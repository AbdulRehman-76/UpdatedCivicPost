import { db } from '../config/firebase';
import {
	collection,
	addDoc,
	updateDoc,
	deleteDoc,
	doc,
	serverTimestamp,
	arrayUnion,
	query,
	where,
	getDocs,
	orderBy,
} from 'firebase/firestore';

/**
 * Create a new report
 */
export const createReport = async (reportData) => {
	try {
		const docRef = await addDoc(collection(db, 'reports'), {
			userId: reportData.userId, // citizen's Firebase Auth UID
			category: reportData.category, // department name e.g. "Electricity"
			title: reportData.title,
			description: reportData.description,
			location: reportData.location,
			priority: reportData.priority,
			contactInfo: reportData.contactInfo || null,
			media: reportData.media || [],
			photo: reportData.photo || null,
			status: 'pending',
			timeline: [
				{
					date: new Date().toLocaleString(),
					note: 'Report submitted',
					status: 'pending',
				},
			],
			createdAt: serverTimestamp(),
		});

		return docRef.id;
	} catch (error) {
		console.error('Error saving report:', error);
		throw error;
	}
};

/**
 * Get all reports for a specific user
 */
export const getUserReportsFromFirestore = async (userId) => {
	try {
		// Note: If you want to order by createdAt, you need a composite index in Firestore
		// query(collection(db, 'reports'), where('userId', '==', userId), orderBy('createdAt', 'desc'))
		// For now, we fetch and sort in JS to avoid index errors during dev.
		const q = query(collection(db, 'reports'), where('userId', '==', userId));

		const querySnapshot = await getDocs(q);
		const reports = [];

		querySnapshot.forEach((doc) => {
			const data = doc.data();
			reports.push({
				id: doc.id,
				...data,
				// Convert Firestore timestamp to Date string or keep as object
				createdAt: data.createdAt?.toDate
					? data.createdAt.toDate().toISOString().split('T')[0]
					: new Date().toISOString().split('T')[0],
				// Ensure timeline exists
				timeline: data.timeline || [],
			});
		});

		// Sort by createdAt descending (newest first)
		reports.sort((a, b) => {
			const dateA = new Date(a.createdAt);
			const dateB = new Date(b.createdAt);
			return dateB - dateA;
		});

		return reports;
	} catch (error) {
		console.error('Error fetching user reports:', error);
		// Return empty array instead of throwing to prevent app crash
		return [];
	}
};

//  Update an existing report
//
//  Editing Rules:
// - ✅ CAN edit when status = 'pending' or 'assigned'
// - ❌ CANNOT edit when status = 'inProgress', 'resolved', 'closed'

// Editable fields for citizens:
// - title
// - description
// - location
// - contactInfo
// - media (photos/videos)

export const updateReport = async (reportId, currentStatus, updateData) => {
	try {
		// Validate reportId
		if (!reportId) {
			throw new Error('Report ID is required');
		}

		// Check status-based permissions
		const normalizedStatus = currentStatus?.toLowerCase();
		const allowedStatuses = ['pending', 'assigned'];

		if (!allowedStatuses.includes(normalizedStatus)) {
			throw new Error(
				`Cannot edit this report. Reports can only be edited when status is "Pending" or "Assigned". ` +
					`Current status: ${currentStatus}`,
			);
		}

		// Prepare the update object
		const updates = {};

		// Validate and add title
		if (updateData.title !== undefined) {
			const trimmedTitle = updateData.title.trim();
			if (!trimmedTitle) {
				throw new Error('Title cannot be empty');
			}
			updates.title = trimmedTitle;
		}

		// Validate and add description
		if (updateData.description !== undefined) {
			const trimmedDescription = updateData.description.trim();
			if (!trimmedDescription) {
				throw new Error('Description cannot be empty');
			}
			updates.description = trimmedDescription;
		}

		// Validate and add location
		if (updateData.location !== undefined) {
			const trimmedLocation = updateData.location.trim();
			if (!trimmedLocation) {
				throw new Error('Location cannot be empty');
			}
			updates.location = trimmedLocation;
		}

		// Add contact info (can be null/empty)
		if (updateData.contactInfo !== undefined) {
			updates.contactInfo = updateData.contactInfo?.trim() || null;
		}

		// Add media array
		if (updateData.media !== undefined) {
			updates.media = Array.isArray(updateData.media) ? updateData.media : [];
		}

		// Add timestamp for last update
		updates.updatedAt = serverTimestamp();

		// Add timeline entry for audit trail
		updates.timeline = arrayUnion({
			date: new Date().toLocaleString(),
			note: 'Report details updated by citizen',
			status: normalizedStatus,
		});

		// Perform the update
		const reportRef = doc(db, 'reports', reportId);
		await updateDoc(reportRef, updates);

		return {
			success: true,
			message: 'Report updated successfully',
		};
	} catch (error) {
		console.error('Error updating report:', error);

		// Re-throw with user-friendly message
		if (error.message.includes('Cannot edit')) {
			throw error; // Already has a good message
		} else if (error.message.includes('cannot be empty')) {
			throw error; // Already has a good message
		} else {
			throw new Error('Failed to update report. Please try again.');
		}
	}
};

/**
 * Delete a report
 * Deletion Rule:
 * - CAN delete ONLY when status = 'pending'
 * - CANNOT delete when status = 'assigned', 'inProgress', 'resolved', 'closed'
 */
export const deleteReport = async (reportId, currentStatus) => {
	try {
		// Normalize status to lowercase
		const normalizedStatus = currentStatus?.toLowerCase();

		// Only allow deletion if status is pending
		if (normalizedStatus !== 'pending') {
			throw new Error(
				`Reports cannot be deleted when status is "${currentStatus}". ` +
					`Only Pending reports can be deleted.`,
			);
		}

		const reportRef = doc(db, 'reports', reportId);
		await deleteDoc(reportRef);

		return true;
	} catch (error) {
		console.error('Error deleting report:', error);
		throw error;
	}
};
