import NotificationSettings from '@/components/dashboard/NotificationSettings';
import DashboardSidebar from '@/components/dashboard/DashboardSidebar';
import { Metadata } from 'next';
import { ArrowLeft, Bell, LayoutDashboard } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Notifications',
  description: 'Manage your notification preferences and settings',
};

export default function NotificationsPage() {
  return (
    <div className="dashboard-theme min-h-screen bg-background text-foreground md:flex">
      <DashboardSidebar>
        <nav aria-label="Dashboard navigation" className="py-4">
          <p className="px-6 pb-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Main navigation
          </p>
          <div className="flex overflow-x-auto md:flex-col">
            <Link href="/dashboard" className="flex items-center gap-3 border-l-2 border-transparent px-6 py-3 text-sm font-medium text-slate-300 hover:bg-white/5 hover:text-white">
              <LayoutDashboard className="h-4 w-4 shrink-0" />
              Dashboard
            </Link>
            <Link href="/notifications" aria-current="page" className="flex items-center gap-3 border-l-2 border-violet-400 bg-[#292052] px-6 py-3 text-sm font-medium text-white">
              <Bell className="h-4 w-4 shrink-0" />
              Notifications
            </Link>
          </div>
        </nav>
      </DashboardSidebar>
      <div className="min-w-0 flex-1">
        <header className="flex min-h-16 flex-wrap items-center justify-between gap-3 border-b bg-card px-4 py-3 sm:px-6">
          <h1 className="text-xl font-semibold">Notifications</h1>
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline">
            <ArrowLeft className="h-4 w-4" />
            Back to dashboard
          </Link>
        </header>
        <main className="p-4 sm:p-6">
          <NotificationSettings />
        </main>
      </div>
    </div>
  );
}