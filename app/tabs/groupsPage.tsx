import { StyleSheet, Text, View, Image, TouchableOpacity, ActivityIndicator, FlatList, Animated, TouchableWithoutFeedback } from 'react-native'
import React, { useState, useCallback, useRef } from 'react'
import { useFocusEffect } from 'expo-router'
import { mainBlue, lightblue, fabStyle } from '@/constants/theme'
import { Ionicons } from '@expo/vector-icons'
import apiClient from '@/api/apiClient'
import { loadingIndicatorStyle } from '@/constants/theme'
import AddGroupModal, { NewGroupData } from '@/components/AddGroupModal';
import DeleteModal from '@/components/DeleteModal';
import CustomModal from '@/components/CustomModal';
import { useRouter } from 'expo-router';
import { formatDate } from '@/utils/formateDate'
import VoiceGroupCreator from '@/components/VoiceGroupCreator'

interface Participant {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
}

interface GroupOwner {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
}

interface Group {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  destination: string;
  groupImageUrl: string | null;
  owner: GroupOwner;
  participants: Participant[];
}

const groupsPage = () => {
  const router = useRouter();
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedGroups, setSelectedGroups] = useState<number[]>([]);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');
  const [isFabOpen, setIsFabOpen] = useState(false);
  const [isVoiceModalVisible, setIsVoiceModalVisible] = useState(false);
  const animation = useRef(new Animated.Value(0)).current;

  //Pobieranie danych o grupach
  useFocusEffect(
    useCallback(() => {
      const fetchGroups = async () => {
        try {
          const response = await apiClient.get<Group[]>('/groups/my-groups');
          setGroups(response.data);

        } catch (error) {
          console.error("Error fetching groups:", error);
        } finally {
          setIsLoading(false);
        }
      };

      fetchGroups();
    }, [])
  );
//===========================================================

  //Dodawania nowej grupy
  const handleAddGroup = async (data: NewGroupData) => {
    const groupPayload = {
      name: data.name,
      destination: data.destination,
      startDate: data.startDate!.toISOString().split('T')[0],
      endDate: data.endDate!.toISOString().split('T')[0],
      latitude: data.latitude,
      longitude: data.longitude,
    };

    let newGroup: Group;

    try {
      const response = await apiClient.post<Group>('/groups', groupPayload);
      newGroup = response.data;
    } catch (error) {
      setModalTitle('Błąd dodawania grupy');
      setModalMessage('Nie udało się utworzyć grupy. Spróbuj ponownie.');
      setModalVisible(true);
      setIsModalVisible(false);
      return;
    }

    if (data.imageUri) {
      const formData = new FormData();
      const uriParts = data.imageUri.split('.');
      const fileType = uriParts[uriParts.length - 1];

      formData.append('file', {
        uri: data.imageUri,
        name: `group_photo.${fileType}`,
        type: `image/${fileType}`,
      } as any);

      try {
        const imageResponse = await apiClient.post<Group>(
          `/groups/${newGroup.id}/image`,
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          }
        );

        newGroup = imageResponse.data;
      } catch (error) {
        setModalTitle('Błąd zdjęcia');
        setModalMessage('Grupa została utworzona, ale nie udało się przesłać zdjęcia.');
        setModalVisible(true);
      }
    }

    setGroups([newGroup, ...groups]);
    setIsModalVisible(false);
  };
  //===========================================================


  //Handlery do obsługi przytrzymań, kliknięć oraz usuwania grup
  const handleLongPress = (id: number) => {
    if (!isSelectionMode) {
      setIsSelectionMode(true);
      setSelectedGroups([id]);
    }
  };

  const handlePress = (id: number) => {
    if (isSelectionMode) {
      const newSelection = selectedGroups.includes(id)
        ? selectedGroups.filter(groupId => groupId !== id)
        : [...selectedGroups, id];

      setSelectedGroups(newSelection);

      if (newSelection.length === 0) {
        setIsSelectionMode(false);
      }
    } else {
      router.push({
        pathname: `../group/${id}`,
        params: { id: id }
      });
    }
  };

  const cancelSelection = () => {
    setIsSelectionMode(false);
    setSelectedGroups([]);
  };

  const handleDeleteSelected = () => {
    setIsDeleteModalVisible(true);
  };

  const executeDelete = async () => {
    setIsDeleteModalVisible(false);

    try {
      await Promise.all(
        selectedGroups.map(id => apiClient.delete(`/groups/${id}`))
      );

      setGroups(prevGroups =>
        prevGroups.filter(group => !selectedGroups.includes(group.id))
      );

    } catch (error) {
      console.error("Błąd podczas usuwania grup:", error);
      setModalTitle('Błąd usuwania grup');
      setModalMessage('Nie udało się usunąć wybranych grup.');
      setModalVisible(true);
    } finally {
      cancelSelection();
    }
  };
