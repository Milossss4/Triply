import { StyleSheet, Text, View, Pressable } from 'react-native';
import React, { useState } from 'react';
import { mainBlue } from '@/constants/theme';
import HistoryTab from './HistoryTab';
import BalanceTab from './BalanceTab';

type ExpensesScreenProps = {
  groupId: string | undefined;
  refreshTrigger: number;
  currentUserId: number;
};

type ActiveTab = 'balance' | 'history';

const ExpensesScreen = ({ groupId, refreshTrigger, currentUserId }: ExpensesScreenProps) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('balance');

  const renderContent = () => {
    if (activeTab === 'balance') {
      return (
        <BalanceTab
          groupId={groupId}
          refreshTrigger={refreshTrigger}
          currentUserId={currentUserId}
        />
      );
    }

    if (activeTab === 'history') {
      return (
        <HistoryTab
          groupId={groupId}
          refreshTrigger={refreshTrigger}
        />
      );
    }

    return null;
  };

  return (
    <View style={styles.container}>
      <View style={styles.tabContainer}>
        <Pressable
          style={[
            styles.tabButton,
            activeTab === 'balance' && styles.activeTabButton,
          ]}
          onPress={() => setActiveTab('balance')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'balance' && styles.activeTabText,
            ]}
          >
            Balans
          </Text>
        </Pressable>

        <Pressable
          style={[
            styles.tabButton,
            activeTab === 'history' && styles.activeTabButton,
          ]}
          onPress={() => setActiveTab('history')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'history' && styles.activeTabText,
            ]}
          >
            Historia
          </Text>
        </Pressable>
      </View>

      <View style={styles.contentContainer}>
        {renderContent()}
      </View>
    </View>
  );
};

export default ExpensesScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f2f5',
  },

  tabContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },

  tabButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: '#E0E0E0',
  },

  activeTabButton: {
    backgroundColor: mainBlue,
  },

  tabText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
    textAlign: 'center',
  },

  activeTabText: {
    color: '#fff',
    fontWeight: 'bold',
  },

  contentContainer: {
    flex: 1,
  },

  contentView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
});