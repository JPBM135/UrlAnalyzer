/* eslint-disable typescript-sort-keys/interface */
import type { OmitBaseProps, OmitBasePropsAndMore } from './utils.js';

export interface RawUser {
	id: string;
	email: string;
	password: string | null;
	type: number;
	name: string;
	active: boolean;
	known_ips_hashes: string[];
	two_factor_config_id: string | null;
	last_login_at: string | null;
	reset_password_token: string | null;
	terms_accepted_at: string | null;
	created_at: string;
	updated_at: string;
}

export type SafeUser = Omit<RawUser, 'known_ips_hashes' | 'password' | 'reset_password_token'>;

export type ModifiableUser = OmitBasePropsAndMore<
	RawUser,
	'last_login_at' | 'reset_password_token' | 'terms_accepted_at' | 'two_factor_config_id'
>;

export type InternalModifiableUser = OmitBaseProps<RawUser>;

export interface RawOauthConnection {
	id: string;
	user_id: string;
	provider: string;
	provider_user_id: string;
	access_token: string;
	refresh_token: string;
	scopes: string[];
	expires_at: Date | string;
	created_at: string;
	updated_at: string;
}

export type ModifiableOauthConnection = OmitBasePropsAndMore<RawOauthConnection, 'user_id'>;

export type InternalModifiableOauthConnection = OmitBasePropsAndMore<RawOauthConnection, 'expires_at'> & {
	expires_at: Date | string;
};

export interface RawTwoFactorConfig {
	id: string;
	enabled: boolean;
	type: number;
	secret: string | null;
	recovery_codes: string[];
	created_at: string;
	updated_at: string;
}

export type ModifiableTwoFactorConfig = OmitBaseProps<RawTwoFactorConfig>;

export interface RawSession {
	id: string;
	user_id: string;
	session_token: string;
	created_at: string;
	updated_at: string;
}

export type ModifiableSession = never;

export type SafeSession = Omit<RawSession, 'session_token'> & { token: string };
