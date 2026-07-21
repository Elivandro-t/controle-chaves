import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';

export default function IndexScreen() {
  const [ready, setReady] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function restore() {
      const token = await AsyncStorage.getItem('authToken');
      const selectedFilial = await AsyncStorage.getItem('selectedFilial');

      if (!token) {
        router.replace('/login');
      } else if (!selectedFilial) {
        router.replace('/filial');
      } else {
        router.replace('/home');
      }

      setReady(true);
    }

    restore();
  }, [router]);

  if (!ready) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#0a7ea4" />
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  loaderContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0a7ea4',
  },
});
