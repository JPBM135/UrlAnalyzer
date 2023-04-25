export interface ConditionReturn {
	amount: number | null,
	conditions: (ConditionReturn | RegExp)[];
	type: 'and' | 'of' | 'or';
}

export type IOKPrefixes = 'cookies' | 'css' | 'headers' | 'html' | 'js' | 'requests';
export type IOKSuffixes = 'contains' | 'endswith' | 're' | 'startswith';
export type IOKUnion = `${IOKPrefixes}|${IOKSuffixes}`;

export type RawIOKDetectionRule = Partial<Record<IOKUnion, string[] | string>>;

export interface IOKDetectionRule {
	condition: ConditionReturn;
	parsed: Map<string, { method: IOKSuffixes; type: IOKPrefixes; value: string[] }>;
}

export interface RawIOKRule {
	readonly description: string;
	detection: Record<string, RawIOKDetectionRule> & {
		condition: string;
	};
	readonly references: string[];
	readonly tags: string[];
	readonly title: string;
}

export interface IOKRule extends Omit<RawIOKRule, 'detection'> {
	readonly detection: IOKDetectionRule;
	readonly raw: RawIOKRule['detection'];
}
