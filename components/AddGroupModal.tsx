import React, { useState, useEffect } from "react";
import { Modal, Pressable, StyleSheet, Text, TextInput, View, Image, FlatList, ActivityIndicator, KeyboardAvoidingView } from "react-native";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { buttonStyle, buttonTextStyle, mainBlue } from "../constants/theme";
import CustomModal from '../components/CustomModal';
import * as ImagePicker from 'expo-image-picker';

const WEATHER_API_KEY = "ccbc4b442fde211509b946adccb26265";

export interface ParsedTripData {
  name: string;
  destination: string;
  startDate: string | null;
  endDate: string | null;
}

export interface NewGroupData {
  name: string;
  destination: string;
  startDate: Date | null;
  endDate: Date | null;
  imageUri: string | null;
  latitude: number | null,
  longitude: number | null,
}

interface LocationSuggestion {
  name: string;
  local_names?: { [key: string]: string };
  lat: number;
  lon: number;
  country: string;
  state?: string;
}

interface AddGroupModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: NewGroupData) => void;
  //Dane od AI
  initialData?: ParsedTripData | null;
}

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

const AddGroupModal = ({ visible, onClose, onSubmit, initialData }: AddGroupModalProps) => {
  const [name, setName] = useState("");
  const [destination, setDestination] = useState("");
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [isStartDatePickerVisible, setStartDatePickerVisibility] = useState(false);
  const [isEndDatePickerVisible, setEndDatePickerVisibility] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');

  //Stan od zdjęć
  const [imageUri, setImageUri] = useState<string | null>(null);

  const formatDate = (date: Date | null) => {
    return date ? date.toLocaleDateString() : "Wybierz datę";
  };

  const showStartDatePicker = () => setStartDatePickerVisibility(true);
  const hideStartDatePicker = () => setStartDatePickerVisibility(false);
  const handleConfirmStartDate = (date: Date) => {
    setStartDate(date);
    if (endDate && date > endDate) {
      setEndDate(null);
    }
    hideStartDatePicker();
  };

  const showEndDatePicker = () => setEndDatePickerVisibility(true);
  const hideEndDatePicker = () => setEndDatePickerVisibility(false);
  const handleConfirmEndDate = (date: Date) => {
    setEndDate(date);
    hideEndDatePicker();
  };

  //Handler od wybierania zdjęć
  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      setModalTitle('Brak uprawnień');
      setModalMessage('Potrzebujemy dostępu do galerii, aby dodać zdjęcie.');
      setModalVisible(true);
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleSubmit = () => {
    if (name && destination && startDate && endDate && latitude && longitude) {
      setIsLoading(true);

      onSubmit({ name, destination, startDate, endDate, imageUri, latitude, longitude });
      setName("");
      setDestination("");
      setStartDate(null);
      setEndDate(null);
      setImageUri(null);
    } else {
      setModalTitle('Błąd');
      setModalMessage('Proszę wypełnić wszystkie pola (nazwa, destynacja i daty).');
      setModalVisible(true);
    }
  };

  const handleClose = () => {
    if (isLoading) return;
    setName("");
    setDestination("");
    setStartDate(null);
    setEndDate(null);
    setImageUri(null);
    setLatitude(null);
    setLongitude(null);
    onClose();
  }

  const getLocationName = (item: LocationSuggestion) => {
    const cityName = item.local_names?.pl || item.name;
    let stateName = item.state;

    if (item.country === "PL" && item.state && POLISH_VOIVODESHIPS[item.state]) {
      stateName = POLISH_VOIVODESHIPS[item.state];
    }

    return { cityName, stateName };
  };

  const handleSuggestionPress = (item: LocationSuggestion) => {
    const { cityName, stateName } = getLocationName(item);

    const formattedName = [cityName, stateName, item.country]
      .filter(Boolean)
      .join(", ");

    setDestination(formattedName);
    setLatitude(item.lat);
    setLongitude(item.lon);
    setSuggestions([]);
  };

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
      console.error("Failed to fetch locations:", error);
      setModalTitle("Błąd API");
      setModalMessage("Nie udało się pobrać lokalizacji. Spróbuj ponownie.");
      setModalVisible(true);
    }
  };

  const handleDestinationChange = (text: string) => {
    setDestination(text);
    if (latitude !== null || longitude !== null) {
      setLatitude(null);
      setLongitude(null);
    }
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      if (destination) {
        if (latitude === null) {
          fetchLocations(destination);
        }
      } else {
        setSuggestions([]);
      }
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [destination]);

  //dla AI
  useEffect(() => {
    if (initialData && visible) {
      setName(initialData.name || "");
      setDestination(initialData.destination || "");
      setLatitude(null);
      setLongitude(null);

      if (initialData.startDate) {
        setStartDate(new Date(initialData.startDate));
      }

      if (initialData.endDate) {
        setEndDate(new Date(initialData.endDate));
      }

    }
  }, [initialData, visible]);

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={handleClose}
    >

      {isLoading ? (
        <View style={styles.centeredView}>
          <ActivityIndicator size="large" color={mainBlue} />
        </View>
      ) : (
        <KeyboardAvoidingView
          behavior={"padding"}
          keyboardVerticalOffset={-100}
          style={{ flex: 1 }}
        >
          <Pressable style={styles.modalContainerStyle} onPress={onClose}>
            <Pressable style={styles.modalViewStyle} onPress={(e) => e.stopPropagation()}>
              <Text style={styles.modalTitleStyle}>Dodaj nową grupę</Text>

              <TextInput
                style={styles.input}
                placeholder="Nazwa grupy"
                value={name}
                onChangeText={setName}
                placeholderTextColor="black"
              />

              <TextInput
                style={styles.input}
                placeholder="Destynacja (np. Warszawa)"
                value={destination}
                onChangeText={handleDestinationChange}
                placeholderTextColor="black"
              />

              {suggestions.length > 0 && (
                <FlatList
                  data={suggestions}
                  keyExtractor={(item, index) =>
                    `${item.name}|${item.lat}|${index}`
                  }
                  renderItem={({ item }) => {
                    const { cityName, stateName } = getLocationName(item);

                    return (
                      <Pressable
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
                  }}
                  style={styles.suggestionsList}
                />
              )}

              <Pressable style={styles.datePickerButton} onPress={showStartDatePicker}>
                <Text style={styles.datePickerButtonText}>
                  Data początkowa: {formatDate(startDate)}
                </Text>
              </Pressable>

              <Pressable style={styles.datePickerButton} onPress={showEndDatePicker}>
                <Text style={styles.datePickerButtonText}>
                  Data końcowa: {formatDate(endDate)}
                </Text>
              </Pressable>

              <Pressable style={styles.datePickerButton} onPress={handlePickImage}>
                <Text style={styles.datePickerButtonText}>
                  {imageUri ? "Zmień zdjęcie" : "Dodaj zdjęcie grupy"}
                </Text>
              </Pressable>

              {imageUri && (
                <Image source={{ uri: imageUri }} style={styles.imagePreview} />
              )}

              <DateTimePickerModal
                isVisible={isStartDatePickerVisible}
                mode="date"
                onConfirm={handleConfirmStartDate}
                onCancel={hideStartDatePicker}
                minimumDate={new Date()}
              />
              <DateTimePickerModal
                isVisible={isEndDatePickerVisible}
                mode="date"
                onConfirm={handleConfirmEndDate}
                onCancel={hideEndDatePicker}
                minimumDate={startDate || new Date()}
              />

              <View style={styles.buttonRow}>
                <Pressable
                  style={[styles.actionButton, styles.cancelButton]}
                  onPress={handleClose}
                >
                  <Text style={styles.cancelButtonText}>Anuluj</Text>
                </Pressable>
                <Pressable
                  style={[styles.actionButton, styles.submitButton]}
                  onPress={handleSubmit}
                >
                  <Text style={styles.submitButtonText}>Dodaj</Text>
                </Pressable>
              </View>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      )}

      <CustomModal
        visible={modalVisible}
        title={modalTitle}
        message={modalMessage}
        onClose={() => setModalVisible(false)}
      />
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainerStyle: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },

  modalViewStyle: {
    margin: 10,
    backgroundColor: "white",
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    elevation: 5,
    width: "90%",
  },

  modalTitleStyle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
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

  datePickerButton: {
    width: "100%",
    height: 50,
    borderColor: "lightgray",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 15,
    justifyContent: "center",
  },

  datePickerButtonText: {
    fontSize: 16,
    color: "#333",
  },

  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 10,
  },

  actionButton: {
    ...buttonStyle,
    width: "48%",
    paddingVertical: 12,
  },

  cancelButton: {
    backgroundColor: "#eee",
    borderWidth: 1,
    borderColor: "#ccc",
  },

  cancelButtonText: {
    ...buttonTextStyle,
    color: "#555",
    fontSize: 18,
  },

  submitButton: {
    backgroundColor: mainBlue,
  },

  submitButtonText: {
    ...buttonTextStyle,
    color: "white",
    fontSize: 18,
  },

  imagePreview: {
    width: "100%",
    height: 150,
    borderRadius: 10,
    marginBottom: 15,
    backgroundColor: "#eee",
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

  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
});
export default AddGroupModal;