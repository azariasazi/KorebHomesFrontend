import { redirect } from 'next/navigation';

export default function RootPage() {
  // Placeholder until the Home Feed screen is built — sign up first,
  // per the sequencing we agreed on (Sign Up before Home Feed).
  redirect('/signup');
}
