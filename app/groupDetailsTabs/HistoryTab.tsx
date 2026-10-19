import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, Text, View, FlatList, ActivityIndicator, Pressable, RefreshControl } from 'react-native';
import apiClient from '@/api/apiClient';
import { mainBlue } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import ConfirmDeleteModal from '@/components/DeleteModal';

type SimpleUser = {
    id: number;
    firstName: string;
    lastName: string;
};

type Expense = {
    id: number;
    description: string;
    amount: number;
    date: string;
    paidBy: SimpleUser;
    participants: SimpleUser[];
};

type HistoryTabProps = {
    groupId: string | undefined;
    refreshTrigger: number;
};


const HistoryTab = ({ groupId, refreshTrigger }: HistoryTabProps) => {
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<number | null>(null);
    const [currentUserId, setCurrentUserId] = useState<number | null>(null);
    const [refreshing, setRefreshing] = useState(false);

    const fetchData = useCallback(async (isRefresh = false) => {
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

            const [userResponse, expensesResponse] = await Promise.all([
                apiClient.get('/users/me'),
                apiClient.get(`/groups/${groupId}/expenses`)
            ]);

            setCurrentUserId(userResponse.data.id);

            const sortedData = expensesResponse.data.sort(
                (a: Expense, b: Expense) => new Date(b.date).getTime() - new Date(a.date).getTime()
            );
            setExpenses(sortedData);

        } catch (err) {
            console.log("Błąd pobierania danych:", err);
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    }, [groupId]);

    useEffect(() => {
        fetchData(false);
    }, [fetchData, refreshTrigger]);

    const onRefresh = useCallback(() => {
        fetchData(true);
    }, [fetchData]);


    const handleDelete = (expenseId: number) => {
        if (deletingId) return;
        setItemToDelete(expenseId);
        setIsDeleteModalVisible(true);
    };

    const closeDeleteModal = () => {
        setIsDeleteModalVisible(false);
        setItemToDelete(null);
    };

    const confirmDelete = async () => {
        if (!itemToDelete) return;

        setDeletingId(itemToDelete);
        closeDeleteModal();

        try {
            await apiClient.delete(`/expenses/${itemToDelete}`);

            setExpenses((currentExpenses) =>
                currentExpenses.filter((exp) => exp.id !== itemToDelete)
            );
        } catch (err) {
            console.log('Błąd podczas usuwania wydatku:', err);
        } finally {
            setDeletingId(null);
        }
    };

    
    const formatName = (user: SimpleUser) => {
        return `${user.firstName} ${user.lastName ? `${user.lastName[0]}.` : ''}`;
    };


    const renderItem = ({ item }: { item: Expense }) => {
        const otherParticipants = item.participants.filter(
            (p) => p.id !== item.paidBy.id
        );

        const sharedWithText =
            otherParticipants.length > 0
                ? otherParticipants.map((p) => formatName(p)).join(', ')
                : 'tylko siebie';

        const formattedDate = new Date(item.date).toLocaleDateString('pl-PL', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        });

        const canDelete = currentUserId === item.paidBy.id;

        return (
            <View style={styles.expenseCard}>
                <View style={styles.cardTopRow}>
                    <Text style={styles.descriptionText}>{item.description}</Text>
                    <Text style={styles.amountText}>{item.amount.toFixed(2)} zł</Text>
                </View>

                <View style={styles.cardDetails}>                    
                    <View style={styles.infoRow}>
                        <Ionicons name="wallet-outline" size={18} color="#666" />
                        <Text style={styles.infoText}>
                            {item.paidBy.firstName} {item.paidBy.lastName}
                        </Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Ionicons name="calendar-outline" size={16} color="#666" />
                        <Text style={styles.infoText}>{formattedDate}</Text>
                    </View>

                    <View style={styles.infoRow}>
                        <Ionicons name="people-outline" size={16} color="#666" />
                        <Text style={styles.infoText} numberOfLines={1} ellipsizeMode='tail'>
                            {sharedWithText}
                        </Text>
                    </View>
                </View>

                {canDelete && (
                    <View style={styles.cardBottomRow}>
                        <Pressable
                            style={styles.deleteButton}
                            onPress={() => handleDelete(item.id)}
                            disabled={deletingId === item.id}
                        >
                            {deletingId === item.id ? (
                                <ActivityIndicator size="small" color="#c70000" />
                            ) : (
                                <Ionicons name="trash-outline" size={22} color="#c70000" />
                            )}
                        </Pressable>
                    </View>
                )}
            </View>
        );
    };

    if (isLoading && !refreshing && expenses.length === 0) {
        return (
            <View style={styles.centeredView}>
                <ActivityIndicator size="large" color={mainBlue} />
            </View>
        );
    }

    return (
        <>
            <FlatList
                data={expenses}
                renderItem={renderItem}
                keyExtractor={(item) => item.id.toString()}
                style={styles.listContainer}
                contentContainerStyle={[
                    styles.listContentContainer,
                    expenses.length === 0 && styles.listContentContainerEmpty
                ]}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={[mainBlue]}
                        tintColor={mainBlue}
                    />
                }
                ListEmptyComponent={
                    <View style={styles.centeredView}>
                        <Text style={styles.infoText}>Brak wydatków w historii.</Text>
                    </View>
                }
            />

            <ConfirmDeleteModal
                visible={isDeleteModalVisible}
                title="Potwierdź usunięcie"
                message="Czy na pewno chcesz usunąć ten wydatek? Tej akcji nie można cofnąć."
                onClose={closeDeleteModal}
                onConfirm={confirmDelete}
            />
        </>
    );
};

export default HistoryTab;

const styles = StyleSheet.create({
    listContainer: {
        flex: 1,
        paddingHorizontal: 16,
        paddingTop: 16,
    },

    listContentContainer: {
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 16,
        flexGrow: 1, 
    },

    listContentContainerEmpty: {
        justifyContent: 'center',
        alignItems: 'center',
    },

    centeredView: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        minHeight: 150,
    },

    errorText: {
        color: 'red',
        fontSize: 16,
    },

    infoText: {
        fontSize: 14,
        color: '#666',
    },

    expenseCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        elevation: 3,
    },

    cardTopRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },

    descriptionText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#111',
        flex: 1,
        marginRight: 10,
    },

    amountText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: mainBlue,
    },

    cardDetails: {
        marginBottom: 12,
    },

    detailText: {
        fontSize: 14,
        color: '#555',
        lineHeight: 20,
    },

    detailValue: {
        fontWeight: '500',
        color: '#333',
    },

    cardBottomRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
        marginTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
        paddingTop: 12,
    },

    deleteButton: {
        paddingHorizontal: 8,
        paddingVertical: 4,
    },

    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5
    },
});