import { Redirect } from 'expo-router';

export default function Index() {
  // Placeholder until we build real "already logged in?" session detection —
  // for now this mirrors the web app's root redirect to /signup.
  return <Redirect href="/signup" />;
}
