'use client';

import type { GETUtilsFactsEndpointReturn } from '@app/types';
import { makeApiRequest } from '@app/utils/makeApiReq';
import { useEffect, useState } from 'react';

export function RandomFacts() {
	const [fact, setFact] = useState('Loading...');
	const [factsArray, setFactsArray] = useState<string[]>([]);

	useEffect(() => {
		const fetchData = async () => {
			if (factsArray.length) {
				setFact(factsArray[Math.floor(Math.random() * factsArray.length)]!);
				return;
			}

			const res = await makeApiRequest<GETUtilsFactsEndpointReturn>(`/utils/facts`);
			const { data } = res;

			if (!data) {
				setFact('There was an error while fetching the facts. That is a fact btw.');
				return;
			}

			setFactsArray(data!);
			setFact(data[Math.floor(Math.random() * data.length)]!);
		};

		void fetchData();
		const interval = setInterval(() => {
			void fetchData();
		}, 7_000);
		return () => clearInterval(interval);

		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	return <div className="text-center text-2xl font-bold text-gray-700 w-[400px] word-wrap">{fact}</div>;
}
