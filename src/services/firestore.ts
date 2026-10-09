import { db } from './firebase';
import { 
  collection, 
  addDoc, 
  deleteDoc, 
  doc, 
  updateDoc, 
  serverTimestamp,
  query,
  where,
  getDocs,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';

export interface ShoppingList {
  id: string;
  name: string;
  ownerId: string;
  sharedWith: string[];
  createdAt: any;
}

export const createList = async (name: string, ownerId: string) => {
  return await addDoc(collection(db, 'lists'), {
    name,
    ownerId,
    sharedWith: [],
    createdAt: serverTimestamp()
  });
};

export const deleteList = async (listId: string) => {
  await deleteDoc(doc(db, 'lists', listId));
};

export const renameList = async (listId: string, newName: string) => {
  await updateDoc(doc(db, 'lists', listId), {
    name: newName
  });
};

export interface ListItem {
  id: string;
  name: string;
  quantity?: string;
  isBought: boolean;
  createdAt: any;
}

export const addItemToList = async (listId: string, name: string, quantity?: string) => {
  const itemsRef = collection(db, `lists/${listId}/items`);
  return await addDoc(itemsRef, {
    name,
    quantity: quantity || '',
    isBought: false,
    createdAt: serverTimestamp()
  });
};

export const toggleItemStatus = async (listId: string, itemId: string, currentStatus: boolean) => {
  await updateDoc(doc(db, `lists/${listId}/items`, itemId), {
    isBought: !currentStatus
  });
};

export const deleteItem = async (listId: string, itemId: string) => {
  await deleteDoc(doc(db, `lists/${listId}/items`, itemId));
};

export const shareListWithEmail = async (listId: string, email: string) => {
  const usersRef = collection(db, 'users');
  const q = query(usersRef, where('email', '==', email.toLowerCase()));
  const querySnapshot = await getDocs(q);
  
  if (querySnapshot.empty) {
    throw new Error('User with this email not found.');
  }

  const uid = querySnapshot.docs[0].id;
  await updateDoc(doc(db, 'lists', listId), {
    sharedWith: arrayUnion(uid)
  });
};

export const removeParticipant = async (listId: string, uid: string) => {
  await updateDoc(doc(db, 'lists', listId), {
    sharedWith: arrayRemove(uid)
  });
};
