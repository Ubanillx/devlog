import { Metadata } from 'next';
import { AboutView } from '@/components/AboutView';

export const metadata: Metadata = {
  title: 'About',
  description: 'About me - backend developer & AI enthusiast',
};

export default function AboutPage() {
  return <AboutView />;
}
