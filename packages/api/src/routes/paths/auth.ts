import { RouteManager } from '@structures/routeClass.js';
import { googleOAuthCallbackHandler } from 'routes/sub-routes/auth/GoogleHandler.js';
import { OAuthGenerateHandler } from 'routes/sub-routes/auth/Urls.js';

export default class AuthRoute extends RouteManager {
	public constructor() {
		super('/oauth2', {
			get: [
				{
					route: '/urls',
					handler: OAuthGenerateHandler,
				},
				{
					route: '/google/callback',
					handler: googleOAuthCallbackHandler,
				},
				/* 				{
					route: '/discord/callback',
					handler: () => {},
				},
				{
					route: '/github/callback',
					handler: () => {},
				},
				{
					route: '/microsoft/callback',
					handler: () => {},
				},
			],
			post: [
				{
					route: '/login',
					handler: () => {},
				}, */
			],
		});
	}
}
