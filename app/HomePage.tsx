import React, { useEffect, useState,useRef } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Modal, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import Header from '../components/Header';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Sidenav from '../components/Sidenav';
import { BlurView } from 'expo-blur';
import { Calendar, CalendarProps } from 'react-native-calendars';
import { Camera } from 'react-native-camera-kit'; // Updated import
import * as ImageManipulator from 'expo-image-manipulator';

const HomePage: React.FC = () => {
  const router = useRouter();
  const [modalVisible, setModalVisible] = useState(false);
  const [cameraVisible, setCameraVisible] = useState(false);
  const cameraRef = useRef<Camera>(null); // Correctly typed ref

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

  const onDayPress: CalendarProps['onDayPress'] = (day) => {
    console.log('Selected day:', day);
  };

  const handleCameraPress = () => {
    setCameraVisible(true);
  };

  const onPictureTaken = async () => {
    if (cameraRef.current) {
      try {
        const { uri } = await cameraRef.current.capture(); // Adjust based on available methods

        if (!uri) {
          Alert.alert('Error', 'Failed to take picture.');
          return;
        }

        const manipulatedImage = await ImageManipulator.manipulateAsync(
          uri,
          [{ resize: { width: 800 } }],
          { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
        );

        const blob = await (await fetch(manipulatedImage.uri)).blob();

        const formData = new FormData();
        formData.append('file', blob, 'photo.jpg');

        // Replace this with your actual upload function to UploadThing
        const response = await fetch('YOUR_UPLOADTHING_URL', {
          method: 'POST',
          body: formData,
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        if (response.ok) {
          Alert.alert('Upload Successful', 'Your photo was uploaded successfully!');
        } else {
          Alert.alert('Upload Failed', 'There was a problem uploading your photo.');
        }
       } catch (error) {
        console.error('Failed to upload image:', error);
        Alert.alert('Error', 'Failed to upload image.');
      } finally {
        setCameraVisible(false);
      }
    }
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

      <View className="flex gap-2 p-5">
        <Text className="mb-2 text-xl font-extrabold">Absen Sales</Text>
        <View className="bg-[#FDCE35] flex p-5 rounded-md w-full shadow-lg">
          <View>
            <Text className="font-bold text-white">Senin</Text>
            <Text className="font-bold text-white">8:00 AM - 5:00 PM</Text>
          </View>
          <View>
            <Text className="font-bold text-white">Lokasi:-</Text>
            <Text className="font-bold text-white">Total Waktu Hari Ini:-</Text>
          </View>
        </View>

        <View className="flex flex-row flex-wrap justify-center gap-4">
          <TouchableOpacity
            className="bg-[#159847] w-[160px] rounded-md py-3 px-1"
            onPress={() => setModalVisible(true)}
          >
            <Text className="font-bold text-center text-white">Absen Masuk</Text>
          </TouchableOpacity>
          <Modal
            animationType="slide"
            transparent={true}
            visible={modalVisible}
            onRequestClose={() => setModalVisible(!modalVisible)}
          >
            <View style={styles.modalBackground}>
              <View style={styles.modalView}>
                <Text className="text-md">Take a Selfie Right Now</Text>

                <TouchableOpacity style={styles.closeButton} onPress={handleCameraPress}>
                  <Text style={styles.textStyle}>Open Camera</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setModalVisible(!modalVisible)}
                >
                  <Text style={styles.textStyle}>Hide Modal</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>

          <TouchableOpacity className="bg-[#F23737] w-[160px] rounded-md py-3 px-1">
            <Text className="font-bold text-center text-white">Absen Pulang</Text>
          </TouchableOpacity>
          <TouchableOpacity className="bg-[#00CABE] w-[160px] rounded-md py-3 px-1">
            <Text className="font-bold text-center text-white">Izin</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View className="p-5 mx-5 mb-3 bg-white rounded-xl">
        <Text className="text-center text-[16px] font-bold">Presensi</Text>
        <Calendar
          onDayPress={onDayPress}
          markedDates={{
            '2024-08-16': {
              selected: true,
              selectedColor: '#F2D437',
              dotColor: 'red',
              selectedTextColor: 'white',
            },
            '2024-08-17': {
              selected: true,
              selectedColor: '#159847',
              dotColor: 'red',
              selectedTextColor: 'white',
            },
          }}
          theme={{
            calendarBackground: '#ffffff',
            textSectionTitleColor: '#b6c1cd',
            selectedDayBackgroundColor: '#00adf5',
            selectedDayTextColor: '#ffffff',
            todayTextColor: '#90EE90',
            dayTextColor: '#2d4150',
            textDisabledColor: '#d9e1e8',
            dotColor: '#00adf5',
            selectedDotColor: '#ffffff',
            arrowColor: 'orange',
            monthTextColor: 'black',
            indicatorColor: 'black',
            textDayFontFamily: 'monospace',
            textMonthFontFamily: 'monospace',
            textDayHeaderFontFamily: 'monospace',
            textDayFontWeight: '300',
            textMonthFontWeight: 'bold',
            textDayHeaderFontWeight: '300',
            textDayFontSize: 12,
            textMonthFontSize: 12,
            textDayHeaderFontSize: 12,
          }}
        />
      </View>

      <View className="flex flex-row items-center justify-center gap-12">
        <View className="flex items-center justify-center">
          <View className="pt-[2px]" style={[styles.legendDot, { backgroundColor: '#159847' }]}>
            <Text className="text-sm text-center text-white">1</Text>
          </View>
          <Text className="text-sm text-center">Hadir</Text>
        </View>
        <View className="flex items-center justify-center">
          <View className="pt-[2px]" style={[styles.legendDot, { backgroundColor: '#F2D437' }]}>
            <Text className="text-sm text-center text-white">1</Text>
          </View>
          <Text className="text-sm text-center">Libur</Text>
        </View>
        <View className="flex items-center justify-center">
          <View className="pt-[2px]" style={[styles.legendDot, { backgroundColor: '#D84848' }]}>
            <Text className="text-sm text-center text-white">1</Text>
          </View>
          <Text className="text-sm text-center">Izin</Text>
        </View>
      </View>

      {cameraVisible && (
        <Modal
          animationType="slide"
          transparent={true}
          visible={cameraVisible}
          onRequestClose={() => setCameraVisible(!cameraVisible)}
        >
          <View style={styles.modalBackground}>
            <Camera
              style={{ flex: 1, width: '100%' }}
              ref={cameraRef} // Use the ref here
              captureAudio={false}
            >
              <TouchableOpacity
                style={{ flex: 1, justifyContent: 'flex-end', alignItems: 'center' }}
                onPress={onPictureTaken}
              >
                <Text style={{ fontSize: 18, color: 'white', marginBottom: 30 }}>Take Picture</Text>
              </TouchableOpacity>
            </Camera>
          </View>
        </Modal>
      )}

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
  textStyle: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  legendDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
});

export default HomePage;
