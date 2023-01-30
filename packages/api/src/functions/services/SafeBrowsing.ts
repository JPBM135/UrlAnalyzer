import { createDigestedHash } from '@utils/hash.js';
import { resolveEnv } from '@utils/resolveEnv.js';
import { validateStatusCode } from '@utils/validateStatusCode.js';
import { OP_DELIMITER, SERVICES_CONSTANTS } from 'constants.js';
import type { Redis } from 'ioredis';
import { kRedis } from 'tokens.js';
import { container } from 'tsyringe';
import { request } from 'undici';
import logger from '../../logger.js';

export interface SafeBrowsingResponse {
	matches: ThreatMatch[];
}

/**
 * A match when checking a threat entry in the Safe Browsing threat lists.
 */
export interface ThreatMatch {
	/**
	 * The cache lifetime for the returned match. Clients must not cache this response for more than this duration to avoid false positives.
	 */
	cacheDuration?: string | null;
	/**
	 * The platform type matching this threat.
	 */
	platformType?: PlatformType;
	/**
	 * The threat matching this threat.
	 */
	threat?: ThreatEntry;
	/**
	 * Optional metadata associated with this threat.
	 */
	threatEntryMetadata?: ThreatEntryMetadata[];
	/**
	 * The threat entry type matching this threat.
	 */
	threatEntryType?: ThreadEntryType;
	/**
	 * The threat type matching this threat.
	 */
	threatType?: ThreadType;
}

export interface ThreatEntry {
	/**
	 * The digest of an executable in SHA256 format. The API supports both binary and hex digests. For JSON requests, digests are base64-encoded.
	 */
	digest?: string | null;
	/**
	 * A hash prefix, consisting of the most significant 4-32 bytes of a SHA256 hash. This field is in binary format. For JSON requests, hashes are base64-encoded.
	 */
	hash?: string | null;
	/**
	 * A URL.
	 */
	url?: string | null;
}

export interface ThreatEntryMetadata {
	/**
	 * The metadata entry key. For JSON requests, the key is base64-encoded.
	 */
	key?: string | null;
	/**
	 * The metadata entry value. For JSON requests, the value is base64-encoded.
	 */
	value?: string | null;
}

export enum ThreadEntryType {
	Executable = 'EXECUTABLE',
	ThreadEntryTypeUnspecified = 'THREAT_ENTRY_TYPE_UNSPECIFIED',
	Url = 'URL',
}

export enum ThreadType {
	Malware = 'MALWARE',
	PotentiallyHarmfulApplication = 'POTENTIALLY_HARMFUL_APPLICATION',
	SocialEngineering = 'SOCIAL_ENGINEERING',
	ThreadTypeUnspecified = 'THREAT_TYPE_UNSPECIFIED',
	UnwantedSoftware = 'UNWANTED_SOFTWARE',
}

export enum PlatformType {
	AllPlatforms = 'ALL_PLATFORMS',
	Android = 'ANDROID',
	AnyPlatform = 'ANY_PLATFORM',
	Chrome = 'CHROME',
	Ios = 'IOS',
	Linux = 'LINUX',
	Osx = 'OSX',
	PlatformTypeUnspecified = 'PLATFORM_TYPE_UNSPECIFIED',
	Windows = 'WINDOWS',
}

export type TransparencyReportResponse = [
	string,
	TransparencyReportGenericStatus,
	NumberBoolean,
	NumberBoolean,
	NumberBoolean,
	NumberBoolean,
	NumberBoolean,
	number,
	string,
];

export enum TransparencyReportGenericStatus {
	NoUnsafeContentFound = 1,
	UnsafeContentFound,
	SomePagesUnsafe,
	Whitelisted,
	NotCommonDownloads,
	NoDataAvailable,
}

export enum TransparencyReportFlags {
	SendsVisitorsToMalwareSites,
	InstallMalwareOrMaliciousCode,
	TrickUsersIntoSharingPersonalInfo,
	ContainsMalwareOrMaliciousCode,
	DistributesUncommonDownloads,
}

export type NumberBoolean = 0 | 1;

export async function checkUrlSafeBrowsing(urls: string[]): Promise<
	{
		platformType: PlatformType;
		threatEntryType: ThreadEntryType;
		threatType: ThreadType;
		url: string;
	}[]
