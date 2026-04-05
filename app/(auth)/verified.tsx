import { router } from 'expo-router';

import VerifiedScreen from '@/src/components/auth/VerifiedScreen';

export default function VerifiedRoute() {
  return <VerifiedScreen onDone={() => router.replace('/profileSetup')} />;
}
