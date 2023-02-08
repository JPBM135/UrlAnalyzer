import { RouteManager } from '@structures/routeClass.js';
import { scanHandlerHandler } from 'routes/sub-routes/scan/CreateScan.js';
import { getScanHandler } from 'routes/sub-routes/scan/GetScan.js';

export default class ScanRoute extends RouteManager {
	public constructor() {
		super('/scan', {
			get: [
				{
					route: '/:scan_id',
					handler: getScanHandler,
				},
			],
			post: [
				{
					route: '/create',
					handler: scanHandlerHandler,
				},
			],
		});
	}
}
