// ClientLayout.tsx
'use client';

import dynamic from 'next/dynamic';

const ClientProviders = dynamic(
  () => import('@/app/_components/ClientProviders/ClientProviders'),
  { ssr: false }
);

const Navbar = dynamic(() => import('./Navigation/NavBar'), { ssr: false });

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClientProviders>
      <Navbar />
      {children}
    </ClientProviders>
  );
}