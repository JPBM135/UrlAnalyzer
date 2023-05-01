import { RouteManager } from '@structures/routeClass.js';
import { factsHandler } from 'routes/sub-routes/utils/GetFacts.js';
import { formatHandler } from 'routes/sub-routes/utils/PostFormat.js';

export default class UtilsRoute extends RouteManager {
	public constructor() {
		super('/utils', {
			get: [
				{
					route: '/facts',
					handler: factsHandler,
				},
			],
			post: [
				{
					route: '/format',
					handler: formatHandler,
				},
			],
		});
	}
}