//===========================================================

  //Handlery do pokazywania FAB-ów
  const toggleMenu = () => {
    const toValue = isFabOpen ? 0 : 1;

    Animated.spring(animation, {
      toValue,
      friction: 6,
      useNativeDriver: true,
    }).start();

    setIsFabOpen(!isFabOpen);
  };

  const pin1Style = {
    transform: [
      { scale: animation },
      {
        translateY: animation.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -60]
        })
      }
    ],
    opacity: animation
  };

  const pin2Style = {
    transform: [
      { scale: animation },
      {
        translateY: animation.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -110]
        })
      }
    ],
    opacity: animation
  };

  const handleNewGroupPress = () => {
    toggleMenu(); 
    setIsModalVisible(true); 
  };

  const handlePlaceholderPress = () => {
    toggleMenu(); 
    setIsVoiceModalVisible(true);
  };

  //Dodawanie grupy przez głos
  const handleVoiceGroupCreated = (newGroup: Group) => {
    setGroups([newGroup, ...groups]);
  };

//===========================================================

  if (isLoading) {
    return (
      <View style={loadingIndicatorStyle}>
        <ActivityIndicator size="large" color={mainBlue} />
      </View>
    );
  }

  //Renderowanie kafelków grup
  const renderGroupItem = ({ item }: { item: Group }) => {
    const memberCount = item.participants.length;
    const dateRange = `${formatDate(item.startDate)} - ${formatDate(item.endDate)}`;
    const isSelected = selectedGroups.includes(item.id);

    return (
      <View style={styles.container}>
        <TouchableOpacity
          style={[styles.groupBox, isSelected && styles.groupBoxSelected]}
          onPress={() => handlePress(item.id)}
          onLongPress={() => handleLongPress(item.id)}
          delayLongPress={200}
        >
          <View style={styles.mainRow}>
            <Image
              source={
                item.groupImageUrl
                  ? { uri: item.groupImageUrl }
                  : require('@/assets/images/groupPhoto.jpg')
              }
              style={styles.photo}
            />
            <View style={styles.column}>
              <Text style={styles.groupName}>{item.name}</Text>
              <Text style={styles.groupDestination}>{item.destination}</Text>

              <View style={styles.row}>
                <Ionicons name="people-outline" size={20} color="gray" />
                <Text style={styles.groupQuantity}>
                  {memberCount} {memberCount === 1 ? 'członek' : 'członków'}
                </Text>
              </View>

              <Text style={styles.groupDates}>{dateRange}</Text>
            </View>
          </View>
        </TouchableOpacity>
      </View>
    );
  };
//===========================================================

  // Renderowanie FAB-ów 
  const renderFabs = () => {
    if (isSelectionMode) return null;

    return (
      <View style={[fabStyle, { backgroundColor: 'transparent'}]}>
        <Animated.View style={[styles.miniFabContainer, pin2Style]}>
          <TouchableOpacity
            style={styles.miniFab} 
            onPress={handlePlaceholderPress}
          >
            <Ionicons name="mic-outline" size={24} color="white" />
          </TouchableOpacity>
        </Animated.View>

        <Animated.View style={[styles.miniFabContainer, pin1Style]}>
          <TouchableOpacity
            style={styles.miniFab}
            onPress={handleNewGroupPress}
          >
            <Ionicons name="create-outline" size={24} color="white" />
          </TouchableOpacity>
        </Animated.View>

        <TouchableWithoutFeedback onPress={toggleMenu}>
          <Animated.View style={[styles.mainFab]}>
            <Ionicons name="add" size={30} color="white" />
          </Animated.View>
        </TouchableWithoutFeedback>
      </View>
    );
  };
