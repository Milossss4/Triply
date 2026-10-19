import apiClient from '@/api/apiClient'
import ConfirmDeleteModal from '@/components/DeleteModal'
import { Ionicons } from '@expo/vector-icons'
import { Stack, useLocalSearchParams, useRouter } from 'expo-router'
import React from 'react'
import { Pressable, StyleSheet, Text, View, ActivityIndicator, ScrollView, Image, TextInput } from 'react-native'
import { mainBlue } from '@/constants/theme'
import InputModal from '@/components/InputModal'
import CustomModal from '@/components/CustomModal'
import { useState, useEffect } from 'react'
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker'
import { formatDate } from '@/utils/formateDate'
import * as ImagePicker from 'expo-image-picker';

const WEATHER_API_KEY = "ccbc4b442fde211509b946adccb26265";

type ModalConfig = {
  title: string;
  initialValue: string;
  field: 'name' | null;
};

type Participant = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
};

interface LocationSuggestion {
  name: string;
  local_names?: { [key: string]: string };
  lat: number;
  lon: number;
  country: string;
  state?: string;
}

type DateField = 'startDate' | 'endDate';

const POLISH_VOIVODESHIPS: Record<string, string> = {
  "Lower Silesian Voivodeship": "Dolnośląskie",
  "Kuyavian-Pomeranian Voivodeship": "Kujawsko-Pomorskie",
  "Lublin Voivodeship": "Lubelskie",
  "Lubusz Voivodeship": "Lubuskie",
  "Łódź Voivodeship": "Łódzkie",
  "Lesser Poland Voivodeship": "Małopolskie",
  "Masovian Voivodeship": "Mazowieckie",
  "Opole Voivodeship": "Opolskie",
  "Subcarpathian Voivodeship": "Podkarpackie",
  "Podlaskie Voivodeship": "Podlaskie",
  "Pomeranian Voivodeship": "Pomorskie",
  "Silesian Voivodeship": "Śląskie",
  "Holy Cross Voivodeship": "Świętokrzyskie",
  "Warmian-Masurian Voivodeship": "Warmińsko-Mazurskie",
  "Greater Poland Voivodeship": "Wielkopolskie",
  "West Pomeranian Voivodeship": "Zachodniopomorskie",
};

