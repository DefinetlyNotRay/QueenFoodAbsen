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
import Sidenav from "../components/Sidenav";
import { BlurView } from "expo-blur";
import { Table, Row, Rows } from "react-native-table-component";

const izin = () => {
  const router = useRouter();
  const [tableIzinData, setIzinTableData] = useState([
    ["1", "Alex", "a", "Approve"],
  ]);
  const izinTableHead = ["No", "Tanggal", "Alasan", "Foto", "Tipe", "Status"];

  // Define the column widths for each column
  const widthArr = [40, 100, 150, 80, 80, 100];

  const [isModalVisible, setModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null); // Store the selected image URL

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
      const izinResponse = await fetch(
        `https://459a-27-131-1-4.ngrok-free.app/table-izin-karyawan/${userId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!izinResponse.ok) {
        Alert.alert("Error", "Failed to fetch izin");
        return;
      }

      const izinData = await izinResponse.json();
      const formattedIzinData = izinData.map((row, index) => [
        index + 1,
        row.tanggal_izin.split("T")[0],
        row.alasan,
        <TouchableOpacity key={index} onPress={() => openModal(row.foto)}>
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: row.foto }}
              style={styles.image}
              alt={`Foto ${row.nama_karyawan}`}
            />
          </View>
        </TouchableOpacity>,
        row.tipe,
        row.status,
      ]);

      setIzinTableData(formattedIzinData);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    }
  };

  const toggleSidenav = () => {
    setSidenavVisible(!isSidenavVisible);
  };

  const closeSidenav = () => {
    setSidenavVisible(false);
  };

  // Open the modal and set the selected image
  const openModal = (imageUri) => {
    setSelectedImage(imageUri);
    setModalVisible(true);
  };

  // Close the modal
  const closeModal = () => {
    setModalVisible(false);
    setSelectedImage(null);
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

      {/* Modal for displaying full image */}
      <Modal
        visible={isModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={closeModal}
      >
        <TouchableOpacity style={styles.modalContainer} onPress={closeModal}>
          {selectedImage && (
            <Image
              source={{ uri: selectedImage }}
              style={styles.fullImage}
              resizeMode="contain"
            />
          )}
        </TouchableOpacity>
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
