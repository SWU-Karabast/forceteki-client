// layout.tsx
import type { Metadata } from "next";
import React from 'react';
import ClientLayout from './ClientLayout';

export const metadata: Metadata = {
	title: "Karabast",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}