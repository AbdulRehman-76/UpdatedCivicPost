import React, {
	createContext,
	useContext,
	useState,
	useCallback,
	useEffect,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { initialReports } from '../data/reports';
import { useLanguage } from './LanguageContext';
import {
	createReport as createReportService,
	getUserReportsFromFirestore,
} from '../services/reportService';
import { verifyAdminRole } from '../services/adminService';

const AppContext = createContext();

const REPORTS_STORAGE_KEY = '@reports_data';
const NOTIFICATIONS_STORAGE_KEY = '@notifications_data';
const CURRENT_USER_STORAGE_KEY = '@current_user';

export const useApp = () => {
	const context = useContext(AppContext);
	if (!context) {
		throw new Error('useApp must be used within an AppProvider');
	}
	return context;
};

export const AppProvider = ({ children }) => {
	const { t } = useLanguage();
	const [reports, setReports] = useState(initialReports);
	const [notifications, setNotifications] = useState([]);
	const [currentUser, setCurrentUser] = useState(null);
	const [isAdmin, setIsAdmin] = useState(false);
	const [isLoading, setIsLoading] = useState(true);

	// Load data on mount
	useEffect(() => {
		const loadData = async () => {
			try {
				const storedReports =
					await AsyncStorage.getItem(REPORTS_STORAGE_KEY);
				const storedNotifications = await AsyncStorage.getItem(
					NOTIFICATIONS_STORAGE_KEY,
				);
				const storedUser = await AsyncStorage.getItem(
					CURRENT_USER_STORAGE_KEY,
				);

				if (storedReports) {
					setReports(JSON.parse(storedReports));
				}
				if (storedNotifications) {
					setNotifications(JSON.parse(storedNotifications));
				}
				if (storedUser) {
					const user = JSON.parse(storedUser);
					setCurrentUser(user);
					// Verify if user is admin (if we have a uid)
					if (user.uid) {
						// We don't await here to not block UI, but it might be better to await if we want to redirect correctly
						// For now, let's keep it simple.
						verifyAdminRole(user.uid).then((isAdminRole) => {
							setIsAdmin(isAdminRole);
						});
					}
				}
			} catch (error) {
				console.error('Error loading data:', error);
			} finally {
				setIsLoading(false);
			}
		};

		loadData();
	}, []);

	// Save reports whenever they change
	useEffect(() => {
		const saveReports = async () => {
			if (!isLoading) {
				try {
					await AsyncStorage.setItem(
						REPORTS_STORAGE_KEY,
						JSON.stringify(reports),
					);
				} catch (error) {
					console.error('Error saving reports:', error);
				}
			}
		};
		saveReports();
	}, [reports, isLoading]);

	// Save notifications whenever they change
	useEffect(() => {
		const saveNotifications = async () => {
			if (!isLoading) {
				try {
					await AsyncStorage.setItem(
						NOTIFICATIONS_STORAGE_KEY,
						JSON.stringify(notifications),
					);
				} catch (error) {
					console.error('Error saving notifications:', error);
				}
			}
		};
		saveNotifications();
	}, [notifications, isLoading]);

	// Save current user whenever it changes
	useEffect(() => {
		const saveUser = async () => {
			if (!isLoading) {
				try {
					if (currentUser) {
						await AsyncStorage.setItem(
							CURRENT_USER_STORAGE_KEY,
							JSON.stringify(currentUser),
						);
					} else {
						await AsyncStorage.removeItem(CURRENT_USER_STORAGE_KEY);
					}
				} catch (error) {
					console.error('Error saving user:', error);
				}
			}
		};
		saveUser();
	}, [currentUser, isLoading]);

	// Get reports for current user
	// ← FIXED: was currentUser?.id, now currentUser?.uid
	// create.js saves userId: currentUser.uid, so this must match
	const getUserReports = useCallback(
		(userId = currentUser?.uid) => {
			if (!userId) return [];
			return reports.filter((r) => r.userId === userId);
		},
		[reports, currentUser],
	);

	// ← NEW: home.js calls getUserStats() but it didn't exist
	// Simply counts the current user's reports by status
	const getUserStats = useCallback(() => {
		const myReports = getUserReports();
		return {
			total: myReports.length,
			pending: myReports.filter(
				(r) => r.status === 'pending' || r.status === 'Pending',
			).length,
			resolved: myReports.filter(
				(r) => r.status === 'resolved' || r.status === 'Resolved',
			).length,
		};
	}, [getUserReports]);

	// Get reports by status
	const getReportsByStatus = useCallback(
		(status) => {
			if (status === 'all') return reports;
			return reports.filter((r) => r.status === status);
		},
		[reports],
	);

	// Get reports by department
	const getReportsByDepartment = useCallback(
		(department) => {
			if (department === 'all') return reports;
			return reports.filter((r) => r.category === department);
		},
		[reports],
	);

	// Get single report
	const getReport = useCallback(
		(id) => {
			console.log(`Id: ${id}`);
			return reports.find((r) => r.id === id);
		},
		[reports],
	);

	// Helper to map status to translation key
	const getStatusKey = (status) => {
		const map = {
			Pending: 'pending',
			Assigned: 'assigned',
			'In Progress': 'inProgress',
			Resolved: 'resolved',
			Closed: 'closed',
		};
		return map[status] || status.toLowerCase();
	};

	// Helper to map category/department to translation key
	const getCategoryKey = (cat) => {
		const map = {
			Streetlights: 'streetLights',
			Garbage: 'garbageCollection',
			Water: 'waterSupply',
			Roads: 'roadMaintenance',
			Gas: 'gasProblems',
			Electricity: 'electricity',
			Sewerage: 'sewerageIssues',
			'Animal Rescue': 'animalRescue',
			'Public Safety': 'publicSafety',
		};
		return map[cat] || cat.toLowerCase();
	};

	// Add notification
	const addNotification = useCallback((notification) => {
		const newNotification = {
			id: Date.now(),
			time: new Date().toISOString(),
			read: false,
			...notification,
		};
		setNotifications((prev) => [newNotification, ...prev]);
	}, []);

	// Mark notification as read
	const markNotificationAsRead = useCallback((id) => {
		setNotifications((prev) =>
			prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
		);
	}, []);

	// Mark all notifications as read
	const markAllNotificationsAsRead = useCallback(() => {
		setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
	}, []);

	const addReport = useCallback(
		async (reportData) => {
			try {
				// Save to Firestore
				const firestoreId = await createReportService(reportData);

				// Save to local state (for citizen view)
				const newReport = {
					id: firestoreId, // Use Firestore ID
					...reportData,
					createdAt: new Date().toISOString().split('T')[0],
					status: 'pending',
					timeline: [
						{
							status: 'pending',
							date: new Date().toLocaleString(),
							note: t('submittedBy'),
						},
					],
				};

				setReports((prev) => [newReport, ...prev]);

				addNotification({
					titleKey: 'reportSubmitted',
					messageKey: 'reportSubmittedMsg',
					type: 'success',
					icon: '✅',
				});

				return firestoreId;
			} catch (error) {
				console.error('Error adding report:', error);
				throw error;
			}
		},
		[currentUser, addNotification, t],
	);

	const login = async (userData) => {
		setCurrentUser(userData);
		if (userData.uid) {
			const isAdminRole = await verifyAdminRole(userData.uid);
			setIsAdmin(isAdminRole);
		}

		// Restore session: Load user reports from Firestore
		// We use the phone number (id) as the primary identifier for reports in this flow
		const userId = userData.id || userData.uid;
		if (userId) {
			setIsLoading(true);
			try {
				const userReports = await getUserReportsFromFirestore(userId);
				// Merge with existing reports or replace?
				// Since we want to "restore", replacing seems safer to avoid duplicates with initialReports
				// But we might want to keep other people's reports if this was a public feed?
				// The app seems to be "My Reports" focused?
				// getUserReports filters by userId.
				// But setReports sets the global 'reports' state.
				// If 'reports' is supposed to contain ALL reports (for admin/feed), this is wrong.
				// But getUserReports in AppContext filters from 'reports'.
				// If 'reports' only contains MY reports, then it's fine.
				// Let's check getReportsByStatus('all').

				// If the app supports seeing other people's reports, we shouldn't overwrite all reports.
				// But getUserReportsFromFirestore ONLY returns MY reports.
				// If I overwrite 'reports', I lose others' reports.

				// However, if the user just logged in, they shouldn't have any "local" reports yet (except initialReports).
				// If I replace 'reports' with 'userReports', I effectively show only my reports.
				// Is there a "Feed" feature?
				// "admin-dashboard" implies admins see all. Citizens might only see theirs?
				// app/(user)/reports.jsx likely lists reports.

				// Let's assume for now we just want to load MY reports.
				// If the app needs a public feed, we would need a 'getAllReports' service.

				// For the purpose of "Restore session", loading my reports is key.
				// I will append them or replace duplicates.

				setReports((prev) => {
					// Create a map of existing reports by ID
					const existingMap = new Map(prev.map((r) => [r.id, r]));
					// Add/Update with fetched reports
					userReports.forEach((r) => existingMap.set(r.id, r));
					return Array.from(existingMap.values());
				});
			} catch (error) {
				console.error('Failed to load user reports on login', error);
			} finally {
				setIsLoading(false);
			}
		}
	};

	const logout = async () => {
		setCurrentUser(null);
		setIsAdmin(false);
		console.log(`Current User Key: ${CURRENT_USER_STORAGE_KEY}`);
		await AsyncStorage.removeItem(CURRENT_USER_STORAGE_KEY);
	};

	return (
		<AppContext.Provider
			value={{
				reports,
				notifications,
				currentUser,
				setCurrentUser,
				isAdmin,
				setIsAdmin,
				isLoading,
				getUserReports,
				getUserStats,
				getReportsByStatus,
				getReportsByDepartment,
				getReport,
				getStatusKey,
				getCategoryKey,
				addNotification,
				markNotificationAsRead,
				markAllNotificationsAsRead,
				addReport,
				login,
				logout,
			}}
		>
			{children}
		</AppContext.Provider>
	);
};

export default AppContext;
// import React, {
// 	createContext,
// 	useContext,
// 	useState,
// 	useCallback,
// 	useEffect,
// } from 'react';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import { initialReports } from '../data/reports';
// import { useLanguage } from './LanguageContext';
// import { createReport as createReportService } from '../services/reportService';
// import { verifyAdminRole } from '../services/adminService';

// const AppContext = createContext();

// const REPORTS_STORAGE_KEY = '@reports_data';
// const NOTIFICATIONS_STORAGE_KEY = '@notifications_data';
// const CURRENT_USER_STORAGE_KEY = '@current_user';

// export const useApp = () => {
// 	const context = useContext(AppContext);
// 	if (!context) {
// 		throw new Error('useApp must be used within an AppProvider');
// 	}
// 	return context;
// };

// export const AppProvider = ({ children }) => {
// 	const { t } = useLanguage();
// 	const [reports, setReports] = useState(initialReports);
// 	const [notifications, setNotifications] = useState([]);
// 	const [currentUser, setCurrentUser] = useState(null);
// 	const [isAdmin, setIsAdmin] = useState(false);
// 	const [isLoading, setIsLoading] = useState(true);

// 	// Load data on mount
// 	useEffect(() => {
// 		const loadData = async () => {
// 			try {
// 				const storedReports =
// 					await AsyncStorage.getItem(REPORTS_STORAGE_KEY);
// 				const storedNotifications = await AsyncStorage.getItem(
// 					NOTIFICATIONS_STORAGE_KEY,
// 				);
// 				const storedUser = await AsyncStorage.getItem(
// 					CURRENT_USER_STORAGE_KEY,
// 				);

// 				if (storedReports) {
// 					setReports(JSON.parse(storedReports));
// 				}
// 				if (storedNotifications) {
// 					setNotifications(JSON.parse(storedNotifications));
// 				}
// 				if (storedUser) {
// 					const user = JSON.parse(storedUser);
// 					setCurrentUser(user);
// 					// Verify if user is admin (if we have a uid)
// 					if (user.uid) {
// 						// We don't await here to not block UI, but it might be better to await if we want to redirect correctly
// 						// For now, let's keep it simple.
// 						verifyAdminRole(user.uid).then((isAdminRole) => {
// 							setIsAdmin(isAdminRole);
// 						});
// 					}
// 				}
// 			} catch (error) {
// 				console.error('Error loading data:', error);
// 			} finally {
// 				setIsLoading(false);
// 			}
// 		};

// 		loadData();
// 	}, []);

// 	// Save reports whenever they change
// 	useEffect(() => {
// 		const saveReports = async () => {
// 			if (!isLoading) {
// 				try {
// 					await AsyncStorage.setItem(
// 						REPORTS_STORAGE_KEY,
// 						JSON.stringify(reports),
// 					);
// 				} catch (error) {
// 					console.error('Error saving reports:', error);
// 				}
// 			}
// 		};
// 		saveReports();
// 	}, [reports, isLoading]);

// 	// Save notifications whenever they change
// 	useEffect(() => {
// 		const saveNotifications = async () => {
// 			if (!isLoading) {
// 				try {
// 					await AsyncStorage.setItem(
// 						NOTIFICATIONS_STORAGE_KEY,
// 						JSON.stringify(notifications),
// 					);
// 				} catch (error) {
// 					console.error('Error saving notifications:', error);
// 				}
// 			}
// 		};
// 		saveNotifications();
// 	}, [notifications, isLoading]);

// 	// Save current user whenever it changes
// 	useEffect(() => {
// 		const saveUser = async () => {
// 			if (!isLoading) {
// 				try {
// 					if (currentUser) {
// 						await AsyncStorage.setItem(
// 							CURRENT_USER_STORAGE_KEY,
// 							JSON.stringify(currentUser),
// 						);
// 					} else {
// 						await AsyncStorage.removeItem(CURRENT_USER_STORAGE_KEY);
// 					}
// 				} catch (error) {
// 					console.error('Error saving user:', error);
// 				}
// 			}
// 		};
// 		saveUser();
// 	}, [currentUser, isLoading]);

// 	// Get reports for current user
// 	const getUserReports = useCallback(
// 		(userId = currentUser?.id) => {
// 			if (!userId) return [];
// 			return reports.filter((r) => r.userId === userId);
// 		},
// 		[reports, currentUser],
// 	);

// 	// Get reports by status
// 	const getReportsByStatus = useCallback(
// 		(status) => {
// 			if (status === 'all') return reports;
// 			return reports.filter((r) => r.status === status);
// 		},
// 		[reports],
// 	);

// 	// Get reports by department
// 	const getReportsByDepartment = useCallback(
// 		(department) => {
// 			if (department === 'all') return reports;
// 			return reports.filter((r) => r.category === department);
// 		},
// 		[reports],
// 	);

// 	// Get single report
// 	const getReport = useCallback(
// 		(id) => {
// 			return reports.find((r) => r.id === id);
// 		},
// 		[reports],
// 	);

// 	// Helper to map status to translation key
// 	const getStatusKey = (status) => {
// 		const map = {
// 			Pending: 'pending',
// 			Assigned: 'assigned',
// 			'In Progress': 'inProgress',
// 			Resolved: 'resolved',
// 			Closed: 'closed',
// 		};
// 		return map[status] || status.toLowerCase();
// 	};

// 	// Helper to map category/department to translation key
// 	const getCategoryKey = (cat) => {
// 		const map = {
// 			Streetlights: 'streetLights',
// 			Garbage: 'garbageCollection',
// 			Water: 'waterSupply',
// 			Roads: 'roadMaintenance',
// 			Gas: 'gasProblems',
// 			Electricity: 'electricity',
// 			Sewerage: 'sewerageIssues',
// 			'Animal Rescue': 'animalRescue',
// 			'Public Safety': 'publicSafety',
// 		};
// 		return map[cat] || cat.toLowerCase();
// 	};

// 	// Add notification
// 	const addNotification = useCallback((notification) => {
// 		const newNotification = {
// 			id: Date.now(),
// 			time: new Date().toISOString(),
// 			read: false,
// 			...notification,
// 		};
// 		setNotifications((prev) => [newNotification, ...prev]);
// 	}, []);

// 	// Mark notification as read
// 	const markNotificationAsRead = useCallback((id) => {
// 		setNotifications((prev) =>
// 			prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
// 		);
// 	}, []);

// 	// Mark all notifications as read
// 	const markAllNotificationsAsRead = useCallback(() => {
// 		setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
// 	}, []);

// 	const addReport = useCallback(
// 		async (reportData) => {
// 			try {
// 				// Save to Firestore
// 				const firestoreId = await createReportService(reportData);

// 				// Save to local state (for citizen view)
// 				const newReport = {
// 					id: firestoreId, // Use Firestore ID
// 					...reportData,
// 					createdAt: new Date().toISOString().split('T')[0],
// 					status: 'Pending',
// 					timeline: [
// 						{
// 							status: 'Pending',
// 							date: new Date().toLocaleString(),
// 							note: t('submittedBy'),
// 						},
// 					],
// 				};

// 				setReports((prev) => [newReport, ...prev]);

// 				addNotification({
// 					title: 'Report Submitted',
// 					message: `Your report about ${reportData.title} has been submitted successfully.`,
// 					type: 'success',
// 				});

// 				return firestoreId;
// 			} catch (error) {
// 				console.error('Error adding report:', error);
// 				throw error;
// 			}
// 		},
// 		[currentUser, addNotification, t],
// 	);

// 	const login = async (userData) => {
// 		setCurrentUser(userData);
// 		if (userData.uid) {
// 			const isAdminRole = await verifyAdminRole(userData.uid);
// 			setIsAdmin(isAdminRole);
// 		}
// 	};

// 	const logout = async () => {
// 		setCurrentUser(null);
// 		setIsAdmin(false);
// 		await AsyncStorage.removeItem(CURRENT_USER_STORAGE_KEY);
// 	};

// 	return (
// 		<AppContext.Provider
// 			value={{
// 				reports,
// 				notifications,
// 				currentUser,
// 				setCurrentUser,
// 				isAdmin,
// 				setIsAdmin,
// 				isLoading,
// 				getUserReports,
// 				getReportsByStatus,
// 				getReportsByDepartment,
// 				getReport,
// 				getStatusKey,
// 				getCategoryKey,
// 				addNotification,
// 				markNotificationAsRead,
// 				markAllNotificationsAsRead,
// 				addReport,
// 				login,
// 				logout,
// 			}}
// 		>
// 			{children}
// 		</AppContext.Provider>
// 	);
// };

// export default AppContext;

