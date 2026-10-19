import apiClient from '@/api/apiClient';
import CustomModal from '@/components/CustomModal';
import InputDateModal from '@/components/InputDateModal';
import { fabStyle, mainBlue } from '@/constants/theme';
import { formatDate } from '@/utils/formateDate';
import { Ionicons } from '@expo/vector-icons';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import React, { useState, useCallback } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import ExpensesScreen from '../groupDetailsTabs/ExpensesScreen';
import ListScreen from '../groupDetailsTabs/ListScreen';
import PollScreen from '../groupDetailsTabs/PollScreen';
import WeatherScreen from '../groupDetailsTabs/WeatherScreen';
import AddExpenseModal, { Member } from '@/components/AddExpenseModal';
import { useFocusEffect } from '@react-navigation/native';


type GroupData = {
  name: string;
  startDate: string;
  endDate: string;
  destination: string;
};

type User = {
  id: string;
};

type ActiveTab = 'polls' | 'expenses' | 'itinerary' | 'weather';

const GroupDetails = () => {
  const { id: paramId } = useLocalSearchParams();
  const id = Array.isArray(paramId) ? paramId[0] : paramId;
  const [group, setGroup] = useState<GroupData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ActiveTab>('polls');
  const [isDateModalVisible, setIsDateModalVisible] = useState(false);

  //Stany modala z błędem
  const [errorModalTitle, setErrorModalTitle] = useState('');
  const [errorModalMessage, setErrorModalMessage] = useState('');
  const [isErrorModalVisible, setIsErrorModalVisible] = useState(false);

  //Stany dla wydatków
  const [isExpenseModalVisible, setIsExpenseModalVisible] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const [pollRefreshTrigger, setPollRefreshTrigger] = useState(0);
  const [expenseRefreshTrigger, setExpenseRefreshTrigger] = useState(0);


  const handleSetting = () => {
    router.push({
      pathname: '/groupSettings',
      params: { groupId: id }
    })
  };

  //Handler zamykania modala error
  const handleErrorModalClose = () => {
    setIsErrorModalVisible(false);
  };

  //Handler dodawania nowej ankiety
  const handleAddPoll = () => {
    setIsDateModalVisible(true);
  };

  //Handler dodawania nowego wydatku
  const handleAddExpense = () => {
    setIsExpenseModalVisible(true);
  }

  //Handlery do zamykania modali
  const handleCloseModal = () => {
    setIsDateModalVisible(false);
  };

  const handleCloseExpenseModal = () => {
    setIsExpenseModalVisible(false);
  };

  //Handler FAB
  const handleFabPress = () => {
    if (activeTab === 'polls') {
      handleAddPoll();
    } else if (activeTab === 'expenses') {
      handleAddExpense();
    }
  };

  //Wysyłanie ankiet
  const handleModalSubmit = async (name: string, date: Date) => {
    if (!name) {
      setErrorModalTitle("Błąd dodawania ankiety");
      setErrorModalMessage("Podaj nazwę ankiety")
      setIsErrorModalVisible(true);

      return;
    }

    const payload = {
      title: name.trim(),
      votingDeadline: date.toISOString(),
    };

    try {
      await apiClient.post(`/groups/${id}/polls`, payload);
      handleCloseModal();

      setPollRefreshTrigger(prevTrigger => prevTrigger + 1);

    } catch (error: any) {
      console.error("Błąd podczas dodawania ankiety:", error);
    }
  };

  //Wysyłanie wydatków
  const handleExpenseModalSubmit = async (
    description: string,
    amount: string,
    date: Date,
    selectedMembers: string[]
  ) => {
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      setErrorModalTitle("Błąd dodawania wydatku");
      setErrorModalMessage("Wprowadź poprawną kwotę.");
      setIsErrorModalVisible(true);
      return;
    }

    if (!currentUser) {
      setErrorModalTitle("Błąd dodawania wydatku");
      setErrorModalMessage("Użytkownik nie jest zalogowany.");
      setIsErrorModalVisible(true);
      return;
    }

    const participantIdsSet = new Set(selectedMembers);
    participantIdsSet.add(currentUser.id);

    const payload = {
      description,
      amount: numericAmount,
      date: date.toISOString(),
      participantUserIds: Array.from(participantIdsSet),
    };

    try {
      await apiClient.post(`/groups/${id}/expenses`, payload);
      handleCloseExpenseModal();
      setExpenseRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error("Błąd podczas dodawania wydatku:", error);
      setErrorModalTitle("Błąd dodawania wydatku");
      setErrorModalMessage("Nie udało się dodać wydatku. Spróbuj ponownie.");
      setIsErrorModalVisible(true);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (!id) {
        setIsLoading(false);
        return;
      }

      const fetchGroupDetails = async () => {
        setIsLoading(true);
        try {
          const [groupResponse, membersResponse, userResponse] = await Promise.all([
            apiClient.get(`/groups/${id}`),
            apiClient.get(`/groups/${id}/participants`),
            apiClient.get(`/users/me`)
          ]);

          setGroup(groupResponse.data);
          setMembers(membersResponse.data);
          setCurrentUser(userResponse.data);

        } catch (err) {
          console.log("Błąd podczas pobierania danych grupy lub członków:", err);
        } finally {
          setIsLoading(false);
        }
      };

      fetchGroupDetails();      
    }, [id]) 
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'polls':
        return <PollScreen groupId={id} refreshTrigger={pollRefreshTrigger} />;
      case 'expenses':
        return <ExpensesScreen groupId={id} refreshTrigger={expenseRefreshTrigger} currentUserId={Number(currentUser?.id)} />;
      case 'itinerary':
        return <ListScreen groupId={id} />;
      case 'weather':
        return <WeatherScreen groupId={id} />;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={mainBlue} />
        <Text style={styles.loadingText}>Ładowanie danych...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerTitle: () => (
            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerGroupName}>{group ? group.name : '...'}</Text>
              <Text style={styles.headerDate}>
                {group ? `${formatDate(group.startDate)} - ${formatDate(group.endDate)}` : '...'}
              </Text>
              <Text style={styles.headerDestination}>{group ? group.destination : '...'}</Text>
            </View>
          ),
          headerTitleAlign: 'center',

          headerLeft: () => (
            <View>
              <Pressable onPress={() => router.back()}>
                <Ionicons
                  name="arrow-back"
                  size={25}
                  color="black"
                />
              </Pressable>
            </View>
          ),

          headerRight: () => (
            <Pressable onPress={handleSetting}>
              <Ionicons
                name="settings-outline"
                size={25}
                color="black"
              />
            </Pressable>
          ),
        }}
      />

      <View style={styles.tabBar}>
        <Pressable
          style={[styles.tabButton, activeTab === 'polls' && styles.tabButtonActive]}
          onPress={() => setActiveTab('polls')}>
          <Ionicons name="checkbox-outline" size={24} color={activeTab === 'polls' ? mainBlue : '#555'} />
        </Pressable>

        <Pressable
          style={[styles.tabButton, activeTab === 'weather' && styles.tabButtonActive]}
          onPress={() => setActiveTab('weather')}>
          <Ionicons name="cloudy-night-outline" size={24} color={activeTab === 'weather' ? mainBlue : '#555'} />
        </Pressable>

        <Pressable
          style={[styles.tabButton, activeTab === 'expenses' && styles.tabButtonActive]}
          onPress={() => setActiveTab('expenses')}>
          <Ionicons name="card-outline" size={24} color={activeTab === 'expenses' ? mainBlue : '#555'} />
        </Pressable>

        <Pressable
          style={[styles.tabButton, activeTab === 'itinerary' && styles.tabButtonActive]}
          onPress={() => setActiveTab('itinerary')}>
          <Ionicons name="list-outline" size={24} color={activeTab === 'itinerary' ? mainBlue : '#555'} />
        </Pressable>
      </View>

      <View style={styles.contentContainer}>
        {renderContent()}

        {(activeTab === 'polls' || activeTab === 'expenses') && (
          <TouchableOpacity
            style={{ ...fabStyle, bottom: 50 }}
            onPress={handleFabPress}
          >
            <Ionicons name="add" size={30} color="white" />
          </TouchableOpacity>
        )}


        <InputDateModal
          visible={isDateModalVisible}
          title="Dodaj nową ankietę"
          onClose={handleCloseModal}
          onSubmit={handleModalSubmit}
        />

        <AddExpenseModal
          visible={isExpenseModalVisible}
          title="Dodaj nowy wydatek"
          members={members}
          onClose={handleCloseExpenseModal}
          onSubmit={handleExpenseModalSubmit}
          currentUserId={currentUser?.id}
        />

        <CustomModal
          visible={isErrorModalVisible}
          title={errorModalTitle}
          message={errorModalMessage}
          onClose={handleErrorModalClose}
        />
      </View>
    </View>
  )
}

export default GroupDetails;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignContent: 'center',
    justifyContent: 'center',
  },

  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },

  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#555',
  },

  content: {
    alignItems: 'center',
    marginTop: 20,
  },

  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },

  dateRange: {
    fontSize: 18,
    color: '#333',
    marginBottom: 8,
  },

  destination: {
    fontSize: 16,
    color: '#666',
  },

  headerTitleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 5,
  },

  headerGroupName: {
    fontSize: 20,
    fontWeight: '500',
    color: '#000',
    marginBottom: 3,
  },

  headerDate: {
    fontSize: 16,
    color: '#333',
    marginBottom: 3,
  },

  headerDestination: {
    fontSize: 14,
    color: '#555',
    marginBottom: 8,
  },

  tabBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#fff',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    elevation: 2,
  },

  tabButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 10,
    marginHorizontal: 5,
  },

  tabButtonActive: {
    backgroundColor: '#e6f0ff'
  },

  contentContainer: {
    flex: 1,
  },
});