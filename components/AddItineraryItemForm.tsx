import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, Pressable, ActivityIndicator, Keyboard } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { mainBlue } from '@/constants/theme'; 

type AddItemFormProps = {
  onAddItem: (description: string) => void; 
  isAdding: boolean;
};

const AddItineraryItemForm = ({ onAddItem, isAdding }: AddItemFormProps) => {
  const [description, setDescription] = useState('');
  const insets = useSafeAreaInsets();

  const handlePress = () => {
    if (!description.trim()) {
      return;
    }
    onAddItem(description);
    setDescription('');
    Keyboard.dismiss();
  };

  return (
    <View style={[styles.addItemContainer, { paddingBottom: 16 + insets.bottom }]}>
      <Text style={styles.addItemTitle}>Dodaj nowy punkt planu</Text>
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Dodaj nową rzecz do zabrania"
          placeholderTextColor="#888"
          value={description}
          onChangeText={setDescription}
        />
        <Pressable
          style={[styles.addButton, isAdding && styles.addButtonDisabled]}
          onPress={handlePress}
          disabled={isAdding}
        >
          {isAdding
            ? <ActivityIndicator size="small" color="#fff" />
            : <Ionicons name="add" size={24} color="white" />
          }
        </Pressable>
      </View>
    </View>
  );
};

export default AddItineraryItemForm;

const styles = StyleSheet.create({
  addItemContainer: {
    // ZMIANA: Usunięto 'padding: 16' i zastąpiono 'paddingVertical'
    paddingVertical: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    elevation: 5,
    // (Możesz tu dodać swoje style cienia, jeśli zniknęły)
  },

  addItemTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    paddingHorizontal: 16, // DODANO: Padding poziomy dla tytułu
  },

  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16, // DODANO: Padding poziomy dla wiersza inputu
  },
  
  input: {
    flex: 1,
    height: 50,
    backgroundColor: '#fff',
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
    marginRight: 10,
  },

  addButton: {
    width: 50,
    height: 50,
    backgroundColor: mainBlue,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonDisabled: {
    backgroundColor: '#aaa',
  },
});