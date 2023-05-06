'use client';

import { LoadingSpin } from '@app/components/Loading';
import { RandomFacts } from '@app/components/RandomFact';
import { UrlAnalysisResult as UrlAnalysisResultComponent } from '@app/components/UrlAnalysisResult';
import type { GETScanEndpointReturn } from '@app/types';
import type { WebSocketData } from '@app/types/types';
import { generateRandomHash } from '@app/utils/generateRandom';
import { makeApiRequest } from '@app/utils/makeApiReq';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { BiErrorAlt } from 'react-icons/bi';
import { RxDoubleArrowLeft } from 'react-icons/rx';

export const runtime = 'nodejs';

export default function ScanPage({ params }: { params: { id: string } }) {
	const { id } = params;

	const [result, setResult] = useState<GETScanEndpointReturn | null>(null);
	const [error, setError] = useState<string | null>(null);

	const [wsEvents, setWsEvents] = useState<(WebSocketData & { formatted: string })[]>([]);

	useEffect(
		() => {
			if (id === 'create') {
				return;
			}

			const ws = new WebSocket(`${process.env.NEXT_PUBLIC_WSS_URL}/api/v1/scan/${id}/ws`);

			ws.addEventListener('message', (event) => {
				const data = JSON.parse(event.data);

				const events = [
					...wsEvents,
					{
						...data,
						formatted: `${new Date(data.timestamp).toISOString().slice(11).slice(0, 8)} | ${data.data}`,
					},
				].sort((a, b) => a.timestamp - b.timestamp);

				setWsEvents(events);
				console.log(events, wsEvents);
			});

			return () => ws.close();
		},
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[],
	);

	useEffect(() => {
		if (id === 'create') {
			return;
		}

		// eslint-disable-next-line @typescript-eslint/no-use-before-define
		const interval = setInterval(async () => fetch(), 5_000);
		const fetch = async () => {
			const res = await makeApiRequest<GETScanEndpointReturn>(`/scan/${id}`).catch((error_) => {
				setError(`There was an error while processing your request: ${error_}`);
			});

			if (!res) {
				return;
			}

			if (res.message === 'success') {
				setResult(res);
				clearInterval(interval);
			}

			if (res.message !== 'success' && res.error?.code !== 'NavigationInProgress') {
				clearInterval(interval);
				setError(`There was an error while processing your request: ${res.error?.description ?? 'Unknown error'}`);
			}
		};

		void fetch();

		// On unmount clear the interval
		return () => clearInterval(interval);

		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	return (
		<main className={`flex flex-col gap-4 pt-12 ${error || !result ? 'justify-between' : ''}`}>
			{result ? (
				<div className="mx-20 my-10 text-5xl font-bold font-sans p-4 bg-gray-100 rounded-xl text-center text-gray-600">
					Results for {result.data?.url}
				</div>
			) : error ? (
				<div className="flex justify-between h-full flex-col items-center gap-72">
					<div className="flex justify-center items-center w-2/3 m-20 text-5xl font-bold font-sans p-4 bg-gray-100 rounded-xl text-center text-gray-600 gap-4">
						<BiErrorAlt className="fast-animate-pulse" color="red" size={64} />
						{error}
					</div>
					<Link className="flex items-center gap-2 text-white w-fit p-3 rounded text-2xl bg-gray-500" href="/">
						<RxDoubleArrowLeft />
						Go back
					</Link>
				</div>
			) : (
				<div className="flex justify-between h-full flex-col items-center gap-72">
					<div>
						<div className="flex justify-center w-auto px-10 items-center m-20 text-5xl font-bold font-sans bg-gray-100 rounded-xl text-center text-gray-600">
							<LoadingSpin />
							Processing your request...
						</div>
						<div className="flex flex-col bg-gray-500 p-4 rounded gap-3 justify-center w-auto">
							<div className="text-3xl font-bold text-white m-3 ml-5 bg-gray-600 w-fit p-2 rounded">Realtime Logs:</div>
							{wsEvents.map((scan, idx) => (
								<div
									className={`flex flex-col text-start p-4 rounded text-white ${
										idx % 2 === 0 ? 'bg-gray-600' : 'bg-gray-700'
									}`}
									key={generateRandomHash()}
								>
									<span>{scan.formatted}</span>
								</div>
							))}
						</div>
					</div>
					<RandomFacts />
				</div>
			)}
			{result ? <UrlAnalysisResultComponent res={result!} /> : null}
		</main>
	);
}
