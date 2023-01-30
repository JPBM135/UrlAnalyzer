'use client';

import useAuth from '@app/functions/hooks/useAuth';
import { makeApiRequest } from '@app/functions/makeApiReq';
import type { GETOAuth2AuthorizeEndpointReturn } from '@app/types';
import { redirect } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function LoginPage() {
	const auth = useAuth();

	if (auth.authenticated) {
		redirect('/');
	}

	const [googleUrl, setGoogleUrl] = useState<string | null>(null);

	useEffect(() => {
		const fetchUrls = async () => {
			const googleUrl = await makeApiRequest<GETOAuth2AuthorizeEndpointReturn>('/oauth2/google');
			setGoogleUrl(googleUrl.data.url);
		};

		void fetchUrls();
	}, []);

	return (
		<main className="align-middle items-center pt-[3rem]">
			<button className="text-white" type="button">
				Google Login {googleUrl}
			</button>
		</main>
	);
}
