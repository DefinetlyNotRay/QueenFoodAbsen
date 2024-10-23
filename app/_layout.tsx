import { View, ActivityIndicator, Platform } from "react-native";
import React, { useEffect, useState, useRef } from "react";
import { Stack, useRouter } from "expo-router";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Notification handler setup
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

// Register for push notifications
async function registerForPushNotificationsAsync() {
  if (Device.isDevice) {
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      alert("Failed to get push token for push notification!");
      return;
    }

    const tokenData = await Notifications.getExpoPushTokenAsync();
    return tokenData.data; // Return the push token
  } else {
    alert("Must use physical device for push notifications");
  }

  if (Platform.OS === "android") {
    Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
    });
  }
}

const _layout = () => {
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const [expoPushToken, setExpoPushToken] = useState("");
  const [notification, setNotification] = useState<
    Notifications.Notification | undefined
  >(undefined);
  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();

  useEffect(() => {
    // Register push notifications and store the token
    const registerForPushNotifications = async () => {
      const userId = await AsyncStorage.getItem("userId");
      const token = await registerForPushNotificationsAsync();
      setExpoPushToken(token ?? "");

      if (token) {
        try {
          const response = await fetch(
            "https://queenfoodbackend-production.up.railway.app/storePushToken",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                userId: userId,
                expoPushToken: token,
              }),
            }
          );

          if (!response.ok) {
            const errorData = await response.json();
            console.error("Failed to store push token:", errorData);
          }
        } catch (error) {
          console.error("Error sending push token to backend:", error);
        }
      }
    };

    registerForPushNotifications();

    // Add listeners for notifications
    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        setNotification(notification);
        console.log("Notification received:", notification);
      });

    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        console.log("Notification response:", response);
      });

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(
          notificationListener.current
        );
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, []);

  useEffect(() => {
    // Check auth token and redirect to appropriate pages
    const checkAuthAndRedirect = async () => {
      try {
        const token = await AsyncStorage.getItem("authToken");
        const level = await AsyncStorage.getItem("level");

        if (!token) {
          router.replace("/index"); // Not logged in, redirect to login
        } else if (level === "admin") {
          router.replace("/AdminPage"); // Admin level
        } else {
          router.replace("/HomePage"); // User level
        }
      } catch (error) {
        console.error("Error fetching token or level:", error);
        router.replace("/index"); // Error, go back to login
      } finally {
        setLoading(false); // Hide the loading spinner after redirect logic
      }
    };

    checkAuthAndRedirect();
  }, [router]);

  // Display loading spinner until auth check is complete
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
