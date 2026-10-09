import { db } from './firebase';
import { 
  collection, 
  addDoc, 
  deleteDoc, 
  doc, 
  updateDoc, 
  serverTimestamp,
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
