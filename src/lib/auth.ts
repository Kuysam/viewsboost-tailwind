import { auth, db } from './firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

const ADMIN_EMAIL = 'cham212003@gmail.com';

export const loginWithEmailPassword = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error: any) {
    console.error('Login error:', error);
    throw new Error(error.message);
  }
};

export const loginWithGoogle = async () => {
  try {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (error: any) {
    console.error('Google login error:', error);
    throw new Error(error.message);
  }
};

export const createAccount = async (email: string, password: string) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error: any) {
    console.error('Signup error:', error);
    throw new Error(error.message);
  }
};

export const logoutUser = async () => {
  try {
    await signOut(auth);
  } catch (error: any) {
    console.error('Logout error:', error);
    throw new Error(error.message);
  }
};

export const isAdminEmail = (email: string) => email === ADMIN_EMAIL;

export const setupUserInFirestore = async (userId: string, email: string, role: 'admin' | 'creator' | 'viewer') => {
  try {
    await setDoc(doc(db, role + 's', userId), {
      email,
      role,
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString()
    }, { merge: true });
  } catch (error) {
    console.error('Firestore setup error:', error);
    throw error;
  }
};

export const isAdmin = (email: string | null) => {
  return email === 'cham212003@gmail.com';
}; 