import React, { useState, useEffect } from 'react';
import { Modal, View, StyleSheet, Pressable, Text, TextInput, ScrollView, KeyboardAvoidingView } from 'react-native';
import { buttonStyle, buttonTextStyle, mainBlue } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from 'react-native-modal-datetime-picker';
import CustomModal from './CustomModal';

export type Member = {
    id: string;
    firstName: string;
    lastName: string;
};

interface AddExpenseModalProps {
    visible: boolean;
    title: string;
    members: Member[];
    onClose: () => void;
    onSubmit: (description: string, amount: string, date: Date, selectedMembers: string[]) => void;
    currentUserId?: string;
}

const AddExpenseModal = ({ visible, title, members, onClose, onSubmit, currentUserId }: AddExpenseModalProps) => {
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
    const [date, setDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [customModalVisible, setCustomModalVisible] = useState(false);
    const [customModalTitle, setCustomModalTitle] = useState('');
    const [customModalMessage, setCustomModalMessage] = useState('');


    useEffect(() => {
        if (!visible) {
            setDescription('');
            setAmount('');
            setDate(new Date());
            setShowDatePicker(false);
            setSelectedMembers([]);
            setCustomModalVisible(false);
        }
    }, [visible]);

    //Handlery wybierania daty
    const showDatepickerUI = () => {
        setShowDatePicker(true);
    };

    const hideDatePicker = () => {
        setShowDatePicker(false);
    };

    const handleDateConfirm = (selectedDate: Date) => {
        setDate(selectedDate);
        hideDatePicker();
    };

    //Handler wybierania użytkowników
    const handleToggleMember = (id: string) => {
        setSelectedMembers((prev) =>
            prev.includes(id)
                ? prev.filter((memberId) => memberId !== id)
                : [...prev, id]
        );
    };

    const hideCustomModal = () => {
        setCustomModalVisible(false);
    };

    const handleSubmit = () => {
        if (!description.trim() || !amount.trim() || selectedMembers.length === 0) {
            setCustomModalTitle('Błąd');
            setCustomModalMessage('Wszystkie pola są wymagane.');
            setCustomModalVisible(true);
            return;
        }
        onSubmit(description, amount, date, selectedMembers);
    };

    return (
        <Modal
            animationType="fade"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <KeyboardAvoidingView
                behavior={'height'}
                keyboardVerticalOffset={-100}
                style={{ flex: 1 }}
            >
                <Pressable style={styles.modalContainerStyle} onPress={onClose}>
                    <Pressable style={styles.modalViewStyle} onPress={() => { }}>
                        <ScrollView
                            style={{ width: '100%' }}
                            contentContainerStyle={styles.scrollViewContent}
                            keyboardShouldPersistTaps="handled"
                        >
                            <Text style={styles.modalTitleStyle}>{title}</Text>

                            <TextInput
                                style={styles.input}
                                placeholder="Opis"
                                placeholderTextColor={"gray"}
                                value={description}
                                onChangeText={setDescription}
                            />

                            <TextInput
                                style={styles.input}
                                placeholder="Kwota"
                                placeholderTextColor={"gray"}
                                value={amount}
                                onChangeText={setAmount}
                                keyboardType="numeric"
                            />

                            <Pressable onPress={showDatepickerUI} style={styles.datePickerButton}>
                                <Ionicons name="calendar-outline" size={22} color="#333" style={styles.datePickerIcon} />
                                <Text style={styles.datePickerText}>
                                    Data: {date.toLocaleDateString('pl-PL')}
                                </Text>
                            </Pressable>

                            <Text style={styles.listHeader}>Podziel z:</Text>

                            <View style={styles.memberListContainer}>
                                {members
                                    .filter(member => member.id !== currentUserId)
                                    .map((member) => (
                                        <Pressable
                                            key={member.id}
                                            style={styles.memberRow}
                                            onPress={() => handleToggleMember(member.id)}
                                        >
                                            <Ionicons
                                                name={
                                                    selectedMembers.includes(member.id)
                                                        ? 'checkbox'
                                                        : 'checkbox-outline'
                                                }
                                                size={24}
                                                color={mainBlue}
                                                style={styles.checkboxIcon}
                                            />
                                            <Text style={styles.memberName}>{member.firstName} {member.lastName}</Text>
                                        </Pressable>
                                    ))}
                            </View>

                            <View style={styles.buttonContainer}>
                                <Pressable
                                    style={[styles.actionButton, styles.cancelButton]}
                                    onPress={onClose}
                                >
                                    <Text style={[styles.actionButtonText, styles.cancelButtonText]}>
                                        Anuluj
                                    </Text>
                                </Pressable>
                                <Pressable
                                    style={[styles.actionButton, styles.submitButton]}
                                    onPress={handleSubmit}
                                >
                                    <Text style={styles.actionButtonText}>Dodaj</Text>
                                </Pressable>
                            </View>

                        </ScrollView>
                    </Pressable>
                </Pressable>
            </KeyboardAvoidingView>

            <DateTimePicker
                isVisible={showDatePicker}
                mode="date"
                date={date}
                onConfirm={handleDateConfirm}
                onCancel={hideDatePicker}
                maximumDate={new Date()}
            />

            <CustomModal
                visible={customModalVisible}
                title={customModalTitle}
                message={customModalMessage}
                onClose={hideCustomModal}
            />
        </Modal>
    );
};

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
        alignItems: 'center',
        width: '90%',
        maxHeight: '80%',
    },

    scrollViewContent: {
        padding: 20,
        alignItems: 'center',
    },

    modalTitleStyle: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
    },

    input: {
        width: '100%',
        padding: 12,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        marginBottom: 15,
        fontSize: 16,
    },

    listHeader: {
        fontSize: 18,
        fontWeight: '500',
        marginBottom: 10,
        alignSelf: 'flex-start',
    },

    memberListContainer: {
        width: '100%',
        borderWidth: 1,
        borderColor: '#eee',
        borderRadius: 8,
    },
    memberRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },

    checkboxIcon: {
        marginRight: 12,
    },

    memberName: {
        fontSize: 16,
    },

    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        marginTop: 25,
    },

    actionButton: {
        ...buttonStyle,
        width: '48%',
        paddingVertical: 12,
    },

    actionButtonText: {
        ...buttonTextStyle,
        fontSize: 18,
    },

    cancelButton: {
        backgroundColor: '#f0f0f0',
    },

    cancelButtonText: {
        color: '#333',
    },

    submitButton: {
        backgroundColor: mainBlue,
    },

    datePickerButton: {
        width: '100%',
        padding: 12,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        marginBottom: 15,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f9f9f9'
    },

    datePickerIcon: {
        marginRight: 10,
    },

    datePickerText: {
        fontSize: 16,
        color: '#333',
    },
});

export default AddExpenseModal;