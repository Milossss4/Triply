import { StyleSheet, Text, View, ActivityIndicator, FlatList, Pressable, RefreshControl } from 'react-native';
import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '@/api/apiClient';
import { mainBlue } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';

interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
}

interface Balance {
  debtor: User;
  creditor: User;
  amount: number;
}

type BalanceResponse = Balance[];

type BalanceTabProps = {
  groupId: string | undefined;
  refreshTrigger: number;
  currentUserId: number;
};

const BalanceTab = ({ groupId, refreshTrigger, currentUserId }: BalanceTabProps) => {
  const [balances, setBalances] = useState<Balance[]>([]);
  const [loading, setLoading] = useState(true);
  const [settlingId, setSettlingId] = useState<number | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchBalances = useCallback(async (isRefresh = false) => {
    if (!groupId) {
      setLoading(false);
      return;
    }

    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await apiClient.get<BalanceResponse>(`/groups/${groupId}/balances`);
      setBalances(response.data);
    } catch (err: any) {
      console.error('Błąd podczas pobierania salda:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [groupId]);

  useEffect(() => {
    fetchBalances(false);
  }, [fetchBalances, refreshTrigger, currentUserId]);

  const onRefresh = useCallback(() => {
    fetchBalances(true);
  }, [fetchBalances]);

  const handleSettle = async (debtorId: number, creditorId: number) => {
    if (!groupId || settlingId) return;

    setSettlingId(debtorId);

    try {
      await apiClient.post(
        `/expenses/${groupId}/balances/settle`,
        null,
        {
          params: {
            debtorId,
            creditorId,
          },
        }
      );

      setBalances((prevBalances) =>
        prevBalances.filter(
          (b) => !(b.debtor.id === debtorId && b.creditor.id === creditorId)
        )
      );
    } catch (err: any) {
      console.log('Błąd podczas regulowania długu:', err);
    } finally {
      setSettlingId(null);
    }
  };

  const renderEmptyList = () => (
    <View style={styles.centeredView}>
      <Text style={styles.infoText}>Jesteście kwita!</Text>
      <Text style={styles.infoSubText}>
        Nikt nie wisi Ci pieniędzy w tej grupie.
      </Text>
    </View>
  );

  if (loading && !refreshing && balances.length === 0) {
    return (
      <View style={styles.centeredView}>
        <ActivityIndicator size="large" color={mainBlue} />
      </View>
    );
  }

  return (
    <FlatList
      data={balances}
      keyExtractor={(item) => `${item.debtor.id}-${item.creditor.id}`}
      style={styles.container}
      contentContainerStyle={[
        styles.listContent,
        balances.length === 0 && styles.listContentEmpty
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
      renderItem={({ item }) => {
        const isCreditor = item.creditor.id === currentUserId;
        const isDebtor = item.debtor.id === currentUserId;

        //Zalogowany użytkownik jest wierzycielem
        if (isCreditor) {
          return (
            <View style={styles.itemContainer}>
              <View style={[styles.itemTopRow, { marginBottom: 16 }]}>
                <View>
                  <Text style={styles.debtorName}>
                    {item.debtor.firstName} {item.debtor.lastName}
                  </Text>
                </View>
                <Text style={styles.amountText}>
                  {item.amount.toFixed(2)} zł
                </Text>
              </View>

              <View style={styles.itemButtonRow}>
                <Pressable
                  style={[
                    styles.settleButton,
                    settlingId === item.debtor.id &&
                    styles.settleButtonDisabled,
                  ]}
                  onPress={() => handleSettle(item.debtor.id, item.creditor.id)}
                  disabled={settlingId === item.debtor.id}
                >
                  {settlingId === item.debtor.id ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Ionicons name="checkmark-done" size={20} color="#fff" />
                  )}
                </Pressable>
              </View>
            </View>
          );
        }

        //Zalogowany użytkownik jest dłużnikiem
        if (isDebtor) {
          return (
            <View style={styles.itemContainer}>
              <View style={styles.itemTopRow}>
                <View>
                  <Text style={styles.debtorName}>
                    {item.creditor.firstName} {item.creditor.lastName}
                  </Text>
                </View>
                <Text style={[styles.amountText, styles.debtAmountText]}>
                  -{item.amount.toFixed(2)} zł
                </Text>
              </View>
            </View>
          );
        }

        return null;
      }}
    />
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

 listContent: {
    padding: 16,
    flexGrow: 1, 
  },

  listContentEmpty: {
    justifyContent: 'center',
    alignItems: 'center',
  },

  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f0f2f5',
  },

  infoText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },

  infoSubText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },

  itemContainer: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 3,
  },

  itemTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  debtorName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#111',
  },

  debtorEmail: {
    fontSize: 14,
    color: '#777',
    marginTop: 2,
  },

  amountText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
  },

  debtAmountText: {
    color: '#D32F2F',
  },

  itemButtonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
  },

  settleButton: {
    backgroundColor: mainBlue,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 90,
    minHeight: 36,
  },

  settleButtonDisabled: {
    backgroundColor: '#a0a0a0',
  },

});

export default BalanceTab;