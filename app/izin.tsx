import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, Text,FlatList, TouchableOpacity, Modal, Alert, Image,TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import Header from '../components/Header';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Sidenav from '../components/Sidenav';
import { BlurView } from 'expo-blur';

const data = [
  { no: '1', alasan: 'Sick', tanggal: '2024-09-01', status: 'Approved' },
  { no: '2', alasan: 'Family Event', tanggal: '2024-09-02', status: 'Pending' },
  { no: '3', alasan: 'Holiday', tanggal: '2024-09-03', status: 'Rejected' },
];
const izin = () => {
    const router = useRouter();
    useEffect(() => {
        const checkAuth = async () => {
          try {
            const token = await AsyncStorage.getItem('authToken');
            if (!token) {
              router.replace('/index');
            }
          } catch (error) {
            console.error('Failed to get auth token:', error);
          }
        };
    
        checkAuth();
      }, []);
  const [isSidenavVisible, setSidenavVisible] = useState(false);

  const toggleSidenav = () => {
    setSidenavVisible(!isSidenavVisible);
  };

  const closeSidenav = () => {
    setSidenavVisible(false);
  };
  const renderRow = ({ item }) => (
    <View className="flex-row py-2">
      <Text className="flex-1 p-2 text-center border border-black">{item.no}</Text>
      <Text className="flex-1 p-2 text-center border border-black">{item.alasan}</Text>
      <Text className="flex-1 p-2 text-center border border-black">{item.tanggal}</Text>
      <Text className="flex-1 p-2 text-center border border-black">{item.status}</Text>
    </View>
  );
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
        <View className="p-4">
            <Text className='text-xl font-bold'>Izin</Text>
            <View className="">
          <View className="flex-row py-2 bg-gray-300">
        <Text className="flex-1 p-2 font-bold text-center border border-black">No</Text>
        <Text className="flex-1 p-2 font-bold text-center border border-black">Alasan</Text>
        <Text className="flex-1 p-2 font-bold text-center border border-black">Tanggal</Text>
        <Text className="flex-1 p-2 font-bold text-center border border-black">Status</Text>
      </View>
      <FlatList
        data={data}
        renderItem={renderRow}
        keyExtractor={(item) => item.no}
      />
    </View>
        </View>
    </View>

  )
}
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
export default izin