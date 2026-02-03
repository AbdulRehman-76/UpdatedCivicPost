import React, { useState } from 'react';
import {
	View,
	Text,
	StyleSheet,
	TextInput,
	TouchableOpacity,
	Alert,
	Modal,
	ScrollView,
	ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../../src/context/LanguageContext';
import { saveCitizenProfile } from '../../src/services/userService';
import { useApp } from '../../src/context/AppContext';

const GENDER_OPTIONS = ['Male', 'Female', 'Other'];

export default function PhoneLoginScreen() {
	const router = useRouter();
	const { t } = useLanguage();
	const { login } = useApp();

	const [phone, setPhone] = useState('');
	const [firstName, setFirstName] = useState('');
	const [lastName, setLastName] = useState('');
	const [gender, setGender] = useState('');
	const [loading, setLoading] = useState(false);
	const [showGenderModal, setShowGenderModal] = useState(false);

	const handleContinue = async () => {
		// Validation
		if (!phone.trim()) {
			Alert.alert('Required', 'Please enter your phone number');
			return;
		}
		if (!firstName.trim()) {
			Alert.alert('Required', 'Please enter your first name');
			return;
		}
		if (!lastName.trim()) {
			Alert.alert('Required', 'Please enter your last name');
			return;
		}
		if (!gender) {
			Alert.alert('Required', 'Please select your gender');
			return;
		}

		setLoading(true);

		try {
			// Generate a unique ID (in real app, this would be Firebase Auth UID)
			// For now, using timestamp as a simple UID
			const uid = `citizen_${Date.now()}`;

			// Save profile to Firestore
			await saveCitizenProfile(uid, {
				phone: phone.trim(),
				firstName: firstName.trim(),
				lastName: lastName.trim(),
				gender: gender,
			});

			// Login user (saves to AsyncStorage via AppContext)
			await login({
				uid,
				phone: phone.trim(),
				name: `${firstName.trim()} ${lastName.trim()}`,
				role: 'citizen',
			});

			// Navigate to home
			router.replace('/(user)/home');
		} catch (error) {
			console.error('Signup error:', error);
			Alert.alert('Error', 'Failed to create account. Please try again.');
		} finally {
			setLoading(false);
		}
	};

	return (
		<SafeAreaView style={styles.container}>
			<ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
				{/* Logo & Branding */}
				<View style={styles.header}>
					<View style={styles.logoCircle}>
						<Ionicons name="megaphone" size={48} color="#fff" />
					</View>
					<Text style={styles.appName}>CivicPost</Text>
					<Text style={styles.tagline}>Voice Your Community Concerns</Text>
				</View>

				{/* Form Card */}
				<View style={styles.card}>
					<Text style={styles.formTitle}>Create Your Account</Text>
					<Text style={styles.formSubtitle}>Join thousands making a difference</Text>

					{/* Phone Number */}
					<View style={styles.labelRow}>
						<Text style={styles.label}>Phone Number</Text>
						<Text style={styles.required}>*</Text>
					</View>
					<View style={styles.inputWrapper}>
						<Ionicons name="call-outline" size={20} color="#6b7280" style={styles.inputIcon} />
						<TextInput
							style={styles.input}
							placeholder="+92 300 0000000"
							placeholderTextColor="#9ca3af"
							keyboardType="phone-pad"
							value={phone}
							onChangeText={setPhone}
							editable={!loading}
						/>
					</View>

					{/* First Name */}
					<View style={styles.labelRow}>
						<Text style={styles.label}>First Name</Text>
						<Text style={styles.required}>*</Text>
					</View>
					<View style={styles.inputWrapper}>
						<Ionicons name="person-outline" size={20} color="#6b7280" style={styles.inputIcon} />
						<TextInput
							style={styles.input}
							placeholder="John"
							placeholderTextColor="#9ca3af"
							value={firstName}
							onChangeText={setFirstName}
							editable={!loading}
							autoCapitalize="words"
						/>
					</View>

					{/* Last Name */}
					<View style={styles.labelRow}>
						<Text style={styles.label}>Last Name</Text>
						<Text style={styles.required}>*</Text>
					</View>
					<View style={styles.inputWrapper}>
						<Ionicons name="person-outline" size={20} color="#6b7280" style={styles.inputIcon} />
						<TextInput
							style={styles.input}
							placeholder="Doe"
							placeholderTextColor="#9ca3af"
							value={lastName}
							onChangeText={setLastName}
							editable={!loading}
							autoCapitalize="words"
						/>
					</View>

					{/* Gender */}
					<View style={styles.labelRow}>
						<Text style={styles.label}>Gender</Text>
						<Text style={styles.required}>*</Text>
					</View>
					<TouchableOpacity
						style={styles.inputWrapper}
						onPress={() => setShowGenderModal(true)}
						disabled={loading}
					>
						<Ionicons 
							name={
								gender === 'Male' ? 'male' : 
								gender === 'Female' ? 'female' : 
								gender === 'Other' ? 'male-female' : 
								'male-female-outline'
							} 
							size={20} 
							color="#6b7280" 
							style={styles.inputIcon} 
						/>
						<Text style={[styles.input, styles.dropdownText, !gender && styles.placeholder]}>
							{gender || 'Select Gender'}
						</Text>
						<Ionicons name="chevron-down" size={20} color="#6b7280" />
					</TouchableOpacity>

					{/* Submit Button */}
					<TouchableOpacity
						style={[styles.button, loading && styles.buttonDisabled]}
						onPress={handleContinue}
						disabled={loading}
						activeOpacity={0.8}
					>
						{loading ? (
							<ActivityIndicator color="#fff" />
						) : (
							<>
								<Text style={styles.buttonText}>Continue</Text>
								<Ionicons name="arrow-forward" size={20} color="#fff" style={{ marginLeft: 8 }} />
							</>
						)}
					</TouchableOpacity>

					{/* Footer Note */}
					<View style={styles.footerNote}>
						<Ionicons name="shield-checkmark" size={16} color="#22c55e" />
						<Text style={styles.footerText}>Your information is secure and private</Text>
					</View>
				</View>

				<View style={{ height: 40 }} />
			</ScrollView>

			{/* Gender Modal */}
			<Modal visible={showGenderModal} transparent animationType="slide" onRequestClose={() => setShowGenderModal(false)}>
				<View style={styles.modalOverlay}>
					<View style={styles.modalContent}>
						<View style={styles.modalHeader}>
							<Text style={styles.modalTitle}>Select Gender</Text>
							<TouchableOpacity onPress={() => setShowGenderModal(false)}>
								<Ionicons name="close" size={24} color="#6b7280" />
							</TouchableOpacity>
						</View>

						{GENDER_OPTIONS.map((option) => (
							<TouchableOpacity
								key={option}
								style={[styles.modalOption, gender === option && styles.modalOptionActive]}
								onPress={() => {
									setGender(option);
									setShowGenderModal(false);
								}}
							>
								<Ionicons
									name={
										option === 'Male' ? 'male' : option === 'Female' ? 'female' : 'male-female'
									}
									size={22}
									color={gender === option ? '#22c55e' : '#6b7280'}
									style={{ marginRight: 12 }}
								/>
								<Text style={[styles.modalOptionText, gender === option && styles.modalOptionTextActive]}>
									{option}
								</Text>
								{gender === option && <Ionicons name="checkmark-circle" size={22} color="#22c55e" />}
							</TouchableOpacity>
						))}
					</View>
				</View>
			</Modal>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#f9fafb',
	},
	scrollContent: {
		padding: 20,
	},

	// Header
	header: {
		alignItems: 'center',
		marginTop: 20,
		marginBottom: 32,
	},
	logoCircle: {
		width: 100,
		height: 100,
		borderRadius: 50,
		backgroundColor: '#22c55e',
		alignItems: 'center',
		justifyContent: 'center',
		marginBottom: 16,
		shadowColor: '#22c55e',
		shadowOffset: { width: 0, height: 8 },
		shadowOpacity: 0.3,
		shadowRadius: 16,
		elevation: 8,
	},
	appName: {
		fontSize: 32,
		fontWeight: 'bold',
		color: '#111827',
		marginBottom: 4,
	},
	tagline: {
		fontSize: 15,
		color: '#6b7280',
		textAlign: 'center',
	},

	// Form Card
	card: {
		backgroundColor: '#ffffff',
		borderRadius: 20,
		padding: 24,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.08,
		shadowRadius: 12,
		elevation: 4,
	},
	formTitle: {
		fontSize: 22,
		fontWeight: 'bold',
		color: '#111827',
		marginBottom: 4,
	},
	formSubtitle: {
		fontSize: 14,
		color: '#6b7280',
		marginBottom: 24,
	},

	// Input Fields
	labelRow: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: 8,
		marginTop: 4,
	},
	label: {
		fontSize: 14,
		fontWeight: '600',
		color: '#374151',
	},
	required: {
		fontSize: 16,
		fontWeight: 'bold',
		color: '#ef4444',
		marginLeft: 3,
	},
	inputWrapper: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: '#f9fafb',
		borderWidth: 1.5,
		borderColor: '#e5e7eb',
		borderRadius: 12,
		paddingHorizontal: 14,
		marginBottom: 16,
		height: 54,
	},
	inputIcon: {
		marginRight: 10,
	},
	input: {
		flex: 1,
		fontSize: 16,
		color: '#111827',
	},
	dropdownText: {
		paddingVertical: 0,
	},
	placeholder: {
		color: '#9ca3af',
	},

	// Button
	button: {
		flexDirection: 'row',
		backgroundColor: '#22c55e',
		borderRadius: 12,
		paddingVertical: 16,
		alignItems: 'center',
		justifyContent: 'center',
		marginTop: 8,
		shadowColor: '#22c55e',
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.3,
		shadowRadius: 8,
		elevation: 4,
	},
	buttonDisabled: {
		opacity: 0.6,
	},
	buttonText: {
		color: '#ffffff',
		fontSize: 17,
		fontWeight: 'bold',
	},

	// Footer Note
	footerNote: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		marginTop: 16,
		gap: 6,
	},
	footerText: {
		fontSize: 13,
		color: '#6b7280',
	},

	// Gender Modal
	modalOverlay: {
		flex: 1,
		backgroundColor: 'rgba(0, 0, 0, 0.5)',
		justifyContent: 'flex-end',
	},
	modalContent: {
		backgroundColor: '#ffffff',
		borderTopLeftRadius: 24,
		borderTopRightRadius: 24,
		padding: 24,
	},
	modalHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 20,
	},
	modalTitle: {
		fontSize: 20,
		fontWeight: 'bold',
		color: '#111827',
	},
	modalOption: {
		flexDirection: 'row',
		alignItems: 'center',
		padding: 16,
		borderRadius: 12,
		marginBottom: 8,
		backgroundColor: '#f9fafb',
		borderWidth: 1.5,
		borderColor: '#e5e7eb',
	},
	modalOptionActive: {
		backgroundColor: '#f0fdf4',
		borderColor: '#22c55e',
	},
	modalOptionText: {
		flex: 1,
		fontSize: 16,
		color: '#374151',
		fontWeight: '500',
	},
	modalOptionTextActive: {
		color: '#22c55e',
		fontWeight: '600',
	},
});