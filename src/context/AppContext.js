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
import { createReport as createReportService } from '../services/reportService';

const AppContext = createContext();

const REPORTS_STORAGE_KEY = '@reports_data';
const NOTIFICATIONS_STORAGE_KEY = '@notifications_data';

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
	const [currentUser] = useState({
		id: 1,
		name: 'John Citizen',
		email: 'john.citizen@email.com',
	});
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

				if (storedReports) {
					setReports(JSON.parse(storedReports));
				}
				if (storedNotifications) {
					setNotifications(JSON.parse(storedNotifications));
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

	// Get user's reports
	const getUserReports = useCallback(
		(userId = currentUser.id) => {
			return reports.filter((r) => r.userId === userId);
		},
		[reports, currentUser.id],
	);

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
			const maxId =
				reports.length > 0 ? Math.max(...reports.map((r) => r.id)) : 0;
			const newReportBase = {
				...reportData,
				status: 'Pending',
				department: null,
				createdAt: new Date().toISOString().split('T')[0],
				userId: currentUser.id,
				timeline: [
					{
						status: 'Pending',
						date: new Date().toLocaleString(),
						note: t('submittedBy'),
					},
				],
			};
			const remoteId = await createReportService({
				...newReportBase,
			});
			const newReport = {
				id: maxId + 1,
				...newReportBase,
				remoteId,
			};
			setReports((prev) => [newReport, ...prev]);
			addNotification({
				type: 'info',
				titleKey: 'reportSubmitted',
				messageKey: 'reportSubmittedMsg',
				icon: '📝',
				reportId: newReport.id,
			});
			return newReport;
		},
		[reports, currentUser.id, t, addNotification],
	);

	// Update report status
	const updateReportStatus = useCallback(
		(id, status, note = '') => {
			setReports((prev) =>
				prev.map((report) => {
					if (report.id === id) {
						const statusKey = getStatusKey(status);
						const updatedReport = {
							...report,
							status,
							timeline: [
								...report.timeline,
								{
									status,
									date: new Date().toLocaleString(),
									note:
										note ||
										t('statusUpdatedTo', {
											status: t(statusKey),
										}),
								},
							],
						};

						// Add notification for the user
						addNotification({
							type: 'status',
							titleKey: 'reportStatusUpdated',
							messageKey:
								status === 'Resolved'
									? 'reportResolvedMsg'
									: 'reportStatusUpdatedMsg',
							icon: status === 'Resolved' ? '✅' : '🔄',
							reportId: id,
							statusKey: statusKey,
						});

						return updatedReport;
					}
					return report;
				}),
			);
		},
		[t, addNotification],
	);

	// Assign report to department
	const assignDepartment = useCallback(
		(id, department) => {
			setReports((prev) =>
				prev.map((report) => {
					if (report.id === id) {
						const deptKey = getCategoryKey(department);
						const updatedReport = {
							...report,
							department,
							status:
								report.status === 'Pending'
									? 'Assigned'
									: report.status,
						};

						const newStatus =
							report.status === 'Pending'
								? 'Assigned'
								: report.status;

						if (report.status === 'Pending') {
							updatedReport.timeline = [
								...report.timeline,
								{
									status: 'Assigned',
									date: new Date().toLocaleString(),
									note: t('assignedTo', {
										department: t(deptKey),
									}),
								},
							];

							// Add notification for the user
							addNotification({
								type: 'status',
								titleKey: 'reportAssigned',
								messageKey: 'reportStatusAssignedMsg',
								icon: '👤',
								reportId: id,
								departmentKey: deptKey,
							});
						}
						return updatedReport;
					}
					return report;
				}),
			);
		},
		[t, addNotification],
	);

	// Get statistics
	const getStats = useCallback(() => {
		const total = reports.length;
		const pending = reports.filter((r) => r.status === 'Pending').length;
		const inProgress = reports.filter(
			(r) => r.status === 'In Progress' || r.status === 'Assigned',
		).length;
		const resolved = reports.filter((r) => r.status === 'Resolved').length;
		return { total, pending, inProgress, resolved };
	}, [reports]);

	// Get user statistics
	const getUserStats = useCallback(() => {
		const userReports = getUserReports();
		const total = userReports.length;
		const pending = userReports.filter((r) => r.status === 'Pending').length;
		const resolved = userReports.filter((r) => r.status === 'Resolved').length;
		return { total, pending, resolved };
	}, [getUserReports]);

	// Get department statistics
	const getDepartmentStats = useCallback(() => {
		const deptStats = {};
		reports.forEach((report) => {
			const dept = report.category;
			if (!deptStats[dept]) {
				deptStats[dept] = 0;
			}
			deptStats[dept]++;
		});
		return deptStats;
	}, [reports]);

	const value = {
		reports,
		notifications,
		currentUser,
		isAdmin,
		setIsAdmin,
		isLoading,
		getUserReports,
		getReportsByStatus,
		getReportsByDepartment,
		getReport,
		addReport,
		updateReportStatus,
		assignDepartment,
		getStats,
		getUserStats,
		getDepartmentStats,
		markNotificationAsRead,
		markAllNotificationsAsRead,
	};

	return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export default AppContext;

