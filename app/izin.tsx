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

const izin = () => {
  const router = useRouter();
  const [tableIzinData, setIzinTableData] = useState([
    ["1", "Alex", "a", "Approve"],
  ]);
  const izinTableHead = ["No", "Tanggal", "Alasan", "Tipe", "Status"];
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
          throw new Error("User ID not found in AsyncStorage");
        }
        // Fetch Izin Data
        const izinResponse = await fetch(
          `https://queenfoodbackend-production.up.railway.app/table-izin-karyawan/${userId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (!izinResponse.ok) {
          Alert.alert("Error", "Failed to fetch izin");
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
        console.error("Failed to fetch data:", error);
      }
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

      <Sidenav isVisible={isSidenavVisible} onClose={closeSidenav} />

      <View className="flex-1 p-4">
        <Text className="mt-2 mb-2 ml-[0.2rem] text-xl font-semibold">
          Izin
        </Text>
        {/* Wrap table in horizontal ScrollView for horizontal scroll */}
        <ScrollView horizontal={true} style={{ maxHeight: 700 }}>
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
                    data={tableIzinData}
                    widthArr={widthArr}
                    textStyle={styles.tableText}
                    style={styles.tableRow}
                  />
                ) : (
                  <Row
                    data={["No data yet"]}
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
