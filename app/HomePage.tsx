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
const HomePage: React.FC = () => {
  const statusColors = {
    Hadir: '#159847',
    Libur: '#F2D437',
    Izin: '#00CABE',
    Sakit: '#B0AF9F',
    Alpha: '#6F6262',
  };
  const router = useRouter();
  const [absenModal, setAbsenModalVisible] = useState(false);
  const [izinModal, setIzingModalVisible] = useState(false);
  const [alasanInput, setAlesanInput] = useState("")


  const [cameraVisible, setCameraVisible] = useState(false);
  const cameraRef = useRef<Camera>(null); // Correctly typed ref

  const [selectedImage, setSelectedImage] = useState<string | null>(null); // State to store the selected image URI

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
  
  const [markedDates, setMarkedDates] = useState({});
  
  useEffect(() => {
  const fetchAttendanceData = async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) {
        throw new Error('User ID not found in AsyncStorage');
      }

      const response = await axios.get(`https://ec51-27-131-1-4.ngrok-free.app/attendance/${userId}`);
      const attendanceData = response.data;

      // Get today's date and start date (September 1st)
      const today = new Date();
      const startDate = new Date('2024-09-01');

      // Initialize dates object with Alpha status for every day from startDate until today
      const dates = {};
      let currentDate = new Date(startDate);

      while (currentDate <= today) {
        const dateString = currentDate.toISOString().split('T')[0];
        dates[dateString] = {
          selected: true,
          selectedColor: statusColors['Alpha'],
          dotColor: 'red',
          selectedTextColor: 'white',
        };
        currentDate.setDate(currentDate.getDate() + 1); // Move to the next day
      }

      // Update dates object based on attendance data
      attendanceData.forEach((item) => {
        const { absen_time, detail } = item;
        const date = absen_time.split('T')[0]; // Extract date part from absen_time

        // Debugging line to check the detail and statusColors
        console.log(`Detail: ${detail}, Color: ${statusColors[detail]}`);

        if (statusColors[detail]) {
          dates[date] = {
            selected: true,
            selectedColor: statusColors[detail],
            dotColor: 'red',
            selectedTextColor: 'white',
          };
        }
      });

      // Debugging line to see the final dates object
      console.log('Marked Dates:', dates);

      // Set marked dates
      setMarkedDates(dates);
    } catch (error) {
      console.error('Error fetching attendance data:', error);
      Alert.alert('Error', 'An error occurred while fetching attendance data');
    }
  };

  fetchAttendanceData();
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

        // Process the manipulated image
        setSelectedImage(manipulatedImage.uri);

       } catch (error) {
        console.error('Failed to take image:', error);
        Alert.alert('Error', 'Failed to take image.');
      } finally {
        setCameraVisible(false);
      }
    }
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
    }
  };
  const convertToBlob = async (uri: string): Promise<Blob> => {
    const response = await fetch(uri);
    const blob = await response.blob();
    return blob;
  };
  
  
  
  const submitForm = async () => {
    if (!alasanInput || !selectedImage) {
      Alert.alert('Error', 'Please fill in all fields and select an image.');
      return;
    }
  
    try {
      // Convert image URI to Blob
      const imageBlob = await convertToBlob(selectedImage);
      console.log('Image Blob:', imageBlob); // Debugging line
  
      // Create FormData
      const formData = new FormData();
      formData.append('image', imageBlob, 'photo.jpg'); // 'photo.jpg' is the file name
  
      // Upload image to the backend
      console.log('Uploading image...');
      const uploadResponse = await axios.post('https://ec51-27-131-1-4.ngrok-free.app/upload-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 10000, // 10 seconds

      });
      console.log('Upload Response:', uploadResponse.data); // Debugging line
  
      const imageLink = uploadResponse.data.imageUrl;
  
      // Send alasanInput and imageLink to your database
      console.log('Saving data...');
      const saveResponse = await axios.post('https://ec51-27-131-1-4.ngrok-free.app/save-data', {
        alasanInput,
        imageLink,
      });
      console.log('Save Response:', saveResponse.data); // Debugging line
  
      Alert.alert('Success', 'Form submitted successfully.');
      setAlesanInput('');
      setSelectedImage(null);
    } catch (error:any) {
      console.error('Error submitting form:', error.response ? error.response.data : error.message); // Improved error logging
      Alert.alert('Error', 'Failed to submit form.');
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
          onPress={() => setAbsenModalVisible(true)}
        >
          <Text className="font-bold text-center text-white">Absen Masuk</Text>
        </TouchableOpacity>
        <Modal
          animationType="slide"
          transparent={true}
          visible={absenModal}
          onRequestClose={() => setAbsenModalVisible(!absenModal)}
        >
          <View style={styles.modalBackground}>
            <View style={styles.modalView}>
              <Text className="text-md">Take a Selfie Right Now</Text>

              <TouchableOpacity style={styles.closeButton} onPress={handleCameraPress}>
                <Text style={styles.textStyle}>Open Camera</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setAbsenModalVisible(!absenModal)}
              >
                <Text style={styles.textStyle}>Hide Modal</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        <TouchableOpacity className="bg-[#F23737] w-[160px] rounded-md py-3 px-1">
          <Text className="font-bold text-center text-white">Absen Pulang</Text>
        </TouchableOpacity>
        <TouchableOpacity className="bg-[#00CABE] w-[160px] rounded-md py-3 px-1" onPress={()=>setIzingModalVisible(true)}>
          <Text className="font-bold text-center text-white">Izin</Text>
        </TouchableOpacity>
        <Modal animationType='slide' transparent={true}visible={izinModal} onRequestClose={()=>setIzingModalVisible(!absenModal)}>
        <View className="p-3" style={styles.modalBackground} >
            <View className='bg-white p-5 w-[100%] rounded-md'>
              <Text className="mb-5 text-xl font-bold">Izin</Text>

              <View className=''>
        <View className='flex flex-col gap-4'>

          <View>
            <Text className='font-extrabold'>Alasan</Text>
            <TextInput
            editable
            className='border-[0.5px] border-gray-300 px-2'
            maxLength={40}
            value={alasanInput}
            onChangeText={(alesanInput) => setAlesanInput(alesanInput)} 
            />
          </View>
          <View>
            <Text className='font-extrabold'>Lampiran</Text>
            <TouchableOpacity className='border ' style={styles.uploadButton} onPress={pickImage}>
              <Text className='text-black'>Pick Image</Text>
            </TouchableOpacity>

            {selectedImage && (
              <Image
                source={{ uri: selectedImage }}
                style={styles.selectedImage}
              />
            )}
          </View>
          <TouchableOpacity className="bg-[#159847] py-2 px-2" onPress={submitForm}>
            <Text className="text-sm font-bold text-center text-white">Submit</Text>
          </TouchableOpacity>
        </View>
      </View>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setIzingModalVisible(!izinModal)}
              >
                <Text style={styles.textStyle}>Hide Modal</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </View>


      <View className="p-5 mx-5 mb-3 bg-white rounded-xl">
        <Text className="text-center text-[16px] font-bold">Presensi</Text>
        <Calendar
          onDayPress={(day) => console.log(day)}
          markedDates={markedDates}
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

      <View className="flex flex-row items-center justify-center gap-10">
        <View className="flex items-center justify-center">
          <View className="pt-1" style={[styles.legendDot, { backgroundColor: '#159847' }]}>
            <Text className="text-sm text-center text-white">1</Text>
          </View>
          <Text className="text-sm text-center">Hadir</Text>
        </View>
        <View className="flex items-center justify-center">
          <View className="pt-1" style={[styles.legendDot, { backgroundColor: '#F2D437' }]}>
            <Text className="text-sm text-center text-white">1</Text>
          </View>
          <Text className="text-sm text-center">Libur</Text>
        </View>
        <View className="flex items-center justify-center">
          <View className="pt-1" style={[styles.legendDot, { backgroundColor: '#00CABE' }]}>
            <Text className="text-sm text-center text-white">1</Text>
          </View>
          <Text className="text-sm text-center">Izin</Text>
        </View>
        <View className="flex items-center justify-center">
          <View className="pt-1" style={[styles.legendDot, { backgroundColor: '#B0AF9F' }]}>
            <Text className="text-sm text-center text-white">1</Text>
          </View>
          <Text className="text-sm text-center">Sakit</Text>
        </View>
        <View className="flex items-center justify-center">
          <View className="pt-1" style={[styles.legendDot, { backgroundColor: '#6F6262' }]}>
            <Text className="text-sm text-center text-white">1</Text>
          </View>
          <Text className="text-sm text-center">Alpha</Text>
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

export default HomePage;
