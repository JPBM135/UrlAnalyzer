import { Header } from '@app/components/Header';
import Head from './head';
import './styles/globals.css';

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en">
			<Head />
			<body>
				<Header />
				{children}
			</body>
		</html>
	);
}
