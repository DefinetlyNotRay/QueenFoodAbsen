import React, { useEffect, useState, useRef } from "react";
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Modal,
  Alert,
  Image,
  TextInput,
} from "react-native";
import { useRouter } from "expo-router";
import Header from "../components/Header";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Sidenav from "../components/Sidenav";
import { BlurView } from "expo-blur";
import { Calendar, CalendarProps } from "react-native-calendars";
import { Dropdown } from "react-native-element-dropdown";
import * as ImagePicker from "expo-image-picker"; // Import the ImagePicker
import axios from "axios";
import * as Location from "expo-location";
interface DecodedToken {
  id: string;
  username: string;
  // Add other fields if needed
}

const HomePage: React.FC = () => {
  const [selectedImageAbsen, setSelectedImageAbsen] = useState<string | null>(
    null
  ); // State to store the selected image URI

  const statusColors = {
    Hadir: "#159847",
    Libur: "#F2D437",
    Izin: "#00CABE",
    Sakit: "#B0AF9F",
    Alpha: "#6F6262",
  };
  const items = [
    { label: "Sakit", value: "Sakit" },
    { label: "Izin", value: "Izin" },
  ];
  const router = useRouter();
  const [absenModal, setAbsenModalVisible] = useState(false);
  const [locationModal, setLoactionModal] = useState(false);
  const [izinModal, setIzingModalVisible] = useState(false);
  const [alasanInput, setAlesanInput] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null); // State to store the selected image URI
  const [etalaseImage, setEtalaseImage] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState("");
  const [etalaseUrl, setEtalaseUrl] = useState("");
  const [location, setLocation] = useState<Location.LocationObject | null>(
    null
  );
  const [isFocus, setIsFocus] = useState(false);
  const [value, setValue] = useState("");

  const [etelaseModal, setEtelaseModal] = useState(false);

  const [hasIzinToday, setHasIzinToday] = useState(false);

  const [hasAttendedToday, setHasAttendedToday] = useState(false);
  const [hasGoneHome, setHasGoneHome] = useState(false);

  useEffect(() => {
    checkAttendance();
    checkHome();
    checkIzin();
  }, []);
  const [isLoading, setIsLoading] = useState(true); // Tambahkan state loading

  useEffect(() => {
    const loadData = async () => {
      await checkAttendance();
      await checkHome();
      await checkIzin();
      setIsLoading(false); // Set loading false setelah semua data diambil
    };

    loadData();
  }, []);

  const checkAttendance = async () => {
    try {
      // Get the user ID from AsyncStorage or other storage method
      const userId = await AsyncStorage.getItem("userId");

      if (!userId) {
        throw new Error("User ID not found");
      }

      // Fetch attendance data for today
      const today = new Date().toISOString().split("T")[0]; // Format: yyyy-mm-dd
      const response = await axios.get(
        `https://459a-27-131-1-4.ngrok-free.app/checkAttendance?userId=${userId}&date=${today}`
      );

      // Check if the user has attended today
      if (response.data.hasAttended) {
        setHasAttendedToday(true);
      } else {
        setHasAttendedToday(false);
      }
    } catch (error) {
      console.error("Error checking attendance:", error);
      Alert.alert("Error", "Failed to check attendance.");
    }
  };
  const checkHome = async () => {
    try {
      // Get the user ID from AsyncStorage or other storage method
      const userId = await AsyncStorage.getItem("userId");

      if (!userId) {
        throw new Error("User ID not found");
      }

      // Fetch attendance data for today
      const today = new Date().toISOString().split("T")[0]; // Format: yyyy-mm-dd
      const response = await axios.get(
        `https://459a-27-131-1-4.ngrok-free.app/checkHome?userId=${userId}&date=${today}`
      );

      // Check if the user has attended today
      if (response.data.hasAttended) {
        setHasGoneHome(true);
      } else {
        setHasGoneHome(false);
      }
    } catch (error) {
      console.error("Error checking attendance:", error);
      Alert.alert("Error", "Failed to check attendance.");
    }
  };
  const checkIzin = async () => {
    try {
      // Get the user ID from AsyncStorage or other storage method
      const userId = await AsyncStorage.getItem("userId");

      if (!userId) {
        throw new Error("User ID not found");
      }

      // Fetch attendance data for today
      const today = new Date().toISOString().split("T")[0]; // Format: yyyy-mm-dd
      const response = await axios.get(
        `https://459a-27-131-1-4.ngrok-free.app/checkIzin?userId=${userId}&date=${today}`
      );

      // Check if the user has attended today
      if (response.data.hasAttended) {
        setHasIzinToday(true);
      } else {
        setHasIzinToday(false);
      }
    } catch (error) {
      console.error("Error checking attendance:", error);
      Alert.alert("Error", "Failed to check attendance.");
    }
  };
  const getLocationData = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Location Error", "Permission to access location was denied");
      return;
    }
    let currentLocation = await Location.getCurrentPositionAsync({});
    setLocation(currentLocation);
    setTimeout(() => {
      // Close the first modal
      setLoactionModal(false);
      // Open the second modal
      setEtelaseModal(true);
    }, 1000);
    Alert.alert(
      "Location Retrieved",
      `Latitude: ${currentLocation.coords.latitude}, Longitude: ${currentLocation.coords.longitude}`
    );
  };

  const takePhoto = async () => {
    console.log("Taking photo...");

    const options = {
      mediaType: "photo",
      includeBase64: true,
      quality: 0.5,
    };

    const result = await ImagePicker.launchCameraAsync(options);

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0]; // Get the first asset
      setSelectedImageAbsen(asset.uri); // Now asset is of type ImagePicker.ImagePickerAsset
      await handleUpload(asset.uri); // Call handleUpload with the image URI
    } else {
      console.log("Camera error: ", result.error);
    }
  };
  const takeEtalase = async () => {
    console.log("Taking photo...");

    const options = {
      mediaType: "photo",
      includeBase64: true,
      quality: 0.5,
    };

    const result = await ImagePicker.launchCameraAsync(options);

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0]; // Get the first asset
      setEtalaseImage(asset.uri); // Now asset is of type ImagePicker.ImagePickerAsset
      await handleEtalaseUpload(asset.uri); // Call handleUpload with the image URI
    } else {
      console.log("Camera error: ", result.error);
    }
  };
  const handleUpload = async (imageUri: string) => {
    try {
      const imageUrl = await uploadImageToCloudinary(imageUri);
      console.log("Image URL:", imageUrl);
      setImageUrl(imageUrl);
    } catch (error) {
      console.error("Failed to upload image:", error);
      Alert.alert("Error", "Failed to upload image.");
    }
  };

  const getAddressFromCoordinates = async (latitude: any, longitude: any) => {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`;

    try {
      const response = await axios.get(url);
      return response.data.display_name || "Address not found";
    } catch (error) {
      console.error("Error fetching address:", error);
      return "Error fetching address";
    }
  };
  useEffect(() => {
    console.log("Updated etalaseUrl state:", etalaseUrl);
  }, [etalaseUrl]); // This will run every time etalaseUrl changes

  const createAbsen = async (etalaseUrl: string) => {
    if (isLoading) {
      Alert.alert("Loading", "Please wait until all data is loaded.");
      return; // Cegah tindakan jika masih loading
    }
    try {
      // Get the user ID from AsyncStorage
      const userId = await AsyncStorage.getItem("userId");

      if (!userId) {
        throw new Error("User ID not found in AsyncStorage");
      }
      console.log(
        "image " + imageUrl + " etalase " + etalaseUrl + " location " + location
      );

      // Ensure both image URLs and location are available
      if (!imageUrl || !etalaseUrl || !location) {
        console.log(
          "image " +
            imageUrl +
            " etalase " +
            etalaseUrl +
            " location " +
            location
        );
        Alert.alert(
          "Error",
          "Please capture the images and retrieve location."
        );
        return;
      }
      // Extract latitude and longitude from location
      const { latitude, longitude } = location.coords;

      // Get the address from latitude and longitude
      const address = await getAddressFromCoordinates(latitude, longitude);
      // Prepare the data to be sent
      const absenData = {
        userId,
        imageUrl,
        etalaseUrl,
        location: {
          latitude,
          longitude,
          address, // Include the address in the location data
        },
      };

      // Send the data to your backend
      const response = await axios.post(
        `https://459a-27-131-1-4.ngrok-free.app/createAbsen`,
        absenData
      );

      if (response.status === 200) {
        Alert.alert("Success", "Absen created successfully.");
        // Assuming today is the date you want to mark
        const today = new Date().toISOString().split("T")[0]; // Format: yyyy-mm-dd

        // Update the marked dates after successful upload
        setMarkedDates((prevDates) => ({
          ...prevDates,
          [today]: {
            selected: true,
            selectedColor: statusColors["Hadir"],
            selectedTextColor: "white",
          },
        }));
        setLocation(null);
        setImageUrl("");
        setEtalaseUrl("");
        checkAttendance();
        checkHome();
      }
    } catch (error) {
      console.error("Error creating absen:", error);
      Alert.alert("Error", "Failed to create absen.");
    }
  };
  const handleEtalaseUpload = async (imageUri: string) => {
    try {
      const imageUrl = await uploadEtalaseToCloudinary(imageUri);
      setEtalaseUrl(imageUrl);
      createAbsen(imageUrl);
    } catch (error) {
      console.error("Failed to upload etalase image:", error);
      Alert.alert("Error", "Failed to upload etalase image.");
    }
  };
  const uploadEtalaseToCloudinary = async (imageUri: String) => {
    const userId = await AsyncStorage.getItem("userId");
    console.log("User ID:", userId);

    const formData = new FormData();
    formData.append("file", {
      uri: imageUri,
      type: "image/jpeg",
      name: `${userId}.jpg`,
    });
    formData.append("upload_preset", "my_upload_preset");

    try {
      console.log("Image URI to upload:", imageUri);
      const response = await axios.post(
        "https://api.cloudinary.com/v1_1/dezla8wit/image/upload",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setEtelaseModal(false);
      return response.data.secure_url;
    } catch (error) {
      console.error(
        "Error uploading image:",
        error.response?.data || error.message
      );
      Alert.alert("Upload Error", "Failed to upload image. Please try again.");
      throw error;
    }
  };

  const uploadImageToCloudinary = async (imageUri: String) => {
    const userId = await AsyncStorage.getItem("userId");
    const formData = new FormData();
    formData.append("file", {
      uri: imageUri,
      type: "image/jpeg", // or the appropriate type for your image
      name: `${userId}.jpg`,
    });
    formData.append("upload_preset", "my_upload_preset"); // Set your upload preset

    try {
      const response = await axios.post(
        "https://api.cloudinary.com/v1_1/dezla8wit/image/upload",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      setTimeout(() => {
        // Close the first modal

        setAbsenModalVisible(false);

        // Open the second modal
        setLoactionModal(true);
        Alert.alert("Success", "Image Successfully Uploaded.");
      }, 1000); // Simulating a 1-second delay for photo upload
      return response.data.secure_url;
    } catch (error) {
      console.error("Error uploading image:", error);
      throw error;
    }
  };

  const uploadIzinImageToCloudinary = async (imageUri: String) => {
    const userId = await AsyncStorage.getItem("userId");
    const formData = new FormData();
    formData.append("file", {
      uri: imageUri,
      type: "image/jpeg", // or the appropriate type for your image
      name: `${userId}.jpg`,
    });
    formData.append("upload_preset", "my_upload_preset"); // Set your upload preset

    try {
      const response = await axios.post(
        "https://api.cloudinary.com/v1_1/dezla8wit/image/upload",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      return response.data.secure_url; // Return the Cloudinary URL
    } catch (error) {
      console.error("Error uploading image:", error);
      throw error;
    }
  };
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = await AsyncStorage.getItem("authToken");
        const level = await AsyncStorage.getItem("level");
        if (level === "admin") {
          router.replace("/AdminPage");
        }
        if (!token) {
          router.replace("/index");
        }
      } catch (error) {
        console.error("Failed to get auth token:", error);
      }
    };

    checkAuth();
  }, []);

  const [markedDates, setMarkedDates] = useState({});

  useEffect(() => {
    const fetchAttendanceData = async () => {
      try {
        const userId = await AsyncStorage.getItem("userId");
        if (!userId) {
          throw new Error("User ID not found in AsyncStorage");
        }

        const response = await axios.get(
          `https://459a-27-131-1-4.ngrok-free.app/attendance/${userId}`
        );
        const attendanceData = response.data;

        // Get today's date and start date (September 1st)
        const today = new Date();
        const startDate = new Date("2024-09-01");

        // Initialize dates object with Alpha status for every day from startDate until today
        const dates = {};
        let currentDate = new Date(startDate);

        while (currentDate <= today) {
          const dateString = currentDate.toISOString().split("T")[0];
          dates[dateString] = {
            selected: true,
            selectedColor: statusColors["Alpha"],
            dotColor: "red",
            selectedTextColor: "white",
          };
          currentDate.setDate(currentDate.getDate() + 1); // Move to the next day
        }

        // Update dates object based on attendance data
        attendanceData.forEach((item) => {
          const { absen_time, detail } = item;
          const date = absen_time.split("T")[0]; // Extract date part from absen_time

          // Debugging line to check the detail and statusColors
          console.log(`Detail: ${detail}, Color: ${statusColors[detail]}`);

          if (statusColors[detail]) {
            dates[date] = {
              selected: true,
              selectedColor: statusColors[detail],
              dotColor: "red",
              selectedTextColor: "white",
            };
          }
        });

        // Debugging line to see the final dates object
        console.log("Marked Dates:", dates);

        // Set marked dates
        setMarkedDates(dates);
      } catch (error) {
        console.error("Error fetching attendance data:", error);
        Alert.alert(
          "Error",
          "An error occurred while fetching attendance data"
        );
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

  const submitForm = async () => {
    try {
      const userId = await AsyncStorage.getItem("userId");
      if (!userId) {
        throw new Error("User ID not found in AsyncStorage");
      }

      if (!alasanInput || !selectedImage) {
        Alert.alert("Error", "Please fill in all fields and select an image.");
        return;
      }

      // Debugging log before the image upload
      console.log("Uploading image to Cloudinary...");

      // Upload image to Cloudinary first
      const imageLink = await uploadIzinImageToCloudinary(selectedImage);
      console.log("Image uploaded to Cloudinary:", imageLink);

      const today = new Date().toISOString().split("T")[0]; // Format: yyyy-mm-dd

      // Send alasanInput and imageLink to your backend
      console.log("Saving data...");
      const saveResponse = await axios.post(
        `https://459a-27-131-1-4.ngrok-free.app/uploadIzin?userId=${userId}&date=${today}`,
        {
          alasanInput,
          imageLink,
          value,
        }
      );
      console.log("Save Response:", saveResponse.data); // Debugging line

      // Update the marked dates after successful upload
      setMarkedDates((prevDates) => ({
        ...prevDates,
        [today]: {
          selected: true,
          selectedColor: statusColors[value as keyof typeof statusColors],
          selectedTextColor: "white",
        },
      }));

      // Reset the form fields after successful submission
      setAlesanInput("");
      setSelectedImage(null);
      setValue("");
      setIzingModalVisible(false);

      // Log success and show alert
      console.log("Form submission successful. Showing alert.");
      Alert.alert("Success", "Form submitted successfully.");
    } catch (error: any) {
      console.error(
        "Error submitting form:",
        error.response ? error.response.data : error.message
      );

      // Show an alert if an error occurs
      Alert.alert("Error", "Failed to submit form.");
    }
  };

  const absenPulang = async () => {
    try {
      const userId = await AsyncStorage.getItem("userId");
      if (!userId) {
        throw new Error("User ID not found in AsyncStorage");
      }

      // Confirm action
      Alert.alert("Confirm", "Are you sure?", [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "OK",
          onPress: async () => {
            // Proceed with the API call if confirmed
            const response = await axios.post(
              `https://459a-27-131-1-4.ngrok-free.app/absen-pulang/${userId}`
            );

            console.log("Absen Pulang Response:", response.data); // Debugging line
            Alert.alert("Success", response.data.message);
          },
        },
      ]);
    } catch (error) {
      console.error("Error during absen pulang:", error);
      Alert.alert(
        "Error",
        error.response?.data?.message || "Failed to mark attendance."
      );
    }
  };
  return (
    <View style={{ flex: 1 }}>
      <Header onToggleSidenav={toggleSidenav} />

      {isSidenavVisible && (
        <TouchableOpacity
          style={styles.blurContainer}
          activeOpacity={1}
          onPress={closeSidenav}
        >
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
            disabled={hasAttendedToday || hasIzinToday} // Disable button if the user has attended today
          >
            <Text className="font-bold text-center text-white">
              Absen Masuk
            </Text>
          </TouchableOpacity>
          <Modal
            animationType="slide"
            transparent={true}
            visible={absenModal}
            onRequestClose={() => setAbsenModalVisible(!absenModal)}
          >
            <View style={styles.modalBackground}>
              <View style={styles.modalView}>
                <Text>Take a Selfie Right Now</Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={takePhoto}
                >
                  <Text style={styles.textStyle}>Take Photo</Text>
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
          <Modal
            animationType="slide"
            transparent={true}
            visible={locationModal}
            onRequestClose={() => setLoactionModal(!locationModal)}
          >
            <View style={styles.modalBackground}>
              <View style={styles.modalView}>
                <Text>Send Your Current Location</Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={getLocationData}
                >
                  <Text style={styles.textStyle}>Send Location</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
          <Modal
            animationType="slide"
            transparent={true}
            visible={etelaseModal}
            onRequestClose={() => setEtelaseModal(!etelaseModal)}
          >
            <View style={styles.modalBackground}>
              <View style={styles.modalView}>
                <Text>Send Display Photo</Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={takeEtalase}
                >
                  <Text style={styles.textStyle}>Send Display Photo</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
          <TouchableOpacity
            className="bg-[#F23737] w-[160px] rounded-md py-3 px-1"
            onPress={absenPulang}
            disabled={hasGoneHome || hasIzinToday} // Disable button if the user has gone home today
          >
            <Text className="font-bold text-center text-white">
              Absen Pulang
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="bg-[#00CABE] w-[160px] rounded-md py-3 px-1"
            onPress={() => setIzingModalVisible(true)}
            disabled={hasAttendedToday || hasIzinToday}
          >
            <Text className="font-bold text-center text-white">Izin</Text>
          </TouchableOpacity>
          <Modal
            animationType="slide"
            transparent={true}
            visible={izinModal}
            onRequestClose={() => setIzingModalVisible(!absenModal)}
          >
            <View className="p-3" style={styles.modalBackground}>
              <View className="bg-white p-5 w-[100%] rounded-md">
                <Text className="mb-5 text-xl font-bold">Izin</Text>

                <View className="">
                  <View className="flex flex-col gap-4">
                    <View>
                      <Text className="font-extrabold">Alasan</Text>
                      <TextInput
                        editable
                        className="border-[0.5px] border-gray-300 px-2"
                        maxLength={40}
                        value={alasanInput}
                        onChangeText={(alesanInput) =>
                          setAlesanInput(alesanInput)
                        }
                      />
                    </View>

                    <Text className="mb-2 font-extrabold">Type</Text>
                    <View className="justify-center flex-1 mb-5">
                      <Dropdown
                        style={{
                          height: 40,
                          borderColor: "gray",
                          borderWidth: 1,
                          borderRadius: 1,
                          paddingHorizontal: 8,
                        }}
                        placeholderStyle={{
                          fontSize: 14,
                          color: "gray",
                        }}
                        selectedTextStyle={{
                          fontSize: 14,
                        }}
                        containerStyle={{
                          backgroundColor: "white",
                          borderRadius: 5,
                        }}
                        data={items}
                        maxHeight={200}
                        labelField="label"
                        valueField="value"
                        placeholder={!isFocus ? "Select an option..." : "..."}
                        value={value}
                        onFocus={() => setIsFocus(true)}
                        onBlur={() => setIsFocus(false)}
                        onChange={(item) => {
                          setValue(item.value);
                          setIsFocus(false);
                        }}
                      />
                    </View>
                    <View className="">
                      <Text className="font-extrabold">Lampiran</Text>
                      <TouchableOpacity
                        className="border "
                        style={styles.uploadButton}
                        onPress={pickImage}
                      >
                        <Text className="text-black">Pick Image</Text>
                      </TouchableOpacity>

                      {selectedImage && (
                        <Image
                          source={{ uri: selectedImage }}
                          style={styles.selectedImage}
                        />
                      )}
                    </View>
                    <TouchableOpacity
                      className="bg-[#159847] py-2 px-2"
                      onPress={submitForm}
                    >
                      <Text className="text-sm font-bold text-center text-white">
                        Submit
                      </Text>
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
            calendarBackground: "#ffffff",
            textSectionTitleColor: "#b6c1cd",
            selectedDayBackgroundColor: "#00adf5",
            selectedDayTextColor: "#ffffff",
            todayTextColor: "#90EE90",
            dayTextColor: "#2d4150",
            textDisabledColor: "#d9e1e8",
            dotColor: "#00adf5",
            selectedDotColor: "#ffffff",
            arrowColor: "orange",
            monthTextColor: "black",
            indicatorColor: "black",
            textDayFontFamily: "monospace",
            textMonthFontFamily: "monospace",
            textDayHeaderFontFamily: "monospace",
            textDayFontWeight: "300",
            textMonthFontWeight: "bold",
            textDayHeaderFontWeight: "300",
            textDayFontSize: 12,
            textMonthFontSize: 12,
            textDayHeaderFontSize: 12,
          }}
        />
      </View>

      <View className="flex flex-row items-center justify-center gap-10">
        <View className="flex items-center justify-center">
          <View
            className="pt-1"
            style={[styles.legendDot, { backgroundColor: "#159847" }]}
          >
            <Text className="text-sm text-center text-white">1</Text>
          </View>
          <Text className="text-sm text-center">Hadir</Text>
        </View>
        <View className="flex items-center justify-center">
          <View
            className="pt-1"
            style={[styles.legendDot, { backgroundColor: "#F2D437" }]}
          >
            <Text className="text-sm text-center text-white">1</Text>
          </View>
          <Text className="text-sm text-center">Libur</Text>
        </View>
        <View className="flex items-center justify-center">
          <View
            className="pt-1"
            style={[styles.legendDot, { backgroundColor: "#00CABE" }]}
          >
            <Text className="text-sm text-center text-white">1</Text>
          </View>
          <Text className="text-sm text-center">Izin</Text>
        </View>
        <View className="flex items-center justify-center">
          <View
            className="pt-1"
            style={[styles.legendDot, { backgroundColor: "#B0AF9F" }]}
          >
            <Text className="text-sm text-center text-white">1</Text>
          </View>
          <Text className="text-sm text-center">Sakit</Text>
        </View>
        <View className="flex items-center justify-center">
          <View
            className="pt-1"
            style={[styles.legendDot, { backgroundColor: "#6F6262" }]}
          >
            <Text className="text-sm text-center text-white">1</Text>
          </View>
          <Text className="text-sm text-center">Alpha</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  blurContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    zIndex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalBackground: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalView: {
    margin: 20,
    backgroundColor: "white",
    borderRadius: 20,
    padding: 35,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  closeButton: {
    backgroundColor: "#F23737",
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
    color: "white",
    fontWeight: "bold",
    textAlign: "center",
  },
  legendDot: {
    width: 30,
    height: 30,
    borderRadius: 5,
  },
});

export default HomePage;
