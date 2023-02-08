'use client';

import { UrlAnalysisResult } from '@app/components/UrlAnalysisResult';
import { useError } from '@app/functions/hooks/useError';
import type { POSTScanResultEndpointReturn } from '@app/types';
import { makeApiRequest } from '@app/utils/makeApiReq';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import Loading from './loading';

export default function ScanPage() {
	const { ErrorElement } = useError();

	const search = usePathname()!;
	const url = decodeURIComponent(search.split('/').pop()!);

	const [result, setResult] = useState<POSTScanResultEndpointReturn | null>(null);

	useEffect(() => {
		const scan = async () => {
			const res = await makeApiRequest<POSTScanResultEndpointReturn>('/scan/create', {
				method: 'POST',
				body: JSON.stringify({ url }),
			});

			setResult(res);
		};

		void scan();
	}, [url]);

	return (
		<>
			<ErrorElement />
			<main className="flex flex-col gap-4 pt-[3rem]">
				<div className="w-full flex justify-center">
					<div className=" w-fit text-7xl font-bold text-center font-sans text-gray-500 p-[1rem] bg-gray-200 rounded-xl">
						{result ? `Results for ${url}` : 'Processing...'}
					</div>
				</div>
				{result ? <UrlAnalysisResult res={result!} /> : <Loading />}
			</main>
		</>
	);
}
