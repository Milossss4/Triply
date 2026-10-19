import { StyleSheet, Text, View, KeyboardAvoidingView, Keyboard, FlatList, ActivityIndicator, Pressable, RefreshControl } from 'react-native';
import React, { useState, useEffect, useCallback } from 'react';
import AddItineraryItemForm from '@/components/AddItineraryItemForm';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import apiClient from '@/api/apiClient';
import { mainBlue } from '@/constants/theme';
import ChecklistManagementModal from '@/components/ChecklistManagementModal';
import { Ionicons } from '@expo/vector-icons';

type ListScreenProps = {
  groupId: string | undefined;
};

type AssignedUser = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
};

type ChecklistItem = {
  id: number;
  description: string;
  assignedUsers: AssignedUser[];
};

const ListScreen = ({ groupId }: ListScreenProps) => {
  const [isAddingItem, setIsAddingItem] = useState(false);
  const insets = useSafeAreaInsets();
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [selectedItem, setSelectedItem] = useState<ChecklistItem | null>(null);
  const [refreshing, setRefreshing] = useState(false);


  const fetchChecklist = useCallback(async (isRefresh = false) => {
    if (!groupId) return;
    
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setIsLoadingList(true);
      }

      const response = await apiClient.get<ChecklistItem[]>(`/groups/${groupId}/trip-checklist`);
      setItems(response.data);
    } catch (error) {
      console.log("Błąd podczas pobierania checklisty:", error);
      if (!isRefresh) setItems([]);
    } finally {
      setIsLoadingList(false);
      setRefreshing(false);
    }
  }, [groupId]);

  useEffect(() => {
    fetchChecklist(false);
  }, [fetchChecklist, refreshTrigger]);

  const onRefresh = useCallback(() => {
    fetchChecklist(true);
  }, [fetchChecklist]);


  const handleAddItem = async (description: string) => {
    if (!groupId) {
      console.error('Brak ID grupy, nie można dodać elementu.');
      return;
    }

    setIsAddingItem(true);

    const payload = {
      description: description.trim()
    };

    try {
      await apiClient.post(`/groups/${groupId}/trip-checklist`, payload);
      setRefreshTrigger(prev => prev + 1);

    } catch (error) {
      console.error('Błąd podczas dodawania elementu:', error);
    } finally {
      setIsAddingItem(false);
    }
  };


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


  const handleDataChanged = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  //Usuwanie elementu 
  const handleTriggerDelete = async (item: ChecklistItem) => {
    try {
      await apiClient.delete(`/checklist-items/${item.id}`);

      setRefreshTrigger(prev => prev + 1);

    } catch (error: any) {
      console.log("Błąd podczas usuwania elementu:", error);
    }
    setSelectedItem(null);
  }



  const renderItem = ({ item }: { item: ChecklistItem }) => {
    const assignedNames = item.assignedUsers.map(user =>
      `${user.firstName} ${user.lastName ? `${user.lastName[0]}.` : ''}`
    );

    const namesToShow = assignedNames.slice(0, 5).join(', ');
    const remainingCount = item.assignedUsers.length - 5;

    return (
      <Pressable
        style={styles.itemContainer}
        onPress={() => setSelectedItem(item)}
      >
        <View style={styles.itemContent}>
          <Text style={styles.itemDescription}>{item.description}</Text>

          {item.assignedUsers.length > 0 && (
            <Text style={styles.assignedNamesText} numberOfLines={2}>
              <Ionicons name="person-outline" size={14} color="#555" />
              {' '}
              {namesToShow}
              {remainingCount > 0 && `, +${remainingCount}`}
            </Text>
          )}
        </View>
      </Pressable>
    );
  };

  const renderEmptyList = () => (
    <View style={styles.centeredEmpty}>
      <Text style={styles.emptyText}>Brak elementów na liście.</Text>
      <Text style={styles.subEmptyText}>Dodaj pierwszy lub odśwież!</Text>
    </View>
  );

  const renderListContent = () => {
    if (isLoadingList && items.length === 0) {
      return (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={mainBlue} />
        </View>
      );
    }

    if (isLoadingList && !refreshing && items.length === 0) {
      return (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={mainBlue} />
        </View>
      );
    }

    return (
      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        style={styles.list}
        contentContainerStyle={[
          styles.listContentContainer,
          items.length === 0 && styles.listContentContainer 
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[mainBlue]}
            tintColor={mainBlue}
          />
        }
        ListEmptyComponent={renderEmptyList}
      />
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={(isKeyboardVisible ? 'padding' : undefined)}
      keyboardVerticalOffset={insets.bottom + 100}
    >
      {renderListContent()}

      <AddItineraryItemForm
        onAddItem={handleAddItem}
        isAdding={isAddingItem}
      />

      <ChecklistManagementModal
        visible={!!selectedItem}
        item={selectedItem}
        groupId={groupId}
        onClose={() => setSelectedItem(null)}
        onTriggerDelete={handleTriggerDelete}
        onDataChanged={handleDataChanged}
      />
    </KeyboardAvoidingView>
  );
};

export default ListScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f0f0',
  },

  list: {
    flex: 1,
  },

  listContentContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },

  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },

  centeredEmpty: {
    alignItems: 'center',
    padding: 20,
  },

  emptyText: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
  },

  subEmptyText: {
    fontSize: 12,
    color: '#aaa',
    textAlign: 'center',
  },

  itemContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 2,
  },

  itemContent: {
    flex: 1,
  },

  itemDescription: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },

  assignedNamesText: {
    fontSize: 14,
    color: '#555',
    flexWrap: 'wrap',
  },

});