import { db } from '../config/firebase';
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';

// Save Citizen Profile
// uid → pass auth.currentUser.uid when you call this
export const saveCitizenProfile = async (uid, { phone, firstName, lastName, gender }) => {
  try {
    await setDoc(doc(db, 'users', uid), {
      phone,
      name: `${firstName || ''} ${lastName || ''}`.trim(),
      gender: gender || null,
      role: 'citizen',
      createdAt: serverTimestamp(),
    });

    return uid;
  } catch (error) {
    console.error('Error creating citizen:', error);
    throw error;
  }
};

// Get User Profile
export const getUserProfile = async (uid) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
      return { uid: userDoc.id, ...userDoc.data() };
    }
    return null;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw error;
  }
};

// Update User Profile
export const updateUserProfile = async (uid, data) => {
  try {
    await updateDoc(doc(db, 'users', uid), {
      ...data,
      updatedAt: serverTimestamp(),
    });
    return true;
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};