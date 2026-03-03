import { notFound } from 'next/navigation';
import { interpreters } from '@/lib/data/seed';
import ProfileClient from './ProfileClient';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateStaticParams() {
  return interpreters.map((i) => ({ id: String(i.id) }));
}

export default async function ProfilePage({ params }: Props) {
  const { id } = await params;
  const interpreter = interpreters.find((i) => i.id === Number(id));
  if (!interpreter) notFound();
  return <ProfileClient interpreter={interpreter} />;
}
