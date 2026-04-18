import CustomSplash from '@/components/CustomSplash';
import { useAuth } from '@/context/AuthContext';
import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

export default function EntryScreen() {
  const { user, loading } = useAuth();
  const [showSplash, setShowSplash] = useState(true);
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);

  // Ensure splash screen is shown for at least 3.5 seconds
  useEffect(() => {
    const timer = setTimeout(() => setMinTimeElapsed(true), 3500);
    return () => clearTimeout(timer);
  }, []);

  // Dismiss splash only after both auth resolves and minimum time has passed
  useEffect(() => {
    if (!loading && minTimeElapsed) {
      const timer = setTimeout(() => setShowSplash(false), 950);
      return () => clearTimeout(timer)
    }
  }, [loading, minTimeElapsed]);

  if (loading || showSplash) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0F1010' }}>
        <CustomSplash />
      </View>
    );
  }

  if (user) return <Redirect href="/(tabs)" />;
  return <Redirect href="/(onboarding)" />;
}