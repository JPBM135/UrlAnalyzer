import { kIOKRules } from 'tokens.js';
import { container } from 'tsyringe';
import type { UrlAnalysisResult } from 'types/types.js';
import type { IOKRule } from '../../types/iok-types.js';
import { matchConditions } from './conditionParser.js';
import { findBodyScript, detectBasedOnType, formatHeaders, formatCookies } from './utils.js';

export function matchAgainstIOK({
	requests: resultReqs,
	cookies: resultCookie,
}: Pick<UrlAnalysisResult, 'cookies' | 'requests'>) {
	const IOKrules = container.resolve<IOKRule[]>(kIOKRules);

	const initialRequest = resultReqs[0]!;

	const html: string[] = [];
	const js: string[] = [];
	const css: string[] = [];
	const headers: string[] = formatHeaders(initialRequest.response?.headers ?? {});
	const cookies: string[] = formatCookies(resultCookie ?? []);
	const requests: string[] = [];

	for (const { response, resource_type, url } of resultReqs) {
		requests.push(url);

		if (!response?.body?.length) continue;

		const body = response.body;

		switch (resource_type) {
			case 'document':
				html.push(body);
				// eslint-disable-next-line no-case-declarations
				const script = findBodyScript(body);
				if (script) js.push(script);
				break;
			case 'script':
				js.push(body);
				break;
			case 'stylesheet':
				css.push(body);
				break;
		}
	}

	const matches: IOKRule[] = [];

	for (const rule of IOKrules) {
		if (matchCheckRule({ cookies, css, headers, html, js, requests }, rule)) matches.push(rule);
	}

	return matches;
}

export function matchCheckRule(
	values: {
		cookies?: string[];
		css?: string[];
		headers?: string[];
		html?: string[];
		js?: string[];
		requests?: string[];
	},
	rule: IOKRule,
) {
	const detections = rule.detection.parsed;

	const matchedDetections = new Set<string>();

	for (const [name, { method, value, type }] of detections) {
		switch (type) {
			case 'html':
				if (values.html?.length && detectBasedOnType(method, value, values.html)) matchedDetections.add(name);
				break;
			case 'js':
				if (values.js?.length && detectBasedOnType(method, value, values.js)) matchedDetections.add(name);
				break;
			case 'css':
				if (values.css?.length && detectBasedOnType(method, value, values.css)) matchedDetections.add(name);
				break;
			case 'headers':
				if (values.headers?.length && detectBasedOnType(method, value, values.headers)) matchedDetections.add(name);
				break;
			case 'cookies':
				if (values.cookies?.length && detectBasedOnType(method, value, values.cookies)) matchedDetections.add(name);
				break;
			case 'requests':
				if (values.requests?.length && detectBasedOnType(method, value, values.requests)) matchedDetections.add(name);
				break;
		}
	}

	return matchConditions(rule.detection.condition, matchedDetections);
}
