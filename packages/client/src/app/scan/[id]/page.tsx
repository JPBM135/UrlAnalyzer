'use client';

import { UrlAnalysisResult as UrlAnalysisResultComponent } from '@app/components/UrlAnalysisResult';
import { useError } from '@app/functions/hooks/useError';
import type { GETScanEndpointReturn } from '@app/types';
import { makeApiRequest } from '@app/utils/makeApiReq';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function ScanPage() {
	const { ErrorElement, setError } = useError();

	const router = useRouter();

	const search = usePathname()!;
	const id = decodeURIComponent(search.split('/').pop()!);

	const [result, setResult] = useState<GETScanEndpointReturn | null>(null);

	useEffect(() => {
		// eslint-disable-next-line @typescript-eslint/no-use-before-define
		const interval = setInterval(async () => fetch(), 5_000);
		const fetch = async () => {
			const res = await makeApiRequest<GETScanEndpointReturn>(`/scan/${id}`);

			if (res.message === 'success') {
				setResult(res);
				clearInterval(interval);
			}

			if (res.message !== 'success' && res.error?.status !== 404) {
				setError(`${res.error!.code!} - ${res.error!.description}`);
				clearInterval(interval);
				router.push('/');
			}
		};

		void fetch();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	return (
		<>
			<ErrorElement />
			<main className="flex flex-col gap-4 pt-[3rem]">
				<div className="ml-20 my-20 w-fit text-4xl font-bold text-left font-sans text-gray-500 p-4 bg-gray-200 rounded-xl">
					{result ? `Results for ${result.data?.url}` : 'Processing...'}
				</div>
				{result ? <UrlAnalysisResultComponent res={result!} /> : null}
			</main>
		</>
	);
}
