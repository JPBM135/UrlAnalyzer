export async function makeApiRequest<T>(path: string, options: RequestInit = {}) {
	const res = await fetch(`http://localhost:3232/api/v1${path}`, {
		headers: {
			'Content-Type': 'application/json',
		},
		...options,
	});

	return res.json() as Promise<T>;
}
