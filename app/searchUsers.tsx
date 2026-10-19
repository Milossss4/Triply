import { StyleSheet, Text, View, TextInput, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import React, { useState, useEffect } from 'react';
import { Stack, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import apiClient from '@/api/apiClient';
import axios from 'axios';
import { mainBlue } from '@/constants/theme';
import CustomModal from '@/components/CustomModal';

interface User {
    id: number;
    email: string;
}


const SearchUsers = () => {
    const [searchText, setSearchText] = useState('');
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [modalTitle, setModalTitle] = useState('');
    const [modalMessage, setModalMessage] = useState('');
    const { groupId } = useLocalSearchParams<{ groupId: string }>();
    const groupIdAsNumber = parseInt(groupId, 10);


    useEffect(() => {
        if (searchText.trim() === '') {
            setUsers([]);
            setLoading(false);
            return;
        }

        const delayDebounceFn = setTimeout(() => {
            searchApi(searchText);
        }, 10);

        return () => clearTimeout(delayDebounceFn);
    }, [searchText]);

    const searchApi = async (query: string) => {
        setLoading(true);
        try {
            const response = await apiClient.get('/users/search', {
                params: {
                    query: query,
                },
            });
            setUsers(response.data);
        }
        catch (error) {
            console.log(error);
        }
        finally {
            setLoading(false);
        }
    }


    const handleInviteUser = async (email: string) => {
        if (!groupIdAsNumber) {
            console.log('Błąd przy wysyłaniu zaproszenia. Brak grupy');
            return;
        }

        try {            
            const response = await apiClient.post(`/groups/${groupIdAsNumber}/participants`, { email: email });

            setModalTitle('Zaproszenie wysłane!');
            setModalMessage('Udało się wysłać zaproszenie do użytkownika: ' + email);
            setModalVisible(true);
        }
        catch (error) {
            console.log(error);

            if (axios.isAxiosError(error) && error.response?.status === 400) 
            {
                const errorMessage = error.response.data.message;
                setModalTitle('Błąd');
                setModalMessage(errorMessage);
                setModalVisible(true);
            }
        }
    }

    const renderUserItem = ({ item }: { item: User }) => (
        <View style={styles.userItem}>
            <View style={styles.userInfo}>
                <Text style={styles.username}>{item.email}</Text>
            </View>
            <TouchableOpacity
                style={styles.inviteButton}
                onPress={() => handleInviteUser(item.email)}
            >
                <Text style={styles.inviteButtonText}>Zaproś</Text>
            </TouchableOpacity>
        </View>
    );

    const renderContent = () => {
        if (loading) {
            return <ActivityIndicator size="large" color='mainBlue' style={{ marginTop: 20 }} />;
        }
        else if (users.length > 0) {
            return (
                <FlatList
                    data={users}
                    renderItem={renderUserItem}
                    keyExtractor={(item) => item.id.toString()}
                    style={styles.list}
                />
            );
        }
        else if (searchText.length > 0 && users.length === 0) {
            return <Text style={styles.infoText}>Brak wyników dla: "{searchText}"</Text>;
        }
        return null;
    };

    return (
        <View style={styles.container}>
            <Stack.Screen
                options={{
                    title: "Dodaj znajomych",
                    headerBackTitle: "Wróć",
                }}
            />

            <View style={styles.searchContainer}>
                <Ionicons
                    name="search"
                    size={20}
                    color="gray"
                    style={styles.searchIcon}
                />
                <TextInput
                    style={styles.searchBar}
                    placeholder="Szukaj użytkownika..."
                    value={searchText}
                    onChangeText={setSearchText}
                    placeholderTextColor="gray"
                    autoCapitalize="none"
                    clearButtonMode="while-editing"
                />
            </View>

            <View style={styles.content}>
                {renderContent()}
            </View>

            <CustomModal
                visible={modalVisible}
                title={modalTitle}
                message={modalMessage}
                onClose={() => setModalVisible(false)}
            />
        </View>
    );
}

export default SearchUsers;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },

    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f0f0f0',
        borderRadius: 10,
        margin: 10,
        paddingHorizontal: 10,
    },

    searchIcon: {
        marginRight: 10,
    },

    searchBar: {
        flex: 1,
        height: 44,
        fontSize: 16,
        color: '#000',
    },

    content: {
        flex: 1,
    },

    list: {
        flex: 1,
    },

    userItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },

    userInfo: {
        flex: 1,
    },

    username: {
        fontSize: 16,
        fontWeight: 'bold',
    },

    fullName: {
        fontSize: 14,
        color: 'gray',
    },

    inviteButton: {
        backgroundColor: mainBlue,
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 8,
    },

    inviteButtonText: {
        color: 'white',
        fontWeight: '600',
    },

    infoText: {
        color: 'gray',
        textAlign: 'center',
        marginTop: 20,
    }
});