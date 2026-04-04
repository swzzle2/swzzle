import { redirect } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';

export default async function HQPage() {
  const authed = await isAuthenticated();
  if (authed) {
    redirect('/hq/dashboard');
  } else {
    redirect('/hq/login');
  }
}
