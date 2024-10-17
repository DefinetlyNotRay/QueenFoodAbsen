import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Alert,
  Modal,
} from "react-native";
import { useRouter } from "expo-router";
import Header from "../components/Header";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Image } from "expo-image";

import { BlurView } from "expo-blur";
import { DateTimePickerAndroid } from "@react-native-community/datetimepicker";
import { Dropdown } from "react-native-element-dropdown";
import { Table, Row, Rows } from "react-native-table-component";
import { ScrollView } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { NGROK_API } from "@env";
import SidenavAdmin from "../components/SidenavAdmin";

import * as FileSystem from "expo-file-system";
import * as XLSX from "xlsx";
import * as Sharing from "expo-sharing";
const absenAdmin: React.FC = () => {
  const router = useRouter();
  const apiUrl = NGROK_API;
  const [date, setDate] = useState(new Date());
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  const [stats, setStats] = useState({
    totalEmployees: 0,
    attendedToday: 0,
    izinToday: 0,
  });
  useFocusEffect(
    useCallback(() => {
      fetchData(); // Call your data fetching function when the screen is focused

      // Optionally, you can return a cleanup function
      return () => {
        // Clean up if necessary
      };
    }, []) // Empty dependency array ensures this runs only on focus
  );
  const [isSidenavVisible, setSidenavVisible] = useState(false);
  const [selectedDate1, setSelectedDate1] = useState<string | null>(null);
  const [selectedDate2, setSelectedDate2] = useState<string | null>(null);

  const [tableData, setTableData] = useState([
    ["1", "Alex", "01/09/24", "-", "Hadir"],
  ]);
  const widthArr = [40, 150, 120, 100, 100, 100, 140, 140, 130];
  const openImageModal = (imageUrl) => {
    setSelectedImage(imageUrl);
    setModalVisible(true);
  };

  const closeImageModal = () => {
    setModalVisible(false);
    setSelectedImage(null);
  };
  const tableHead = [
    "No",
    "Nama Sales",
    "Tanggal",
    "Foto Selfie",
    "Foto Etalase",
    "Lokasi",
    "Absen Time",
    "Pulang Time",
    "Detail",
  ]; // Ensure you have a matching table head

  const [filteredData, setFilteredData] = useState(tableData);
  const [value, setValue] = useState<string | null>(null);
  const [isFocus, setIsFocus] = useState(false);
  // Function to export to Excel
  const exportToExcel = async () => {
    try {
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet([tableHead, ...filteredData]);
      XLSX.utils.book_append_sheet(wb, ws, "Sheet1");

      const wbout = XLSX.write(wb, { type: "base64", bookType: "xlsx" });
      const fileUri = FileSystem.documentDirectory + "tableData.xlsx";

      await FileSystem.writeAsStringAsync(fileUri, wbout, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Check if sharing is available, then share the file
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri);
      } else {
        Alert.alert("Error", "Sharing is not available on this device");
      }
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      Alert.alert("Error", "Failed to export data to Excel");
    }
  };
  const items = [
    { label: "None", value: "None" },
    { label: "Hadir", value: "Hadir" },
    { label: "Sakit", value: "Sakit" },
    { label: "Izin", value: "Izin" },
    { label: "Alpa", value: "Alpa" },
  ];
  const formatDate = (date: Date) => {
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear().toString().slice(-2); // Get last 2 digits of year
    return `${day}/${month}/${year}`;
  };

  const parseDate = (dateStr: string) => {
    const [day, month, year] = dateStr.split("/").map(Number);
    return new Date(`20${year}`, month - 1, day);
  };
  useEffect(() => {
    fetchData(); // Initial data fetch
  }, []);

  const fetchData = async () => {
    try {
      const token = await AsyncStorage.getItem("authToken");

      // Fetch Attendance Data
      const absenResponse = await fetch(`${apiUrl}/table-absen`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!absenResponse.ok) {
        Alert.alert("Error", "Failed to fetch attendance");
        return;
      }

      const absenData = await absenResponse.json();
      const formattedAbsenData = absenData.map((row, index) => {
        const absenTime = new Date(row.absen_time).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });
        const absenDate = new Date(row.absen_time);
        const formattedDate = formatDate(absenDate);
        const pulangTime = new Date(row.pulang_time).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });

        return [
          index + 1,
          row.nama_karyawan,
          formattedDate,
          row.foto_diri, // Store the URL string instead of the JSX component
          row.foto_etalase, // Store the URL string instead of the JSX component
          row.lokasi,
          absenTime,
          pulangTime,
          row.detail,
        ];
      });

      setTableData(formattedAbsenData); // Set formattedAbsenData to state
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = await AsyncStorage.getItem("authToken");
        const level = await AsyncStorage.getItem("level");
        if (level === "user") {
          router.replace("/HomePage");
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
    const getStats = async () => {
      try {
        const token = await AsyncStorage.getItem("authToken");
        const response = await fetch(`${apiUrl}/employee-stats`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          Alert.alert("Error", "Failed to fetch statistics");
          return;
        }

        const data = await response.json();
        setStats(data);
      } catch (error) {
        console.error("Failed to get stats:", error);
      }
    };

    getStats();
  }, []);

  const toggleSidenav = () => {
    setSidenavVisible(!isSidenavVisible);
  };

  const closeSidenav = () => {
    setSidenavVisible(false);
  };

  const showDatePicker = (isFirstDatePicker: boolean) => {
    DateTimePickerAndroid.open({
      value: date,
      onChange: (event, selectedDate) => {
        if (event.type === "set" && selectedDate) {
          // Only set date if 'OK' was pressed
          const formattedDate = formatDate(selectedDate);
          if (isFirstDatePicker) {
            setSelectedDate1(formattedDate);
          } else {
            setSelectedDate2(formattedDate);
          }
        } else if (event.type === "dismissed") {
          // Handle cancel
          if (isFirstDatePicker) {
            setSelectedDate1(null);
          } else {
            setSelectedDate2(null);
          }
        }
      },
      mode: "date",
      is24Hour: true,
    });
  };

  useEffect(() => {
    const filterData = () => {
      const startDate = selectedDate1 ? parseDate(selectedDate1) : null;
      const endDate = selectedDate2 ? parseDate(selectedDate2) : null;

      const filtered = tableData.filter((row) => {
        const absenDate = parseDate(row[2]); // 'Tanggal' column
        const attendanceType = row[5]; // 'Detail' column where the attendance type is stored

        // If no date is selected, show today's records by default
        const today = new Date();
        const todayString = formatDate(today);

        const dateMatch =
          startDate && endDate
            ? absenDate >= startDate && absenDate <= endDate
            : startDate && !endDate
            ? absenDate.toDateString() === startDate.toDateString()
            : true; // if no date filter is applied, include all rows

        const attendanceMatch =
          value && value !== "None" ? attendanceType === value : true;

        return dateMatch && attendanceMatch;
      });

      // Reset the index for the filtered data
      const indexedFilteredData = filtered.map((row, index) => {
        return [index + 1, ...row.slice(1)]; // Add the new index to the first column
      });

      setFilteredData(indexedFilteredData.map((row) => row.map(String)));
    };

    filterData();
  }, [selectedDate1, selectedDate2, value, tableData]);

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

      <SidenavAdmin isVisible={isSidenavVisible} onClose={closeSidenav} />

      <View className="px-4">
        <View className="mt-4">
          <Text className="mb-2 text-xl font-bold">Absen</Text>
          <View className="flex flex-row gap-4">
            <View>
              <Text className="mb-2">Tanggal-1:</Text>
              <TouchableOpacity
                className="px-2 py-1 pr-5 border rounded"
                onPress={() => showDatePicker(true)}
              >
                <Text className="text-xs">
                  {selectedDate1 ? selectedDate1 : "Select Date"}
                </Text>
              </TouchableOpacity>
            </View>
            <View>
              <Text className="mb-2">Tanggal-2:</Text>
              <TouchableOpacity
                className="px-2 py-1 pr-5 border rounded"
                onPress={() => showDatePicker(false)}
              >
                <Text className="text-xs">
                  {selectedDate2 ? selectedDate2 : "Select Date"}
                </Text>
              </TouchableOpacity>
            </View>
            <View className="justify-center flex-1">
              <Text className="mb-2">Type:</Text>
              <Dropdown
                style={{
                  height: 30,
                  borderColor: "gray",
                  borderWidth: 1,
                  borderRadius: 5,
                  paddingHorizontal: 8,
                }}
                placeholderStyle={{
                  fontSize: 12,
                  color: "gray",
                }}
                selectedTextStyle={{
                  fontSize: 12,
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
          </View>
          <View>
            <ScrollView horizontal={true}>
              <View>
                <ScrollView style={styles.tableContainer}>
                  <Table borderStyle={styles.tableBorder}>
                    <Row
                      data={tableHead}
                      widthArr={widthArr}
                      style={styles.tableHeader}
                      textStyle={styles.headerText}
                    />
                    {filteredData.length > 0 ? (
                      filteredData.map((row, index) => (
                        <Row
                          key={index}
                          data={[
                            row[0], // No
                            row[1], // Nama Sales
                            row[2], // Tanggal
                            <TouchableOpacity
                              style={styles.fotoContainer}
                              onPress={() => openImageModal(row[3])}
                            >
                              <Image
                                source={{ uri: row[3] }}
                                style={{ width: 50, height: 50 }}
                              />
                            </TouchableOpacity>, // Foto Selfie
                            <TouchableOpacity
                              style={styles.fotoContainer}
                              onPress={() => openImageModal(row[4])}
                            >
                              <Image
                                source={{ uri: row[4] }}
                                style={{ width: 50, height: 50 }}
                              />
                            </TouchableOpacity>, // Foto Etalase
                            row[5], // Lokasi
                            row[6], // Absen Time
                            row[7], // Pulang Time
                            row[8], // Detail
                          ]}
                          widthArr={widthArr}
                          textStyle={styles.tableText}
                          style={styles.tableRow}
                        />
                      ))
                    ) : (
                      <Row
                        data={["No data yet"]}
                        widthArr={widthArr}
                        style={styles.noDataRow}
                        textStyle={styles.noDataText}
                      />
                    )}
                  </Table>
                </ScrollView>
              </View>
            </ScrollView>

            <TouchableOpacity
              style={styles.exportButton}
              className="w-[30%] rounded-md ml-64 mt-2 px-2 py-2"
              onPress={exportToExcel} // Set onPress to exportToExcel function
            >
              <Text className="text-xs text-center text-white">
                Export To Excel
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={closeImageModal}
      >
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "rgba(0, 0, 0, 0.8)",
          }}
        >
          {selectedImage && (
            <Image
              source={{ uri: selectedImage }}
              style={{ width: "100%", height: "100%", resizeMode: "contain" }}
            />
          )}
          <TouchableOpacity
            onPress={closeImageModal}
            style={{ position: "absolute", top: 20, right: 20 }}
          >
            <Text style={{ color: "white", fontSize: 20 }}>Close</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  blurContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    zIndex: 1,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)", // Modal background with transparency
  },
  fotoContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  fullSizeImage: {
    width: "100%",
    height: "100%",
  },
  closeButton: {
    position: "absolute",
    top: 40,
    right: 20,
    padding: 10,
    backgroundColor: "white",
    borderRadius: 5,
  },
  closeButtonText: {
    color: "black",
    fontWeight: "bold",
  },
  modalContent: {
    width: 300,
    padding: 20,
    backgroundColor: "white",
    borderRadius: 10,
    alignItems: "center",
  },
  modalText: {
    marginBottom: 20,
    fontSize: 18,
  },
  closeButton: {
    backgroundColor: "blue",
    padding: 10,
    borderRadius: 5,
  },
  exportButton: {
    backgroundColor: "#159847",
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  selectedDate: {
    marginTop: 10,
    fontSize: 18,
    color: "#000",
  },
  border: {
    borderWidth: 1,
    borderColor: "#c8e1ff",
  },
  text: {
    margin: 6,
    textAlign: "center",
    fontSize: 11,
  },

  tableContainer: {
    maxHeight: 600, // Adjust this to fit your screen
  },
  tableBorder: {
    borderWidth: 1,
    borderColor: "#ccc",
  },
  tableHeader: {
    backgroundColor: "black",
  },
  headerText: {
    textAlign: "center",
    fontWeight: "bold",
    color: "white",
    paddingVertical: 8,
  },
  tableRow: {
    backgroundColor: "#f8f9fa",
  },
  tableText: {
    textAlign: "center",
    paddingVertical: 8,
    color: "#333",
  },
  noDataRow: {
    backgroundColor: "#fce4ec",
  },
  noDataText: {
    textAlign: "center",
    color: "#e57373",
    paddingVertical: 8,
  },
  imageContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  image: {
    width: 50,
    height: 50,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  fullImage: {
    width: "90%",
    height: "70%",
  },
});

export default absenAdmin;
