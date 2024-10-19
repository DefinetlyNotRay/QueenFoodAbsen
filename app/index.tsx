import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import React from "react";
import { useState, useEffect } from "react";
import axios from "axios";
import { Alert } from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { NGROK_API } from "@env";
import { Image } from "expo-image";
const Login = () => {
  const apiUrl = NGROK_API;

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = await AsyncStorage.getItem("authToken");
        if (token) {
          // Redirect to login if the token is missing
          router.replace("/HomePage");
        }
      } catch (error) {
        console.error("Login First");
      }
    };

    checkAuth();
  }, []);
  const handleLogin = async () => {
    try {
      const response = await axios.post(
        `https://queenfoodbackend-production.up.railway.app/login`,
        {
          username,
          password,
        }
      );

      if (response.data.success) {
        await AsyncStorage.setItem("authToken", response.data.token);
        await AsyncStorage.setItem("userId", response.data.userId.toString());

        // Check if level is defined before storing it
        if (response.data.level) {
          await AsyncStorage.setItem("level", response.data.level);
        } else {
          console.warn("Level is undefined or null");
        }

        // Retrieve the level after setting it
        const level = await AsyncStorage.getItem("level");
        console.log(level);

        if (level === "admin") {
          router.push("/AdminPage");
        } else {
          router.push("/HomePage");
        }

        Alert.alert("Login Success", response.data.message);
      } else {
        Alert.alert("Login Failed", response.data.message);
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "An error occurred while logging in");
    }
  };

  return (
    <View className="flex justify-center flex-col px-10 h-[100vh]">
      <Text className="mb-6 text-xl font-extrabold text-black">
        Queen Food's Sales App
      </Text>
      <View
        style={styles.formContainer}
        className="w-full max-w-md px-5 py-10 bg-white"
      >
        <View className="flex gap-4">
          <View className="flex flex-row items-center justify-between">
            <Text className="text-lg font-extrabold">Login!</Text>
            <Image
              source={require("../assets/logo2.png")}
              className="w-[40px] h-[47px]"
            />
          </View>

          <View className="">
            <View className="flex flex-col gap-4">
              <View>
                <Text className="font-extrabold">Username</Text>
                <TextInput
                  editable
                  className="border-[0.5px] border-gray-300 px-2"
                  maxLength={40}
                  onChangeText={(username) => setUsername(username)}
                  value={username}
                />
              </View>
              <View>
                <Text className="font-extrabold">Password</Text>
                <TextInput
                  editable
                  className="border-[0.5px] border-gray-300 px-2"
                  maxLength={40}
                  onChangeText={(password) => setPassword(password)}
                  secureTextEntry
                  value={password}
                />
              </View>
              <TouchableOpacity
                onPress={handleLogin}
                className="bg-[#159847] py-2 px-2"
              >
                <Text className="text-sm font-bold text-center text-white">
                  Login
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};
const styles = StyleSheet.create({
  formContainer: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 20, // For Android shadow
  },
});
export default Login;
