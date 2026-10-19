import React, { useState, useEffect } from "react";
import { Modal, View, StyleSheet, Pressable, Text, TextInput, KeyboardAvoidingView } from "react-native";
import { buttonStyle, buttonTextStyle } from "../constants/theme";

interface InputModalProps {
  visible: boolean;
  title: string;
  onCancel: () => void;
  onAccept: (value: string) => void;
  placeholder?: string;
  initialValue?: string;
  acceptText?: string;
  cancelText?: string;
}

const InputModal = ({
  visible,
  title,
  onCancel,
  onAccept,
  placeholder = "Wprowadź wartość...",
  initialValue = "",
  acceptText = "Akceptuj",
  cancelText = "Anuluj"
}: InputModalProps) => {

  const [inputValue, setInputValue] = useState(initialValue);

  useEffect(() => {
    if (visible) {
      setInputValue(initialValue || '');
    }
  }, [visible, initialValue]);

  const handleAccept = () => {
    onAccept(inputValue);
  };

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onCancel}
    >
      <KeyboardAvoidingView
        behavior={'height'}
        keyboardVerticalOffset={-100}
        style={{ flex: 1 }}
      >
        <View style={styles.modalContainerStyle}>
          <View style={styles.modalViewStyle}>

            <Text style={styles.modalTitleStyle}>{title}</Text>

            <TextInput
              style={styles.inputStyle}
              onChangeText={setInputValue}
              value={inputValue}
              placeholder={placeholder}
            />

            <View style={styles.buttonContainer}>
              <Pressable
                style={[styles.button, styles.cancelBtn]}
                onPress={onCancel}
              >
                <Text style={styles.buttonText}>{cancelText}</Text>
              </Pressable>
              <Pressable
                style={[styles.button, styles.acceptBtn]}
                onPress={handleAccept}
              >
                <Text style={styles.buttonText}>{acceptText}</Text>
              </Pressable>
            </View>

          </View>
        </View>
      </KeyboardAvoidingView>
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
    width: '85%',
    alignItems: 'stretch',
  },
  modalTitleStyle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },

  inputStyle: {
    height: 45,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    width: '100%',
    marginBottom: 25,
    fontSize: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  button: {
    ...buttonStyle,
    width: '48%',
  },
  buttonText: {
    ...buttonTextStyle,
    fontSize: 18,
  },
  acceptBtn: {
    // Zakładamy, że `buttonStyle` to styl akceptacji (np. niebieski)
    // Jeśli nie, możesz dodać np. backgroundColor: '#007bff'
  },
  cancelBtn: {
    backgroundColor: '#6c757d',
  },
});

export default InputModal;