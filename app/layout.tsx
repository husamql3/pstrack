import { ReactNode } from "react";
import type { Metadata } from "next";
import { Geist } from "next/font/google";

import { DotPattern } from "@/components/ui/dot-pattern";
import { cn } from "@/lib/utils";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  weight: ["100", "300", "400", "500", "700", "900"],
});

export const metadata: Metadata = {
  title: "PStrack",
  description: "The platform that helps you solve, track, and grow.",
};

function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={cn(geist.variable, "antialiased font-sans dark bg-zinc-950")}>
        {children}

        <div className="absolute inset-0 flex h-dvh w-full flex-col items-center justify-center overflow-hidden bg-zinc-950">
          <DotPattern
            glow={true}
            className="md:mask-[radial-gradient(300px_circle_at_center,white,transparent)] mask-[radial-gradient(250px_circle_at_center,white,transparent)]"
          />
        </div>
      </body>
    </html>
  );
}

export default RootLayout;