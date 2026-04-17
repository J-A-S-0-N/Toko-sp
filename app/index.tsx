import CustomSplash from '@/components/CustomSplash';
import { useAuth } from '@/context/AuthContext';
import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

export default function EntryScreen() {
  const { user, loading } = useAuth();
  const [showSplash, setShowSplash] = useState(true);

  // Keep showing custom splash until auth resolves, then let it animate out
  useEffect(() => {
    if (!loading) {
      const timer = setTimeout(() => setShowSplash(false), 800);
      return () => clearTimeout(timer);
    }
  }, [loading]);

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