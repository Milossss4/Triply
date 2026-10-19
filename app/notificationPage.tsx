import { StyleSheet, Text, View, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native'
import { mainBlue } from '@/constants/theme'
import React, { useState, useCallback } from 'react'
import { Ionicons } from '@expo/vector-icons'
import apiClient from '@/api/apiClient'
import { useFocusEffect } from 'expo-router'

interface Invitation {
  invitationId: number;
  groupId: number;
  groupName: string;
  groupOwnerName: string;
}

// TODO: Zrobić powiadamianie o otrzymaniu zaproszenia (push) 
const notificationPage = () => {
  const [invitations, setInvitations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchInvitations = async () => {
    setIsLoading(true);

    try {
      const response = await apiClient.get('/invitations/pending');
      setInvitations(response.data);
    }
    catch (error) {
      console.log(error);
    }
    finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchInvitations();
    }, [])
  );


  const handleAcceptInvitation = async (invitationId: number) => {
    try {
      await apiClient.post(`/invitations/${invitationId}/accept`);
      fetchInvitations();
    }
    catch (error) {
      console.log(error);
    }
  };

  const handleRejectInvitation = async (invitationId: number) => {
    try {
      await apiClient.post(`/invitations/${invitationId}/decline`);
      fetchInvitations();
    }
    catch (error) {
      console.log(error);
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={mainBlue} />
      </View>
    );
  }

  if (invitations.length === 0) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.notificationTitle}>Brak nowych zaproszeń</Text>
      </View>
    );
  }

  const renderInvitationItem = ({ item }: { item: Invitation }) => (
    <View style={styles.notificationContainer}>
      <View style={styles.infoContainer}>
        <View style={styles.iconContainer}>
          <Ionicons name="people" size={28} />
        </View>

        <View style={styles.textContainer}>
          <Text style={styles.notificationTitle}>Nowe zaproszenie</Text>
          <Text style={styles.notificationSubtitle}>Otrzymałeś zaproszenie do grupy: {item.groupName}</Text>
          <Text style={styles.notificationSubtitle}>Od: {item.groupOwnerName}</Text>
        </View>
      </View>

      <View style={styles.actionContainer}>
        <TouchableOpacity
          style={[styles.actionButton, styles.rejectButton]}
          onPress={() => handleRejectInvitation(item.invitationId)}
        >
          <Text style={styles.buttonText}>Odrzuć</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.acceptButton]}
          onPress={() => handleAcceptInvitation(item.invitationId)}
        >
          <Text style={styles.buttonText}>Akceptuj</Text>
        </TouchableOpacity>
      </View>
    </View>
  );


  return (
    <FlatList
      data={invitations}
      renderItem={renderInvitationItem}
      keyExtractor={(item) => item.invitationId.toString()}
      style={styles.container}
    />
  )
}

export default notificationPage

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: 'white',
  },

  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  notificationContainer: {
    width: '95%',
    borderRadius: 12,
    padding: 16,
    backgroundColor: '#eee',
    marginBottom: 10,
    alignSelf: 'center',
  },

  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },

  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },

  textContainer: {
    flex: 1,
  },

  notificationTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },

  notificationSubtitle: {
    fontSize: 14,
    color: '#666',
  },

  actionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  actionButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    marginHorizontal: 4,
  },

  rejectButton: {
    backgroundColor: '#dc3545',
  },

  acceptButton: {
    backgroundColor: mainBlue,
  },

  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },

  buttonIcon: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  }
})