//===========================================================

  return (
    <View style={{ backgroundColor: 'white', flex: 1 }}>
      <FlatList
        data={groups}
        renderItem={renderGroupItem}
        keyExtractor={(item) => item.id.toString()}
        extraData={selectedGroups}
      />
      {isSelectionMode ? (
        <View style={styles.deletebar}>
          <TouchableOpacity style={styles.cancelButton} onPress={cancelSelection}>
            <Text style={styles.buttonText}>Anuluj</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteSelected}>
            <Text style={styles.buttonText}>Usuń</Text>
          </TouchableOpacity>
        </View>
      ) : (
        renderFabs()
      )}

      <AddGroupModal
        visible={isModalVisible}
        onClose={() => setIsModalVisible(false)}
        onSubmit={handleAddGroup}
      />

      <DeleteModal
        visible={isDeleteModalVisible}
        title="Potwierdź usunięcie"
        message={`Czy na pewno chcesz usunąć ${selectedGroups.length} ${selectedGroups.length === 1 ? 'grupę' : 'grup'}?`}
        onClose={() => setIsDeleteModalVisible(false)}
        onConfirm={executeDelete}
      />

      <CustomModal
        visible={modalVisible}
        title={modalTitle}
        message={modalMessage}
        onClose={() => setModalVisible(false)}
      />

      <VoiceGroupCreator
        visible={isVoiceModalVisible}
        onClose={() => setIsVoiceModalVisible(false)}
        onSubmit={handleAddGroup}
      />
    </View>
  );
}

export default groupsPage

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    backgroundColor: 'white',
  },

  groupBox: {
    width: '90%',
    borderWidth: 1,
    borderColor: 'lightgray',
    borderRadius: 10,
    height: 'auto',
    padding: 20,
  },

  groupBoxSelected: {
    borderWidth: 1,
    borderColor: mainBlue,
    backgroundColor: lightblue
  },

  mainRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  column: {
    flexDirection: 'column',
    flex: 1,
    marginLeft: 10,
    gap: 5,
  },

  photo: {
    width: 110,
    height: 110,
    borderRadius: 10,
  },

  groupName: {
    fontSize: 22,
    fontWeight: 'bold',
  },

  groupDestination: {
    fontSize: 16,
  },

  groupQuantity: {
    fontSize: 14,
    color: 'gray',
  },

  groupDates: {
    fontSize: 14,
    color: 'gray',
  },

  addIconContainer: {
    position: 'absolute',
    right: 10,
    bottom: 10,
  },

  deletebar: {
    position: 'absolute',
    bottom: 15,
    width: '100%',
    height: 70,
    backgroundColor: 'white',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    padding: 20,
  },

  deleteButton: {
    borderRadius: 10,
    height: 50,
    width: '40%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'red',
  },

  cancelButton: {
    borderRadius: 10,
    height: 50,
    width: '40%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'lightgray',
  },

  buttonText: {
    fontSize: 18,
    color: 'white',
    fontWeight: 'bold',
  },

  miniFabContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    // Ustawiamy offset, aby wycentrować względem dużego FABa, jeśli zajdzie potrzeba
    // Zakładając, że duży FAB ma ok 60px, a mały 44px
    right: 5, // Drobna korekta, zależy od rozmiaru fabStyle w theme
  },
  miniFab: {
    backgroundColor: mainBlue,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
  },
  mainFab: {
    backgroundColor: mainBlue, // Używamy koloru z theme, musisz upewnić się, że fabStyle go nie nadpisuje
    width: 56, // Standardowy rozmiar FAB
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255,255,255,0.8)', // Półprzezroczyste tło, gdy menu otwarte
    zIndex: 1,
  },

})