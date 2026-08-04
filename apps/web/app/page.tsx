import { redirect } from 'next/navigation';

export default function RootPage() {
  // Anyone landing on the root sees the public Home Feed — browsing is open to
  // everyone, no account required. Sign Up / Log In live in the header.
  redirect('/home');
}
