import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAgoieqn_z50wrFuS3jqMbdYcojAaSXe5w",
  authDomain: "relationship-l10.firebaseapp.com",
  projectId: "relationship-l10",
  storageBucket: "relationship-l10.firebasestorage.app",
  messagingSenderId: "125005734084",
  appId: "1:125005734084:web:9f9a05562cc87a19daa991"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

export default app;
