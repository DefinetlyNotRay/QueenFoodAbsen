import { View, ActivityIndicator } from 'react-native';
import React, { useEffect, useState } from 'react';
import { Stack, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const _layout = () => {
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = await AsyncStorage.getItem('authToken');
        console.log('AuthToken:', token); // Debugging line
        if (!token) {
          // If there's no token, redirect to the login page
          router.replace('/index');
        } else {
          // If there's a token, stay on the current page
          setLoading(false);
        }
      } catch (error) {
        setLoading(false); // Stop loading if there's an error
      }
    };

    checkAuth();
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="HomePage" options={{ headerShown: false }} />
    </Stack>
  );
};

export default _layout;
