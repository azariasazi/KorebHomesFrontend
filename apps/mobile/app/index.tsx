import { Redirect } from 'expo-router';

export default function Index() {
  // Browsing is open to everyone, no account required — mirrors the web
  // app's root redirect to /home. Sign Up / Log In live in the home
  // header and Account tab, not as a forced first screen.
  return <Redirect href="/home" />;
}
