import { db } from '../config/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export const createReport = async (reportData) => {
  try {
    const docRef = await addDoc(collection(db, 'reports'), {
      userId:     reportData.userId,           // ← citizen's Firebase Auth UID
      category:    reportData.category,          // ← department name e.g. "Electricity"
      title:       reportData.title,
      description: reportData.description,
      location:    reportData.location,
      priority:    reportData.priority,
      contactInfo: reportData.contactInfo || null,
      media:       reportData.media || [],
      photo:       reportData.photo || null,
      status:      'pending',
      timeline:    [{ date: new Date().toLocaleString(), note: 'Report submitted', status: 'pending' }],
      createdAt:   serverTimestamp(),
    });

    return docRef.id;
  } catch (error) {
    console.error('Error saving report:', error);
    throw error;
  }
};
// Firestore logic (addReport, updateReport)
// import { db } from '../config/firebase';
// import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

// export const createReport = async (reportData) => {
//   try {
//     const docRef = await addDoc(collection(db, 'reports'), {
//       ...reportData,
//       createdAt: serverTimestamp(),
//       status: 'pending',
//     });

//     return docRef.id;
//   } catch (error) {
//     console.error('Error saving report:', error);
//     throw error;
//   }
// };
// Meaning:
// “Go to the reports collection inside my database.”
// db → your Firestore database instance
// 'reports' → name of the collection
// If reports does not exist, Firestore creates it automatically.