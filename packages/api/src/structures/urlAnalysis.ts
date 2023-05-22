import { X509Certificate } from 'node:crypto';
import { resolve } from 'node:dns/promises';
import process from 'node:process';
import { setTimeout as wait } from 'node:timers/promises';
import { URL } from 'node:url';
import { createCertificateDetails } from '@database/certificate_details/createCertDetails.js';
import { getCertificateDetails } from '@database/certificate_details/getCertDetails.js';
import { createRequest } from '@database/requests/createRequest.js';
import { getRequestsByParentId } from '@database/requests/getRequest.js';
import { createResponse } from '@database/responses/createResponse.js';
import { getResponsesByParentId } from '@database/responses/getResponse.js';
import { createUrlAnalysis } from '@database/scans/createScan.js';
import { matchAgainstIOK } from '@functions/iok/matchResult.js';
import type Imgur from '@functions/services/Imgur.js';
import { checkUrlSafeBrowsing, checkUrlTransparencyReport } from '@functions/services/SafeBrowsing.js';
import type { PopulatedRequest, RawCertificate, RawResponse, RawUrlAnalysis } from '@types';
import { convertCert, parseInfoAccess, parseIssuer, parseSubject, parseSubjectAltName } from '@utils/certUtils.js';
import { formatHTTPRequest, formatHTTPResponse } from '@utils/formatReq.js';
import { generateCompoundSnowflake, generateSnowflake } from '@utils/idUtils.js';
import { findArtifact } from '@utils/lighthouse.js';
import { allowedResourceTypes, REGEXES, TableWorkerIdentifiers } from 'constants.js';
import lighthouse from 'lighthouse';
import logger from 'logger.js';
import getMetaData from 'metadata-scraper';
import { Counter, Histogram } from 'prom-client';
import type { Page, Protocol, Browser, CDPSession, HTTPResponse, HTTPRequest } from 'puppeteer';
import { kCache, kImgur, kPuppeteer, kWebSockets } from 'tokens.js';
import { container } from 'tsyringe';
import type {
	ConsoleOutput,
	InternalCache,
	LightHouseReport,
	Screenshot,
	UrlAnalysisResult,
	UrlSecurityDetails,
	WebSocketData,
} from 'types/types.js';
import type { WebSocket, WebSocketServer } from 'ws';

const scansMetrics = new Counter({
	name: 'url_analyzer_api_scans_total',
	help: 'Total number of scans',
	labelNames: ['domain'],
});

const requestsMetrics = new Counter({
	name: 'url_analyzer_api_requests_total',
	help: 'Total number of requests',
	labelNames: ['domain'],
});

const processingTime = new Histogram({
	name: 'url_analyzer_api_processing_time',
	help: 'Time it took to process a scan',
	labelNames: ['domain'],
	buckets: [0.1, 0.5, 1, 2, 5],
});

export default class UrlAnalysis {
	public browser: Browser;

	public url: string;

	public page: Page | null = null;

	public requests: PopulatedRequest[];

	public cookies: Protocol.Network.Cookie[];

	public consoleOutput: ConsoleOutput[];

	public contactedDomains: Set<string>;

	public urlsFound: string[];

	public body: string | null = null;

	public effectiveUrl: string | null = null;

	public dns: Record<string, string[]> | null = null;

	public screenshotUrl: Screenshot | null = null;

	public certificate: RawCertificate | null = null;

	public metadata: Record<string, unknown> | null = null;

	public security: UrlSecurityDetails | null = null;

	private readonly _promises: Promise<any>[]; // eslint-disable-line @typescript-eslint/no-explicit-any

	private _imgurClient = container.resolve<Imgur>(kImgur);

	public certificate_id: string | null = null;

	public lhReport: LightHouseReport | null = null;

	public id: string;

	public requests_ids: string[] = [];

	public author_id: string | null = null;

	private dbResult: RawUrlAnalysis | null = null;

	private startTime: [number, number] = process.hrtime();

	public websocket: WebSocket | null = null;

	private pastProgress: WebSocketData[] = [];

	public constructor(url: string, owner_id: string | null) {
		this.browser = container.resolve<Browser>(kPuppeteer);

		this.id = generateSnowflake(TableWorkerIdentifiers.Scan);
		this.author_id = owner_id;

		this.url = url;

		this.requests = [];
		this.cookies = [];
		this.consoleOutput = [];

		this.contactedDomains = new Set();

		this.urlsFound = [];

		this._promises = [];

		const globalServer = container.resolve<WebSocketServer>(kWebSockets);
		globalServer.on(`connection:${this.id}`, (socket: WebSocket) => {
			logger.debug(`Connection established with ${socket.url}`);

			this.websocket = socket;

			for (const data of this.pastProgress) {
				this.websocket.send(JSON.stringify(data));
			}

			if (this.dbResult) {
				this.websocket.close();
			}
		});

		scansMetrics.inc({ domain: new URL(url).hostname });
	}

