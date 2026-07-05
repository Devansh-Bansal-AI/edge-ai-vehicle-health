import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { Suspense } from 'react';

export default function MaintenanceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-[#fce9ed]">
      <Suspense fallback={<div className="w-[220px] bg-[#ffffff] border-r border-rose-100" />}>
        <Sidebar />
      </Suspense>
      <div className="flex-1 ml-[220px] flex flex-col">
        <Header />
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
