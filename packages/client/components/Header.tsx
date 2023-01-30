import Link from 'next/link';

export function Header() {
	return (
		<header className="text-white flex justify-between items-center p-4 bg-slate-800">
			<Link className="text-3xl" href="/">
				Url Analyzer
			</Link>
			<nav className="flex space-x-4" />
		</header>
	);
}
