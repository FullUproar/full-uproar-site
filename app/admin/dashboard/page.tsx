import { redirect } from 'next/navigation';

export default function DashboardPage() {
  // Redirect to main admin page to ensure full layout loads
  redirect('/admin');
}