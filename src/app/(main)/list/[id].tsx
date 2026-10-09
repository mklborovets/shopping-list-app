import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TextInput, Button, StyleSheet, Alert, TouchableOpacity, KeyboardAvoidingView, Platform, Modal } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { useAuth } from '../../../hooks/useAuth';
import { db } from '../../../services/firebase';
import { collection, query, onSnapshot, doc, orderBy } from 'firebase/firestore';
import { addItemToList, toggleItemStatus, deleteItem, shareListWithEmail, ShoppingList, ListItem } from '../../../services/firestore';

export default function ListDetailScreen() {
  const { id } = useLocalSearchParams();
  const listId = id as string;
  const { user } = useAuth();
  
  const [list, setList] = useState<ShoppingList | null>(null);
  const [items, setItems] = useState<ListItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [newItemName, setNewItemName] = useState('');
  const [newItemQuantity, setNewItemQuantity] = useState('');
  
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [shareEmail, setShareEmail] = useState('');
  const [sharing, setSharing] = useState(false);

  useEffect(() => {
    const unsubList = onSnapshot(doc(db, 'lists', listId), (docSnap) => {
      if (docSnap.exists()) {
        setList({ id: docSnap.id, ...docSnap.data() } as ShoppingList);
      } else {
        Alert.alert('Error', 'List deleted or unavailable');
      }
    });

    const q = query(collection(db, `lists/${listId}/items`), orderBy('createdAt', 'desc'));
    const unsubItems = onSnapshot(q, (snapshot) => {
      const fetchedItems = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ListItem[];
      
      fetchedItems.sort((a, b) => {
        if (a.isBought === b.isBought) return 0;
        return a.isBought ? 1 : -1;
      });
      
      setItems(fetchedItems);
      setLoading(false);
    });

    return () => { unsubList(); unsubItems(); };
  }, [listId]);

  const handleAddItem = async () => {
    if (!newItemName.trim()) return;
    try {
      await addItemToList(listId, newItemName.trim(), newItemQuantity.trim());
      setNewItemName('');
      setNewItemQuantity('');
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  };

  const handleShare = async () => {
    if (!shareEmail.trim()) return;
    setSharing(true);
    try {
      await shareListWithEmail(listId, shareEmail.trim());
      Alert.alert('Success', 'List shared successfully!');
      setShareEmail('');
      setShareModalVisible(false);
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setSharing(false);
    }
  };

  if (loading || !list) {
    return <View style={styles.center}><Text>Loading list...</Text></View>;
  }

  const isOwner = list.ownerId === user?.uid;
  const boughtCount = items.filter(i => i.isBought).length;
  const totalCount = items.length;
  const progressText = totalCount > 0 ? `${boughtCount}/${totalCount} bought` : 'Empty list';

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: list.name,
          headerRight: () => isOwner ? (
            <Button title="Share" onPress={() => setShareModalVisible(true)} />
          ) : undefined
        }} 
      />

      <View style={styles.progressContainer}>
        <Text style={styles.progressText}>{progressText}</Text>
      </View>

      <View style={styles.addSection}>
        <TextInput style={[styles.input, { flex: 2 }]} placeholder="Item name..." value={newItemName} onChangeText={setNewItemName} />
        <TextInput style={[styles.input, { flex: 1, marginLeft: 10 }]} placeholder="Qty (opt)" value={newItemQuantity} onChangeText={setNewItemQuantity} />
        <View style={{ marginLeft: 10 }}><Button title="Add" onPress={handleAddItem} /></View>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={[styles.itemRow, item.isBought && styles.itemBought]}>
            <TouchableOpacity style={styles.itemTextContainer} onPress={() => toggleItemStatus(listId, item.id, item.isBought)}>
              <Text style={[styles.itemName, item.isBought && styles.textStrike]}>{item.isBought ? '✅ ' : '⬜ '}{item.name}</Text>
              {!!item.quantity && <Text style={styles.itemQty}>Qty: {item.quantity}</Text>}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => deleteItem(listId, item.id)}>
              <Text style={styles.deleteBtn}>✕</Text>
            </TouchableOpacity>
          </View>
        )}
      />

      <Modal visible={shareModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Share List</Text>
            <Text style={styles.modalSub}>Enter the email of a registered user.</Text>
            <TextInput style={styles.modalInput} placeholder="User Email" value={shareEmail} onChangeText={setShareEmail} keyboardType="email-address" autoCapitalize="none" />
            <View style={styles.modalButtons}>
              <Button title="Cancel" color="red" onPress={() => setShareModalVisible(false)} />
              <Button title={sharing ? "Sharing..." : "Share"} onPress={handleShare} disabled={sharing} />
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9f9f9' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  progressContainer: { padding: 10, backgroundColor: '#e6f2ff', alignItems: 'center' },
  progressText: { fontWeight: 'bold', color: '#0055cc' },
  addSection: { flexDirection: 'row', padding: 15, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#eee', alignItems: 'center' },
  input: { height: 40, borderWidth: 1, borderColor: '#ccc', borderRadius: 8, paddingHorizontal: 10 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#eee' },
  itemBought: { backgroundColor: '#f0f0f0' },
  itemTextContainer: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  itemName: { fontSize: 16 },
  textStrike: { textDecorationLine: 'line-through', color: '#888' },
  itemQty: { marginLeft: 10, fontSize: 14, color: '#666', backgroundColor: '#e0e0e0', paddingHorizontal: 6, borderRadius: 4 },
  deleteBtn: { fontSize: 18, color: 'red', padding: 5 },
  modalOverlay: { flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { backgroundColor: '#fff', margin: 20, padding: 20, borderRadius: 10 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 10 },
  modalSub: { marginBottom: 15, color: '#666' },
  modalInput: { height: 40, borderWidth: 1, borderColor: '#ccc', marginBottom: 20, paddingHorizontal: 10, borderRadius: 5 },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-around' }
});
