import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Alert,
  Image,
  ScrollView,
  Modal,
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

const createSales = () => {
  const apiUrl = NGROK_API;

  const router = useRouter();

  const [userTable, setUserTable] = useState([["1", "Alex", "a", "Approve"]]);

  const izinTableHead = [
    "No",
    "Nama Sales",
    "Username",
    "Password",
    "Level",
    "Action",
  ];

  // Define the column widths for each column
  const widthArr = [40, 150, 100, 150, 80, 100];

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

  const fetchData = async () => {
    try {
      const token = await AsyncStorage.getItem("authToken");
      const userId = await AsyncStorage.getItem("userId");
      if (!userId) {
        throw new Error("User ID not found in AsyncStorage");
      }
      // Fetch Izin Data
      const izinResponse = await fetch(`${apiUrl}/table-sales`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!izinResponse.ok) {
        const errorResponse = await izinResponse.json();
        console.error("Error response:", errorResponse);
        Alert.alert("Error", "Failed to fetch data");
        return;
      }

      const izinData = await izinResponse.json();
      const formattedIzinData = izinData.map((row, index) => [
        index + 1,
        row.nama_karyawan,
        row.username,
        row.password,
        row.level,
        <View className="flex flex-col justify-center px-2 py-2 space-y-2">
          <TouchableOpacity
            className="bg-[#228E47] p-1 rounded"
            onPress={() => handleEdit(row.id_akun)}
          >
            <Text className="text-white text-center text-[10px]">Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="bg-[#F23737] p-1 rounded"
            onPress={() => handleDelete(row.id_akun)}
          >
            <Text className="text-white text-center text-[10px]">Delete</Text>
          </TouchableOpacity>
        </View>,
      ]);

      setUserTable(formattedIzinData);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    }
  };
  const handleEdit = (idAkun) => {
    Alert.alert("Edit Akun", "Edit data ini?", [
      { text: "Batal", style: "cancel" },
      {
        text: "Edit",
        onPress: () => {
          console.log(idAkun);
        },
      },
    ]);
  };
  const handleDelete = (idAkun) => {
    Alert.alert("Hapus Akun", "Apakah anda yakin ingin menghapus akun ini?", [
      { text: "Batal", style: "cancel" },
      {
        text: "Hapus",
        onPress: () => {
          console.log(idAkun);
        },
      },
    ]);
  };
  const toggleSidenav = () => {
    setSidenavVisible(!isSidenavVisible);
  };

  const closeSidenav = () => {
    setSidenavVisible(false);
  };
  const handleAddUser = () => {
    Alert.alert("Tambah Akun", "Tambah data baru?", [
      { text: "Batal", style: "cancel" },
      {
        text: "Tambah",
        onPress: () => {
          console.log("Tambah data baru");
        },
      },
    ]);
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

      <SidenavAdmin isVisible={isSidenavVisible} onClose={closeSidenav} />

      <View className="flex-1 min-h-screen p-4">
        <Text className="mt-2 mb-2 ml-[0.2rem] text-xl font-semibold">
          User
        </Text>
        <View>
          <TouchableOpacity
            className="bg-[#159847] p-2 mb-1 rounded"
            onPress={() => handleAddUser()}
          >
            <Text className="text-white text-center text-[10px]">Tambah</Text>
          </TouchableOpacity>
        </View>
        <View className="flex flex-row gap-4">
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
                  {userTable.length > 0 ? (
                    <Rows
                      data={userTable}
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
  tableContainer: {
    maxHeight: 700, // Adjust this to fit your screen
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

export default createSales;
