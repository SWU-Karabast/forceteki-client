// layout.tsx
import type { Metadata } from "next";
import { Barlow } from "next/font/google";
import React from "react";
import { PopupProvider } from "./_contexts/Popup.context";
import "./_utils/s3Utils";
import ClientLayout from "./ClientLayout";

const barlow = Barlow({
  subsets: ["latin"],
  weight: ["400", "600", "800"],
  variable: "--font-barlow",
});

export const metadata: Metadata = {
  title: "Karabast",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={barlow.variable}>
      <body>
        <PopupProvider>
          <ClientLayout>{children}</ClientLayout>
        </PopupProvider>
      </body>
    </html>
  );
}
