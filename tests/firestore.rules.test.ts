// @ts-nocheck
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { setDoc, doc, getDoc, collection, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import * as fs from 'fs';

let testEnv: RulesTestEnvironment;

beforeAll(async () => {
  const rules = fs.readFileSync('firestore.rules', 'utf8');
  testEnv = await initializeTestEnvironment({
    projectId: 'demo-project',
    firestore: { rules, host: 'localhost', port: 8080 },
  });
});

afterAll(async () => {
  await testEnv.cleanup();
});

beforeEach(async () => {
  await testEnv.clearFirestore();
});

describe('Firestore Security Rules', () => {
  const ownerId = 'user_owner';
  const participantId = 'user_participant';
  const strangerId = 'user_stranger';
  const listId = 'list_123';

  async function setupSharedList() {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await setDoc(doc(db, 'lists', listId), {
        name: 'Shared List',
        ownerId: ownerId,
        sharedWith: [participantId],
      });
    });
  }

  it('1. Owner can read and write their own list', async () => {
    const ownerDb = testEnv.authenticatedContext(ownerId).firestore();
    await assertSucceeds(setDoc(doc(ownerDb, 'lists', 'new_list'), { name: 'My List', ownerId: ownerId, sharedWith: [] }));
    await setupSharedList();
    await assertSucceeds(getDoc(doc(ownerDb, 'lists', listId)));
  });

  it('2. Participant can read the list but not update it', async () => {
    await setupSharedList();
    const participantDb = testEnv.authenticatedContext(participantId).firestore();
    await assertSucceeds(getDoc(doc(participantDb, 'lists', listId)));
    await assertFails(updateDoc(doc(participantDb, 'lists', listId), { name: 'Hacked Name' }));
  });

  it('3. Participant can read and write items in the shared list', async () => {
    await setupSharedList();
    const participantDb = testEnv.authenticatedContext(participantId).firestore();
    const itemsRef = collection(participantDb, `lists/${listId}/items`);
    await assertSucceeds(addDoc(itemsRef, { name: 'Milk', isBought: false }));
  });

  it('4. Stranger cannot read or write the list or items', async () => {
    await setupSharedList();
    const strangerDb = testEnv.authenticatedContext(strangerId).firestore();
    await assertFails(getDoc(doc(strangerDb, 'lists', listId)));
    await assertFails(getDoc(doc(strangerDb, `lists/${listId}/items/item1`)));
    await assertFails(addDoc(collection(strangerDb, `lists/${listId}/items`), { name: 'Bread', isBought: false }));
  });

  it('5. Anonymous user cannot read or write anything', async () => {
    await setupSharedList();
    const unauthDb = testEnv.unauthenticatedContext().firestore();
    await assertFails(getDoc(doc(unauthDb, 'lists', listId)));
  });

  it('6. Owner can delete their list, participant cannot', async () => {
    await setupSharedList();
    const ownerDb = testEnv.authenticatedContext(ownerId).firestore();
    const participantDb = testEnv.authenticatedContext(participantId).firestore();
    await assertFails(deleteDoc(doc(participantDb, 'lists', listId)));
    await assertSucceeds(deleteDoc(doc(ownerDb, 'lists', listId)));
  });
});
