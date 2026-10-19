import { Tabs, useRouter, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { mainBlue } from "@/constants/theme";
import { TouchableOpacity, View, StyleSheet, DeviceEventEmitter } from 'react-native';
import { useState, useCallback } from "react";
import apiClient from '@/api/apiClient';
import ConfirmDeleteModal from "@/components/DeleteModal";

const NotificationIcon = () => {
    const router = useRouter();
    const [hasNotifications, setHasNotifications] = useState(false);

    const checkNotifications = async () => {
        try {
            const response = await apiClient.get('/invitations/pending');
            if (response.data && response.data.length > 0) {
                setHasNotifications(true);
            } else {
                setHasNotifications(false);
            }
        } catch (error) {
            console.log("Błąd sprawdzania powiadomień:", error);
        }
    };

    useFocusEffect(
        useCallback(() => {
            checkNotifications();
        }, [])
    );

    return (
        <TouchableOpacity 
            onPress={() => router.push('../notificationPage')}
            style={{ marginRight: 15, position: 'relative' }} 
        >
            <Ionicons 
                name="notifications-outline" 
                size={24} 
                color={"black"} 
            />
            
            {hasNotifications && (
                <View style={styles.badge} />
            )}
        </TouchableOpacity>
    );
};

export default function Layout() {
    const router = useRouter();
    const [isDeleteModalVisible, setDeleteModalVisible] = useState(false);

    const handleDeleteHistory = async () => {
        try {
            await apiClient.delete('/ai/chat/history');
            setDeleteModalVisible(false);
            DeviceEventEmitter.emit('event.chat.clearHistory');
        } catch (error) {
            console.log("Błąd podczas usuwania historii:", error);
            setDeleteModalVisible(false);
        }
    };

    return (
        <>
            <Tabs> 
                <Tabs.Screen
                    name="groupsPage"
                    options={{ 
                        title: "Moje grupy podróży",
                        headerTitleAlign: 'center',
                        tabBarLabel: "Grupy", 
                        tabBarIcon: ({color, size}) => (
                            <Ionicons name="people-outline" size={size} color={color} />
                        ),
                        tabBarActiveTintColor: mainBlue,
                        headerRight: () => (<NotificationIcon/>),
                    }}
                />    
                <Tabs.Screen
                    name="chatPage"
                    options={{
                        title: "Tipuś",
                        headerTitleAlign: 'center',
                        tabBarLabel: "Chatbot",
                        tabBarIcon: ({color, size}) => (
                            <Ionicons name="hardware-chip-outline" size={size} color={color} />
                        ),
                        tabBarActiveTintColor: mainBlue,
                        headerRight: () => (
                            <TouchableOpacity 
                                onPress={() => setDeleteModalVisible(true)}
                                style={{ marginRight: 15 }}
                            >
                                <Ionicons name="trash-outline" size={24} color="black" />
                            </TouchableOpacity>
                        ),
                    }}
                />
                <Tabs.Screen
                    name="photosPage"
                    options={{
                        title: "Zdjęcia",
                        headerTitleAlign: 'center',
                        tabBarLabel: "Zdjęcia",
                        tabBarIcon: ({color, size}) => (
                            <Ionicons name="camera-outline" size={size} color={color} />
                        ),
                        tabBarActiveTintColor: mainBlue,
                    }}
                />            
                <Tabs.Screen
                    name="settingsPage"
                    options={{
                        title: "Ustawienia",
                        headerTitleAlign: 'center',
                        tabBarLabel: "Ustawienia",
                        tabBarIcon: ({color, size}) => (
                            <Ionicons name="settings-outline" size={size} color={color} />
                        ),
                        tabBarActiveTintColor: mainBlue,
                    }}
                />               
            </Tabs>

            <ConfirmDeleteModal
                visible={isDeleteModalVisible}
                title="Usuń historię"
                message="Czy na pewno chcesz usunąć całą historię czatu? Tej operacji nie można cofnąć."
                onClose={() => setDeleteModalVisible(false)}
                onConfirm={handleDeleteHistory}
            />
        </>
    );
}

const styles = StyleSheet.create({
    badge: {
        position: 'absolute',
        right: -2, 
        top: -2,   
        backgroundColor: 'red',
        width: 10,
        height: 10,
        borderRadius: 5, 
        borderWidth: 1.5,
        borderColor: 'white', 
        zIndex: 2,
    }
});