import { collectDefaultMetrics, Registry } from 'prom-client';
import { container } from 'tsyringe';
import { kPrometheus } from '../tokens.js';

export function createPromRegistry() {
	const register = new Registry();

	container.register(kPrometheus, { useValue: register });

	collectDefaultMetrics({
		register,
		prefix: 'vivarte_api_',
	});
}
