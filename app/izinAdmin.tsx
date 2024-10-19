import React, { useEffect, useState, JSX, useCallback } from "react";
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Alert,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import Header from "../components/Header";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BlurView } from "expo-blur";
import { Table, Row, Rows } from "react-native-table-component";
import { NGROK_API } from "@env";
import SidenavAdmin from "../components/SidenavAdmin";
import { Dropdown } from "react-native-element-dropdown";
import { DateTimePickerAndroid } from "@react-native-community/datetimepicker";
import { useFocusEffect } from "@react-navigation/native";
import SpinnerOverlay from "../components/SpinnerOverlayProps";

const izinAdmin = () => {
  const [selectedDate1, setSelectedDate1] = useState<string | null>(null);
  const [selectedDate2, setSelectedDate2] = useState<string | null>(null);
  const router = useRouter();
  const [date, setDate] = useState(new Date());

  const [isFocus, setIsFocus] = useState(false);
  const [value, setValue] = useState<string | null>(null);

  const [tableIzinData, setIzinTableData] = useState([
    ["1", "Alex", "a", "Approve"],
  ]);
  const [isLoading, setIsLoading] = useState(false);
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
  const [filteredData, setFilteredData] = useState<
    (string | number | JSX.Element)[][]
  >([]);
  useFocusEffect(
    useCallback(() => {
      fetchData(); // Call your data fetching function when the screen is focused

      // Optionally, you can return a cleanup function
      return () => {
        // Clean up if necessary
      };
    }, []) // Empty dependency array ensures this runs only on focus
  );
  const items = [
    { label: "None", value: "None" },
    { label: "Sakit", value: "Sakit" },
    { label: "Izin", value: "Izin" },
  ];
  const izinTableHead = [
    "No",
    "Nama Sales",
    "Tanggal",
    "Alasan",
    "Tipe",
    "Status",
    "Action",
  ];

  // Define the column widths for each column
  const widthArr = [40, 150, 100, 150, 80, 100, 100];
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
    const checkAuth = async () => {
      try {
        const token = await AsyncStorage.getItem("authToken");
        if (!token) {
          router.replace("/index");
        }
      } catch (error) {
        console.error("Failed to get auth token:", error);
      }
    };

    checkAuth();
  }, []);

  const [isSidenavVisible, setSidenavVisible] = useState(false);
  useEffect(() => {
    fetchData(); // Initial data fetch
  }, []);

  const fetchData = () =>
    withLoading(async () => {
      try {
        const token = await AsyncStorage.getItem("authToken");
        const userId = await AsyncStorage.getItem("userId");
        if (!userId) {
          throw new Error("User ID not found in AsyncStorage");
        }
        // Fetch Izin Data
        const izinResponse = await fetch(
          `https://queenfoodbackend-production.up.railway.app/table-izin-admin`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (!izinResponse.ok) {
          Alert.alert("Error", "Failed to fetch izin");
          return;
        }

        const izinData = await izinResponse.json();
        const formattedIzinData = izinData.map((row: any, index: number) => {
          const date = new Date(row.tanggal_izin);
          const formattedDate = formatDate(date);
          return [
            index + 1,
            row.nama_karyawan,
            formattedDate, // Use the corrected date here
            row.alasan,
            row.tipe,
            row.status,
            <View className="flex flex-col justify-center px-2 py-2 space-y-2">
              {row.status === "Pending" ? (
                <>
                  {/* Approve Button */}
                  <TouchableOpacity
                    className="bg-[#228E47] p-1 rounded"
                    onPress={() => handleApprove(row.id_izin)}
                  >
                    <Text className="text-white text-center text-[10px]">
                      Approve
                    </Text>
                  </TouchableOpacity>

                  {/* Reject Button */}
                  <TouchableOpacity
                    className="bg-[#F23737] p-1 rounded"
                    onPress={() => handleReject(row.id_izin)}
                  >
                    <Text className="text-white text-center text-[10px]">
                      Reject
                    </Text>
                  </TouchableOpacity>
                </>
              ) : (
                // Conditionally render the approved/rejected button with reduced opacity
                <TouchableOpacity
                  className={`p-1 rounded ${
                    row.status === "Approved" ? "bg-[#228E47]" : "bg-[#F23737]"
                  }`}
                  disabled={true} // Disable the button when it's not pending
                  style={{ opacity: 0.6 }} // Lower opacity to indicate it's not clickable
                >
                  <Text className="text-white text-center text-[10px] capitalize">
                    {row.status} {/* Will show "approved" or "rejected" */}
                  </Text>
                </TouchableOpacity>
              )}
            </View>,
          ];
        });

        setIzinTableData(formattedIzinData);
      } catch (error) {
        console.error("Failed to fetch data:", error);
      }
    });
  const formatDate = (date: Date): string => {
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear().toString().slice(-2);
    return `${day}/${month}/${year}`;
  };

  const parseDate = (dateString: string): Date => {
    const [day, month, year] = dateString.split("/");
    return new Date(parseInt(`20${year}`), parseInt(month) - 1, parseInt(day));
  };

  useEffect(() => {
    const filterData = () => {
      const startDate = selectedDate1 ? parseDate(selectedDate1) : null;
      const endDate = selectedDate2 ? parseDate(selectedDate2) : null;

      const filtered = tableIzinData.filter((row) => {
        const izinDate = parseDate(row[2]); // 'Tanggal' column
        const izinType = row[4]; // 'Tipe' column where the attendance type is stored

        const dateMatch =
          startDate && endDate
            ? izinDate >= startDate && izinDate <= endDate
            : startDate
            ? izinDate.toDateString() === startDate.toDateString()
            : endDate
            ? izinDate.toDateString() === endDate.toDateString()
            : true;

        const attendanceMatch =
          value && value !== "None" ? izinType === value : true;

        return dateMatch && attendanceMatch;
      });

      const indexedFilteredData = filtered.map((row, index) => [
        index + 1, // New display index
        row[1], // nama_karyawan
        row[2], // tanggal_izin
        row[3], // alasan
        row[4], // tipe
        row[5], // status
        row[6], // Original id_izin (keep this!)
        <View className="flex flex-col justify-center h-3 px-2 py-2 space-y-2">
          {row[5] === "Pending" ? (
            <>
              <TouchableOpacity
                className="bg-[#228E47] p-1 rounded"
                onPress={() => handleApprove(Number(row[6]))} // Convert to number
              >
                <Text className="text-white text-center text-[10px]">
                  Approve
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="bg-[#F23737] p-1 rounded"
                onPress={() => handleReject(Number(row[6]))} // Use the original id_izin
              >
                <Text className="text-white text-center text-[10px]">
                  Reject
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              className={`p-1 rounded ${
                row[5] === "Approved" ? "bg-[#228E47]" : "bg-[#F23737]"
              }`}
              disabled={true}
              style={{ opacity: 0.6 }}
            >
              <Text className="text-white text-center text-[10px] capitalize">
                {row[5]}
              </Text>
            </TouchableOpacity>
          )}
        </View>,
      ]);

      setFilteredData(indexedFilteredData);
    };

    filterData();
  }, [selectedDate1, selectedDate2, value, tableIzinData]);

  const handleApprove = (id_izin: number) =>
    withLoading(async () => {
      const token = await AsyncStorage.getItem("authToken");

      if (!token) {
        Alert.alert("Error", "Authorization token not found");
        return;
      }

      console.log("Approving izin with ID:", id_izin); // Debug id_izin

      try {
        const response = await fetch(
          `https://queenfoodbackend-production.up.railway.app/accept-status/`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ id_izin }), // Ensure id_izin is correctly passed
          }
        );

        const responseData = await response.json(); // Parse the response

        if (!response.ok) {
          console.log("Error response data:", responseData);
          Alert.alert(
            "Error",
            responseData.message || "Failed to approve izin"
          );
          return;
        }

        console.log("Approval successful:", responseData);
        fetchData(); // Refresh the table data
      } catch (error) {
        console.error("Failed to approve izin:", error);
        Alert.alert("Error", "An error occurred while approving izin");
      }
    });

  const handleReject = (id_izin: number) =>
    withLoading(async () => {
      const token = await AsyncStorage.getItem("authToken");

      const response = await fetch(
        `https://queenfoodbackend-production.up.railway.app/reject-status/`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json", // Specify content type
          },
          body: JSON.stringify({ id_izin }), // Send id_izin in the body
        }
      );

      if (!response.ok) {
        Alert.alert("Error", "Failed to reject izin");
        return;
      }

      fetchData();
    });
  const toggleSidenav = () => {
    setSidenavVisible(!isSidenavVisible);
  };

  const closeSidenav = () => {
    setSidenavVisible(false);
  };

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

      <SidenavAdmin isVisible={isSidenavVisible} onClose={closeSidenav} />

      <View className="flex-1 min-h-screen p-4">
        <Text className="mt-2 mb-2 ml-[0.2rem] text-xl font-semibold">
          Izin
        </Text>
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
        {/* Wrap table in horizontal ScrollView for horizontal scroll */}
        <ScrollView horizontal={true}>
          <View>
            <ScrollView style={styles.tableContainer}>
              <Table borderStyle={styles.tableBorder}>
                {/* Set column widths with widthArr */}
                <Row
                  data={izinTableHead}
                  widthArr={widthArr}
                  style={styles.tableHeader}
                  textStyle={styles.headerText}
                />
                {tableIzinData.length > 0 ? (
                  <Rows
                    data={filteredData}
                    widthArr={widthArr}
                    textStyle={styles.tableText}
                    style={styles.tableRow}
                  />
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
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
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
  blurContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    zIndex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
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

export default izinAdmin;
