import React from "react";
import { Modal, View, ActivityIndicator, StyleSheet } from "react-native";

interface SpinnerModalProps {
  visible: boolean;
}

const SpinnerModal: React.FC<SpinnerModalProps> = ({ visible }) => {
  return (
    <Modal transparent={true} animationType="none" visible={visible}>
      <View style={styles.modalBackground}>
        <View style={styles.activityIndicatorWrapper}>
          <ActivityIndicator size="large" color="#0000ff" />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackground: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  activityIndicatorWrapper: {
    backgroundColor: "white",
    height: 100,
    width: 100,
    borderRadius: 10,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-around",
  },
});

export default SpinnerModal;
