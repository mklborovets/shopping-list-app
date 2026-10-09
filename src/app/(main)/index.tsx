import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TextInput, Button, StyleSheet, Alert, TouchableOpacity, Platform, Modal } from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import { db } from '../../services/firebase';
import { collection, query, or, where, onSnapshot } from 'firebase/firestore';
import { createList, deleteList, ShoppingList } from '../../services/firestore';
import { useRouter } from 'expo-router';
import { logoutUser } from '../../services/auth';

export default function ListsScreen() {
  const { user } = useAuth();
  const [lists, setLists] = useState<ShoppingList[]>([]);
  const [newListName, setNewListName] = useState('');
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [listToDelete, setListToDelete] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'lists'),
      or(
        where('ownerId', '==', user.uid),
        where('sharedWith', 'array-contains', user.uid)
      )
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedLists = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ShoppingList[];
      
      fetchedLists.sort((a, b) => {
        const timeA = a.createdAt?.toMillis() || 0;
        const timeB = b.createdAt?.toMillis() || 0;
        return timeB - timeA;
      });

      setLists(fetchedLists);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleCreateList = async () => {
    if (!newListName.trim()) return;
    try {
      await createList(newListName.trim(), user!.uid);
      setNewListName('');
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  };

  const handleDelete = async (id: string, ownerId: string) => {
    if (ownerId !== user?.uid) {
      Alert.alert('Error', 'Only the owner can delete this list.');
      return;
    }
    setListToDelete(id);
    setDeleteModalVisible(true);
  };

  const confirmDelete = async () => {
    if (!listToDelete) return;
    try {
      await deleteList(listToDelete);
      setDeleteModalVisible(false);
      setListToDelete(null);
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  };

  if (loading) {
    return <View style={styles.center}><Text>Loading lists...</Text></View>;
  }

  return (
    <View style={styles.container}>
      <View style={styles.innerContainer}>
        <View style={styles.header}>
          <Text style={styles.email}>{user?.email}</Text>
          <TouchableOpacity onPress={logoutUser}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.createSection}>
          <TextInput
            style={styles.input}
            placeholder="New list name"
            placeholderTextColor="#999"
            value={newListName}
            onChangeText={setNewListName}
          />
          <TouchableOpacity style={styles.addBtn} onPress={handleCreateList}>
            <Text style={styles.addBtnText}>Add List</Text>
          </TouchableOpacity>
        </View>

        {lists.length === 0 ? (
          <View style={styles.center}><Text>No lists yet.</Text></View>
        ) : (
          <FlatList
            data={lists}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingBottom: 20 }}
            renderItem={({ item }) => (
              <View style={styles.listItem}>
                <TouchableOpacity style={{ flex: 1 }} onPress={() => router.push(`/(main)/list/${item.id}`)}>
                  <View>
                    <Text style={styles.listTitle}>{item.name}</Text>
                    <Text style={styles.listRole}>{item.ownerId === user?.uid ? 'Owner' : 'Shared'}</Text>
                  </View>
                </TouchableOpacity>
                {item.ownerId === user?.uid && (
                  <TouchableOpacity style={{ justifyContent: 'center', paddingLeft: 15 }} onPress={() => handleDelete(item.id, item.ownerId)}>
                    <Text style={styles.deleteBtn}>Delete</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          />
        )}

        <Modal visible={deleteModalVisible} animationType="fade" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Delete List</Text>
              <Text style={styles.modalSub}>Are you sure you want to delete this list?</Text>
              <View style={styles.modalButtons}>
                <TouchableOpacity style={[styles.modalBtn, styles.modalBtnCancel]} onPress={() => { setDeleteModalVisible(false); setListToDelete(null); }}>
                  <Text style={styles.modalBtnCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.modalBtn, styles.modalBtnDelete]} onPress={confirmDelete}>
                  <Text style={styles.modalBtnDeleteText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f2f2f7' },
  innerContainer: { flex: 1, width: '100%', maxWidth: 700, alignSelf: 'center', backgroundColor: '#f2f2f7' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#e5e5ea' },
  email: { fontSize: 15, color: '#1c1c1e', fontWeight: '500' },
  logoutText: { color: '#ff3b30', fontSize: 15, fontWeight: '500' },
  createSection: { flexDirection: 'row', padding: 20, backgroundColor: '#fff', marginBottom: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 },
  input: { flex: 1, height: 44, backgroundColor: '#f2f2f7', borderWidth: 0, borderRadius: 10, paddingHorizontal: 15, marginRight: 15, color: '#1c1c1e', fontSize: 16 },
  addBtn: { backgroundColor: '#007aff', paddingHorizontal: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  addBtnText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  listItem: { flexDirection: 'row', justifyContent: 'space-between', padding: 18, backgroundColor: '#fff', marginHorizontal: 20, marginBottom: 12, borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 },
  listTitle: { fontSize: 17, fontWeight: '600', color: '#1c1c1e' },
  listRole: { fontSize: 13, color: '#8e8e93', marginTop: 6 },
  deleteBtn: { color: '#ff3b30', fontWeight: '600', fontSize: 15 },
  modalOverlay: { flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.4)', padding: 20 },
  modalContent: { backgroundColor: '#fff', padding: 24, borderRadius: 16, width: '100%', maxWidth: 350, alignSelf: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 },
  modalTitle: { fontSize: 20, fontWeight: '700', marginBottom: 8, color: '#1c1c1e', textAlign: 'center' },
  modalSub: { marginBottom: 24, color: '#8e8e93', fontSize: 15, textAlign: 'center', lineHeight: 22 },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  modalBtn: { flex: 1, height: 44, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  modalBtnCancel: { backgroundColor: '#f2f2f7' },
  modalBtnDelete: { backgroundColor: '#ff3b30' },
  modalBtnCancelText: { color: '#1c1c1e', fontWeight: '600', fontSize: 15 },
  modalBtnDeleteText: { color: '#fff', fontWeight: '600', fontSize: 15 }
});