> {
	const redis = container.resolve<Redis>(kRedis);

	const cached = await redis.mget(...urls.map((url) => `safe-browsing:${createDigestedHash(url)}`));

	const cachedUrls = cached.filter((url) => url !== null) as string[];

	if (cachedUrls.length) {
		return cachedUrls.map((url) => {
			const data = url.split(OP_DELIMITER) as [string, ThreadType, ThreadEntryType, PlatformType];

			return {
				url: data[0],
				threatType: data[1],
				threatEntryType: data[2],
				platformType: data[3],
			};
		});
	}

	const body = {
		client: {
			clientId: 'url_analyzer',
			clientVersion: '0.1.0',
		},
		threatInfo: {
			threatTypes: ['MALWARE', 'SOCIAL_ENGINEERING', 'UNWANTED_SOFTWARE', 'POTENTIALLY_HARMFUL_APPLICATION'],
			platformTypes: ['ANY_PLATFORM'],
			threatEntryTypes: ['URL', 'EXECUTABLE'],
			threatEntries: urls.map((link) => ({ url: link })),
		},
	};

	const res = await request(
		`${SERVICES_CONSTANTS.SAFE_BROWSING.SAFE_BROWSING}/threatMatches:find?key=${resolveEnv('SAFE_BROWSING_KEY')}`,
		{
			method: 'POST',
			body: JSON.stringify(body),
		},
	);

	if (!validateStatusCode(res.statusCode)) {
		logger.error(`Safe Browsing API returned status code ${res.statusCode} for ${urls.join(', ')}`, {
			service: 'Safe Browsing',
			statusCode: res.statusCode,
			body: await res.body.json(),
		});

		return [];
	}

	const data = (await res.body.json()) as SafeBrowsingResponse;

	if (!data.matches?.length) return [];

	for (const match of data.matches) {
		if (!match.threat?.url) continue;

		await redis.set(
			`safe-browsing:${createDigestedHash(match.threat.url)}`,
			[
				match.threat.url,
				match.threatType ?? ThreadType.ThreadTypeUnspecified,
				match.threatEntryType ?? ThreadEntryType.ThreadEntryTypeUnspecified,
				match.platformType ?? PlatformType.PlatformTypeUnspecified,
			].join(OP_DELIMITER),
			'EX',
			SERVICES_CONSTANTS.SAFE_BROWSING.EXPIRE_SECONDS,
		);
	}

	return data.matches.map((match) => ({
		url: match.threat!.url!,
		threatType: match.threatType ?? ThreadType.ThreadTypeUnspecified,
		threatEntryType: match.threatEntryType ?? ThreadEntryType.ThreadEntryTypeUnspecified,
		platformType: match.platformType ?? PlatformType.PlatformTypeUnspecified,
	}));
}

export async function checkUrlTransparencyReport(url: string): Promise<{
	flags: TransparencyReportFlags[];
	lastTimeChecked: number;
	status: TransparencyReportGenericStatus;
	url: string;
} | null> {
	const redis = container.resolve<Redis>(kRedis);
	let data: TransparencyReportResponse | null = null;

	const cached = await redis.get(`transparency-report:${createDigestedHash(url)}`);

	if (cached) {
		data = cached.split(OP_DELIMITER) as TransparencyReportResponse;
	} else {
		const res = await request(`${SERVICES_CONSTANTS.SAFE_BROWSING.TRANSPARENCY_REPORT}?site=${url}`);

		if (!validateStatusCode(res.statusCode)) {
			logger.error(`Transparency Report API returned status code ${res.statusCode} for ${url}`, {
				service: 'Transparency Report',
				statusCode: res.statusCode,
				body: await res.body.json(),
			});

			return null;
		}

		const rawData = await res.body.text();

		if (!rawData.length) return null;

		data = JSON.parse(rawData.split('\n').slice(2)![0]!)[0] as TransparencyReportResponse;

		await redis.set(
			`transparency-report:${createDigestedHash(url)}`,
			data.join(OP_DELIMITER),
			'EX',
			SERVICES_CONSTANTS.SAFE_BROWSING.EXPIRE_SECONDS,
		);
	}

	const flags: TransparencyReportFlags[] = [];

	for (let idx = 2; idx < 7; idx++) {
		if (data[idx] === 1) flags.push(idx - 2);
	}

	return {
		flags,
		lastTimeChecked: data[7],
		status: data[1],
		url,
	};
}
