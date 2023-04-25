import { globToRegex } from '@utils/globToRegex.js';
import type { ConditionReturn } from 'types/iok-types.js';
import { NaNCoallescing } from './utils.js';

export function parseCondition(condition: string): ConditionReturn {
	let _condition = condition;

	const nested = _condition.match(/\([^)]+\)/g);

	const conditions: (ConditionReturn | RegExp | number | string)[] = [];

	if (nested) {
		for (const nest of nested) {
			const parsed = parseCondition(nest.slice(1, -1));

			conditions.push(parsed);
			_condition = _condition.replace(nest, '');
		}
	}

	const type = /\d\sof/.test(_condition) ? 'of' : _condition.includes(' or ') ? 'or' : 'and';

	if (type === 'of') {
		const conditions = [globToRegex(_condition.replace(/\d+\sof\s/, ''))];
		return {
			type,
			conditions,
			amount: NaNCoallescing(Number(/\d+/.exec(_condition)?.[0]), null),
		};
	}

	conditions.push(
		..._condition
			.split(` ${type} `)
			.filter(Boolean)
			.map((val) => {
				if (/^\d+$/.test(val)) {
					return Number(val);
				}

				return globToRegex(val);
			}),
	);

	return {
		type,
		conditions: conditions as ConditionReturn['conditions'],
		amount: null,
	};
}

export function matchConditions({ conditions, type, amount }: ConditionReturn, matched: Set<string>): boolean {
	const matches = conditions.filter((condition) => {
		if (condition instanceof RegExp) {
			if (type === 'of') {
				if (amount === null) return false;

				const matchCount = [...matched].filter((match) => condition.test(match)).length;

				return matchCount >= amount;
			}

			return [...matched].some((match) => condition.test(match));
		}

		return matchConditions(condition, matched);
	});

	return type === 'and' ? matches.length === conditions.length : matches.length > 0;
}
