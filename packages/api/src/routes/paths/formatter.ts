import { RouteManager } from '@structures/routeClass.js';
import { formatHandler } from 'routes/sub-routes/formatter/PostFormat.js';

export default class FormatterRoute extends RouteManager {
	public constructor() {
		super('/formatter', {
			post: [
				{
					route: '/format',
					handler: formatHandler,
				},
			],
		});
	}
}
