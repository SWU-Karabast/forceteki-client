// layout.tsx
import type { Metadata } from "next";
import React from 'react';
import ClientLayout from './ClientLayout';
import { Barlow } from "next/font/google";
import "./_utils/s3Assets";

const barlow = Barlow({
	subsets: ["latin"],
	weight: ["400", "600", "800"],
	variable: "--font-barlow",
});

export const metadata: Metadata = {
	title: "Karabast",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={barlow.variable}>
      <body>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}