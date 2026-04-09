import { Metadata } from 'next';
import { AdminLogin } from '@/components/AdminLogin';

export const metadata: Metadata = {
  title: 'Login',
  robots: 'noindex, nofollow',
};

export default function LoginPage() {
  return <AdminLogin />;
}
