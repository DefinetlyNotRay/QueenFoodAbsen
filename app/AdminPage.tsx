import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Alert,
  PermissionsAndroid,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import Header from "../components/Header";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Sidenav from "../components/Sidenav";
import { BlurView } from "expo-blur";
import { DateTimePickerAndroid } from "@react-native-community/datetimepicker";
import { Dropdown } from "react-native-element-dropdown";
import { Table, Row, Rows } from "react-native-table-component";
import { ScrollView } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { NGROK_API } from "@env";
import SidenavAdmin from "../components/SidenavAdmin";
import RNFS from "react-native-fs";
import Share from "react-native-share";
import * as FileSystem from "expo-file-system";

const AdminPage: React.FC = () => {
  const router = useRouter();
  const apiUrl = NGROK_API;

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
  const [date, setDate] = useState(new Date());
  const [selectedDate1, setSelectedDate1] = useState<string | null>(null);
  const [selectedDate2, setSelectedDate2] = useState<string | null>(null);
  const [tableData, setTableData] = useState([
    ["1", "Alex", "01/09/24", "-", "Hadir"],
  ]);
  const [tableIzinData, setIzinTableData] = useState([
    ["1", "Alex", "a", "Approve"],
  ]);

  const tableHead = [
    "No",
    "Account",
    "Tanggal",
    "Absen Time",
    "Pulang Time",
    "Detail",
  ]; // Ensure you have a matching table head
  const izinTableHead = ["No", "Nama", "Alasan", "Action"]; // Ensure you have a matching table head

  const [filteredData, setFilteredData] = useState(tableData);
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState<string | null>(null);
  const [isFocus, setIsFocus] = useState(false);

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

      // Fetch Izin Data
      const izinResponse = await fetch(`${apiUrl}/table-izin`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!izinResponse.ok) {
        Alert.alert("Error", "Failed to fetch izin");
        return;
      }

      const izinData = await izinResponse.json();
      const formattedIzinData = izinData.map((row, index) => [
        index + 1,
        row.nama_karyawan,
        row.alasan,
        <View className="flex flex-col justify-center px-2 py-2 space-y-2">
          <TouchableOpacity
            className="bg-[#228E47] p-1 rounded"
            onPress={() => handleApprove(row.id_izin, row.id_akun, row.tipe)}
          >
            <Text className="text-white text-center text-[10px]">Approve</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="bg-[#F23737] p-1 rounded"
            onPress={() => handleReject(row.id_izin, row.id_akun, row.tipe)}
          >
            <Text className="text-white text-center text-[10px]">Reject</Text>
          </TouchableOpacity>
        </View>,
      ]);

      setIzinTableData(formattedIzinData);

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
          absenTime,
          pulangTime,
          row.detail,
        ];
      });

      setTableData(formattedAbsenData);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    }
  };

  const handleApprove = async (id_izin, id_akun, value) => {
    const token = await AsyncStorage.getItem("authToken");
    const today = new Date().toISOString().split("T")[0];
    Alert.alert("Approve Izin", "Approve this request?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Approve",
        onPress: async () => {
          const response = await fetch(`${apiUrl}/accept-status/`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json", // Specify content type
            },
            body: JSON.stringify({ id_izin, id_akun, value, today }), // Send id_izin in the body
          });

          if (!response.ok) {
            Alert.alert("Error", "Failed to approve izin");
            return;
          }

          fetchData();
        },
      },
    ]);
  };

  const handleReject = async (id_izin, id_akun, value) => {
    const token = await AsyncStorage.getItem("authToken");
    const today = new Date().toISOString().split("T")[0];
    Alert.alert("Reject Request", "Reject this request?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Reject",
        onPress: async () => {
          const response = await fetch(`${apiUrl}/reject-status/`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json", // Specify content type
            },
            body: JSON.stringify({ id_izin, id_akun, today, value }), // Send id_izin in the body
          });

          if (!response.ok) {
            Alert.alert("Error", "Failed to reject izin");
            return;
          }

          fetchData();
        },
      },
    ]);
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
            : !selectedDate1 && !selectedDate2 // if no filter is applied, show today's records
            ? row[2] === todayString
            : true;

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

      <View className="p-4">
        <View>
          <View className="flex flex-row justify-center flex-grow gap-5 mb-3">
            <View className="bg-[#D9D9D9] rounded p-2 w-[45%]">
              <Text>Total Karyawan Absen</Text>
              <Text className="text-2xl">{stats.attendedToday}</Text>
            </View>
            <View className="bg-[#D9D9D9] rounded p-2 w-[45%]">
              <Text>Total Karyawan Izin</Text>
              <Text className="text-2xl">{stats.izinToday}</Text>
            </View>
          </View>
          <View className="bg-[#D9D9D9] rounded p-2 w-[100%]">
            <Text>Total Karyawan</Text>
            <Text className="text-2xl">{stats.totalEmployees}</Text>
          </View>
        </View>

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
          <View style={styles.tableContainer}>
            <ScrollView style={{ maxHeight: 160 }}>
              <Table borderStyle={styles.border}>
                <Row
                  data={tableHead}
                  style={styles.tableHead}
                  textStyle={styles.text}
                />
                {filteredData.length > 0 ? (
                  <Rows data={filteredData} textStyle={styles.text} />
                ) : (
                  <Row data={["No data yet"]} textStyle={styles.text} />
                )}
              </Table>
            </ScrollView>
            <TouchableOpacity
              style={styles.exportButton}
              className="w-[30%] rounded-md ml-64 mt-2 px-2 py-2"
            >
              <Text className="text-xs text-center text-white">
                Export To Excel
              </Text>
            </TouchableOpacity>
          </View>
          <Text className="mt-2 mb-2 text-xl font-semibold">Izin</Text>
          <View style={styles.tableContainer}>
            <ScrollView style={{ maxHeight: 280 }}>
              <Table borderStyle={styles.border}>
                <Row
                  data={izinTableHead}
                  style={styles.tableHead}
                  textStyle={styles.text}
                />
                {tableIzinData.length > 0 ? (
                  <Rows data={tableIzinData} textStyle={styles.text} />
                ) : (
                  <Row
                    data={["No data yet"]}
                    style={styles.tableRow}
                    textStyle={styles.text}
                  />
                )}
              </Table>
            </ScrollView>
          </View>
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
});

export default AdminPage;
