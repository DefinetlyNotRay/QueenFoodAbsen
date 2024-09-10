import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Modal, Alert, Image,TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import Header from '../components/Header';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Sidenav from '../components/Sidenav';
import { BlurView } from 'expo-blur';
import { Calendar, CalendarProps } from 'react-native-calendars';
import { Camera } from 'react-native-camera-kit'; // Updated import
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker'; // Import the ImagePicker
import axios from 'axios';
import jwtDecode from 'jwt-decode';
interface DecodedToken {
  id: string;
  username: string;
  // Add other fields if needed
}
const AdminPage: React.FC = () => {

  const router = useRouter();
 
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = await AsyncStorage.getItem('authToken');
        const level = await AsyncStorage.getItem('level');
        if(level === "user"){
          router.replace('/HomePage');
        }
        if (!token) {
          router.replace('/index');
        }
      } catch (error) {
        console.error('Failed to get auth token:', error);
      }
    };

    checkAuth();
  }, []);
  const [stats,setStats]= useState({
    totalEmployees:0,
    attendedToday:0,
    izinToday:0
  })
  useEffect(() => {
    const getStats = async () => {
        try {
          const token = await AsyncStorage.getItem('authToken');
        const response = await fetch('https://ec51-27-131-1-4.ngrok-free.app/employee-stats',{headers: {Authorization: `Bearer ${token}`},
        })
        const data = await response.json();
        console.log(data)
        setStats(data);
      } catch (error) {
        console.error('Failed to get auth token:', error);
      }
    };

    getStats();
  }, []);
  const [isSidenavVisible, setSidenavVisible] = useState(false);

  const toggleSidenav = () => {
    setSidenavVisible(!isSidenavVisible);
  };

  const closeSidenav = () => {
    setSidenavVisible(false);
  };


  return (
    <View style={{ flex: 1 }}>
    <Header onToggleSidenav={toggleSidenav} />

    {isSidenavVisible && (
      <TouchableOpacity style={styles.blurContainer} activeOpacity={1} onPress={closeSidenav}>
        <BlurView intensity={50} style={StyleSheet.absoluteFill}>
          <View style={styles.overlay} />
        </BlurView>
      </TouchableOpacity>
    )}

    <Sidenav isVisible={isSidenavVisible} onClose={closeSidenav} />

    <View className='p-4'>
        <View className=''>
            <View className="flex flex-row flex-grow gap-5 mb-3 justify-center">
                <View className='bg-[#D9D9D9] w-[45%]'>
                    <Text>Total Karyawan Absen</Text>
                    <Text>{stats.attendedToday}</Text>
                </View>
                <View className='bg-[#D9D9D9]  w-[45%]'>
                    <Text>Total Karyawan Izin</Text>
                    <Text>{stats.izinToday}</Text>
                </View>
            </View>
            <View className='bg-[#D9D9D9] w-[100%]'>
                    <Text>Total Karyawan</Text>
                    <Text>{stats.totalEmployees}</Text>
                </View>
        </View>
    </View>
    </View>
  );
};

const styles = StyleSheet.create({
  blurContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalView: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  closeButton: {
    backgroundColor: '#F23737',
    borderRadius: 10,
    padding: 10,
    elevation: 2,
    marginTop: 20,
  },
  uploadButton: {

    padding: 10,
  },
  selectedImage: {
    width: 100,
    height: 100,
    marginTop: 10,
  },
  textStyle: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  legendDot: {
    width: 30,
    height: 30,
    borderRadius: 5,
  },
});

export default AdminPage;
