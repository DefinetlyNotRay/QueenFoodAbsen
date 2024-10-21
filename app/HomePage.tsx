import React, { useEffect, useState, useRef } from "react";
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Modal,
  Alert,
  TextInput,
} from "react-native";
import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import Header from "../components/Header";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Sidenav from "../components/Sidenav";
import { BlurView } from "expo-blur";
import { Calendar, DateData } from "react-native-calendars";
import { Dropdown } from "react-native-element-dropdown";
import * as ImagePicker from "expo-image-picker";
import axios from "axios";
import * as Location from "expo-location";
import * as Device from "expo-device";
import { Platform } from "react-native";
import SpinnerOverlay from "../components/SpinnerOverlayProps";

interface DecodedToken {
  id: string;
  username: string;
  // Add other fields if needed
}

// At the top of your file, add this type definition
type StatusColor = {
  [key: string]: string;
};

type DateMarking = {
  selected: boolean;
  selectedColor: string;
  dotColor?: string;
  selectedTextColor?: string;
};

type DatesObject = {
  [date: string]: DateMarking;
};

// Add this type definition at the top of your file
type MarkedDates = {
  [date: string]: {
    selected: boolean;
    selectedColor: string;
    dotColor?: string;
    selectedTextColor?: string;
  };
};

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
  const [locationDisplay, setLocationDisplay] = useState("");
  const router = useRouter();
  const [expoPushToken, setExpoPushToken] = useState("");
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1); // Start with current month
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear()); // Start with current year
  const [attendanceCounts, setAttendanceCounts] = useState({
    hadir: 0,
    izin: 0,
    sakit: 0,
    alpha: 0,
  });
  // Constants
  const statusColors: StatusColor = {
    Hadir: "#159847",
    Izin: "#00CABE",
    Sakit: "#F2D437",
    Alpha: "#6F6262",
  };

  const items = [
    { label: "Sakit", value: "Sakit" },
    { label: "Izin", value: "Izin" },
  ];
  const withLoading = async (func: () => Promise<void>) => {
    setIsLoading(true);
    try {
      await func();
    } catch (error) {
      console.error("Error:", error);
      Alert.alert("Error", "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };
  // useEffect hooks
  useEffect(() => {
    checkAttendance();
    checkHome();
    checkIzin();
    checkIzinApproveOrReject();
    getTime();
  }, []);
  useEffect(() => {
    const getNotificationPermissions = async () => {
      // Get the current notification permissions
      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      // If the permission is not granted, request it
      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      // If still not granted, show an alert
      if (finalStatus !== "granted") {
        Alert.alert(
          "Permission required",
          "You need to grant permission to receive notifications"
        );
      }
    };

    getNotificationPermissions();
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
  const saveTokenToBackend = async (token: string) => {
    const userId = await AsyncStorage.getItem("userId"); // Assuming you have userId stored in AsyncStorage
    const response = await fetch(
      `https://queenfoodbackend-production.up.railway.app/expo-push-token`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, // Include the user's auth token if needed
        },
        body: JSON.stringify({ userId, expoPushToken: token }),
      }
    );

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
        `https://queenfoodbackend-production.up.railway.app/getTime?userId=${userId}&date=${today}`
      );

      // Mengakses data dari respons
      const { absen_time, pulang_time, lokasi } = response.data;

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
      if (lokasi) {
        setLocationDisplay(lokasi);
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

        const response = await axios.get(
          `https://queenfoodbackend-production.up.railway.app/attendance/${userId}`
        );
        const attendanceData = response.data;

        // Get today's date and start date (September 1st)
        const today = new Date();
        const startDate = new Date("2024-10-17");

        // Initialize dates object with Alpha status for every day from startDate until today
        const dates: DatesObject = {};
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
        attendanceData.forEach((item: any) => {
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
  const checkAttendance = () =>
    withLoading(async () => {
      try {
        const userId = await AsyncStorage.getItem("userId");
        if (!userId) {
          throw new Error("User ID not found");
        }

        const today = new Date().toISOString().split("T")[0];
        const response = await axios.get(
          `https://queenfoodbackend-production.up.railway.app/checkAttendance?userId=${userId}&date=${today}`
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
    });

  /**
   * Checks if the user has already gone home today
   */
  const checkHome = () =>
    withLoading(async () => {
      try {
        const userId = await AsyncStorage.getItem("userId");
        if (!userId) {
          throw new Error("User ID not found");
        }

        const today = new Date().toISOString().split("T")[0];
        const response = await axios.get(
          `https://queenfoodbackend-production.up.railway.app/checkHome?userId=${userId}&date=${today}`
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
    });

  /**
   * Checks if the user has already submitted an absence request today
   */
  const checkIzin = () =>
    withLoading(async () => {
      try {
        const userId = await AsyncStorage.getItem("userId");
        if (!userId) {
          throw new Error("User ID not found");
        }

        const today = new Date().toISOString().split("T")[0];
        const response = await axios.get(
          `https://queenfoodbackend-production.up.railway.app/checkIzin?userId=${userId}&date=${today}`
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
    });

  const checkIzinApproveOrReject = () =>
    withLoading(async () => {
      try {
        const userId = await AsyncStorage.getItem("userId");
        if (!userId) {
          throw new Error("User ID not found");
        }

        const today = new Date().toISOString().split("T")[0];
        const response = await axios.get(
          `https://queenfoodbackend-production.up.railway.app/checkIzinApproveOrReject?userId=${userId}&date=${today}`
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
    });

  /**
   * Retrieves the current location of the user
   */
  const getLocationData = () =>
    withLoading(async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Location Error",
          "Permission to access location was denied"
        );
        return;
      }
      let currentLocation = await Location.getCurrentPositionAsync({});
      setLocation(currentLocation);
      setTimeout(() => {
        setLoactionModal(false);
        setEtelaseModal(true);
        Alert.alert("Location Sucessfully Retrieved");
      }, 1000);
    });

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
      console.log("Camera operation canceled or failed");
    }
  };

  /**
   * Takes a photo of the etalase using the device camera
   */
  const takeEtalase = () =>
    withLoading(async () => {
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
        console.log("Camera operation canceled or failed");
      }
    });

  /**
   * Handles the upload of the attendance photo
   */
  const handleUpload = async (imageUri: string) =>
    withLoading(async () => {
      try {
        const imageUrl = await uploadImageToCloudinary(imageUri);
        console.log("Image URL:", imageUrl);
        setImageUrl(imageUrl);
      } catch (error) {
        console.error("Failed to upload image:", error);
        Alert.alert("Error", "Failed to upload image.");
      }
    });

  /**
   * Retrieves the address from given coordinates
   */
  const getAddressFromCoordinates = async (latitude: any, longitude: any) => {
    const apiKey = "oQpDT61lYsQpX376bAf3aK1myogYGLLR"; // Replace with your TomTom API key
    const url = `https://api.tomtom.com/search/2/reverseGeocode/${latitude},${longitude}.json?key=${apiKey}`;

    try {
      const response = await axios.get(url);
      const addressData = response.data.addresses;

      if (addressData.length > 0) {
        const address = addressData[0].address.freeformAddress;
        return address;
      } else {
        return "Address not found";
      }
    } catch (error) {
      console.error("Error fetching address from TomTom:", error);
      return "Error fetching address";
    }
  };

  /**
   * Creates an attendance record
   */
  const createAbsen = (etalaseUrl: string) =>
    withLoading(async () => {
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

        const response = await axios.post(
          `https://queenfoodbackend-production.up.railway.app/createAbsen`,
          absenData
        );

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
    });

  /**
   * Handles the upload of the etalase photo
   */
  const handleEtalaseUpload = (imageUri: string) =>
    withLoading(async () => {
      try {
        const imageUrl = await uploadEtalaseToCloudinary(imageUri);
        setEtalaseUrl(imageUrl);
        createAbsen(imageUrl);
      } catch (error) {
        console.error("Failed to upload etalase image:", error);
        Alert.alert("Error", "Failed to upload etalase image.");
      }
    });

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
    } as any);
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
    } catch (error: any) {
      // Add ': any' here
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
    } as any);
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
  const submitForm = () =>
    withLoading(async () => {
      try {
        const userId = await AsyncStorage.getItem("userId");
        if (!userId) {
          throw new Error("User ID not found in AsyncStorage");
        }

        if (!alasanInput) {
          Alert.alert(
            "Error",
            "Please fill in all fields and select an image."
          );
          return;
        }

        const today = new Date().toISOString().split("T")[0];

        console.log("Saving data...");
        const saveResponse = await axios.post(
          `https://queenfoodbackend-production.up.railway.app/uploadIzin?userId=${userId}&date=${today}`,
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
    });

  /**
   * Marks the user as gone home for the day
   */
  const absenPulang = () =>
    withLoading(async () => {
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
                  `https://queenfoodbackend-production.up.railway.app/absen-pulang/${userId}`
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
                  (error as any).response?.data?.message ||
                    "Failed to mark attendance."
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
    });
  const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  const currentDay = new Date().getDay(); // 0 is Sunday, 1 is Monday, etc.
  // Function to calculate attendance based on selected month
  const calculateAttendanceCounts = (
    markedDates: MarkedDates,
    month: number,
    year: number
  ) => {
    const attendanceCounts = {
      hadir: 0,
      libur: 0,
      izin: 0,
      sakit: 0,
      alpha: 0,
    };

    // Iterate over markedDates to count the occurrences for the selected month and year
    Object.keys(markedDates).forEach((date) => {
      const dateObj = new Date(date);
      const dateMonth = dateObj.getMonth() + 1;
      const dateYear = dateObj.getFullYear();

      if (dateMonth === month && dateYear === year) {
        const status = markedDates[date].selectedColor;
        if (status === "#159847") attendanceCounts.hadir++;
        else if (status === "#F2D437") attendanceCounts.libur++;
        else if (status === "#00CABE") attendanceCounts.izin++;
        else if (status === "#B0AF9F") attendanceCounts.sakit++;
        else if (status === "#6F6262") attendanceCounts.alpha++;
      }
    });

    return attendanceCounts;
  };

  // Handle month change
  const handleMonthChange = (monthData: { month: number; year: number }) => {
    const newMonth = monthData.month;
    const newYear = monthData.year;

    setCurrentMonth(newMonth);
    setCurrentYear(newYear);

    // Update attendance counts when the month changes
    const newAttendanceCounts = calculateAttendanceCounts(
      markedDates,
      newMonth,
      newYear
    );
    setAttendanceCounts(newAttendanceCounts);
  };

  // Run when the app first loads to set the default month's attendance counts
  useEffect(() => {
    const initialAttendanceCounts = calculateAttendanceCounts(
      markedDates,
      currentMonth,
      currentYear
    );
    setAttendanceCounts(initialAttendanceCounts);
  }, [markedDates]); // This effect runs when markedDates is loaded
  console.log(markedDates);
  return (
    <View style={{ flex: 1 }}>
      <SpinnerOverlay visible={isLoading} />

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
        <View className="bg-[#990F66] flex p-5 rounded-md w-full shadow-lg">
          <View>
            <Text className="text-xl font-bold text-white ">
              {days[currentDay]}
            </Text>
          </View>
          <View>
            <Text className="font-bold text-white">
              Lokasi: {locationDisplay}
            </Text>
            <Text className="font-bold text-white">
              Absen Masuk: {absenTime}
            </Text>
            <Text className="font-bold text-white">
              Absen Pulang: {pulangTime}
            </Text>
          </View>
        </View>

        <View className="flex flex-row flex-wrap justify-center gap-4">
          <TouchableOpacity
            className={`w-[160px] rounded-md py-3 px-1 ${
              hasAttendedToday || hasIzinToday
                ? "bg-[#159847] opacity-50"
                : "bg-[#159847]"
            }`}
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
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setAbsenModalVisible(!absenModal)}
                >
                  <Text style={styles.closeButtonText}>X</Text>
                </TouchableOpacity>

                <Text>Take a Selfie Right Now</Text>

                <TouchableOpacity
                  style={styles.uploadButton}
                  onPress={takePhoto}
                >
                  <Text style={styles.textStyle}>Take Photo</Text>
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
                  style={styles.uploadButton}
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
                  style={styles.uploadButton}
                  onPress={takeEtalase}
                >
                  <Text style={styles.textStyle}>Send Display Photo</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
          <TouchableOpacity
            className={`w-[160px] rounded-md py-3 px-1 ${
              hasGoneHome || hasIzinToday || isGoneHomeDisabled
                ? "bg-[#F23737] opacity-50"
                : "bg-[#F23737]"
            }`}
            onPress={absenPulang}
            disabled={hasGoneHome || hasIzinToday || isGoneHomeDisabled} // Disable button if the user has gone home today
          >
            <Text className="font-bold text-center text-white">
              Absen Pulang
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            className={`w-[160px] rounded-md py-3 px-1 ${
              hasAttendedToday || hasIzinToday
                ? "bg-[#00CABE] opacity-50"
                : "bg-[#00CABE]"
            }`}
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
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setIzingModalVisible(!izinModal)}
                >
                  <Text style={styles.closeButtonText}>X</Text>
                </TouchableOpacity>
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
              </View>
            </View>
          </Modal>
        </View>
      </View>

      <View className="p-5 mx-5 mb-3 bg-white rounded-xl">
        <Text className="text-center text-[16px] font-bold">Presensi</Text>
        <Calendar
          onDayPress={(day: DateData) => console.log(day)}
          markedDates={markedDates}
          onMonthChange={handleMonthChange} // This will trigger when the user changes months
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
            <Text className="text-sm text-center text-white">
              {" "}
              {attendanceCounts.hadir}
            </Text>
          </View>
          <Text className="text-sm text-center">Hadir</Text>
        </View>

        <View className="flex items-center justify-center">
          <View
            className="pt-1"
            style={[styles.legendDot, { backgroundColor: "#00CABE" }]}
          >
            <Text className="text-sm text-center text-white">
              {" "}
              {attendanceCounts.izin}
            </Text>
          </View>
          <Text className="text-sm text-center">Izin</Text>
        </View>
        <View className="flex items-center justify-center">
          <View
            className="pt-1"
            style={[styles.legendDot, { backgroundColor: "#F2D437" }]}
          >
            <Text className="text-sm text-center text-white">
              {" "}
              {attendanceCounts.sakit}
            </Text>
          </View>
          <Text className="text-sm text-center">Sakit</Text>
        </View>
        <View className="flex items-center justify-center">
          <View
            className="pt-1"
            style={[styles.legendDot, { backgroundColor: "#6F6262" }]}
          >
            <Text className="text-sm text-center text-white">
              {attendanceCounts.alpha}
            </Text>
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
    position: "absolute",
    top: 10, // Distance from the top of the modal
    right: 14, // Distance from the right of the modal
    zIndex: 1, // Ensure the button stays on top
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#000",
  },
  uploadButton: {
    backgroundColor: "#159847",
    borderRadius: 10,
    padding: 10,
    elevation: 2,
    marginTop: 20,
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
  spinnerOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    zIndex: 9999,
  },
});

export default HomePage;
