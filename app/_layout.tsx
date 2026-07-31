import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

export default function RootLayout() {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <SafeAreaProvider>
       <QueryClientProvider client={queryClient}>
        <Stack screenOptions={{ headerShown: false }}  />
        <StatusBar style="auto" />
        <Toast />
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}


