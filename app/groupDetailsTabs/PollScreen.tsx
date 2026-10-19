import apiClient from '@/api/apiClient';
import { mainBlue } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View, RefreshControl } from 'react-native';
import { useFocusEffect } from 'expo-router';


type User = {
  id: number;
  firstName: string;
  lastName: string;
};

type PollOption = {
  id: number;
  description: string;
  voteCount: number;
  hasVoted: boolean;
};

type Poll = {
  id: number;
  title: string;
  votingDeadline: string;
  createdBy: User;
  options: PollOption[];
};

type PollScreenProps = {
  groupId: string | undefined;
  refreshTrigger: number;
};

const PollScreen = ({ groupId, refreshTrigger }: PollScreenProps) => {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPolls = useCallback(async (isRefresh = false) => {
    if (!groupId) {
      setIsLoading(false);
      return;
    }

    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setIsLoading(true);
      }

      const response = await apiClient.get(`/groups/${groupId}/polls`);
      setPolls(response.data);
    } catch (err) {
      console.log("Błąd podczas pobierania ankiet:", err);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [groupId]);

  useFocusEffect(
    useCallback(() => {
      fetchPolls(false);
    }, [fetchPolls, refreshTrigger])
  );

  const onRefresh = useCallback(() => {
    fetchPolls(true);
  }, [fetchPolls]);

  const isPollActive = (deadline: string) => {
    if (!deadline) return false;
    return new Date(deadline) > new Date();
  };

  const renderPollItem = ({ item }: { item: Poll }) => {
    const isActive = isPollActive(item.votingDeadline);
    const statusText = isActive ? "Aktywne" : "Zakończone";
    const statusBadgeStyle = isActive ? styles.statusBadgeActive : styles.statusBadgeFinished;
    const statusTextStyle = isActive ? styles.statusTextActive : styles.statusTextFinished;

    const handlePressDetails = () => {
      router.push({
        pathname: `../poll/${item.id}`,
        params: { 
          id: item.id, 
          groupId: groupId
          }
      });
    };

    return (
      <View style={styles.card}>
        <View style={styles.pollInfo}>
          <Text style={styles.title}>{item.title}</Text>
          <View style={[styles.statusBadge, statusBadgeStyle]}>
            <Text style={statusTextStyle}>{statusText}</Text>
          </View>
        </View>

        <Pressable style={styles.detailsButton} onPress={handlePressDetails}>
          <Text style={styles.buttonText}>Głosuj</Text>
          <Ionicons name="chevron-forward" size={16} color="#fff" />
        </Pressable>
      </View>
    );
  };

  const renderEmptyList = () => (
    <View style={styles.centeredEmpty}>
      <Text style={styles.infoText}>Brak ankiet w tej grupie.</Text>
      <Text style={styles.subInfoText}>Pociągnij w dół, aby odświeżyć.</Text>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={mainBlue} />
        <Text style={styles.loadingText}>Ładowanie ankiet...</Text>
      </View>
    );
  }

  if (isLoading && !refreshing && polls.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={mainBlue} />
        <Text style={styles.loadingText}>Ładowanie ankiet...</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={polls}
      renderItem={renderPollItem}
      keyExtractor={(item) => item.id.toString()}
      contentContainerStyle={[
        styles.listContainer,
        polls.length === 0 && styles.listContainerEmpty 
      ]}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[mainBlue]} 
        />
      }
      ListEmptyComponent={renderEmptyList}
    />
  );
};

export default PollScreen;

const styles = StyleSheet.create({
  listContainer: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    flexGrow: 1,
  },

  listContainerEmpty: {
    justifyContent: 'center',
    alignItems: 'center',
  },

  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    marginHorizontal: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 3
  },

  pollInfo: {
    flex: 1,
    marginRight: 10,
  },

  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },

  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },

  statusBadgeActive: {
    backgroundColor: 'rgba(56, 161, 105, 0.1)',
  },

  statusBadgeFinished: {
    backgroundColor: '#f1f1f1',
  },

  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },

  statusTextActive: {
    color: '#228B22',
  },

  statusTextFinished: {
    color: '#666',
  },

  detailsButton: {
    backgroundColor: mainBlue,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },

  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
    marginRight: 4,
  },

  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },

  centeredEmpty: {
    alignItems: 'center',
    padding: 20,
  },

  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#555',
  },

  infoText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },

  subInfoText: {
    fontSize: 12,
    color: '#999',
  }
});