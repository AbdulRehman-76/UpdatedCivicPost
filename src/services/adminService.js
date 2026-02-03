import { db, auth } from '../config/firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp,
  addDoc,
  arrayUnion,
} from 'firebase/firestore';
import { createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';


// ─────────────────────────────────────────────
// 1. ADMIN ROLE VERIFICATION
// ─────────────────────────────────────────────
export const verifyAdminRole = async (uid) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
      return userDoc.data().role === 'admin';
    }
    return false;
  } catch (error) {
    console.error('Error verifying admin role:', error);
    return false;
  }
};


// ─────────────────────────────────────────────
// 2. USER FETCHING
// ─────────────────────────────────────────────

export const getUserById = async (uid) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
      return { id: userDoc.id, ...userDoc.data() };
    }
    return null;
  } catch (error) {
    console.error('Error fetching user:', error);
    return null;
  }
};


// ─────────────────────────────────────────────
// 3. REPORT FETCHING
// ─────────────────────────────────────────────

export const getReportById = async (reportId) => {
  try {
    const reportSnap = await getDoc(doc(db, 'reports', reportId));
    if (reportSnap.exists()) {
      return { id: reportSnap.id, ...reportSnap.data() };
    }
    return null;
  } catch (error) {
    console.error('Error fetching report:', error);
    throw error;
  }
};

export const getAllReports = async () => {
  try {
    const snapshot = await getDocs(collection(db, 'reports'));
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (error) {
    console.error('Error fetching all reports:', error);
    throw error;
  }
};


// ─────────────────────────────────────────────
// 4. REPORT STATUS & ASSIGNMENT
// ─────────────────────────────────────────────

export const updateReportStatus = async (reportId, newStatus) => {
  try {
    await updateDoc(doc(db, 'reports', reportId), {
      status:    newStatus,
      updatedAt: serverTimestamp(),
      timeline: arrayUnion({
        date:   new Date().toLocaleString(),
        note:   `Status changed to ${newStatus}`,
        status: newStatus,
      }),
    });
  } catch (error) {
    console.error('Error updating report status:', error);
    throw error;
  }
};

export const assignReport = async (reportId, departmentUserId) => {
  try {
    await updateDoc(doc(db, 'reports', reportId), {
      assignedTo: departmentUserId,
      status:     'assigned',
      updatedAt:  serverTimestamp(),
      timeline: arrayUnion({
        date:   new Date().toLocaleString(),
        note:   `Report assigned to user ${departmentUserId}`,
        status: 'assigned',
      }),
    });
  } catch (error) {
    console.error('Error assigning report:', error);
    throw error;
  }
};


// ─────────────────────────────────────────────
// 5. DEPARTMENT MANAGEMENT
// ─────────────────────────────────────────────

export const getDepartments = async () => {
  try {
    const snapshot = await getDocs(collection(db, 'departments'));
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (error) {
    console.error('Error fetching departments:', error);
    throw error;
  }
};

export const addDepartment = async (departmentData) => {
  try {
    const docRef = await addDoc(collection(db, 'departments'), {
      ...departmentData,
      isActive:  true,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding department:', error);
    throw error;
  }
};

export const updateDepartment = async (deptId, updateData) => {
  try {
    await updateDoc(doc(db, 'departments', deptId), {
      ...updateData,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating department:', error);
    throw error;
  }
};

export const deleteDepartment = async (deptId) => {
  try {
    await deleteDoc(doc(db, 'departments', deptId));
  } catch (error) {
    console.error('Error deleting department:', error);
    throw error;
  }
};


// ─────────────────────────────────────────────
// 6. DEPARTMENT USER MANAGEMENT (WITH FIREBASE AUTH)
// ─────────────────────────────────────────────

// Get department users (with optional filter)
export const getDepartmentUsers = async (departmentId) => {
  try {
    let q = query(
      collection(db, 'users'),
      where('role', '==', 'departmentUser')
    );
    if (departmentId) {
      q = query(q, where('departmentId', '==', departmentId));
    }
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (error) {
    console.error('Error fetching department users:', error);
    throw error;
  }
};

// Generate a temporary password (simple but secure enough for first login)
const generateTempPassword = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#$%';
  let password = 'Temp@';
  for (let i = 0; i < 8; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

/**
 * Create a new department user
 * 1. Creates Firebase Auth account with email + temp password
 * 2. Gets the UID from Firebase Auth
 * 3. Creates Firestore document with that UID
 * 
 * userData shape: { fullName, email, phone, departmentId, createdBy (admin uid) }
 * Returns: { uid, tempPassword }
 */
export const createDepartmentUser = async (userData, currentAdminUid) => {
  try {
    // Generate temporary password
    const tempPassword = generateTempPassword();

    // Step 1: Create Firebase Auth account
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      userData.email,
      tempPassword
    );
    
    const uid = userCredential.user.uid;

    // Step 2: Create Firestore document
    await setDoc(doc(db, 'users', uid), {
      fullName:     userData.fullName,
      email:        userData.email,
      phone:        userData.phone || null,
      departmentId: userData.departmentId,
      role:         'departmentUser',
      status:       'offline',
      isActive:     true,
      createdBy:    currentAdminUid,
      createdAt:    serverTimestamp(),
      lastActive:   null,
    });

    return { uid, tempPassword };
  } catch (error) {
    console.error('Error creating department user:', error);
    
    // Handle Firebase Auth errors
    if (error.code === 'auth/email-already-in-use') {
      throw new Error('This email is already registered');
    } else if (error.code === 'auth/invalid-email') {
      throw new Error('Invalid email address');
    } else if (error.code === 'auth/weak-password') {
      throw new Error('Password is too weak');
    }
    
    throw error;
  }
};

/**
 * Update existing department user
 * Can update: fullName, phone, departmentId
 * CANNOT update: email (would require Auth re-authentication)
 */
export const updateDepartmentUser = async (uid, updateData) => {
  try {
    const allowedFields = {};
    
    if (updateData.fullName) allowedFields.fullName = updateData.fullName;
    if (updateData.phone) allowedFields.phone = updateData.phone;
    if (updateData.departmentId) allowedFields.departmentId = updateData.departmentId;
    if (updateData.status) allowedFields.status = updateData.status;

    await updateDoc(doc(db, 'users', uid), {
      ...allowedFields,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating department user:', error);
    throw error;
  }
};

/**
 * Toggle user active/inactive status
 * Instead of deleting, we just disable the account
 */
export const toggleUserActive = async (uid, isActive) => {
  try {
    await updateDoc(doc(db, 'users', uid), {
      isActive:  isActive,
      status:    isActive ? 'offline' : 'disabled',
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error toggling user status:', error);
    throw error;
  }
};

/**
 * Send password reset email to department user
 * They can set their own new password
 */
export const resetUserPassword = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error) {
    console.error('Error sending password reset:', error);
    throw error;
  }
};


// ─────────────────────────────────────────────
// 7. USER STATUS
// ─────────────────────────────────────────────
export const updateUserStatus = async (uid, status) => {
  try {
    await updateDoc(doc(db, 'users', uid), {
      status:     status,
      lastActive: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating user status:', error);
    throw error;
  }
};