const groupSettings = () => {
  const router = useRouter();
  //Stany do modali przy usuwaniu oraz błędzie daty
  const [modalVisible, setModalVisible] = React.useState(false);
  const [modalTitle, setModalTitle] = React.useState('');
  const [modalMessage, setModalMessage] = React.useState('');
  const [isInputModalVisible, setInputModalVisible] = useState(false);
  const [modalConfig, setModalConfig] = useState<ModalConfig>({
    title: '',
    initialValue: '',
    field: null,
  });

  const [isErrorModalVisible, setIsErrorModalVisible] = useState(false);
  const [errorModalTitle, setErrorModalTitle] = useState('');
  const [errorModalMessage, setErrorModalMessage] = useState('');

  //Stany id grupy oraz zmiany na liczbę
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const groupIdAsNumber = parseInt(groupId, 10);

  //Stany danych grupy
  const [groupName, setGroupName] = useState('');
  const [groupDestination, setGroupDestination] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);

  //Stany dla modala usuwania uczestników
  const [isParticipantDeleteModalVisible, setIsParticipantDeleteModalVisible] = useState(false);
  const [participantToDelete, setParticipantToDelete] = useState<Participant | null>(null);

  //Stany DatePickera
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateFieldToEdit, setDateFieldToEdit] = useState<DateField | null>(null);

  //Stany dla edycji i usuwania zdjęcia
  const [groupImageUrl, setGroupImageUrl] = useState<string | null>(null);
  const [isImageLoading, setIsImageLoading] = useState(false);
  const [isImageDeleteModalVisible, setIsImageDeleteModalVisible] = useState(false);

  //Stany dla sugenstii i koordynatów
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);

  //Pobieranie danych grupy
  useEffect(() => {
    if (isNaN(groupIdAsNumber)) {
      setIsLoading(false);
      return;
    }

    const fetchAllData = async () => {
      setIsLoading(true);
      try {
        const [groupResponse, userResponse] = await Promise.all([
          apiClient.get(`/groups/${groupIdAsNumber}`),
          apiClient.get('/users/me')
        ]);

        const groupData = groupResponse.data;
        const userData = userResponse.data;

        setGroupName(groupData.name);
        setGroupDestination(groupData.destination);
        setStartDate(groupData.startDate);
        setEndDate(groupData.endDate);
        setParticipants(groupData.participants);
        setGroupImageUrl(groupData.groupImageUrl || null);
        setLatitude(groupData.latitude || null);
        setLongitude(groupData.longitude || null);

        const groupOwnerId = groupData.owner.id;
        const currentUserId = userData.id;

        if (groupOwnerId && currentUserId && groupOwnerId === currentUserId) {
          setIsOwner(true);
        } else {
          setIsOwner(false);
        }

      } catch (err: any) {
        console.log("Błąd podczas pobierania danych grupy lub użytkownika:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllData();
  }, [groupIdAsNumber]);

  //Pobieranie lokalizacji
  const fetchLocations = async (query: string) => {
    if (query.length < 3) {
      setSuggestions([]);
      return;
    }

    if (latitude || longitude) {
      setLatitude(null);
      setLongitude(null);
    }

    try {
      const response = await fetch(
        `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(
          query
        )}&limit=20&appid=${WEATHER_API_KEY}`
      );
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      const data: LocationSuggestion[] = await response.json();
      setSuggestions(data);
    } catch (error) {
      console.log("Failed to fetch locations:", error);
      setErrorModalTitle("Błąd API");
      setErrorModalMessage("Nie udało się pobrać lokalizacji. Spróbuj ponownie.");
      setIsErrorModalVisible(true);
    }
  };

  //Monitorowanie zmian destynacji
  useEffect(() => {
    const handler = setTimeout(() => {
      if (groupDestination) {
        if (latitude === null) {
          fetchLocations(groupDestination);
        }
      } else {
        setSuggestions([]);
      }
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [groupDestination]);

  // Handler dla zmiany tekstu w polu destynacji
  const handleDestinationTextChange = (text: string) => {
    setGroupDestination(text);
    setLatitude(null);
    setLongitude(null);
  };

  //Funkcja do formatowania lokalizacji
  const getLocationName = (item: LocationSuggestion) => {
    const cityName = item.local_names?.pl || item.name;
    let stateName = item.state;
    
    if (item.country === "PL" && item.state && POLISH_VOIVODESHIPS[item.state]) {
      stateName = POLISH_VOIVODESHIPS[item.state];
    }

    return { cityName, stateName };
  };

  // Handler dla wyboru lokalizacji
  const handleSuggestionPress = (item: LocationSuggestion) => {
    const { cityName, stateName } = getLocationName(item);

    const formattedName = [cityName, stateName, item.country]
      .filter(Boolean)
      .join(", ");

    setGroupDestination(formattedName);
    setLatitude(item.lat);
    setLongitude(item.lon);
    setSuggestions([]);

    saveDestinationUpdate(formattedName, item.lat, item.lon);
  };


  //Handler do obsługi modala usuwania grupy
  const handleOpenModal = () => {
    setModalTitle('Usuń grupę');
    setModalMessage('Czy na pewno chcesz usunąć tę grupę? Ta akcja jest nieodwracalna.');
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
  };

  const handleDeleteConfirm = async () => {
    try {
      await apiClient.delete(`/groups/${groupIdAsNumber}`);
      setModalVisible(false);
      router.replace('/tabs/groupsPage');
    }
    catch (error) {
      console.log(error);
    }
  };

  //Handler modala do edycji nazwy i celu podróży
  const handleInputModalCancel = () => {
    setInputModalVisible(false);
    setModalConfig({ title: '', initialValue: '', field: null });
  };

  const handleInputModalAccept = async (newValue: string) => {
    const fieldToUpdate = modalConfig.field;

    if (!fieldToUpdate || newValue.trim() === '' || fieldToUpdate !== 'name') {
      handleInputModalCancel();
      return;
    }

    let payload = {
      name: groupName,
      destination: groupDestination,
      startDate: startDate,
      endDate: endDate,
      latitude: latitude,
      longitude: longitude,
    };

    if (fieldToUpdate === 'name') {
      payload.name = newValue;
    } else if (fieldToUpdate === 'destination') {
      payload.destination = newValue;
    }

    try {
      await apiClient.put(`/groups/${groupIdAsNumber}`, payload);

      if (fieldToUpdate === 'name') {
        setGroupName(newValue);
      } else if (fieldToUpdate === 'destination') {
        setGroupDestination(newValue);
      }
      handleInputModalCancel();

    } catch (error) {
      console.log("Błąd podczas aktualizacji grupy (PUT):", error);
    }
  };

  //Handler do zamykania modala do błędy z datą
  const handleErrorModalClose = () => {
    setIsErrorModalVisible(false);
    setErrorModalTitle('');
    setErrorModalMessage('');
  };

  //Handler do zmiany nazwy grupy i celu podróży
  const handleEditGroupName = () => {
    setModalConfig({
      title: 'Zmień nazwę grupy',
      initialValue: groupName,
      field: 'name',
    });
    setInputModalVisible(true);
  };

  //Handler zapisujący zmianę destynacji
  const saveDestinationUpdate = async (newDestination: string, newLat: number, newLon: number) => {
    const payload = {
      name: groupName,
      destination: newDestination,
      startDate: startDate,
      endDate: endDate,
      latitude: newLat,
      longitude: newLon,
    };

    try {
      await apiClient.put(`/groups/${groupIdAsNumber}`, payload);
    } catch (error) {
      console.log("Błąd podczas aktualizacji destynacji (PUT):", error);
      setErrorModalTitle("Błąd");
      setErrorModalMessage("Nie udało się zaktualizować destynacji. Spróbuj ponownie.");
      setIsErrorModalVisible(true);
    }
  };

  //Handler do otwierania oraz ustawiania i zapisu nowego czasu
  const handleOpenDatePicker = (field: DateField) => {
    const dateString = (field === 'startDate') ? startDate : endDate;
    const parts = dateString.split('-').map(part => parseInt(part, 10));
    const dateToShow = new Date(parts[0], parts[1] - 1, parts[2]);

    setDate(dateToShow);
    setDateFieldToEdit(field);
    setShowDatePicker(true);
  };

  const onDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowDatePicker(false);

    if (event.type === 'set' && selectedDate) {
      const year = selectedDate.getFullYear();
      const month = (selectedDate.getMonth() + 1).toString().padStart(2, '0');
      const day = selectedDate.getDate().toString().padStart(2, '0');

      const formattedDate = `${year}-${month}-${day}`;

      if (dateFieldToEdit) {
        const oldDate = dateFieldToEdit === 'startDate' ? startDate : endDate;

        if (formattedDate !== oldDate) {
          handleDateUpdate(formattedDate, dateFieldToEdit);
        }
      }
    }
  };

  const handleDateUpdate = async (newDate: string, field: DateField) => {
    const newStartDate = field === 'startDate' ? newDate : startDate;
    const newEndDate = field === 'endDate' ? newDate : endDate;

    if (new Date(newStartDate) > new Date(newEndDate)) {
      setErrorModalTitle("Błąd daty");
      setErrorModalMessage("Data rozpoczęcia nie może być późniejsza niż data zakończenia.");
      setIsErrorModalVisible(true);
      return;
    }

    const payload = {
      name: groupName,
      destination: groupDestination,
      startDate: newStartDate,
      endDate: newEndDate,
      latitude: latitude,
      longitude: longitude,
    };

    try {
      await apiClient.put(`/groups/${groupIdAsNumber}`, payload);

      if (field === 'startDate') {
        setStartDate(newDate);
      } else {
        setEndDate(newDate);
      }
    } catch (error) {
      console.log("Błąd podczas aktualizacji daty (PUT):", error);
    }
  };

  //Handler do usuwania uczestnika
  const handleDeleteParticipant = (participantId: string) => {
    const participant = participants.find(p => p.id.toString() === participantId);

    if (participant) {
      setParticipantToDelete(participant);
      setIsParticipantDeleteModalVisible(true);
    } else {
      console.log("Nie znaleziono uczestnika o ID:", participantId);
    }
  };

  const handleConfirmDeleteParticipant = async () => {
    if (!participantToDelete) return;

    const userId = participantToDelete.id;

    try {
      await apiClient.delete(`/groups/${groupIdAsNumber}/participants/${userId}`);

      setParticipants(prevParticipants =>
        prevParticipants.filter(p => p.id !== userId)
      );

    } catch (error) {
      console.log("Błąd podczas usuwania uczestnika:", error);

      setErrorModalTitle("Błąd");
      setErrorModalMessage("Nie udało się usunąć uczestnika. Spróbuj ponownie.");
      setIsErrorModalVisible(true);
    }
    finally {
      setIsParticipantDeleteModalVisible(false);
      setParticipantToDelete(null);
    }
  };

  // Funkcja do zamykania modala usuwania uczestnika
  const handleCancelDeleteParticipant = () => {
    setIsParticipantDeleteModalVisible(false);
    setParticipantToDelete(null);
  };

  //Handler do dodawania użytkownika
  const handleSearchUsers = () => {
    router.push({
      pathname: '/searchUsers',
      params: { groupId: groupId }
    });
  };

  //Handler od wybieranie/edycji zdjęcia
  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      setErrorModalTitle('Brak uprawnień');
      setErrorModalMessage('Potrzebujemy dostępu do galerii, aby zmienić zdjęcie.');
      setIsErrorModalVisible(true);
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled) {
      handleImageUpload(result.assets[0].uri);
    }
  };

  // Handler do wysyłania zdjęcia (edycja/dodawanie)
  const handleImageUpload = async (newImageUri: string) => {
    setIsImageLoading(true);
    const formData = new FormData();
    const uriParts = newImageUri.split('.');
    const fileType = uriParts[uriParts.length - 1];
    const fileName = newImageUri.split('/').pop() || `photo.${fileType}`;

    formData.append('file', {
      uri: newImageUri,
      name: fileName,
      type: `image/${fileType}`,
    } as any);

    try {
      const response = await apiClient.post(
        `/groups/${groupIdAsNumber}/image`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      const groupResponse = await apiClient.get(`/groups/${groupIdAsNumber}`);

      if (groupResponse.data && groupResponse.data.groupImageUrl) {
        let newImageUrl = groupResponse.data.groupImageUrl;
        setGroupImageUrl(newImageUrl);
      } else {
        setGroupImageUrl(null);
      }

    } catch (error) {
      console.log("Błąd podczas przesyłania zdjęcia:", error);
      setErrorModalTitle("Błąd przesyłania");
      const errorMessage = (error as any).response?.data?.message || "Nie udało się zaktualizować zdjęcia. Spróbuj ponownie.";
      setErrorModalMessage(errorMessage);

      setIsErrorModalVisible(true);
    } finally {
      setIsImageLoading(false);
    }
  };

  // Handlery do modala usuwania zdjęcia
  const handleOpenImageDeleteModal = () => {
    setIsImageDeleteModalVisible(true);
  };

  const handleCloseImageDeleteModal = () => {
    setIsImageDeleteModalVisible(false);
  };

  const handleConfirmImageDelete = async () => {
    handleCloseImageDeleteModal();
    setIsImageLoading(true);

    try {
      await apiClient.delete(`/groups/${groupIdAsNumber}/image`);
      setGroupImageUrl(null);

    } catch (error) {
      console.log("Błąd podczas usuwania zdjęcia:", error);
      setErrorModalTitle("Błąd usuwania");
      setErrorModalMessage("Nie udało się usunąć zdjęcia. Spróbuj ponownie.");
      setIsErrorModalVisible(true);
    } finally {
      setIsImageLoading(false);
    }
  };


  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={mainBlue} />
        <Text style={styles.loadingText}>Ładowanie danych grupy...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 60 }}>
      <Stack.Screen
        options={{
          title: `Ustawienia grupy`,
          headerTitleAlign: 'center',
          headerBackTitle: "Wróć",

          headerRight: () => (
            isOwner ? (
              <Pressable onPress={handleOpenModal} style={{ marginRight: 15 }}>
                <Ionicons name="trash-outline" size={24} color="red" />
              </Pressable>
            ) : null
          ),
        }}
      />

      {isOwner && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Nazwa Grupy</Text>
          <View style={styles.rowBetween}>
            <Text style={styles.groupNameText}>{groupName}</Text>
            <Pressable onPress={handleEditGroupName}>
              <Ionicons name="pencil-outline" size={20} color="#555" />
            </Pressable>
          </View>
        </View>)}

      {isOwner && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Cel Podróży</Text>
          <TextInput
            style={styles.input}
            placeholder="Destynacja (np. Warszawa)"
            value={groupDestination}
            onChangeText={handleDestinationTextChange}
            placeholderTextColor="black"
          />
          {suggestions.length > 0 && (
            <ScrollView
              style={styles.suggestionsList}
              nestedScrollEnabled={true}
              keyboardShouldPersistTaps="handled" 
            >
              {suggestions.map((item, index) => {
                const key = `${item.name ?? 'unknown'}|${item.state ?? ''}|${item.country ?? ''}|${item.lat}|${item.lon}|${index}`;
                const { cityName, stateName } = getLocationName(item);
                
                return (
                  <Pressable
                    key={key}
                    style={styles.suggestionItem}
                    onPress={() => handleSuggestionPress(item)}
                  >
                    <Text style={styles.suggestionText}>
                      {cityName}
                      {stateName ? `, ${stateName}` : ""}
                      {item.country ? `, ${item.country}` : ""}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          )}
        </View>
      )}

      {isOwner && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Daty Wyjazdu</Text>

          <View style={styles.dateField}>
            <Text style={styles.dateText}>{formatDate(startDate)}</Text>
            <Pressable onPress={() => {
              handleOpenDatePicker('startDate');
            }}>
              <Ionicons name="calendar-outline" size={20} color="#555" />
            </Pressable>
          </View>

          <View style={styles.dateField}>
            <Text style={styles.dateText}>{formatDate(endDate)}</Text>
            <Pressable onPress={() => {
              handleOpenDatePicker('endDate');
            }}>
              <Ionicons name="calendar-outline" size={20} color="#555" />
            </Pressable>
          </View>
        </View>)}

      {isOwner && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Zdjęcie Grupy</Text>
          <View style={styles.imageContainer}>
            {groupImageUrl ? (
              <Image source={{ uri: groupImageUrl }} style={styles.groupImage} resizeMode="cover" />
            ) : (
              <View style={[styles.groupImage, styles.imagePlaceholder]}>
                <Ionicons name="camera-outline" size={50} color="#ccc" />
                <Text style={styles.imagePlaceholderText}>Brak zdjęcia</Text>
              </View>
            )}
            {isImageLoading && (
              <View style={styles.imageLoadingOverlay}>
                <ActivityIndicator size="large" color={mainBlue} />
              </View>
            )}
          </View>
          <View style={styles.imageButtonRow}>
            <Pressable style={[styles.imageButton, styles.editImageButton]} onPress={handlePickImage} disabled={isImageLoading}>
              <Ionicons name="pencil-outline" size={18} color="#fff" />
              <Text style={styles.imageButtonText}>{groupImageUrl ? "Zmień" : "Dodaj"}</Text>
            </Pressable>
            {groupImageUrl && (
              <Pressable style={[styles.imageButton, styles.deleteImageButton]} onPress={handleOpenImageDeleteModal} disabled={isImageLoading}>
                <Ionicons name="trash-outline" size={18} color="#fff" />
                <Text style={styles.imageButtonText}>Usuń</Text>
              </Pressable>
            )}
          </View>
        </View>
      )}

      <View style={styles.card}>
        <View style={styles.rowBetween}>
          <Text style={styles.sectionTitle}>Uczestnicy</Text>
          <Text style={styles.participantsCount}>{participants.length}</Text>
        </View>

        <ScrollView
          style={styles.participantList}
          nestedScrollEnabled={true}
        >
          {participants.map(participant => (
            <View key={participant.id} style={styles.participantRow}>
              <Text style={styles.participantName}>{participant.firstName} {participant.lastName}</Text>
              {isOwner && (
                <Pressable onPress={() => handleDeleteParticipant(participant.id.toString())}>
                  <Ionicons name="trash-outline" size={22} color="red" />
                </Pressable>)}
            </View>
          ))}
        </ScrollView>
      </View>

      {isOwner && (
        <Pressable style={styles.button} onPress={handleSearchUsers}>
          <Text style={styles.buttonText}>Zaproś nowe osoby</Text>
        </Pressable>)}

      <ConfirmDeleteModal
        visible={modalVisible}
        title={modalTitle}
        message={modalMessage}
        onClose={handleCloseModal}
        onConfirm={handleDeleteConfirm}
      />

      <InputModal
        visible={isInputModalVisible}
        title={modalConfig.title}
        initialValue={modalConfig.initialValue}
        onCancel={handleInputModalCancel}
        onAccept={handleInputModalAccept}
        placeholder="Wprowadź nową wartość..."
      />

      <CustomModal
        visible={isErrorModalVisible}
        title={errorModalTitle}
        message={errorModalMessage}
        onClose={handleErrorModalClose}
      />

      <ConfirmDeleteModal
        visible={isParticipantDeleteModalVisible}
        title="Usuń uczestnika"
        message={`Czy na pewno chcesz usunąć ${participantToDelete?.firstName || ''} ${participantToDelete?.lastName || ''} z grupy?`}
        onClose={handleCancelDeleteParticipant}
        onConfirm={handleConfirmDeleteParticipant}
      />

      <ConfirmDeleteModal
        visible={isImageDeleteModalVisible}
        title="Usuń zdjęcie"
        message="Czy na pewno chcesz usunąć zdjęcie grupy?"
        onClose={handleCloseImageDeleteModal}
        onConfirm={handleConfirmImageDelete}
      />

      {showDatePicker && (
        <DateTimePicker
          testID="dateTimePicker"
          value={date}
          mode="date"
          onChange={onDateChange}
          minimumDate={new Date()}
        />
      )}
    </ScrollView>
  )
}