	public async navigate() {
		const cache = container.resolve<InternalCache>(kCache);

		try {
			this.page = await this.browser.newPage();
			this.page.setDefaultNavigationTimeout(60_000);
			this.emitProgress({
				type: 'message',
				data: 'Page created',
			});

			await this.page.setRequestInterception(true);
			this.emitProgress({
				type: 'message',
				data: 'Request interception enabled',
			});
			this.registerListeners();
			this.emitProgress({
				type: 'message',
				data: 'Listeners registered',
			});

			const client = await this.page.target().createCDPSession();
			await client.send('Network.enable');
			this.emitProgress({
				type: 'message',
				data: 'Network enabled and devtools opened',
			});

			const pageResponse = await this.page.goto(this.url, { waitUntil: 'networkidle2' });
			this.emitProgress({
				type: 'message',
				data: 'Page loaded',
			});

			this.effectiveUrl = this.page.url();

			const [body, cookies] = await Promise.all([this.page.content(), this.page.cookies()]);

			this.emitProgress({
				type: 'message',
				data: 'Page content and cookies retrieved',
			});

			this.body = body;
			this.cookies = cookies;

			await Promise.all([
				this.screenshot(),
				this.resolveDns(),
				this.getCertificate(client, pageResponse!),
				this.lightHouse(),
			]);

			await this.processBody();

			const result = await this.finish();
			cache.set(this.id, {
				ok: true,
				data: result,
				added: Date.now(),
			});
		} catch (error) {
			console.error(error);
			await this.page?.close();
			this.emitProgress({
				type: 'error',
				data: 'An error occured while processing the page :(',
			});

			cache.set(this.id, {
				ok: false,
				error: (error as Error).message,
				added: Date.now(),
			});
		}
	}

	public async lightHouse() {
		const lh_analysis = await lighthouse(this.url, {
			port: Number(new URL(this.browser.wsEndpoint()).port),
			output: 'json',
			logLevel: 'error',
		});

		if (!lh_analysis) {
			this.lhReport = {
				scores: {
					performance: null,
					accessibility: null,
					'best-practices': null,
					seo: null,
					pwa: null,
				},
				audits: {
					'best-practices': {},
					performance: {},
					accessibility: {},
					seo: {},
					pwa: {},
				},
			} as LightHouseReport;
			return;
		}

		const partial: {
			audits: Partial<LightHouseReport['audits']>;
			scores: LightHouseReport['scores'];
		} = {
			scores: {
				performance: lh_analysis.lhr.categories?.performance?.score ?? null,
				accessibility: lh_analysis.lhr.categories?.accessibility?.score ?? null,
				'best-practices': lh_analysis.lhr.categories?.['best-practices']?.score ?? null,
				seo: lh_analysis.lhr.categories?.seo?.score ?? null,
				pwa: lh_analysis.lhr.categories?.pwa?.score ?? null,
			},
			audits: {
				'best-practices': {},
				performance: {},
				accessibility: {},
				seo: {},
				pwa: {},
			},
		};

		for (const [key, value] of Object.entries(lh_analysis.lhr.categories)) {
			const audits = value.auditRefs.map((audit) => {
				const auditData = lh_analysis.lhr.audits[audit.id];

				const extra = findArtifact(audit.id, lh_analysis.artifacts);

				return {
					id: audit.id,
					score: auditData?.score ?? null,
					group: audit.group ?? null,
					extra,
				};
			});

			for (const audit of audits) {
				partial.audits[key as keyof (typeof partial)['audits']]![audit.id] = {
					id: audit.id,
					score: audit.score,
					group: audit.group,
					extra: audit.extra,
				};
			}
		}

		this.lhReport = partial as LightHouseReport;
		this.emitProgress({
			type: 'message',
			data: 'LightHouse report generated',
		});
	}

	public async screenshot() {
		const buffer = await this.page?.screenshot({
			fullPage: true,
			quality: 100,
			type: 'jpeg',
		});

		this.emitProgress({
			type: 'message',
			data: 'Screenshot taken',
		});

		if (!buffer) return;

		this.screenshotUrl = await this._imgurClient
			.uploadImage({
				data: buffer,
				type: 'public',
				url: this.url,
			})
			.catch((error) => {
				console.error(error);
				return null;
			});
	}

