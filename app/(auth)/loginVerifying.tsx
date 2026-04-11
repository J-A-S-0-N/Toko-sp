import { router } from 'expo-router';

import VerifyingScreen from '@/src/components/auth/VerifyingScreen';

export default function LoginVerifyingRoute() {
  return <VerifyingScreen onDone={() => router.replace('/(auth)/loginVerified')} />;
}
