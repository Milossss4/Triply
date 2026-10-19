import { mainBlue } from '@/constants/theme';
import { PollDetails } from '@/app/poll/[id]';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { ActivityIndicator, Keyboard, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type AddOptionFormProps = {
  poll: PollDetails | null;
  onAddOption: (description: string) => void;
  isAdding: boolean;
};


const AddOptionForm = ({ poll, onAddOption, isAdding }: AddOptionFormProps) => {
  const [newOption, setNewOption] = useState('');
  const insets = useSafeAreaInsets();

  const deadlinePassed = !poll || new Date(poll.votingDeadline) < new Date();

  if (deadlinePassed) {
    return null;
  }

  const handlePress = () => {
    if (!newOption.trim()) {
      return; 
    }

    onAddOption(newOption);
    setNewOption('');
    Keyboard.dismiss();
  };

  return (
    <View style={[styles.addOptionContainer, { paddingBottom: 16 + insets.bottom }]}>
      <Text style={styles.addOptionTitle}>Dodaj nową opcję</Text>
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Wpisz nową opcję głosowania"
          placeholderTextColor="#888"
          value={newOption}
          onChangeText={setNewOption}
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

export default AddOptionForm;

const styles = StyleSheet.create({
  addOptionContainer: {
    padding: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    elevation: 5,
  },
  addOptionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
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