	public async getCertificate(client: CDPSession, res: HTTPResponse) {
		if (!this.page) return;

		const rawSecurityDetails = res.securityDetails();

		const parsedSecurityDetails = {
			issuer: rawSecurityDetails?.issuer() ?? 'Unknown',
			protocol: rawSecurityDetails?.protocol() ?? 'Unknown',
			subjectName: rawSecurityDetails?.subjectName() ?? 'Unknown',
			validFrom: rawSecurityDetails?.validFrom() ?? 0,
			validTo: rawSecurityDetails?.validTo() ?? 0,
		};

		const certificate = await client.send('Network.getCertificate', {
			origin: this.page.url(),
		});

		const parsedCertificate = certificate.tableNames.map((name) => {
			const decoded = convertCert(name);

			const x509 = new X509Certificate(decoded);

			return {
				encoded: name,
				decoded,
				x509: {
					ca: x509.ca,
					fingerprint: x509.fingerprint,
					fingerprint256: x509.fingerprint256,
					fingerprint512: x509.fingerprint512,
					infoAccess: parseInfoAccess(x509.infoAccess),
					issuer: parseIssuer(x509.issuer),
					subject: parseSubject(x509.subject),
					subjectAltName: parseSubjectAltName(x509.subjectAltName),
					keyUsage: x509.keyUsage,
					serialNumber: x509.serialNumber,
					validFrom: new Date(x509.validFrom).toISOString(),
					validTo: new Date(x509.validTo).toISOString(),
				},
			};
		});

		this.certificate = await createCertificateDetails({
			id: this.id,
			parent_id: this.id,
			certificates: parsedCertificate,
			subject_name: parsedSecurityDetails.subjectName,
			valid_to: parsedSecurityDetails.validTo,
			valid_from: parsedSecurityDetails.validFrom,
			...parsedSecurityDetails,
		});

		this.certificate_id = this.certificate.id;
		this.emitProgress({
			type: 'message',
			data: 'Certificate report generated',
		});
	}

	public async resolveDns() {
		const domains = [...this.contactedDomains].filter((domain) => domain.length);

		const resolvedDomains: Record<string, string[]> = {};

		for (const domain of domains) {
			try {
				resolvedDomains[domain] = await resolve(domain);
			} catch {
				resolvedDomains[domain] = [];
			}
		}

		this.dns = resolvedDomains;
	}

	public registerListeners() {
		if (!this.page) return;

		this.page.on('request', async (request) => {
			const hostname = new URL(request.url()).hostname;

			if (hostname.length) this.contactedDomains.add(hostname);

			const nonce = generateCompoundSnowflake(TableWorkerIdentifiers.ScanNonce, 3);

			// add nonce to the request headers
			const headers = request.headers();
			headers['x-url-analyzer-nonce'] = nonce;

			request.continue();
		});

		this.page.on('response', async (response) => {
			const request = await this.addAndResolvePromise(formatHTTPRequest(response.request()));
			request.response = await this.addAndResolvePromise(formatHTTPResponse(response));

			requestsMetrics.inc({
				domain: new URL(request.url).hostname,
			});

			const resource_type_allowed = allowedResourceTypes.includes(
				request.resource_type as ReturnType<HTTPRequest['resourceType']>,
			);

			const dbResponse = await this.addAndResolvePromise(
				createResponse({
					...request.response,
					id: this.id,
					parent_id: this.id,
					body: resource_type_allowed ? request.response.body : null,
				}),
			);
			const dbRequest = await this.addAndResolvePromise(
				createRequest({
					...request,
					id: this.id,
					parent_id: this.id,
					response_id: dbResponse.id,
					nonce: request.headers['x-url-analyzer-nonce'] ?? null,
				}),
			);

			this.requests.push({
				...dbRequest,
				response: dbResponse,
			});
			this.requests_ids.push(dbRequest.id);
			console.log('Request', dbRequest.id, 'added', this.requests.length);
		});

		this.page.on('console', (message) => {
			this.consoleOutput.push({
				type: message.type(),
				text: message.text(),
				args: message.args(),
			});
		});
	}

	public async securityDetails() {
		if (!this.page) return;

		const [safeBrowsing, transparencyReport] = await Promise.all([
			checkUrlSafeBrowsing([this.url, this.effectiveUrl!]),
			checkUrlTransparencyReport(this.effectiveUrl!),
		]);

		this.security = {
			safeBrowsing,
			transparencyReport,
			IOK: matchAgainstIOK({
				requests: this.requests,
				cookies: this.cookies,
			}),
		};

		this.emitProgress({
			type: 'message',
			data: 'Security details fetched',
		});
	}

