import type { Protocol } from 'puppeteer';
import type { IOKSuffixes } from './types.js';

export function findBodyScript(body: string) {
	const script = body.match(/<script[^>]*>[\S\s]*?<\/script>/g);

	if (!script) return null;

	return script[0];
}

export function detectBasedOnType(type: IOKSuffixes, values: string[], dataArray: string[]) {
	const detections: boolean[] = [];
	for (const data of dataArray) {
		for (const value of values) {
			switch (type) {
				case 'contains':
					if (data.includes(value)) {
						detections.push(true);
						break;
					}

					break;
				case 're':
					if (new RegExp(value).test(data)) {
						detections.push(true);
						break;
					}

					break;
				case 'endswith':
					if (data.endsWith(value)) {
						detections.push(true);
						break;
					}

					break;
				case 'startswith':
					if (data.startsWith(value)) {
						detections.push(true);
						break;
					}

					break;
				default:
					break;
			}
		}
	}

	return detections.length === values.length;
}

export function formatHeaders(headers: Record<string, string>) {
	return Object.entries(headers).map(([key, value]) => `${key}: ${value}`);
}

export function formatCookies(cookies: Protocol.Network.Cookie[]) {
	return cookies.map(({ name, value }) => `${name}=${value}`);
}
