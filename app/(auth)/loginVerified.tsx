// --- BACK-STACK FIX (added): imports for root stack reset ---
import { CommonActions } from '@react-navigation/native';
import { useNavigation } from 'expo-router';
// To revert: restore -> import { router } from 'expo-router';
// --- END BACK-STACK FIX ---

import VerifiedScreen from '@/src/components/auth/VerifiedScreen';

export default function LoginVerifiedRoute() {
  // --- BACK-STACK FIX (added): reset whole stack so back can't return to onboarding ---
  const navigation = useNavigation();

  const handleDone = () => {
    const root = navigation.getParent() ?? navigation;
    root.dispatch(
      CommonActions.reset({ index: 0, routes: [{ name: '(tabs)' }] })
    );
  };

  return <VerifiedScreen onDone={handleDone} />;
  // To revert: replace everything in this function with the original line below
  // return <VerifiedScreen onDone={() => router.replace('/(tabs)')} />;
  // --- END BACK-STACK FIX ---
}
