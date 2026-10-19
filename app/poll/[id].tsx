import apiClient from '@/api/apiClient';
import AddOptionForm from '@/components/AddPollOptionForm';
import CustomModal from '@/components/CustomModal';
import ConfirmDeleteModal from '@/components/DeleteModal';
import InputDateModal from '@/components/InputDateModal';
import InputModal from '@/components/InputModal';
import { mainBlue } from '@/constants/theme';
import { formatDeadline } from '@/utils/formateDeadline';
import { Ionicons } from '@expo/vector-icons';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Keyboard, KeyboardAvoidingView, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type PollUser = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
};

type PollOption = {
  id: number;
  description: string;
  link: string;
  addedBy: PollUser;
  voteCount: number;
  hasVoted: boolean;
};

export type PollDetails = {
  id: number;
  title: string;
  votingDeadline: string;
  createdBy: PollUser;
  options: PollOption[];
};

type GroupOwnerData = {
  owner: PollUser;
};

const pollDetails = () => {
  const { id, groupId } = useLocalSearchParams<{ id: string, groupId: string }>();
  const [poll, setPoll] = useState<PollDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [canManage, setCanManage] = useState(false);
  const [isAddingOption, setIsAddingOption] = useState(false);
  const insets = useSafeAreaInsets();
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [isErrorModalVisible, setIsErrorModalVisible] = useState(false);
  const [errorModalMessage, setErrorModalMessage] = useState('');
  const [currentUser, setCurrentUser] = useState<PollUser | null>(null);
  const [isGroupOwner, setIsGroupOwner] = useState(false);
  const [optionToManage, setOptionToManage] = useState<PollOption | null>(null);
  const [isDeleteOptionModalVisible, setIsDeleteOptionModalVisible] = useState(false);
  const [isEditOptionModalVisible, setIsEditOptionModalVisible] = useState(false);

  //Handlery dla usuwania głosowania
  const handleDeletePress = () => {
    setIsModalVisible(true);
    setModalTitle('Czy na pewno chcesz usunąć tę ankietę?');
    setModalMessage('Ta akcja jest nieodwracalna.');
  };

  const handleConfirmDelete = async () => {
    setIsModalVisible(false);
    setIsLoading(true);
    try {
      await apiClient.delete(`/polls/${id}`);

      router.back();

    } catch (err: any) {
      console.log("Błąd podczas usuwania ankiety:", err);
      setIsLoading(false);
    }
  };

  //Handlery dla edcji głosowania
  const handleEditPress = () => {
    if (poll) {
      setIsEditModalVisible(true);
    }
  };

  const handleEditClose = () => {
    setIsEditModalVisible(false);
  };

  const handleEditSubmit = async (newTitle: string, newDeadline: Date) => {
    setIsEditModalVisible(false);
    setIsLoading(true);

    try {
      const payload = {
        title: newTitle,
        votingDeadline: newDeadline.toISOString(),
      };

      await apiClient.put(`/polls/${id}`, payload);

      await fetchPollDetails();

    } catch (err: any) {
      console.log("Błąd podczas aktualizacji ankiety:", err);
      setIsLoading(false);
    }
  };

  //Handler do dodawania nowych pomysłów
  const handleAddOption = async (description: string) => {
    // Walidacja i czyszczenie stanu są teraz w komponencie potomnym
    setIsAddingOption(true);
    try {
      const payload = {
        description: description, // Użyj 'description' z argumentu
        link: '',
      };

      await apiClient.post(`/polls/${id}/options`, payload);

      // Nie musisz już czyścić stanu ani chować klawiatury
      await fetchPollDetails();

    } catch (err) {
      console.log("Błąd podczas dodawania nowej opcji:", err);
    } finally {
      setIsAddingOption(false);
    }
  };

  // Handlery do głosowania
  const handleVote = async (optionId: number) => {
    try {
      await apiClient.post(`/polls/options/${optionId}/vote`);
      await fetchPollDetails();
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Głosowanie nie jest już możliwe.';
      setErrorModalMessage(message);
      setIsErrorModalVisible(true);
    }
  };

  //Handlery do edycji pomysłu
  const handleEditOptionPress = (option: PollOption) => {
    setOptionToManage(option);
    setIsEditOptionModalVisible(true);
  };

  const handleEditOptionSubmit = async (newDescription: string) => {
    if (!optionToManage || !newDescription.trim()) return;

    setIsEditOptionModalVisible(false);
    try {
      await apiClient.put(`/polls/options/${optionToManage.id}`, {
        description: newDescription,
      });
      await fetchPollDetails();
      setOptionToManage(null);
    } catch (err: any) {
      console.error("Błąd podczas edycji opcji:", err);
      setErrorModalMessage('Wystąpił błąd podczas edycji opcji.');
      setIsErrorModalVisible(true);
    }
  };

  //Handlery do usuwania pomysłu
  const handleDeleteOptionPress = (option: PollOption) => {
    setOptionToManage(option);
    setIsDeleteOptionModalVisible(true);
  };

  const handleConfirmDeleteOption = async () => {
    if (!optionToManage) return;

    setIsDeleteOptionModalVisible(false);
    try {
      await apiClient.delete(`/polls/options/${optionToManage.id}`);
      await fetchPollDetails();
      setOptionToManage(null);
    } catch (err: any) {
      console.error("Błąd podczas usuwania opcji:", err);
      setErrorModalMessage('Wystąpił błąd podczas usuwania opcji.');
      setIsErrorModalVisible(true);
    }
  };

  const fetchPollDetails = useCallback(async () => {
    if (!id) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const response = await apiClient.get(`/polls/${id}`);
      setPoll(response.data);
    } catch (err: any) {
      console.log("Błąd podczas pobierania szczegółów ankiety:", err);
      setPoll(null);
    } finally {
      setIsLoading(false);
    }
  }, [id]);


  //Pobieranie potrzebnych danych
  useEffect(() => {
    const fetchAllDataAndCheckPermissions = async () => {
      setIsLoading(true);
      setCanManage(false);
      setIsGroupOwner(false);
      setCurrentUser(null);

      try {
        const [pollResponse, meResponse, groupResponse] = await Promise.all([
          apiClient.get<PollDetails>(`/polls/${id}`),
          apiClient.get<PollUser>(`/users/me`),
          apiClient.get<GroupOwnerData>(`/groups/${groupId}`)
        ]);

        const fetchedPoll = pollResponse.data;
        const currentUser = meResponse.data;
        const groupOwner = groupResponse.data.owner;

        setPoll(fetchedPoll);

        const isPollCreator = fetchedPoll.createdBy.id === currentUser.id;
        const isGroupOwner = groupOwner.id === currentUser.id;


        setCurrentUser(currentUser);
        setIsGroupOwner(isGroupOwner);


        if (isPollCreator || isGroupOwner) {
          setCanManage(true);
        }



      } catch (err: any) {
        console.log("Błąd podczas pobierania danych lub sprawdzania uprawnień:", err);
        setPoll(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllDataAndCheckPermissions();
  }, [id, groupId]);

  //Zajmowanie się przesuwaniem addOptionForm
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => {
        setIsKeyboardVisible(true);
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setIsKeyboardVisible(false);
      }
    );

    return () => {
      keyboardDidHideListener.remove();
      keyboardDidShowListener.remove();
    };
  }, []);


  //Ładowanie tytułu oraz deadline
  const renderContent = () => {
    if (isLoading) {
      return (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color='mainBlue' />
          <Text style={styles.loadingText}>Ładowanie ankiety...</Text>
        </View>
      );
    }


    if (!poll) {
      return (
        <View style={styles.centered}>
          <Text>Nie znaleziono ankiety.</Text>
        </View>
      );
    }

    const DeadlinePassed = new Date(poll.votingDeadline) < new Date();
    let optionsToRender = [...poll.options]
    if (DeadlinePassed) {
      optionsToRender.sort((a, b) => b.voteCount - a.voteCount);
    }

    return (
      <>
        <Text style={styles.title}>{poll.title}</Text>
        <View style={styles.metaContainer}>
          
          {/* Wiersz z datą */}
          <View style={styles.metaRow}>
            <Ionicons name="time-outline" size={20} color="#666" />
            <Text style={styles.metaText}>
              {formatDeadline(poll.votingDeadline)}
            </Text>
          </View>

          {/* Wiersz z autorem */}
          <View style={styles.metaRow}>
            <Ionicons name="person-outline" size={20} color="#666" />
            <Text style={styles.metaText}>
              {poll.createdBy.firstName} {poll.createdBy.lastName}
            </Text>
          </View>
          
        </View>

        <View style={styles.separator} />

        <View>
          <Text style={styles.optionsTitle}>
            {DeadlinePassed ? "Wyniki głosowania:" : "Dostępne opcje:"}
          </Text>
          {optionsToRender.length === 0 ? (
            <Text style={styles.noOptionsText}>Brak opcji do głosowania. Dodaj pierwszą!</Text>
          ) : (
            optionsToRender.map((option) => {
              const canManageThisOption = (isGroupOwner || currentUser?.id === option.addedBy.id) && !DeadlinePassed;

              return (
                <View key={option.id} style={styles.optionCard}>

                  <Pressable
                    style={styles.checkboxContainer}
                    onPress={() => handleVote(option.id)}
                    disabled={DeadlinePassed}
                  >
                    <Ionicons
                      name={option.hasVoted ? "checkbox" : "square-outline"}
                      size={30}
                      color={DeadlinePassed ? '#ccc' : (option.hasVoted ? mainBlue : "#888")}
                    />
                  </Pressable>

                  <View style={styles.optionInfo}>
                    <Text style={styles.optionDescription}>{option.description}</Text>
                    <Text style={styles.optionAddedBy}>
                      Dodano przez: {option.addedBy.firstName} {option.addedBy.lastName}
                    </Text>
                  </View>

                  {DeadlinePassed && (
                    <View style={styles.voteCountContainer}>
                      <Text style={styles.voteCount}>{option.voteCount}</Text>
                    </View>
                  )}

                  {canManageThisOption && (
                    <View style={styles.optionActionsContainer}>
                      <Pressable onPress={() => handleEditOptionPress(option)}>
                        <Ionicons name="pencil-outline" size={24} color="#666" />
                      </Pressable>
                      <Pressable onPress={() => handleDeleteOptionPress(option)}>
                        <Ionicons name="trash-outline" size={24} color="red" />
                      </Pressable>
                    </View>
                  )}
                </View>
              )
            })
          )}
        </View>
      </>
    );
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={(isKeyboardVisible ? 'padding' : undefined)}
      keyboardVerticalOffset={insets.bottom}
    >
      <View style={styles.container}>
        <Stack.Screen
          options={{
            headerTitle: '',
            headerRight: () => (
              <View style={styles.row}>
                {canManage && (
                  <>
                    <Pressable onPress={handleDeletePress}>
                      <Ionicons
                        name="trash-outline"
                        size={30}
                        color="red"
                      />
                    </Pressable>

                    <Pressable onPress={handleEditPress}>
                      <Ionicons
                        name="pencil-outline"
                        size={30}
                        color="black"
                      />
                    </Pressable>
                  </>)}
              </View>
            )
          }}
        />
        <ScrollView style={{ flex: 1 }}>
          <View style={styles.mainContentContainer}>
            {renderContent()}
          </View>
        </ScrollView>

        <AddOptionForm
          poll={poll}
          onAddOption={handleAddOption}
          isAdding={isAddingOption}
        />

        {canManage && (
          <>
            <ConfirmDeleteModal
              visible={isModalVisible}
              title={modalTitle}
              message={modalMessage}
              onClose={() => setIsModalVisible(false)}
              onConfirm={handleConfirmDelete}
            />


            {poll && (
              <InputDateModal
                visible={isEditModalVisible}
                title="Edytuj ankietę"
                onClose={handleEditClose}
                onSubmit={handleEditSubmit}
                initialName={poll.title}
                initialDate={new Date(poll.votingDeadline)}
              />
            )}
          </>)}

        {optionToManage && (
          <ConfirmDeleteModal
            visible={isDeleteOptionModalVisible}
            title="Usunąć opcję?"
            message={`Czy na pewno chcesz usunąć: "${optionToManage.description}"?`}
            onClose={() => setIsDeleteOptionModalVisible(false)}
            onConfirm={handleConfirmDeleteOption}
          />
        )}

        {optionToManage && (
          <InputModal
            visible={isEditOptionModalVisible}
            title="Edytuj opcję"
            onCancel={() => setIsEditOptionModalVisible(false)}
            onAccept={handleEditOptionSubmit}
            initialValue={optionToManage.description}
            placeholder="Wpisz nową treść opcji"
          />
        )}

        <CustomModal
          visible={isErrorModalVisible}
          title="Błąd"
          message={errorModalMessage}
          onClose={() => setIsErrorModalVisible(false)}
        />
      </View>
    </KeyboardAvoidingView>
  )
}