	public async processBody() {
		if (!this.body) return;

		// @ts-expect-error: This is callable
		this.metadata = await getMetaData({
			url: this.page?.url(),
			html: this.body,
		});

		const urls = Array.from(new Set(this.body.matchAll(REGEXES.URL)));

		this.urlsFound = urls.map((url) => url[0].replace(/["'>].+$/, ''));
		this.emitProgress({
			type: 'message',
			data: 'Body and metadata processed',
		});
	}

	public async finish(): Promise<UrlAnalysisResult> {
		if (this.dbResult) {
			return UrlAnalysis.createFromDbResult(this.dbResult, {
				certificate: this.certificate!,
				requests: this.requests,
			});
		}

		console.log('Closing page', this._promises.length, this.requests_ids.length);
		await this.page!.close();
		await Promise.race([Promise.all(this._promises), wait(7_000)]);
		console.log('Page closed');

		await this.securityDetails();

		const dbResult = await createUrlAnalysis({
			author_id: this.author_id,
			url: this.url,
			effective_url: this.effectiveUrl!,
			screenshot: this.screenshotUrl,
			metadata: this.metadata!,
			cookies: this.cookies,
			console_output: this.consoleOutput,
			contacted_domains: Array.from(this.contactedDomains.values()),
			urls_found: this.urlsFound,
			body: this.body!,
			dns: this.dns!,
			security_details: this.security!,
			certificate_id: this.certificate_id!,
			id: this.id,
			requests_ids: this.requests_ids,
			lighthouse_analysis: this.lhReport,
		});

		this.dbResult = dbResult;

		const domain = new URL(this.url).hostname;
		const timeTook = process.hrtime(this.startTime);

		processingTime.labels(domain).observe((timeTook[0] * 1e9 + timeTook[1]) / 1e6);

		this.emitProgress({
			type: 'message',
			data: 'Analysis finished',
		});
		this.websocket?.close();

		return UrlAnalysis.createFromDbResult(this.dbResult!, {
			certificate: this.certificate!,
			requests: this.requests,
		});
	}

	private async addAndResolvePromise<T>(promise: Promise<T>) {
		this._promises.push(promise);

		// eslint-disable-next-line promise/prefer-await-to-then
		void promise.finally(() => {
			this._promises.splice(this._promises.indexOf(promise), 1);
		});

		return promise;
	}

	public static async createFromDbResult(
		dbResult: RawUrlAnalysis,
		extras?: {
			certificate?: RawCertificate;
			requests?: PopulatedRequest[];
		},
	): Promise<UrlAnalysisResult> {
		const result: RawUrlAnalysis & {
			certificate?: RawCertificate;
			requests?: PopulatedRequest[];
		} = dbResult;

		if (extras?.requests?.length) {
			result.requests = extras.requests;
		} else {
			const requests: PopulatedRequest[] = (await getRequestsByParentId(dbResult.id)) as unknown as PopulatedRequest[];
			const responses: RawResponse[] = await getResponsesByParentId(dbResult.id);

			for (const request of requests) {
				const response = responses.find((res) => res.id === request.response_id);

				request.response = response ?? null;
			}

			result.requests = requests;
		}

		if (extras?.certificate) {
			result.certificate = extras.certificate;
		} else {
			result.certificate = await getCertificateDetails(dbResult.certificate_id);
		}

		return {
			authorId: result.author_id,
			contactedDomains: result.contacted_domains,
			consoleOutput: result.console_output,
			effectiveUrl: result.effective_url,
			securityDetails: result.security_details,
			urlsFound: result.urls_found,
			certificate: result.certificate!,
			requests: result.requests!,
			lighthouseAnalysis: result.lighthouse_analysis!,
			body: result.body,
			certificate_id: result.certificate_id,
			cookies: result.cookies,
			created_at: result.created_at,
			dns: result.dns,
			id: result.id,
			metadata: result.metadata,
			requests_ids: result.requests_ids,
			screenshot: result.screenshot,
			updated_at: result.updated_at,
			url: result.url,
		};
	}

	private emitProgress(data: Omit<WebSocketData, 'timestamp'>) {
		const progress = {
			...data,
			timestamp: Date.now(),
		};

		this.pastProgress.push(progress);
		if (!this.websocket) return;

		this.websocket.send(JSON.stringify(progress));
	}
}
