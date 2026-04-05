import { router } from 'expo-router';

import VerifyingScreen from '@/src/components/auth/VerifyingScreen';

export default function VerifyingRoute() {
  return <VerifyingScreen onDone={() => router.replace('/verified')} />;
}
