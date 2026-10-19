import React from "react";
import { Modal, View, StyleSheet, Pressable, Text } from "react-native";

interface ConfirmModalProps {
  visible: boolean;
  title: string;
  message: string;
  onClose: () => void;      
  onConfirm: () => void;    
}

const ConfirmDeleteModal = ({ visible, title, message, onClose, onConfirm }: ConfirmModalProps) => {
  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <Pressable style={styles.modalContainerStyle} onPress={onClose}>
        <Pressable style={styles.modalViewStyle} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.modalTitleStyle}>{title}</Text>
          <Text style={styles.modalTextStyle}>{message}</Text>
          
          <View style={styles.buttonRow}>
            <Pressable
              style={[styles.button, styles.cancelButton]}
              onPress={onClose}>
              <Text style={[styles.buttonText, styles.cancelButtonText]}>Anuluj</Text>
            </Pressable>
            
            <Pressable
              style={[styles.button, styles.confirmButton]}
              onPress={onConfirm}>
              <Text style={[styles.buttonText, styles.confirmButtonText]}>Usuń</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: '85%', 
  },
  modalTitleStyle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  modalTextStyle: {
    marginBottom: 25, 
    textAlign: 'center',
    fontSize: 16,
    lineHeight: 22,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  button: {
    borderRadius: 10,
    height: 50,
    width: '48%', 
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: 'lightgray', 
  },
  confirmButton: {
    backgroundColor: 'red', 
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  cancelButtonText: {
    color: '#333',
  },
  confirmButtonText: {
    color: 'white',
  },
});

export default ConfirmDeleteModal;