export default groupSettings

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },

  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    elevation: 3,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },

  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },

  groupNameText: {
    fontSize: 16,
    color: '#555',
  },

  dateField: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#eee',
  },

  dateText: {
    fontSize: 16,
    color: '#555',
  },

  participantsCount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#555',
  },

  participantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },

  participantName: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },

  participantList: {
    maxHeight: 150,
  },

  button: {
    backgroundColor: mainBlue,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
  },

  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },

  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f0f2f5',
  },

  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#555',
  },

  imageContainer: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    overflow: 'hidden',
    position: 'relative',
  },

  groupImage: {
    width: '100%',
    height: '100%',
  },

  imagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
  },

  imagePlaceholderText: {
    color: '#ccc',
    marginTop: 5,
    fontSize: 16,
  },

  imageLoadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  imageButtonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    gap: 10, 
  },

  imageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center', 
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    elevation: 2,
    flex: 1, 
  },

  editImageButton: {
    backgroundColor: mainBlue,
  },

  deleteImageButton: {
    backgroundColor: '#d9534f',
  },

  imageButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 8,
    fontSize: 16,
  },

  input: {
    width: "100%",
    height: 50,
    borderColor: "lightgray",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 15,
    fontSize: 16,
    color: 'black',
  },

  suggestionsList: {
    width: "100%",
    maxHeight: 150,
    backgroundColor: "#f9f9f9",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    marginTop: -10,
    marginBottom: 15,
    zIndex: 10,
  },

  suggestionItem: {
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  
  suggestionText: {
    fontSize: 16,
    color: "#333",
  },
})