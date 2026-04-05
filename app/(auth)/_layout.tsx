import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="signup" />
      <Stack.Screen name="verification" />
      <Stack.Screen name="verifying" />
      <Stack.Screen name="verified" />
      <Stack.Screen name="profileSetup" />
      <Stack.Screen name="login" />
    </Stack>
  );
}
