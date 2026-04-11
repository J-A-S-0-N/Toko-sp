import { router } from 'expo-router';

import VerifiedScreen from '@/src/components/auth/VerifiedScreen';

export default function LoginVerifiedRoute() {
  return <VerifiedScreen onDone={() => router.replace('/(tabs)')} />;
}
