import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TextInput, Button, StyleSheet, Alert, TouchableOpacity } from 'react-native';
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
    Alert.alert('Delete List', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteList(id) }
    ]);
  };

  if (loading) {
    return <View style={styles.center}><Text>Loading lists...</Text></View>;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.email}>{user?.email}</Text>
        <Button title="Logout" onPress={logoutUser} />
      </View>

      <View style={styles.createSection}>
        <TextInput
          style={styles.input}
          placeholder="New list name..."
          value={newListName}
          onChangeText={setNewListName}
        />
        <Button title="Add" onPress={handleCreateList} />
      </View>

      {lists.length === 0 ? (
        <View style={styles.center}><Text>No lists yet.</Text></View>
      ) : (
        <FlatList
          data={lists}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.listItem} onPress={() => router.push(`/(main)/list/${item.id}`)}>
              <View>
                <Text style={styles.listTitle}>{item.name}</Text>
                <Text style={styles.listRole}>{item.ownerId === user?.uid ? 'Owner' : 'Shared'}</Text>
              </View>
              {item.ownerId === user?.uid && (
                <TouchableOpacity onPress={() => handleDelete(item.id, item.ownerId)}>
                  <Text style={styles.deleteBtn}>Delete</Text>
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 15, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#eee' },
  email: { fontSize: 16, color: '#666' },
  createSection: { flexDirection: 'row', padding: 15, backgroundColor: '#fff', marginBottom: 10 },
  input: { flex: 1, height: 40, borderWidth: 1, borderColor: '#ccc', borderRadius: 8, paddingHorizontal: 10, marginRight: 10, color: '#000' },
  listItem: { flexDirection: 'row', justifyContent: 'space-between', padding: 15, backgroundColor: '#fff', marginHorizontal: 15, marginBottom: 10, borderRadius: 8 },
  listTitle: { fontSize: 18, fontWeight: '500' },
  listRole: { fontSize: 12, color: '#888', marginTop: 4 },
  deleteBtn: { color: 'red', fontWeight: 'bold' }
});
