import React, { useEffect, useState } from "react";
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
import Sidenav from "../components/Sidenav";
import { BlurView } from "expo-blur";
import { Table, Row, Rows } from "react-native-table-component";
import { NGROK_API } from "@env";
import SpinnerOverlay from "../components/SpinnerOverlayProps";
import { DateTimePickerAndroid } from "@react-native-community/datetimepicker";
import { Dropdown } from "react-native-element-dropdown";

const izin = () => {
  const router = useRouter();
  const [tableIzinData, setIzinTableData] = useState([["-", "-", "-", "-"]]);
  const izinTableHead = ["No", "Tanggal", "Alasan", "Tipe", "Status"];
  const [isLoading, setIsLoading] = useState(false);
  const withLoading = async (func: () => Promise<void>) => {
    setIsLoading(true);
    try {
      await func();
    } catch (error) {
      console.error("Error:", error);
      Alert.alert("Error", "Terjadi kesalahan yang tidak terduga.");
    } finally {
      setIsLoading(false);
    }
  };
  // Define the column widths for each column
  const widthArr = [40, 100, 150, 80, 100];

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
          throw new Error("ID Pengguna tidak ditemukan di AsyncStorage");
        }
        // Fetch Izin Data
        const izinResponse = await fetch(
          `https://queenfoodbackend-production.up.railway.app/table-izin-karyawan/${userId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (!izinResponse.ok) {
          Alert.alert("Error", "Gagal mengambil data izin");
          return;
        }

        const izinData = await izinResponse.json();
        const formattedIzinData = izinData.map((row: any, index: number) => [
          index + 1,
          row.tanggal_izin.split("T")[0],
          row.alasan,
          row.tipe,
          row.status,
        ]);

        setIzinTableData(formattedIzinData);
      } catch (error) {
        console.error("Gagal mengambil data:", error);
      }
    });

  const toggleSidenav = () => {
    setSidenavVisible(!isSidenavVisible);
  };

  const closeSidenav = () => {
    setSidenavVisible(false);
  };

  const [selectedDate1, setSelectedDate1] = useState<string | null>(null);
  const [selectedDate2, setSelectedDate2] = useState<string | null>(null);
  const [date, setDate] = useState(new Date());
  const [isFocus, setIsFocus] = useState(false);
  const [value, setValue] = useState<string | null>(null);
  const [filteredData, setFilteredData] = useState<string[][]>([]);

  const items = [
    { label: "None", value: "None" },
    { label: "Sakit", value: "Sakit" },
    { label: "Izin", value: "Izin" },
  ];

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
        const izinDate = parseDate(row[1]); // Assuming date is in column 1
        const izinType = row[3]; // Assuming type is in column 3

        const dateMatch =
          startDate && endDate
            ? izinDate >= startDate && izinDate <= endDate
            : startDate
            ? izinDate.toDateString() === startDate.toDateString()
            : endDate
            ? izinDate.toDateString() === endDate.toDateString()
            : true;

        const typeMatch = value && value !== "None" ? izinType === value : true;

        return dateMatch && typeMatch;
      });

      const indexedFilteredData = filtered.map((row, index) => [
        (index + 1).toString(),
        ...row.slice(1),
      ]);

      setFilteredData(indexedFilteredData);
    };

    filterData();
  }, [selectedDate1, selectedDate2, value, tableIzinData]);

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

      <View className="flex-1 p-4">
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

        <ScrollView horizontal={true} style={{ maxHeight: 700 }}>
          <View>
            <ScrollView style={styles.tableContainer}>
              <Table borderStyle={styles.tableBorder}>
                <Row
                  data={izinTableHead}
                  widthArr={widthArr}
                  style={styles.tableHeader}
                  textStyle={styles.headerText}
                />
                {filteredData.length > 0 ? (
                  <Rows
                    data={filteredData}
                    widthArr={widthArr}
                    textStyle={styles.tableText}
                    style={styles.tableRow}
                  />
                ) : (
                  <Row
                    data={["No data available"]}
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
    maxHeight: 300, // Adjust this to fit your screen
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

export default izin;
