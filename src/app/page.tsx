import { redirect } from 'next/navigation';

export default function RootPage() {
  // For now, always redirect to login.
  // In a real app, check auth status here. If authenticated, redirect to '/dashboard'.
  redirect('/login');
}