export default pollDetails

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },

  mainContentContainer: {
    padding: 16,
    paddingBottom: 24,
  },

  row: {
    flexDirection: 'row',
    gap: 15,
    marginRight: 10,
  },

  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },

  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#555',
  },

  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },

  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginRight: 10,
  },

  deadline: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },

  madeBy: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },

  optionsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },

  noOptionsText: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    marginTop: 10,
    fontStyle: 'italic',
  },

  optionCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#eee',
    elevation: 2,
  },

  optionInfo: {
    flex: 1,
    marginRight: 10,
  },

  optionDescription: {
    fontSize: 18,
    fontWeight: '600',
    color: '#444',
    marginBottom: 4,
  },

  optionAddedBy: {
    fontSize: 12,
    color: '#777',
  },

  optionLink: {
    fontSize: 14,
    color: mainBlue,
    marginTop: 5,
    textDecorationLine: 'underline',
  },

  checkboxContainer: {
    paddingRight: 12,
  },

  voteCountContainer: {
    paddingLeft: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },

  voteCount: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    minWidth: 25,
    textAlign: 'right',
  },

  separator: {
    height: 1,
    width: '100%',
    backgroundColor: '#e0e0e0',
    marginBottom: 15,
  },

  optionActionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
    paddingLeft: 10,
  },

  metaContainer: {
    marginTop: 10,
    marginBottom: 10,
    gap: 8, 
  },

  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  metaText: {
    fontSize: 15,
    color: '#555',
    marginLeft: 8, 
    fontWeight: '500',
  },
})