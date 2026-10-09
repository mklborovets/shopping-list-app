import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TextInput, Button, StyleSheet, Alert, TouchableOpacity, KeyboardAvoidingView, Platform, Modal } from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { useAuth } from '../../../hooks/useAuth';
import { db } from '../../../services/firebase';
import { collection, query, onSnapshot, doc, orderBy } from 'firebase/firestore';
import { addItemToList, toggleItemStatus, deleteItem, shareListWithEmail, removeParticipant, getParticipants, ShoppingList, ListItem } from '../../../services/firestore';
import { calculateProgress, sortItems } from '../../../utils/listUtils';

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
  const [participants, setParticipants] = useState<{uid: string, email: string}[]>([]);

  const router = useRouter();

  useEffect(() => {
    const unsubList = onSnapshot(doc(db, 'lists', listId), 
      (docSnap) => {
        if (docSnap.exists()) {
          setList({ id: docSnap.id, ...docSnap.data() } as ShoppingList);
        } else {
          Alert.alert('Notice', 'This list was deleted.');
          router.replace('/(main)');
        }
      },
      (error) => {
        Alert.alert('Access Revoked', 'You no longer have access to this list.');
        router.replace('/(main)');
      }
    );

    const q = query(collection(db, `lists/${listId}/items`), orderBy('createdAt', 'desc'));
    const unsubItems = onSnapshot(q, 
      (snapshot) => {
        const fetchedItems = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as ListItem[];
        
        setItems(sortItems(fetchedItems));
        setLoading(false);
      },
      (error) => {
        console.log('Items listener error:', error.message);
      }
    );

    return () => { unsubList(); unsubItems(); };
  }, [listId]);

  useEffect(() => {
    if (list?.sharedWith) {
      getParticipants(list.sharedWith).then(setParticipants).catch(console.error);
    }
  }, [list?.sharedWith]);

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
  const progressText = calculateProgress(items);

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
      <View style={styles.innerContainer}>
        <Stack.Screen 
          options={{ 
            title: list.name,
            headerRight: () => isOwner ? (
              <TouchableOpacity onPress={() => setShareModalVisible(true)} style={{ marginRight: Platform.OS === 'web' ? 15 : 0 }}>
                <Text style={{ color: '#007aff', fontSize: 16, fontWeight: '500' }}>Share</Text>
              </TouchableOpacity>
            ) : undefined
          }} 
        />

        <View style={styles.progressContainer}>
          <Text style={styles.progressText}>{progressText}</Text>
        </View>

        <View style={styles.addSection}>
          <TextInput style={[styles.input, { flex: 2 }]} placeholder="Item name" placeholderTextColor="#999" value={newItemName} onChangeText={setNewItemName} />
          <TextInput style={[styles.input, { flex: 1, marginLeft: 10 }]} placeholder="Qty" placeholderTextColor="#999" value={newItemQuantity} onChangeText={setNewItemQuantity} />
          <TouchableOpacity style={[styles.addBtn, { marginLeft: 10 }]} onPress={handleAddItem}>
            <Text style={styles.addBtnText}>Add</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 20, paddingTop: 10 }}
          renderItem={({ item }) => (
            <View style={[styles.itemRow, item.isBought && styles.itemBought]}>
              <TouchableOpacity style={styles.itemTextContainer} onPress={() => toggleItemStatus(listId, item.id, item.isBought)}>
                <Text style={[styles.itemName, item.isBought && styles.textStrike]}>
                  {item.isBought ? '✅ ' : '⬜ '} {item.name}
                </Text>
                {!!item.quantity && <Text style={styles.itemQty}>{item.quantity}</Text>}
              </TouchableOpacity>
              <TouchableOpacity style={styles.deleteBtnContainer} onPress={() => deleteItem(listId, item.id)}>
                <Text style={styles.deleteBtn}>✕</Text>
              </TouchableOpacity>
            </View>
          )}
        />

        <Modal visible={shareModalVisible} animationType="fade" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Manage Access</Text>
              <Text style={styles.modalSub}>Enter the email of a registered user to share.</Text>
              <TextInput style={styles.modalInput} placeholder="User email" placeholderTextColor="#999" value={shareEmail} onChangeText={setShareEmail} keyboardType="email-address" autoCapitalize="none" />
              
              {participants.length > 0 && (
                <View style={{ marginBottom: 20, maxHeight: 150, overflow: 'hidden' }}>
                  <Text style={{ fontWeight: '600', marginBottom: 10, color: '#1c1c1e' }}>Participants:</Text>
                  <FlatList
                    data={participants}
                    keyExtractor={p => p.uid}
                    renderItem={({item: p}) => (
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, padding: 10, backgroundColor: '#f2f2f7', borderRadius: 8 }}>
                        <Text style={{ color: '#1c1c1e' }}>{p.email}</Text>
                        <TouchableOpacity onPress={() => removeParticipant(listId, p.uid)}>
                          <Text style={{ color: '#ff3b30', fontWeight: 'bold' }}>Remove</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  />
                </View>
              )}

              <View style={styles.modalButtons}>
                <TouchableOpacity style={[styles.modalBtn, styles.modalBtnCancel]} onPress={() => setShareModalVisible(false)}>
                  <Text style={styles.modalBtnCancelText}>Done</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.modalBtn, styles.modalBtnShare, sharing && { opacity: 0.6 }]} onPress={handleShare} disabled={sharing}>
                  <Text style={styles.modalBtnShareText}>{sharing ? "Sharing..." : "Share"}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f2f2f7' },
  innerContainer: { flex: 1, width: '100%', maxWidth: 700, alignSelf: 'center', backgroundColor: '#f2f2f7' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  progressContainer: { padding: 15, backgroundColor: '#e5f0ff', alignItems: 'center', borderBottomWidth: 1, borderColor: '#cce0ff' },
  progressText: { fontWeight: '700', color: '#0055cc', fontSize: 15 },
  addSection: { flexDirection: 'row', padding: 20, backgroundColor: '#fff', marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2, alignItems: 'center' },
  input: { height: 44, backgroundColor: '#f2f2f7', borderWidth: 0, borderRadius: 10, paddingHorizontal: 15, color: '#1c1c1e', fontSize: 16 },
  addBtn: { backgroundColor: '#007aff', paddingHorizontal: 20, height: 44, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  addBtnText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', marginHorizontal: 20, marginBottom: 12, borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 },
  itemBought: { backgroundColor: '#f9f9f9', opacity: 0.6 },
  itemTextContainer: { flex: 1, flexDirection: 'row', alignItems: 'center', padding: 16 },
  itemName: { fontSize: 17, color: '#1c1c1e', fontWeight: '500' },
  textStrike: { textDecorationLine: 'line-through', color: '#8e8e93' },
  itemQty: { marginLeft: 12, fontSize: 13, color: '#666', backgroundColor: '#e5e5ea', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, overflow: 'hidden' },
  deleteBtnContainer: { padding: 16 },
  deleteBtn: { fontSize: 22, color: '#ff3b30', fontWeight: 'bold' },
  modalOverlay: { flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.4)', padding: 20 },
  modalContent: { backgroundColor: '#fff', padding: 24, borderRadius: 16, width: '100%', maxWidth: 350, alignSelf: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 },
  modalTitle: { fontSize: 20, fontWeight: '700', marginBottom: 8, color: '#1c1c1e', textAlign: 'center' },
  modalSub: { marginBottom: 24, color: '#8e8e93', fontSize: 15, textAlign: 'center', lineHeight: 22 },
  modalInput: { height: 46, backgroundColor: '#f2f2f7', borderWidth: 0, marginBottom: 24, paddingHorizontal: 15, borderRadius: 10, color: '#1c1c1e', fontSize: 16 },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  modalBtn: { flex: 1, height: 44, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  modalBtnCancel: { backgroundColor: '#f2f2f7' },
  modalBtnShare: { backgroundColor: '#007aff' },
  modalBtnCancelText: { color: '#1c1c1e', fontWeight: '600', fontSize: 15 },
  modalBtnShareText: { color: '#fff', fontWeight: '600', fontSize: 15 }
});
