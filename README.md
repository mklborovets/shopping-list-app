# Shopping List App

A collaborative shopping list application built with React Native (Expo) and Firebase (Firestore, Auth, Emulator Suite).

## Features
- User Authentication (Register/Login via Firebase Auth)
- Create and manage shopping lists
- Add items with optional quantities, mark them as bought, or delete them
- Realtime synchronization using Firestore `onSnapshot`
- Share lists with other registered users via their email address
- Security rules enforced in Firestore to prevent unauthorized access

## Prerequisites
- Node.js (v18+)
- Java (for Firebase Emulators)

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the Firebase Emulator Suite:**
   In a separate terminal window, start the local Firestore and Auth emulators:
   ```bash
   npx firebase emulators:start
   ```
   *The emulator UI will be available at http://127.0.0.1:4000*

3. **Run the Expo app:**
   ```bash
   npm start
   ```
   Press `i` for iOS simulator, `a` for Android emulator, or scan the QR code with Expo Go.

## Running Tests

Firestore security rules are tested using the `@firebase/rules-unit-testing` and `jest`.
To run the security tests:

```bash
npm run test
```

This command automatically starts the Firestore emulator, runs the Jest test suite from `tests/firestore.rules.test.ts`, and shuts down the emulator when finished.

## Security Rules Architecture
- **Users**: Users can only modify their own profile data. Any authenticated user can read profiles (needed to search by email when sharing).
- **Lists**: The list `ownerId` has full control. Users added to the `sharedWith` array can read the list and fully interact with its items.
- **Items**: Inherits permissions from the parent list. Only list owners and participants can view or modify items.
