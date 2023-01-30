create EXTENSION pgcrypto;
create function public.set_current_timestamp_updated_at() RETURNS trigger
    language plpgsql
    as $$
declare
  _new record;
begin
  _new := NEW;
  _new."updated_at" = NOW();
  return _new;
end;
$$;

create table 'users' (
	'id' varchar(255) primary key,
	'email' varchar(255) not null unique,
	'password' varchar(255) not null,
	'type' integer not null,
	'first_name' varchar(255) not null,
	'last_name' varchar(255) not null,
	'active' boolean not null default true,
	'known_ips_hashes' text[] not null default '{}'::text[],
	'two_factor_config_id' varchar(255) default null,
	'login_method' integer not null default 0,
	'last_login_at' timestamp default null,
	'reset_password_token' varchar(255) default null,
	'terms_accepted_at' timestamp default null,
	'created_at' timestamp not null default now(),
	'updated_at' timestamp not null default now(),
);

create index 'users_email_index' on 'users' ('email');

create table 'two_factor_configs' (
	'id' varchar(255) primary key references 'users'('id') on delete cascade, 
	'enabled' boolean not null default false,
	'type' integer not null default 0,
	'secret' varchar(255),
	'recovery_codes' text[] not null default '{}'::text[],
	'created_at' timestamp not null default now(),
	'updated_at' timestamp not null default now(),
);

alter table 'two_factor_configs' add constraint 'two_factor_configs_user_id_unique' unique ('user_id');

alter table 'users' alter column 'two_factor_config_id' references 'two_factor_configs'('id') on delete set null; 

create table 'sessions' (
	'id' varchar(255) primary key,
	'user_id' varchar(255) not null references 'users'('id') on delete cascade,
	'created_at' timestamp not null default now(),
	'updated_at' timestamp not null default now(),
);

create index 'sessions_user_id_index' on 'sessions' ('user_id');

create table url_scans (
	'id' varchar(255) primary key,
	'url' varchar(255) not null,
	'status_code' integer not null,
	'response_time' integer not null,
	'redirects' integer not null,
	'created_at' timestamp not null default now(),
	'updated_at' timestamp not null default now(),
);