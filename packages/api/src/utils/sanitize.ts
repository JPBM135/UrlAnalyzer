export function databaseSanitize<T>(value: T): T {
	if (typeof value === 'string') {
		return value.replaceAll('\0', '') as T;
	}

	if (typeof value === 'object' && value !== null) {
		if (Array.isArray(value)) {
			return value.map((item) => databaseSanitize(item)) as T;
		} else {
			return Object.entries(value).reduce<T>((acc, [key, val]) => {
				acc[key as keyof typeof acc] = databaseSanitize(val) as typeof val;
				return acc;
				// @ts-expect-error: Object is gonna be remapped
			}, {}) as T;
		}
	}

	return value;
}
