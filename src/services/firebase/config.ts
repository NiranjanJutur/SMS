import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeFirestore, getFirestore, persistentLocalCache } from 'firebase/firestore';

// These would normally be in an .env file
const firebaseConfig = {
    apiKey: "AIzaSyBHmZ69x-izkI05HXpF8fe-IBPGyBS9aBw",
    authDomain: "smst-a0c47.firebaseapp.com",
    projectId: "smst-a0c47",
    storageBucket: "smst-a0c47.firebasestorage.app",
    messagingSenderId: "927124685756",
    appId: "1:927124685756:android:d2f63023713af9037361b9"
};

// Initialize App only if no apps are initialized
let app;
try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
} catch (e) {
    console.warn('Firebase app init failed:', e);
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
}

// Use a singleton pattern for Firestore to avoid multiple initialization errors
let firestore;
try {
    firestore = initializeFirestore(app, {
        localCache: persistentLocalCache(),
        experimentalForceLongPolling: true,
    });
} catch (e) {
    firestore = getFirestore(app);
}

export const db = firestore;

export default app;
