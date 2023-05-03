import { readdir, readFile } from 'node:fs/promises';
import { URL } from 'node:url';
import { parse } from 'yaml';
import type { IOKRule, RawIOKRule } from '../../types/iok-types.js';
import { parseDetection } from './parseDetectionRule.js';

const dataPath = new URL('../../../data/iok/', import.meta.url);

export async function parseLocalIOKRules() {
	const files = await readdir(dataPath);

	const rules: IOKRule[] = [];

	for (const file of files) {
		const content = await readFile(new URL(file, dataPath), 'utf8');
		rules.push(parseIOKRule(content));
	}

	return rules;
}

export function parseIOKRule(raw: string): IOKRule {
	const parsed = parse(raw) as RawIOKRule;

	const { detection } = parsed;
	const innerRules = parseDetection(detection);
	return {
		...parsed,
		raw: detection,
		detection: innerRules,
	};
}
