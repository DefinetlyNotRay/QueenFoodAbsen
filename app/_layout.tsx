import { View, ActivityIndicator } from "react-native";
import React, { useEffect, useState } from "react";
import { Stack, useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

const _layout = () => {
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = await AsyncStorage.getItem("authToken");
        console.log("AuthToken:", token); // Debugging line
        if (!token) {
          // If no token, redirect to login page
          router.replace("/index");
        }
      } catch (error) {
        console.error("Error fetching token:", error); // Debugging line
      } finally {
        // Ensure loading state ends regardless of success or error
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Show a loading spinner until authentication check is done
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="HomePage" options={{ headerShown: false }} />
      <Stack.Screen name="izin" options={{ headerShown: false }} />
      <Stack.Screen name="izinAdmin" options={{ headerShown: false }} />
      <Stack.Screen name="createSales" options={{ headerShown: false }} />
      <Stack.Screen name="absenAdmin" options={{ headerShown: false }} />
      <Stack.Screen name="AdminPage" options={{ headerShown: false }} />
    </Stack>
  );
};

export default _layout;
