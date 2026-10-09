import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

const firebaseConfig = {
  apiKey: "demo-api-key",
  authDomain: "demo-project.firebaseapp.com",
  projectId: "demo-project",
  storageBucket: "demo-project.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef0123456789"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

if (process.env.EXPO_PUBLIC_USE_FIREBASE_EMULATOR === 'true') {
  let host = process.env.EXPO_PUBLIC_FIREBASE_EMULATOR_HOST || 'localhost';
  
  if (!process.env.EXPO_PUBLIC_FIREBASE_EMULATOR_HOST) {
    if (Platform.OS === 'android') {
      host = '10.0.2.2';
    }
    
    const debuggerHost = Constants.expoConfig?.hostUri;
    if (debuggerHost) {
      host = debuggerHost.split(':')[0];
    }
  }

  connectAuthEmulator(auth, `http://${host}:9099`, { disableWarnings: true });
  connectFirestoreEmulator(db, host, 8080);
  console.log(`Connected to Firebase emulators at ${host}`);
}

export { auth, db };
