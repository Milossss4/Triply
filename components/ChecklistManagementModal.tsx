import React, { useState, useEffect, useMemo } from 'react';
import { Modal, View, StyleSheet, Pressable, Text, FlatList, ActivityIndicator, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import apiClient from '@/api/apiClient';
import { mainBlue } from '@/constants/theme';

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

type GroupMember = AssignedUser;

interface ModalProps {
    visible: boolean;
    item: ChecklistItem | null;
    groupId: string | undefined;
    onClose: () => void;
    onTriggerDelete: (item: ChecklistItem) => void;
    onDataChanged: () => void;
}

const ChecklistManagementModal = ({
    visible,
    item,
    groupId,
    onClose,
    onTriggerDelete,
    onDataChanged
}: ModalProps) => {

    const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
    const [isLoadingMembers, setIsLoadingMembers] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);

    const [isEditing, setIsEditing] = useState(false);
    const [editedDescription, setEditedDescription] = useState('');
    const [isSavingEdit, setIsSavingEdit] = useState(false);
    const [localAssignedUsers, setLocalAssignedUsers] = useState<AssignedUser[]>([]);

    const assignedMemberIds = useMemo(() => {
        return new Set(localAssignedUsers.map(user => user.id));
    }, [localAssignedUsers]);

    //Pobieranie członków grupy
    useEffect(() => {
        if (visible && groupId) {
            const fetchGroupMembers = async () => {
                setIsLoadingMembers(true);
                try {
                    const response = await apiClient.get<GroupMember[]>(`/groups/${groupId}/participants`);
                    setGroupMembers(response.data);
                } catch (error) {
                    console.log("Błąd pobierania członków grupy:", error);
                } finally {
                    setIsLoadingMembers(false);
                }
            };
            fetchGroupMembers();
        }
    }, [visible, groupId]);

    //Ustawianie teksty tytułu do edycji
    useEffect(() => {
        if (item) {
            setIsEditing(false);
            setEditedDescription(item.description);
            setLocalAssignedUsers(item.assignedUsers);
        }
    }, [item]);

    //Handlery do obsługi edycji
    const handleCancelEdit = () => {
        setIsEditing(false);
        if (item) {
            setEditedDescription(item.description);
        }
    };

    const handleSaveEdit = async () => {
        if (!item || isSavingEdit || !editedDescription.trim()) {
            return;
        }

        setIsSavingEdit(true);
        try {
            await apiClient.put(`/checklist-items/${item.id}`, {
                description: editedDescription.trim(),
            });

            onDataChanged();
            setIsEditing(false);
            onClose();

        } catch (error) {
            console.log("Błąd podczas zapisywania edycji:", error);
        } finally {
            setIsSavingEdit(false);
        }
    };

    //Aktywowania/deaktywacja przypisania
    const handleToggleAssignment = async (member: GroupMember) => {
        if (!item || isUpdating) return;

        setIsUpdating(true);
        const isCurrentlyAssigned = assignedMemberIds.has(member.id);

        const method = isCurrentlyAssigned ? 'delete' : 'post';
        const url = `/checklist-items/${item.id}/assign/${member.id}`;

        try {
            await apiClient({
                method: method,
                url: url,
            });

            if (isCurrentlyAssigned) {
                setLocalAssignedUsers(prev => prev.filter(u => u.id !== member.id));
            } else {
                setLocalAssignedUsers(prev => [...prev, member]);
            }

            onDataChanged();

        } catch (error: any) {
            console.log(`Błąd ${isCurrentlyAssigned ? 'odpinania' : 'przypinania'} użytkownika:`, error);
        } finally {
            setIsUpdating(false);
        }
    };

    if (!item) return null;

    return (
        <Modal
            animationType="fade"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <Pressable style={styles.modalContainerStyle} onPress={onClose}>
                <Pressable style={styles.modalViewStyle} onPress={() => { }}>

                    <View style={styles.headerContainer}>
                        {isEditing ? (
                            <TextInput
                                style={[styles.modalTitleStyle, styles.modalTitleInput]}
                                value={editedDescription}
                                onChangeText={setEditedDescription}
                                autoFocus={true}
                            />
                        ) : (
                            <Text style={styles.modalTitleStyle} numberOfLines={2}>
                                {item.description}
                            </Text>
                        )}
                        <View style={styles.iconContainer}>
                            {isEditing ? (
                                <>
                                    {isSavingEdit ? (
                                        <ActivityIndicator size="small" color={mainBlue} style={styles.iconButton} />
                                    ) : (
                                        <Pressable onPress={handleSaveEdit} style={styles.iconButton}>
                                            <Ionicons name="checkmark-outline" size={30} color="green" />
                                        </Pressable>
                                    )}
                                    <Pressable onPress={handleCancelEdit} style={styles.iconButton}>
                                        <Ionicons name="close-outline" size={30} color="#E53935" />
                                    </Pressable>
                                </>
                            ) : (
                                <>
                                    <Pressable onPress={() => setIsEditing(true)} style={styles.iconButton}>
                                        <Ionicons name="pencil-outline" size={26} color="#555" />
                                    </Pressable>
                                    <Pressable onPress={() => onTriggerDelete(item)} style={styles.iconButton}>
                                        <Ionicons name="trash-outline" size={26} color="#E53935" />
                                    </Pressable>
                                </>
                            )}
                        </View>
                    </View>

                    <View style={styles.separator} />

                    {isLoadingMembers ? (
                        <ActivityIndicator size="large" color={mainBlue} style={{ marginVertical: 20 }} />
                    ) : (
                        <FlatList
                            data={groupMembers}
                            keyExtractor={(member) => member.id.toString()}
                            renderItem={({ item: member }) => {
                                const isAssigned = assignedMemberIds.has(member.id);
                                return (
                                    <Pressable
                                        style={styles.memberRow}
                                        onPress={() => handleToggleAssignment(member)}
                                        disabled={isUpdating}
                                    >
                                        <View style={[styles.checkbox, isAssigned && styles.checkboxChecked]}>
                                            {isAssigned && <Ionicons name="checkmark" size={16} color="white" />}
                                        </View>
                                        <Text style={styles.memberName}>
                                            {member.firstName} {member.lastName}
                                        </Text>
                                    </Pressable>
                                );
                            }}
                            style={styles.list}
                        />
                    )}

                    <View style={styles.separator} />

                    <Pressable style={styles.closeButton} onPress={onClose}>
                        <Text style={styles.closeButtonText}>Zamknij</Text>
                    </Pressable>

                </Pressable>
            </Pressable>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalContainerStyle: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalViewStyle: {
        margin: 20,
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 20,
        width: '90%',
        maxHeight: '80%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    headerContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        width: '100%',
        marginBottom: 15,
    },
    modalTitleStyle: {
        fontSize: 22,
        fontWeight: 'bold',
        flex: 1,
        marginRight: 15,
        paddingVertical: 5,
    },
    modalTitleInput: {
        borderBottomWidth: 1,
        borderBottomColor: '#ccc',
        paddingBottom: 4,
    },
    iconContainer: {
        flexDirection: 'row',
        gap: 15,
    },
    iconButton: {
        padding: 5,
        justifyContent: 'center',
        alignItems: 'center',
    },
    separator: {
        height: 1,
        backgroundColor: '#e0e0e0',
        width: '100%',
        marginVertical: 10,
    },
    list: {
        width: '100%',
        maxHeight: 300,
    },
    memberRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 5,
        borderWidth: 2,
        borderColor: '#ccc',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    checkboxChecked: {
        backgroundColor: mainBlue,
        borderColor: mainBlue,
    },
    memberName: {
        fontSize: 16,
        color: '#333',
    },
    closeButton: {
        backgroundColor: '#f0f0f0',
        borderRadius: 8,
        paddingVertical: 12,
        paddingHorizontal: 20,
        alignSelf: 'center',
        marginTop: 10,
        width: '90%',
    },
    closeButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#555',
        textAlign: 'center',
    },
});

export default ChecklistManagementModal;