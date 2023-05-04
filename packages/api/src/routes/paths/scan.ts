import { RouteManager } from '@structures/routeClass.js';
import { scanHandlerHandler } from 'routes/sub-routes/scan/CreateScan.js';
import { getRecentScanHandler, getScanHandler } from 'routes/sub-routes/scan/GetScan.js';
import { scanGetWebsocketHandler } from 'routes/sub-routes/scan/WebsocketScan.js';

export default class ScanRoute extends RouteManager {
	public constructor() {
		super('/scan', {
			get: [
				{
					route: '/recent',
					handler: getRecentScanHandler,
				},
				{
					route: '/:scan_id/ws',
					handler: scanGetWebsocketHandler,
				},
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
