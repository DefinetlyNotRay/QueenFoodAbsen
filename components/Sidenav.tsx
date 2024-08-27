import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import AntDesign from '@expo/vector-icons/AntDesign';
import { Link, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';

interface SidenavProps {
  isVisible: boolean;
  onClose: () => void;
}

const Sidenav: React.FC<SidenavProps> = ({ isVisible, onClose }) => {
  const translateX = useSharedValue(-300); // Initially off-screen
  const router = useRouter();

  useEffect(() => {
    console.log('isVisible:', isVisible);
    translateX.value = withTiming(isVisible ? 0 : -300, {
      duration: 300,
      easing: Easing.inOut(Easing.ease),
    });
  }, [isVisible]);
  

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('authToken');
      router.replace('/');
      Alert.alert('Logged Out', 'You have been successfully logged out.');
    } catch (error) {
      console.error('Logout failed', error);
      Alert.alert('Error', 'Logout failed. Please try again.');
    }
  };

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
    };
  });

  return (
    <Animated.View style={[animatedStyle, { position: 'absolute', top: 0, left: 0, height: '100%', width: 250, backgroundColor: 'white', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.5, shadowRadius: 10, zIndex: 1000 }]}>
      <View className="flex flex-col bg-white  justify-between pb-14 px-4 pt-10 h-[105vh]">
        <View>
          <View className="flex flex-row justify-between items-center">
            <Text className="text-xl font-bold">Queen Food</Text>
            <TouchableOpacity onPress={onClose}>
              <AntDesign name="close" size={20} color="black" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={onClose} className="mt-4">
            <Link href="/HomePage" className="text-base font-bold">Home</Link>
          </TouchableOpacity>
          <TouchableOpacity onPress={onClose} className="mt-4">
            <Link href="/Izin" className="text-base">Izin</Link>
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={handleLogout} className="mt-4">
          <Text className="text-lg font-bold">Logout</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

export default Sidenav;
