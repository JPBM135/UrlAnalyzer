import { globToRegex } from '@utils/globToRegex.js';

export interface ConditionReturn {
	conditions: (ConditionReturn | RegExp)[];
	type: 'and' | 'or';
}

export function parseCondition(condition: string): ConditionReturn {
	let _condition = condition;

	const nested = _condition.match(/\([^)]+\)/g);

	const conditions: (ConditionReturn | RegExp | string)[] = [];

	if (nested) {
		for (const nest of nested) {
			const parsed = parseCondition(nest.slice(1, -1));

			conditions.push(parsed);
			_condition = _condition.replace(nest, '');
		}
	}

	const type = _condition.includes(' or ') ? 'or' : 'and';

	conditions.push(..._condition.split(` ${type} `).filter(Boolean).map(globToRegex));

	return {
		type,
		conditions: conditions as ConditionReturn['conditions'],
	};
}

export function matchConditions({ conditions, type }: ConditionReturn, matched: Set<string>): boolean {
	const matches = conditions.filter((condition) => {
		if (condition instanceof RegExp) {
			return [...matched].some((match) => condition.test(match));
		}

		return matchConditions(condition, matched);
	});

	return type === 'and' ? matches.length === conditions.length : matches.length > 0;
}
