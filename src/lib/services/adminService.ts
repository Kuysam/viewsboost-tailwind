import { db } from '../firebase';
import { 
  collection, 
  doc, 
  query, 
  where, 
  getDocs, 
  updateDoc, 
  orderBy, 
  limit,
  setDoc,
  serverTimestamp 
} from 'firebase/firestore';

interface AdminLoginRecord {
  timestamp: Date;
  ip: string;
  adminEmail: string;
}

interface UserData {
  uid: string;
  email: string;
  role: 'creator' | 'viewer' | 'banned';
  status: 'active' | 'suspended' | 'banned';
  createdAt: Date;
  lastLogin: Date;
}

export const adminService = {
  // Log admin login
  logAdminLogin: async (adminEmail: string) => {
    const response = await fetch('https://api.ipify.org?format=json');
    const { ip } = await response.json();
    
    await setDoc(doc(collection(db, 'adminLogins')), {
      timestamp: serverTimestamp(),
      ip,
      adminEmail
    });
  },

  // Get admin login history
  getLoginHistory: async () => {
    const logins = query(
      collection(db, 'adminLogins'),
      orderBy('timestamp', 'desc'),
      limit(50)
    );
    
    const snapshot = await getDocs(logins);
    return snapshot.docs.map(doc => doc.data() as AdminLoginRecord);
  },

  // Search users
  searchUsers: async (searchTerm: string): Promise<UserData[]> => {
    const usersRef = collection(db, 'users');
    const q = query(
      usersRef,
      where('email', '>=', searchTerm),
      where('email', '<=', searchTerm + '\uf8ff'),
      limit(10)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      uid: doc.id,
      ...doc.data()
    } as UserData));
  },

  // Update user role
  updateUserRole: async (uid: string, role: string) => {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, { role });
  },

  // Ban/Suspend user
  updateUserStatus: async (uid: string, status: 'active' | 'suspended' | 'banned') => {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, { 
      status,
      statusUpdatedAt: serverTimestamp(),
      statusUpdatedBy: 'admin'
    });
  }
}; 