import React from "react";
import { Modal, View, StyleSheet, Pressable, Text } from "react-native";
import { buttonStyle, buttonTextStyle } from "../constants/theme";

interface CustomModalProps {
  visible: boolean;
  title: string;
  message: string;
  onClose: () => void;
}


const CustomModal = ({ visible, title, message, onClose }: CustomModalProps) => {
    return (
        <Modal
            animationType="fade"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}>
        
            <View style={styles.modalContainerStyle}>
            <View style={styles.modalViewStyle}>
                <Text style={styles.modalTitleStyle}>{title}</Text>
                <Text style={styles.modalTextStyle}>{message}</Text>
                <Pressable
                style={[styles.cancelButton, { marginBottom: 0 }]}
                onPress={onClose}>
                <Text style={styles.cancelButtonText}>Ok</Text>
                </Pressable>
            </View>
            </View>
        </Modal>  
    );
}

const styles = StyleSheet.create({
modalContainerStyle: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
},

modalViewStyle: {
    margin: 10,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    width: '80%',
},

modalTitleStyle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
},

modalTextStyle: {
    marginBottom: 20,
    textAlign: 'center',
    fontSize: 16,
},

cancelButton:{
    ...buttonStyle,
    width: '90%',
},

cancelButtonText:{
    ...buttonTextStyle,
    fontSize: 20,
},
});

export default CustomModal;