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

export const updateUserProfile = async (userId, updateData) => {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }

    const updates = {};

    // Validate and add name
    if (updateData.name !== undefined) {
      const trimmedName = updateData.name.trim();
      if (!trimmedName) {
        throw new Error('Name cannot be empty');
      }
      updates.name = trimmedName;
    }

    // Validate and add phone
    if (updateData.phone !== undefined) {
      const trimmedPhone = updateData.phone.trim();
      if (!trimmedPhone) {
        throw new Error('Phone number cannot be empty');
      }
      updates.phone = trimmedPhone;
    }

    // Add timestamp
    updates.updatedAt = serverTimestamp();

    // Update user document
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, updates);

    return {
      success: true,
      message: 'Profile updated successfully'
    };

  } catch (error) {
    console.error('Error updating profile:', error);
    throw new Error(error.message || 'Failed to update profile');
  }
};
// // Update User Profile
// export const updateUserProfile = async (uid, data) => {
//   try {
//     await updateDoc(doc(db, 'users', uid), {
//       ...data,
//       updatedAt: serverTimestamp(),
//     });
//     return true;
//   } catch (error) {
//     console.error('Error updating user profile:', error);
//     throw error;
//   }
// };