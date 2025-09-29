import NotificationSettings from '@/components/dashboard/NotificationSettings';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Notifications',
  description: 'Manage your notification preferences and settings',
};

export default function NotificationsPage() {
  return <NotificationSettings />;
}