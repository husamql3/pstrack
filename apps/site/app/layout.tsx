import "./globals.css";

import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { ReactNode } from "react";

import { DotPattern } from "@/components/dot-pattern";
import { cn } from "@/lib/utils";

const geist = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
	weight: ["100", "300", "400", "500", "700", "900"],
});

export const metadata: Metadata = {
	title: "PStrack",
	description: "The platform that helps you solve, track, and grow.",
	authors: [{ name: "Hüsam" }],
	creator: "@husamql3",
	publisher: "PSTrack",
	formatDetection: {
		email: false,
		telephone: false,
		address: false,
	},
	metadataBase: new URL("https://www.pstrack.app"),
	alternates: {
		canonical: "/",
	},
	openGraph: {
		title: "PSTrack",
		description: "A platform that helps you solve, track, and grow",
		url: "https://www.pstrack.app",
		siteName: "PSTrack",
		locale: "en_US",
		type: "website",
		images: [
			{
				url: "https://www.pstrack.app/og-image.jpg",
				width: 1200,
				height: 630,
				alt: "PSTrack - A platform that helps you solve, track, and grow",
			},
		],
	},
	twitter: {
		card: "summary_large_image",
		title: "PSTrack",
		description: "A platform that helps you solve, track, and grow",
		creator: "@husamql3",
		images: ["https://www.pstrack.app/og-image.jpg"],
	},
};

function RootLayout({
	children,
}: Readonly<{
	children: ReactNode;
}>) {
	return (
		<html lang="en">
			<body className={cn(geist.variable, "antialiased h-dvh font-sans dark bg-zinc-950")}>
				{children}

				<div className="absolute inset-0 flex h-dvh w-full flex-col items-center justify-center overflow-hidden bg-zinc-950">
					<DotPattern
						glow={true}
						cr={1.5}
						className="md:mask-[radial-gradient(300px_circle_at_center,white,transparent)] mask-[radial-gradient(250px_circle_at_center,white,transparent)]"
					/>
				</div>
			</body>
		</html>
	);
}

export default RootLayout;
