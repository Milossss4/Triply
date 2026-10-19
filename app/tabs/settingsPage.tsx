import { boxStyle } from '@/constants/theme';
import CustomModel from '@/components/CustomModal';
import { tokenService } from '@/api/tokenService'; 
import React, { useState, useEffect } from 'react';
import { Pressable, StyleSheet, Text, View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import apiClient from '@/api/apiClient';
import { mainBlue } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';


type UserData = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
}

const settingsPage = () => {
  const router = useRouter();
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');
  const [user, setUser] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      setIsLoading(true);
      try {
        const response = await apiClient.get('/users/me');
        setUser(response.data);
      } catch (err) {
        console.log('Błąd pobierania danych użytkownika:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const handleLogout = async () => {
    try {
      await tokenService.clearTokens();
      delete apiClient.defaults.headers.common['Authorization'];

      setModalTitle('Wylogowano');
      setModalMessage('Zostałeś pomyślnie wylogowany.');
      setModalVisible(true);

      setTimeout(() => {
        router.replace('/');
      }, 1000);
    }
    catch (error) {
      console.error('Błąd podczas wylogowywania: ', error);
    }
  }

  if (isLoading) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" color={mainBlue} />
        <Text style={styles.loadingText}>Ładowanie danych...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.profileContainer}>
        <Ionicons name="person-circle-outline" size={220} style={styles.icon} />
        
        {user ? (
          <>
            <Text style={styles.nameText}>{user.firstName} {user.lastName}</Text>
            <Text style={styles.emailText}>{user.email}</Text>
          </>
        ) : (
          <Text style={styles.emailText}>Nie udało się załadować danych</Text>
        )}
      </View>

      <Pressable style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>Wyloguj</Text>
        <Ionicons name="log-out-outline" size={24} color="white" />
      </Pressable>

      <CustomModel
        visible={modalVisible}
        title={modalTitle}
        message={modalMessage}
        onClose={() => setModalVisible(false)}
      />
    </View>
  )
}

export default settingsPage

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between', 
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 20, 
  },

  profileContainer: {
    width: '100%',
    alignItems: 'center',
    paddingTop: 40, 
  },

  icon: {
    marginBottom: 20,
    color: '#333',
  },

  nameText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },

  emailText: {
    fontSize: 16,
    color: '#666',
  },

  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white', 
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#555',
  },

  logoutButton: {
    ...boxStyle,
    backgroundColor: '#FF3B30',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%', 
    marginBottom: 20, 
  },

  logoutButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    marginRight: 8, 
  },
})