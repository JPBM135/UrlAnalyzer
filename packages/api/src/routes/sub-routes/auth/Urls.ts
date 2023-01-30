import { HttpError } from '@structures/httpError.js';
import type { GETOAuth2AuthorizeEndpointReturn } from '@types';
import { resolveEnv } from '@utils/resolveEnv.js';
import { sendResponse, errorResponse } from '@utils/respond.js';
import type { Request, Response } from 'express';
import { google } from 'googleapis';

const oauth2Client = new google.auth.OAuth2(
	resolveEnv('GOOGLE_OAUTH_CLIENT_ID'),
	resolveEnv('GOOGLE_OAUTH_CLIENT_SECRET'),
	resolveEnv('GOOGLE_REDIRECT_URI'),
);

const scopes = ['https://www.googleapis.com/auth/userinfo.email', 'https://www.googleapis.com/auth/userinfo.profile'];

export async function OAuthGenerateHandler(_: Request, res: Response): Promise<void> {
	try {
		const googleUrl = oauth2Client.generateAuthUrl({
			access_type: 'offline',
			scope: scopes,
			include_granted_scopes: true,
		});

		const discordUrl = `https://discord.com/api/oauth2/authorize?client_id=${resolveEnv(
			'DISCORD_CLIENT_ID',
		)}&redirect_uri=${encodeURI(resolveEnv('DISCORD_REDIRECT_URI'))}&response_type=code&scope=identify%20email`;

		sendResponse<GETOAuth2AuthorizeEndpointReturn>(
			{
				google: `${googleUrl}&prompt=consent`,
				discord: discordUrl,
				github,
			},
			res,
		);
	} catch (error) {
		errorResponse(HttpError.fromError(error as Error), res);
	}
}
