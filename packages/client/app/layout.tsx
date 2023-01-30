import { Header } from '@app/components/Header';
import './styles/globals.css';

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en">
			<Header />
			<head />
			<body>{children}</body>
		</html>
	);
}
