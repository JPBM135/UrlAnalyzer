'use client';

import { AnalyzerBar } from '@app/components/AnalyzerBar';
import { useRouter } from 'next/navigation';

export default function Home() {
	const router = useRouter();

	return (
		<main className="align-middle items-center pt-[3rem]">
			<AnalyzerBar router={router} />
		</main>
	);
}
