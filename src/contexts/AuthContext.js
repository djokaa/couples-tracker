import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, googleProvider, db } from '../firebase/config';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const signInWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      await ensureUserAndCouple(result.user);
      return result.user;
    } catch (error) {
      console.error('Error signing in with Google:', error);
      throw error;
    }
  };

  const signInWithEmail = async (email, password) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      await ensureUserAndCouple(result.user);
      return result.user;
    } catch (error) {
      console.error('Error signing in with email:', error);
      throw error;
    }
  };

  const signUpWithEmail = async (email, password) => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      await ensureUserAndCouple(result.user);
      return result.user;
    } catch (error) {
      console.error('Error signing up with email:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    user,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    logout,
    loading
  };

  // Ensure user profile and couple profile (with dummy partner) exist
  const ensureUserAndCouple = async (firebaseUser) => {
    if (!firebaseUser?.uid) return;
    const userRef = doc(db, 'userProfiles', firebaseUser.uid);
    const snap = await getDoc(userRef);
    let coupleId = null;
    let isNewUser = false;
    
    if (!snap.exists()) {
      isNewUser = true;
      const profile = {
        firstName: firebaseUser.displayName?.split(' ')[0] || 'You',
        lastName: firebaseUser.displayName?.split(' ').slice(1).join(' ') || '',
        email: firebaseUser.email || '',
        profileImageUrl: firebaseUser.photoURL || '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      await setDoc(userRef, profile, { merge: true });
    } else {
      coupleId = snap.data().coupleId || null;
    }

    if (!coupleId) {
      coupleId = `couple_${firebaseUser.uid}`;
      const coupleRef = doc(db, 'couples', coupleId);
      await setDoc(coupleRef, {
        coupleName: `${firebaseUser.displayName?.split(' ')[0] || 'Couple'} & Partner`,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        invitationStatus: 'pending',
        ownerId: firebaseUser.uid,
        partners: [
          { uid: firebaseUser.uid, name: firebaseUser.displayName || 'You', email: firebaseUser.email, status: 'active' },
          { uid: null, name: 'Partner', email: null, status: 'pending', isDummy: true }
        ]
      }, { merge: true });

      // Link user to couple
      await setDoc(userRef, { coupleId }, { merge: true });
    }

    // Note: The new account notification will be automatically triggered by the Firestore trigger
    // when the userProfiles document is created, so we don't need to call it manually here
    // This prevents duplicate emails and ensures the notification is sent even if the client disconnects
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
