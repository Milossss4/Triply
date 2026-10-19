import React, { useEffect, useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Animated, ActivityIndicator } from 'react-native';
import { ExpoSpeechRecognitionModule } from 'expo-speech-recognition';
import { Ionicons } from '@expo/vector-icons';
import apiClient from '@/api/apiClient';
import AddGroupModal, { ParsedTripData, NewGroupData } from '@/components/AddGroupModal';
import { mainBlue } from '@/constants/theme';

interface VoiceGroupCreatorProps {
    visible: boolean;
    onClose: () => void;
    onSubmit: (data: NewGroupData) => Promise<void> | void;
}

const VoiceGroupCreator = ({ visible, onClose, onSubmit }: VoiceGroupCreatorProps) => {
    const [listening, setListening] = useState(false);
    const [isParsing, setIsParsing] = useState(false);
    const [initialData, setInitialData] = useState<ParsedTripData | null>(null);
    const [isAddModalVisible, setIsAddModalVisible] = useState(false);
    const [modalMessage, setModalMessage] = useState('Powiedz nam gdzie chcesz jechać');
    const pulse = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        if (visible) {
            setModalMessage('Powiedz nam gdzie chcesz jechać');
            setInitialData(null);
        } else {
            stopListening();
        }
    }, [visible]);

    useEffect(() => {
        if (listening) {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulse, { toValue: 1.1, duration: 600, useNativeDriver: true }),
                    Animated.timing(pulse, { toValue: 1.0, duration: 600, useNativeDriver: true }),
                ])
            ).start();
        } else {
            pulse.setValue(1);
        }
    }, [listening]);

    useEffect(() => {
        if (!visible) return;

        const startListener = ExpoSpeechRecognitionModule.addListener('start', () => setListening(true));
        const endListener = ExpoSpeechRecognitionModule.addListener('end', () => setListening(false));

        const resultListener = ExpoSpeechRecognitionModule.addListener('result', (event) => {
            const transcript = event.results?.[0]?.transcript ?? '';
            const isFinal = !!event.isFinal;

            if (isFinal && transcript.trim()) {
                handleParseTranscript(transcript);
            }
        });

        return () => {
            startListener.remove();
            endListener.remove();
            resultListener.remove();
        };
    }, [visible]);

    const toggleListening = async () => {
        try {
            if (listening) {
                stopListening();
                return;
            }
            const perms = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
            if (!perms.granted) return;

            ExpoSpeechRecognitionModule.start({
                lang: 'pl-PL',
                interimResults: true,
                continuous: false,
            });
        } catch (e) {
            console.warn('Voice error', e);
        }
    };

    const stopListening = () => {
        ExpoSpeechRecognitionModule.stop();
        setListening(false);
    };

    const handleParseTranscript = async (transcript: string) => {
        stopListening();
        setIsParsing(true);
        setModalMessage("Analizuję Twoją wypowiedź...");

        try {
            const resp = await apiClient.post('/ai/parse-trip', { text: transcript });
            const data = resp.data;

            const parsed: ParsedTripData = {
                name: data?.name ?? '',
                destination: data?.destination ?? '',
                startDate: data?.startDate ?? null,
                endDate: data?.endDate ?? null,
            };

            setInitialData(parsed);
            setIsAddModalVisible(true);
        } catch (err) {
            console.log('Error parsing:', err);
            setModalMessage("Nie udało się zrozumieć. Spróbuj ponownie.");
        } finally {
            setIsParsing(false);
        }
    };

    const finishProcess = () => {
        setIsAddModalVisible(false);
        onClose();
    };

    const handleInternalSubmit = async (data: NewGroupData) => {
        await onSubmit(data);
        finishProcess();
    };

    return (
        <>
            <Modal
                visible={visible && !isAddModalVisible}
                transparent animationType="slide"
                onRequestClose={onClose}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <TouchableOpacity style={styles.closeIcon} onPress={onClose}>
                            <Ionicons name="close" size={24} color="gray" />
                        </TouchableOpacity>

                        <Text style={styles.title}>{modalMessage}</Text>

                        <View style={styles.micContainer}>
                            <Animated.View style={{ transform: [{ scale: pulse }] }}>
                                <TouchableOpacity
                                    style={[styles.micButton, listening && styles.micButtonActive]}
                                    onPress={toggleListening}
                                    disabled={isParsing}
                                >
                                    {isParsing ? (
                                        <ActivityIndicator color="white" />
                                    ) : (
                                        <Ionicons name="mic" size={40} color="white" />
                                    )}
                                </TouchableOpacity>
                            </Animated.View>
                        </View>

                        <Text style={styles.hint}>Naciśnij mikrofon aby rozpocząć</Text>
                    </View>
                </View>
            </Modal>

            <AddGroupModal
                visible={isAddModalVisible}
                onClose={finishProcess}
                onSubmit={handleInternalSubmit}
                initialData={initialData}
            />
        </>
    );
};

export default VoiceGroupCreator;

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: '85%',
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 30,
        alignItems: 'center',
        elevation: 5,
    },
    closeIcon: {
        position: 'absolute',
        top: 15,
        right: 15,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 30,
        textAlign: 'center',
        color: '#333',
    },
    micContainer: {
        height: 100,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    micButton: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: mainBlue,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 10,
        shadowColor: mainBlue,
        shadowOpacity: 0.4,
        shadowRadius: 10,
    },
    micButtonActive: {
        backgroundColor: '#e53935',
    },
    hint: {
        color: 'gray',
        marginTop: 10,
    },
});