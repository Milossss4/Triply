import React, { useState, useEffect } from "react";
import { Modal, View, StyleSheet, Pressable, Text, TextInput, KeyboardAvoidingView } from "react-native";
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { buttonStyle, buttonTextStyle, mainBlue } from "../constants/theme";

interface InputDateModalProps {
  visible: boolean;
  title: string;
  initialName?: string;
  initialDate?: Date;
  onClose: () => void;
  onSubmit: (name: string, date: Date) => void;
}

const InputDateModal = ({ visible, title, onClose, onSubmit, initialName = '', initialDate }: InputDateModalProps) => {
  const [name, setName] = useState("");
  const [date, setDate] = useState(new Date());
  const [showPickerMode, setShowPickerMode] = useState<'date' | 'time' | 'none'>('none');
  const [minDate, setMinDate] = useState(new Date());

  useEffect(() => {
    if (visible) {
      setName(initialName || '');
      const now = new Date();
      setMinDate(now);

      if (initialDate) {
        setDate(initialDate);
      }
      else {
        const defaultDate = new Date(now.getTime());
        defaultDate.setHours(defaultDate.getHours() + 1);
        defaultDate.setMinutes(defaultDate.getMinutes());
        defaultDate.setSeconds(0);

        setDate(defaultDate);
      }
    }
  }, [visible]);

  const onPickerChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (event.type === 'dismissed') {
      setShowPickerMode('none');
      return;
    }

    if (event.type === 'set' && selectedDate) {
      const newDate = new Date(date.getTime());

      if (showPickerMode === 'date') {
        newDate.setFullYear(selectedDate.getFullYear());
        newDate.setMonth(selectedDate.getMonth());
        newDate.setDate(selectedDate.getDate());

        setDate(newDate);
        setShowPickerMode('time');

      } else if (showPickerMode === 'time') {
        newDate.setHours(selectedDate.getHours());
        newDate.setMinutes(selectedDate.getMinutes());
        newDate.setSeconds(0);

        setDate(newDate);
        setShowPickerMode('none');
      }
    } else if (event.type !== 'set') {
      if (showPickerMode === 'time') {
        setShowPickerMode('none');
      }
    }
  };

  const handleSubmit = () => {
    onSubmit(name, date);
    onClose();
  };

  const getFormattedDateTime = () => {
    return date.toLocaleString('pl-PL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}>

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
              placeholder="Wpisz nazwę..."
              placeholderTextColor="#888"
              value={name}
              onChangeText={setName}
            />

            <Pressable style={styles.dateButton} onPress={() => setShowPickerMode('date')}>
              <Text style={styles.dateButtonText}>
                Wybierz deadline: {getFormattedDateTime()}
              </Text>
            </Pressable>

            {showPickerMode !== 'none' && (
              <DateTimePicker
                testID="dateTimePicker"
                value={date}
                mode={showPickerMode}
                display="default"
                onChange={onPickerChange}
                minimumDate={minDate}
                is24Hour={true}
              />
            )}

            <View style={styles.buttonContainer}>
              <Pressable
                style={[styles.button, styles.cancelButton]}
                onPress={onClose}>
                <Text style={styles.cancelButtonText}>Anuluj</Text>
              </Pressable>
              <Pressable
                style={[styles.button, styles.submitButton]}
                onPress={handleSubmit}>
                <Text style={styles.buttonText}>Zapisz</Text>
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
    alignItems: 'center',
    width: '90%',
  },
  modalTitleStyle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },

  inputStyle: {
    width: '100%',
    height: 50,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 15,
    fontSize: 16,
  },

  dateButton: {
    width: '100%',
    height: 50,
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },

  dateButtonText: {
    fontSize: 16,
    color: '#333',
  },

  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 10,
  },

  button: {
    ...buttonStyle,
    borderRadius: 10,
    paddingVertical: 12,
    flex: 1,
    alignItems: 'center',
  },

  buttonText: {
    ...buttonTextStyle,
    fontSize: 18,
    fontWeight: '500',
  },

  cancelButton: {
    backgroundColor: "#eee",
    borderWidth: 1,
    borderColor: '#ccc'
  },

  cancelButtonText: {
    ...buttonTextStyle,
    color: "#555",
    fontSize: 18,
  },

  submitButton: {
    backgroundColor: mainBlue,
    marginLeft: 10,
  },
});

export default InputDateModal;