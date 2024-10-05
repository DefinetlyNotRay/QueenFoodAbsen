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
import * as Notifications from "expo-notifications";
import * as Permissions from "expo-permissions";
import { useRouter } from "expo-router";
import Header from "../components/Header";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Sidenav from "../components/Sidenav";
import { BlurView } from "expo-blur";
import { Calendar, CalendarProps } from "react-native-calendars";
import { Dropdown } from "react-native-element-dropdown";
import * as ImagePicker from "expo-image-picker";
import axios from "axios";
import * as Location from "expo-location";
import { NGROK_API } from "@env";
import Constants from "expo-constants";
import * as Device from "expo-device";
import { Platform } from "react-native";

interface DecodedToken {
  id: string;
  username: string;
  // Add other fields if needed
}

const HomePage: React.FC = () => {
  // State variables
  const [selectedImageAbsen, setSelectedImageAbsen] = useState<string | null>(
    null
  );
  const [absenModal, setAbsenModalVisible] = useState(false);
  const [locationModal, setLoactionModal] = useState(false);
  const [izinModal, setIzingModalVisible] = useState(false);
  const [alasanInput, setAlesanInput] = useState("");
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
  const [isGoneHomeDisabled, setIsGoneHomeDisabled] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [markedDates, setMarkedDates] = useState({});
  const [isSidenavVisible, setSidenavVisible] = useState(false);
  const [absenTime, setAbsenTime] = useState("");
  const [pulangTime, setPulangTime] = useState("");

  const router = useRouter();
  const apiUrl = NGROK_API;
  const [expoPushToken, setExpoPushToken] = useState("");

  // Constants
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

  // useEffect hooks
  useEffect(() => {
    checkAttendance();
    checkHome();
    checkIzin();
    checkIzinApproveOrReject();
    getTime();
  }, []);
  useEffect(() => {
    const getPermissions = async () => {
      const { status } = await Permissions.getAsync(Permissions.NOTIFICATIONS);
      if (status !== "granted") {
        const { status: newStatus } = await Permissions.askAsync(
          Permissions.NOTIFICATIONS
        );
        if (newStatus !== "granted") {
          alert("You need to grant permission to receive notifications");
        }
      }
    };

    getPermissions();
  }, []);
  useEffect(() => {
    const registerForPushNotificationsAsync = async () => {
      if (Device.isDevice) {
        const { status: existingStatus } =
          await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== "granted") {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }

        if (finalStatus !== "granted") {
          alert("You need to grant permission to receive notifications");
          return;
        }

        const token = (await Notifications.getExpoPushTokenAsync()).data;
        setExpoPushToken(token);
        console.log("Expo Push Token:", token);

        // Save the token to your backend
        await saveTokenToBackend(token);
      } else {
        alert("Must use a physical device for push notifications");
      }

      if (Platform.OS === "android") {
        Notifications.setNotificationChannelAsync("default", {
          name: "default",
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: "#FF231F7C",
        });
      }
    };

    registerForPushNotificationsAsync();
  }, []);
  const saveTokenToBackend = async (token) => {
    const userId = await AsyncStorage.getItem("userId"); // Assuming you have userId stored in AsyncStorage
    const response = await fetch(`${apiUrl}/expo-push-token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`, // Include the user's auth token if needed
      },
      body: JSON.stringify({ userId, expoPushToken: token }),
    });

    if (!response.ok) {
      console.error("Failed to save push token:", response.status);
      alert("Failed to save push token. Please try again.");
    } else {
      console.log("Push token saved successfully.");
    }
  };

  console.log("Expo Push Token:", expoPushToken);
  useEffect(() => {
    const notificationListener = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log("Notification received:", notification);
      }
    );

    const responseListener =
      Notifications.addNotificationResponseReceivedListener((response) => {
        console.log("Notification response:", response);
      });

    return () => {
      Notifications.removeNotificationSubscription(notificationListener);
      Notifications.removeNotificationSubscription(responseListener);
    };
  }, []);

  useEffect(() => {
    console.log("Updated etalaseUrl state:", etalaseUrl);
  }, [etalaseUrl]);

  const getTime = async () => {
    try {
      const userId = await AsyncStorage.getItem("userId");
      if (!userId) {
        throw new Error("User ID not found");
      }

      const today = new Date().toISOString().split("T")[0];
      const response = await axios.get(
        `${apiUrl}/getTime?userId=${userId}&date=${today}`
      );

      // Mengakses data dari respons
      const { absen_time, pulang_time } = response.data;

      if (absen_time) {
        // Mengkonversi waktu UTC ke waktu lokal untuk absen_time
        const absenDate = new Date(absen_time);
        const timeAbsen = absenDate.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        });
        setAbsenTime(timeAbsen); // Set absen time state
        console.log("Absen Time:", timeAbsen);
      }

      if (pulang_time) {
        // Mengkonversi waktu UTC ke waktu lokal untuk pulang_time (jika ada)
        const pulangDate = new Date(pulang_time);
        const timePulang = pulangDate.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        });
        setPulangTime(timePulang); // Set pulang time state if available
        console.log("Pulang Time:", timePulang);
      } else {
        setPulangTime(""); // Set null if pulang time is not available
        console.log("Pulang time is not set.");
      }
    } catch (error) {}
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

  useEffect(() => {
    const fetchAttendanceData = async () => {
      try {
        const userId = await AsyncStorage.getItem("userId");
        if (!userId) {
          throw new Error("User ID not found in AsyncStorage");
        }

        const response = await axios.get(`${apiUrl}/attendance/${userId}`);
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
          currentDate.setDate(currentDate.getDate() + 1);
        }

        // Update dates object based on attendance data
        attendanceData.forEach((item) => {
          const { absen_time, detail } = item;
          const date = absen_time.split("T")[0];

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

  // Helper functions
  /**
   * Checks if the user has already attended today
   */
  const checkAttendance = async () => {
    try {
      const userId = await AsyncStorage.getItem("userId");
      if (!userId) {
        throw new Error("User ID not found");
      }

      const today = new Date().toISOString().split("T")[0];
      const response = await axios.get(
        `${apiUrl}/checkAttendance?userId=${userId}&date=${today}`
      );

      if (response.data.hasAttended) {
        setHasAttendedToday(true);
        setIsGoneHomeDisabled(false);
      } else {
        setHasAttendedToday(false);
        setIsGoneHomeDisabled(true);
      }
    } catch (error) {
      console.error("Error checking attendance:", error);
      Alert.alert("Error", "Failed to check attendance.");
    }
  };

  /**
   * Checks if the user has already gone home today
   */
  const checkHome = async () => {
    try {
      const userId = await AsyncStorage.getItem("userId");
      if (!userId) {
        throw new Error("User ID not found");
      }

      const today = new Date().toISOString().split("T")[0];
      const response = await axios.get(
        `${apiUrl}/checkHome?userId=${userId}&date=${today}`
      );

      if (response.data.hasAttended) {
        setHasGoneHome(true);
      } else {
        setHasGoneHome(false);
      }
    } catch (error) {
      console.error("Error checking home status:", error);
      Alert.alert("Error", "Failed to check home status.");
    }
  };

  /**
   * Checks if the user has already submitted an absence request today
   */
  const checkIzin = async () => {
    try {
      const userId = await AsyncStorage.getItem("userId");
      if (!userId) {
        throw new Error("User ID not found");
      }

      const today = new Date().toISOString().split("T")[0];
      const response = await axios.get(
        `${apiUrl}/checkIzin?userId=${userId}&date=${today}`
      );

      if (response.data.hasAttended) {
        setHasIzinToday(true);
      } else {
        setHasIzinToday(false);
      }
    } catch (error) {
      console.error("Error checking izin status:", error);
      Alert.alert("Error", "Failed to check izin status.");
    }
  };

  const checkIzinApproveOrReject = async () => {
    try {
      const userId = await AsyncStorage.getItem("userId");
      if (!userId) {
        throw new Error("User ID not found");
      }

      const today = new Date().toISOString().split("T")[0];
      const response = await axios.get(
        `${apiUrl}/checkIzinApproveOrReject?userId=${userId}&date=${today}`
      );

      if (response.data.hasIzinStatus) {
        setHasIzinToday(true);
        console.log("Has Izin Today", hasIzinToday);
      } else {
        setHasIzinToday(false);
        console.log("Has Izin Today", hasIzinToday);
      }
    } catch (error) {
      console.error("Error checking izin Accept/Reject status:", error);
      Alert.alert("Error", "Failed to check izin Accept/Reject status.");
    }
  };

  /**
   * Retrieves the current location of the user
   */
  const getLocationData = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Location Error", "Permission to access location was denied");
      return;
    }
    let currentLocation = await Location.getCurrentPositionAsync({});
    setLocation(currentLocation);
    setTimeout(() => {
      setLoactionModal(false);
      setEtelaseModal(true);
    }, 1000);
    Alert.alert(
      "Location Retrieved",
      `Latitude: ${currentLocation.coords.latitude}, Longitude: ${currentLocation.coords.longitude}`
    );
  };

  /**
   * Takes a photo using the device camera
   */
  const takePhoto = async () => {
    console.log("Taking photo...");

    const options = {
      mediaType: "photo",
      includeBase64: true,
      quality: 0.5,
    };

    const result = await ImagePicker.launchCameraAsync(options);

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      setSelectedImageAbsen(asset.uri);
      await handleUpload(asset.uri);
    } else {
      console.log("Camera error: ", result.error);
    }
  };

  /**
   * Takes a photo of the etalase using the device camera
   */
  const takeEtalase = async () => {
    console.log("Taking photo...");

    const options = {
      mediaType: "photo",
      includeBase64: true,
      quality: 0.5,
    };

    const result = await ImagePicker.launchCameraAsync(options);

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      setEtalaseImage(asset.uri);
      await handleEtalaseUpload(asset.uri);
    } else {
      console.log("Camera error: ", result.error);
    }
  };

  /**
   * Handles the upload of the attendance photo
   */
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

  /**
   * Retrieves the address from given coordinates
   */
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

  /**
   * Creates an attendance record
   */
  const createAbsen = async (etalaseUrl: string) => {
    if (isLoading) {
      Alert.alert("Loading", "Please wait until all data is loaded.");
      return;
    }
    try {
      const userId = await AsyncStorage.getItem("userId");
      if (!userId) {
        throw new Error("User ID not found in AsyncStorage");
      }

      if (!imageUrl || !etalaseUrl || !location) {
        Alert.alert(
          "Error",
          "Please capture the images and retrieve location."
        );
        return;
      }

      const { latitude, longitude } = location.coords;
      const address = await getAddressFromCoordinates(latitude, longitude);

      const absenData = {
        userId,
        imageUrl,
        etalaseUrl,
        location: {
          latitude,
          longitude,
          address,
        },
      };

      const response = await axios.post(`${apiUrl}/createAbsen`, absenData);

      if (response.status === 200) {
        Alert.alert("Success", "Absen created successfully.");
        const today = new Date().toISOString().split("T")[0];

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
        getTime();
      }
    } catch (error) {
      console.error("Error creating absen:", error);
      Alert.alert("Error", "Failed to create absen.");
    }
  };

  /**
   * Handles the upload of the etalase photo
   */
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

  /**
   * Uploads the etalase image to Cloudinary
   */
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

  /**
   * Uploads the attendance image to Cloudinary
   */
  const uploadImageToCloudinary = async (imageUri: String) => {
    const userId = await AsyncStorage.getItem("userId");
    const formData = new FormData();
    formData.append("file", {
      uri: imageUri,
      type: "image/jpeg",
      name: `${userId}.jpg`,
    });
    formData.append("upload_preset", "my_upload_preset");

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
        setAbsenModalVisible(false);
        setLoactionModal(true);
        Alert.alert("Success", "Image Successfully Uploaded.");
      }, 1000);
      return response.data.secure_url;
    } catch (error) {
      console.error("Error uploading image:", error);
      throw error;
    }
  };

  /**
   * Uploads the absence request image to Cloudinary
   */
  const uploadIzinImageToCloudinary = async (imageUri: String) => {
    const userId = await AsyncStorage.getItem("userId");
    const formData = new FormData();
    formData.append("file", {
      uri: imageUri,
      type: "image/jpeg",
      name: `${userId}.jpg`,
    });
    formData.append("upload_preset", "my_upload_preset");

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
      return response.data.secure_url;
    } catch (error) {
      console.error("Error uploading image:", error);
      throw error;
    }
  };

  /**
   * Toggles the visibility of the side navigation
   */
  const toggleSidenav = () => {
    setSidenavVisible(!isSidenavVisible);
  };

  /**
   * Closes the side navigation
   */
  const closeSidenav = () => {
    setSidenavVisible(false);
  };

  /**
   * Submits the absence request form
   */
  const submitForm = async () => {
    try {
      const userId = await AsyncStorage.getItem("userId");
      if (!userId) {
        throw new Error("User ID not found in AsyncStorage");
      }

      if (!alasanInput) {
        Alert.alert("Error", "Please fill in all fields and select an image.");
        return;
      }

      const today = new Date().toISOString().split("T")[0];

      console.log("Saving data...");
      const saveResponse = await axios.post(
        `${apiUrl}/uploadIzin?userId=${userId}&date=${today}`,
        {
          alasanInput,
          value,
        }
      );
      console.log("Save Response:", saveResponse.data);

      setMarkedDates((prevDates) => ({
        ...prevDates,
        [today]: {
          selected: true,
          selectedColor: statusColors[value as keyof typeof statusColors],
          selectedTextColor: "white",
        },
      }));

      setAlesanInput("");
      setValue("");
      setIzingModalVisible(false);

      console.log("Form submission successful. Showing alert.");
      Alert.alert("Success", "Form submitted successfully.");
    } catch (error: any) {
      console.error(
        "Error submitting form:",
        error.response ? error.response.data : error.message
      );
      Alert.alert("Error", "Failed to submit form.");
    }
  };

  /**
   * Marks the user as gone home for the day
   */
  const absenPulang = async () => {
    try {
      const userId = await AsyncStorage.getItem("userId");
      if (!userId) {
        throw new Error("User ID not found in AsyncStorage");
      }

      Alert.alert("Confirm", "Are you sure?", [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "OK",
          onPress: async () => {
            try {
              setIsLoading(true);
              const response = await axios.put(
                `${apiUrl}/absen-pulang/${userId}`
              );

              if (response.status === 200) {
                console.log("Absen Pulang Response:", response.data);
                Alert.alert("Success", response.data.message);
                checkHome();
                getTime();
              } else {
                Alert.alert("Error", "Unexpected response from the server.");
              }
            } catch (error) {
              console.error("Error during absen pulang:", error);
              Alert.alert(
                "Error",
                error.response?.data?.message || "Failed to mark attendance."
              );
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]);
    } catch (error) {
      console.error("Error during absen pulang:", error);
      Alert.alert("Error", "Failed to mark attendance.");
    }
  };
  useEffect;
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
            <Text className="font-bold text-white">
              Absen Masuk:{absenTime}
            </Text>
            <Text className="font-bold text-white">
              Absen Keluar:{pulangTime}
            </Text>
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
            disabled={hasGoneHome || hasIzinToday || isGoneHomeDisabled} // Disable button if the user has gone home today
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
