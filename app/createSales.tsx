import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Alert,
  Image,
  ScrollView,
  TextInput,
  Modal,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import Header from "../components/Header";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BlurView } from "expo-blur";
import { Table, Row, Rows } from "react-native-table-component";
import { NGROK_API } from "@env";
import SidenavAdmin from "../components/SidenavAdmin";
import axios from "axios";
import SpinnerOverlay from "../components/SpinnerOverlayProps";

const createSales = () => {
  const apiUrl = NGROK_API;

  const router = useRouter();
  const [namaSales, setNamaSales] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [userTable, setUserTable] = useState([["1", "Alex", "a", "Approve"]]);

  const [tambahModal, setTambahModalVisible] = useState(false);
  const [editModal, setEditModalVisible] = useState(false);
  const [editUserId, setEditUserId] = useState("");
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
          `https://queenfoodbackend-production.up.railway.app/table-sales`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

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
    });
  const handleEdit = (idAkun) =>
    withLoading(async () => {
      Alert.alert("Edit Akun", "Edit data ini?", [
        { text: "Batal", style: "cancel" },
        {
          text: "Edit",
          onPress: async () => {
            try {
              const response = await axios.get(
                `https://queenfoodbackend-production.up.railway.app/getEditSalesData`,
                {
                  params: { userId: idAkun }, // Pass idAkun as a query parameter
                }
              );

              if (response.status === 200) {
                // Set data from the response to the state
                setUsername(response.data.username);
                setPassword(response.data.password);
                setEditUserId(idAkun);
                setNamaSales(response.data.nama_karyawan);
                setEditModalVisible(true);
                setTambahModalVisible(false);
              } else {
                Alert.alert("Error", "Userid not found.");
              }
            } catch (error) {
              Alert.alert("Error", "Failed to fetch sales data.");
              console.error("Error:", error);
            }
          },
        },
      ]);
    });

  const handleDelete = (idAkun) =>
    withLoading(async () => {
      Alert.alert("Hapus Akun", "Apakah anda yakin ingin menghapus akun ini?", [
        { text: "Batal", style: "cancel" },
        {
          text: "Hapus",
          onPress: async () => {
            try {
              const response = await axios.delete(
                `https://queenfoodbackend-production.up.railway.app/deleteSales`,
                {
                  params: { userId: idAkun }, // Pass idAkun as a query parameter
                }
              );

              if (response.status === 200) {
                Alert.alert("Success", "Sales deleted successfully.");
                fetchData();
              } else {
                Alert.alert("Error", "Sales deletion failed.");
              }
            } catch (error) {
              Alert.alert("Error", "Failed to fetch sales data.");
              console.error("Error:", error);
            }
          },
        },
      ]);
    });
  const toggleSidenav = () => {
    setSidenavVisible(!isSidenavVisible);
  };

  const closeSidenav = () => {
    setSidenavVisible(false);
  };
  const handleEditUser = () =>
    withLoading(async () => {
      Alert.alert("Edit Akun", "Edit data ini?", [
        { text: "Batal", style: "cancel" },
        {
          text: "Edit",
          onPress: async () => {
            const token = await AsyncStorage.getItem("authToken");
            const userId = await AsyncStorage.getItem("userId");
            if (!userId && !token) {
              throw new Error("User ID & Token not found in AsyncStorage");
            }
            // Fetch Izin Data
            const salesData = {
              namaSales,
              username,
              password,
              editUserId,
            };
            // Fetch Izin Data
            const response = await axios.post(
              `https://queenfoodbackend-production.up.railway.app/editSales`,
              salesData
            );

            if (response.status === 200) {
              Alert.alert("Success", "Sales Edited successfully.");
              setNamaSales("");
              setUsername("");
              setPassword("");
              setEditUserId("");
              fetchData();
              setEditModalVisible(false);
            } else {
              Alert.alert("Error", "Sales Editing failed.");
            }
          },
        },
      ]);
    });
  const handleAddUser = () =>
    withLoading(async () => {
      Alert.alert("Tambah Akun", "Tambah data baru?", [
        { text: "Batal", style: "cancel" },
        {
          text: "Tambah",
          onPress: async () => {
            const token = await AsyncStorage.getItem("authToken");
            const userId = await AsyncStorage.getItem("userId");
            if (!userId && !token) {
              throw new Error("User ID & Token not found in AsyncStorage");
            }
            // Fetch Izin Data
            const salesData = {
              namaSales,
              username,
              password,
            };
            // Fetch Izin Data
            const response = await axios.post(
              `https://queenfoodbackend-production.up.railway.app/createSales`,
              salesData
            );

            if (response.status === 200) {
              Alert.alert("Success", "Sales created successfully.");
              setNamaSales("");
              setUsername("");
              setPassword("");
              fetchData();
              setTambahModalVisible(false);
            } else {
              Alert.alert("Error", "Sales creatiion failed.");
            }
          },
        },
      ]);
    });
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
          User
        </Text>
        <View>
          <TouchableOpacity
            className="bg-[#159847] p-2 mb-1 rounded"
            onPress={() => setTambahModalVisible(true)}
          >
            <Text className="text-white text-center text-[10px]">Tambah</Text>
          </TouchableOpacity>
          <Modal
            animationType="slide"
            transparent={true}
            visible={tambahModal}
            onRequestClose={() => setTambahModalVisible(!tambahModal)}
          >
            <View style={styles.modalBackground}>
              <View style={styles.modalView}>
                <View>
                  <Text className="font-extrabold">Nama Sales</Text>
                  <TextInput
                    editable
                    className="border-[0.5px] w-[75vw] border-gray-300 px-2"
                    maxLength={40}
                    onChangeText={(namaSales) => setNamaSales(namaSales)}
                    value={namaSales}
                  />
                </View>
                <View className="mt-2">
                  <Text className="font-extrabold">Username</Text>
                  <TextInput
                    editable
                    className="border-[0.5px] w-[75vw] border-gray-300 px-2"
                    maxLength={40}
                    onChangeText={(username) => setUsername(username)}
                    value={username}
                  />
                </View>
                <View className="mt-2">
                  <Text className="font-extrabold">Password</Text>
                  <TextInput
                    editable
                    className="border-[0.5px] w-[75vw] border-gray-300 px-2"
                    maxLength={40}
                    onChangeText={(password) => setPassword(password)}
                    secureTextEntry
                    value={password}
                  />
                </View>
                <TouchableOpacity
                  onPress={handleAddUser}
                  className="bg-[#159847] w-[75vw] mt-2 py-2 px-2"
                >
                  <Text className="text-sm font-bold text-center text-white">
                    Submit
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setTambahModalVisible(!tambahModal)}
                >
                  <Text style={styles.closeButtonText}>X</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
          <Modal
            animationType="slide"
            transparent={true}
            visible={editModal}
            onRequestClose={() => setEditModalVisible(!editModal)}
          >
            <View style={styles.modalBackground}>
              <View style={styles.modalView}>
                <View>
                  <Text className="font-extrabold">Nama Sales</Text>
                  <TextInput
                    editable
                    className="border-[0.5px] w-[75vw] border-gray-300 px-2"
                    maxLength={40}
                    onChangeText={(namaSales) => setNamaSales(namaSales)}
                    value={namaSales}
                  />
                </View>
                <View className="mt-2">
                  <Text className="font-extrabold">Username</Text>
                  <TextInput
                    editable
                    className="border-[0.5px] w-[75vw] border-gray-300 px-2"
                    maxLength={40}
                    onChangeText={(username) => setUsername(username)}
                    value={username}
                  />
                </View>
                <View className="mt-2">
                  <Text className="font-extrabold">Password</Text>
                  <TextInput
                    editable
                    className="border-[0.5px] w-[75vw] border-gray-300 px-2"
                    maxLength={40}
                    onChangeText={(password) => setPassword(password)}
                    secureTextEntry
                    value={password}
                  />
                </View>
                <TouchableOpacity
                  onPress={handleEditUser}
                  className="bg-[#159847] w-[75vw] mt-2 py-2 px-2"
                >
                  <Text className="text-sm font-bold text-center text-white">
                    Submit
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setEditModalVisible(!editModal)}
                >
                  <Text style={styles.closeButtonText}>X</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
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
    right: 17, // Distance from the right of the modal
    zIndex: 1, // Ensure the button stays on top
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
  closeButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#000",
  },
});

export default createSales;
