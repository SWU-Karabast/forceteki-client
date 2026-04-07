// layout.tsx
import type { Metadata } from 'next';
import React from 'react';
import ClientLayout from './ClientLayout';
import { Barlow, Barlow_Semi_Condensed } from 'next/font/google';
import './_utils/s3Utils';

const barlow = Barlow({
    subsets: ['latin'],
    weight: ['400', '600', '800', '900'],
    variable: '--font-barlow',
});

const barlowSemiCondensed = Barlow_Semi_Condensed({
    subsets: ['latin'],
    weight: ['800'],
    variable: '--font-barlow-semi-condensed',
});

export const metadata: Metadata = {
    title: 'Karabast',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en" className={`${barlow.variable} ${barlowSemiCondensed.variable}`}>
            <body>
                <ClientLayout>{children}</ClientLayout>
            </body>
        </html>
    );
}