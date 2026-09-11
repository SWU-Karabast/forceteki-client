// layout.tsx
import type { Metadata, Viewport } from 'next';
import React from 'react';
import ClientLayout from './ClientLayout';
import { barlow, barlowSemiCondensed } from './_theme/fonts';
import './_utils/s3Utils';

export const metadata: Metadata = {
    title: 'Karabast',
};

export const viewport: Viewport = {
    width: 'device-width',
    initialScale: 1,
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
