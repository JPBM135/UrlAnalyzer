import { parseCondition } from './conditionParser.js';
import type { IOKDetectionRule, IOKPrefixes, IOKSuffixes, RawIOKRule } from './types.js';

export function parseDetection(detection: RawIOKRule['detection']): IOKDetectionRule {
	const entries = Object.entries(detection);
	const condition = parseCondition(detection.condition);
	entries.pop();

	const result = new Map<string, { method: IOKSuffixes; type: IOKPrefixes; value: string[] }>();

	for (const [key, value] of entries) {
		const header = Object.keys(value)[0]!;

		const [type, method] = header.split('|');

		const innerValue = value[header as keyof typeof value] as string[] | string;

		result.set(key, {
			type: type as IOKPrefixes,
			method: method as IOKSuffixes,
			value: Array.isArray(innerValue) ? innerValue : [innerValue],
		});
	}

	return {
		condition,
		parsed: result,
	};
}
