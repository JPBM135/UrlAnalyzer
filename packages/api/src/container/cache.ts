import { parseLocalIOKRules } from '@functions/iok/parseIOKRules.js';
import { kCache, kIOKRules } from 'tokens.js';
import { container } from 'tsyringe';

export async function createCache() {
	const cache = new Map();

	container.register(kCache, { useValue: cache });

	const IOKRules = await parseLocalIOKRules();

	container.register(kIOKRules, { useValue: IOKRules });
}
