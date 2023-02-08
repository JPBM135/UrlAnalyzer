'use client';

import { usePathname } from 'next/navigation';

export default function Loading() {
	const search = usePathname()!;
	const url = decodeURIComponent(search.split('/').pop()!);

	return (
		<div>
			<div className="text-white text-3xl font-sans">Scanning {url}...</div>
		</div>
	);
}
