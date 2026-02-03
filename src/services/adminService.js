import { db } from '../config/firebase';
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

// Fetch ANY user by their doc ID (works for citizens, dept users, admins)
// Used by report-detail to load the citizen who submitted the report
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

// departmentData shape: { name, iconName, color }
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

// Update existing department fields
// updateData shape: { name?, iconName?, color?, isActive? }
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

// Permanently delete a department
export const deleteDepartment = async (deptId) => {
  try {
    await deleteDoc(doc(db, 'departments', deptId));
  } catch (error) {
    console.error('Error deleting department:', error);
    throw error;
  }
};


// ─────────────────────────────────────────────
// 6. DEPARTMENT USER MANAGEMENT
// ─────────────────────────────────────────────

// Pass null to get ALL department users, or a deptId to filter
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

// Create a new department user profile
// userData shape: { name, phone, email?, departmentId }
export const createDepartmentUser = async (userData) => {
  try {
    const newDocRef = doc(collection(db, 'users'));
    await setDoc(newDocRef, {
      name:         userData.name,
      phone:        userData.phone,
      email:        userData.email || null,
      departmentId: userData.departmentId,
      role:         'departmentUser',
      status:       'offline',
      createdAt:    serverTimestamp(),
    });
    return newDocRef.id;
  } catch (error) {
    console.error('Error creating department user:', error);
    throw error;
  }
};

// Edit an existing department user
// updateData shape: { name?, phone?, email?, departmentId?, status? }
export const updateDepartmentUser = async (uid, updateData) => {
  try {
    await updateDoc(doc(db, 'users', uid), {
      ...updateData,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating department user:', error);
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