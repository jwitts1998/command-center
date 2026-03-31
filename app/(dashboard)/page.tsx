import { redirect } from 'next/navigation';

// Redirect homepage to chat - AI-first interface
export default function HomePage() {
  redirect('/chat');
}
