import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../../src/context/LanguageContext';
import {
  getDepartments,
  getDepartmentUsers,
  createDepartmentUser,
  updateDepartmentUser,
} from '../../src/services/adminService';
import { getDeptIcon } from '../../src/utils/adminUtils';

// Status options an admin can assign to a department user
const USER_STATUS_OPTIONS = ['offline', 'active', 'working'];

export default function UsersScreen() {
  const router = useRouter();
  const { t } = useLanguage();

  const [users, setUsers]             = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedDept, setSelectedDept] = useState(null);

  const [isLoading, setIsLoading]     = useState(true);
  const [submitting, setSubmitting]   = useState(false);

  // ── Modal control ──
  // mode: null | 'add' | 'edit'
  const [modalMode, setModalMode]     = useState(null);
  const [editingUser, setEditingUser] = useState(null); // the full user object when editing

  // ── Form fields (shared by add & edit) ──
  const [formName,   setFormName]   = useState('');
  const [formPhone,  setFormPhone]  = useState('');
  const [formEmail,  setFormEmail]  = useState('');
  const [formDept,   setFormDept]   = useState(null);   // dept id
  const [formStatus, setFormStatus] = useState('offline');

  // ── Load ──
  useEffect(() => { loadDepartments(); }, []);
  useEffect(() => { loadUsers(); }, [selectedDept]);

  const loadDepartments = async () => {
    try {
      const depts = await getDepartments();
      setDepartments(depts);
    } catch (e) { console.error('Depts error:', e); }
  };

  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getDepartmentUsers(selectedDept);
      setUsers(data);
    } catch (e) {
      console.error('Users error:', e);
      Alert.alert('Error', 'Failed to load users.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedDept]);

  // ── Open Add modal (blank form) ──
  const openAddModal = () => {
    setFormName('');
    setFormPhone('');
    setFormEmail('');
    setFormDept(null);
    setFormStatus('offline');
    setEditingUser(null);
    setModalMode('add');
  };

  // ── Open Edit modal (pre-fill form with selected user) ──
  const openEditModal = (user) => {
    setFormName(user.name || '');
    setFormPhone(user.phone || '');
    setFormEmail(user.email || '');
    setFormDept(user.departmentId || null);
    setFormStatus(user.status || 'offline');
    setEditingUser(user);
    setModalMode('edit');
  };

  // ── Close modal & reset ──
  const closeModal = () => {
    setModalMode(null);
    setEditingUser(null);
  };

  // ── Submit: Create ──
  const handleCreate = async () => {
    if (!formName.trim() || !formPhone.trim() || !formDept) {
      Alert.alert('Validation', 'Please fill in name, phone, and select a department.');
      return;
    }
    setSubmitting(true);
    try {
      await createDepartmentUser({
        name:         formName.trim(),
        phone:        formPhone.trim(),
        email:        formEmail.trim(),
        departmentId: formDept,
      });
      closeModal();
      loadUsers();
      Alert.alert('Success', 'User created successfully.');
    } catch (e) {
      console.error('Create error:', e);
      Alert.alert('Error', 'Failed to create user.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Submit: Update ──
  const handleUpdate = async () => {
    if (!formName.trim() || !formPhone.trim() || !formDept) {
      Alert.alert('Validation', 'Please fill in name, phone, and select a department.');
      return;
    }
    setSubmitting(true);
    try {
      await updateDepartmentUser(editingUser.id, {
        name:         formName.trim(),
        phone:        formPhone.trim(),
        email:        formEmail.trim(),
        departmentId: formDept,
        status:       formStatus,
      });
      closeModal();
      loadUsers();
      Alert.alert('Success', 'User updated successfully.');
    } catch (e) {
      console.error('Update error:', e);
      Alert.alert('Error', 'Failed to update user.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Helpers ──
  const getDeptName = (deptId) => {
    const d = departments.find((dept) => dept.id === deptId);
    return d ? d.name : deptId || '—';
  };

  const getDeptColorForUser = (deptId) => {
    const d = departments.find((dept) => dept.id === deptId);
    return d ? getDeptIcon(d.name).color : '#6366f1';
  };

  // ── Render User Card ──
  const renderUser = ({ item }) => {
    const deptColor = getDeptColorForUser(item.departmentId);
    const isActive  = item.status === 'active' || item.status === 'working';

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => openEditModal(item)}
        activeOpacity={0.7}
      >
        {/* Avatar */}
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{item.name?.charAt(0)?.toUpperCase() || 'U'}</Text>
          <View style={[styles.onlineDot, { backgroundColor: isActive ? '#22c55e' : '#475569' }]} />
        </View>

        {/* Info */}
        <View style={styles.info}>
          <Text style={styles.userName}>{item.name}</Text>
          <View style={styles.deptTag}>
            <View style={[styles.deptTagDot, { backgroundColor: deptColor }]} />
            <Text style={[styles.deptTagText, { color: deptColor }]}>{getDeptName(item.departmentId)}</Text>
          </View>
          <Text style={styles.userPhone}>{item.phone || '—'}</Text>
        </View>

        {/* Edit chevron + status */}
        <View style={styles.cardRight}>
          <Text style={[styles.statusLabel, { color: isActive ? '#22c55e' : '#64748b' }]}>
            {item.status || 'Offline'}
          </Text>
          <Ionicons name="chevron-forward" size={18} color="#475569" style={{ marginTop: 6 }} />
        </View>
      </TouchableOpacity>
    );
  };

  // ──────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Department Users</Text>
        <TouchableOpacity style={styles.addButton} onPress={openAddModal}>
          <Ionicons name="add" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Filter Chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterList}>
        <TouchableOpacity
          style={[styles.chip, !selectedDept && styles.chipActive]}
          onPress={() => setSelectedDept(null)}
        >
          <Text style={[styles.chipText, !selectedDept && styles.chipTextActive]}>All</Text>
        </TouchableOpacity>

        {departments.map((dept) => {
          const active = selectedDept === dept.id;
          const icon   = getDeptIcon(dept.name);
          return (
            <TouchableOpacity
              key={dept.id}
              style={[styles.chip, active && { backgroundColor: icon.color, borderColor: icon.color }]}
              onPress={() => setSelectedDept(dept.id)}
            >
              <Ionicons name={icon.iconName} size={14} color={active ? '#fff' : icon.color} style={{ marginRight: 5 }} />
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{dept.name}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Users List */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8b5cf6" />
        </View>
      ) : (
        <FlatList
          data={users}
          renderItem={renderUser}
          keyExtractor={(item) => item.id?.toString()}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.emptyText}>No users found.</Text>}
        />
      )}

      {/* ════════════════════════════════════════
          MODAL — shared layout for Add & Edit
          ════════════════════════════════════════ */}
      <Modal
        animationType="slide"
        transparent
        visible={modalMode !== null}
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>

            {/* Title row */}
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>
                {modalMode === 'edit' ? 'Edit User' : 'Add User'}
              </Text>
              <TouchableOpacity onPress={closeModal}>
                <Ionicons name="close" size={22} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={styles.modalScroll}>

              {/* Name */}
              <Text style={styles.inputLabel}>Full Name</Text>
              <TextInput
                style={styles.input}
                placeholder="John Doe"
                placeholderTextColor="#64748b"
                value={formName}
                onChangeText={setFormName}
                autoCapitalize="words"
              />

              {/* Phone */}
              <Text style={styles.inputLabel}>Phone Number</Text>
              <TextInput
                style={styles.input}
                placeholder="+92 300 0000000"
                placeholderTextColor="#64748b"
                value={formPhone}
                onChangeText={setFormPhone}
                keyboardType="phone-pad"
              />

              {/* Email */}
              <Text style={styles.inputLabel}>Email (optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="john@example.com"
                placeholderTextColor="#64748b"
                value={formEmail}
                onChangeText={setFormEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              {/* Department Picker */}
              <Text style={styles.inputLabel}>Department</Text>
              <ScrollView style={styles.deptPicker} nestedScrollEnabled>
                {departments.map((dept) => {
                  const active = formDept === dept.id;
                  const icon   = getDeptIcon(dept.name);
                  return (
                    <TouchableOpacity
                      key={dept.id}
                      style={[styles.deptPickerItem, active && styles.deptPickerItemActive]}
                      onPress={() => setFormDept(dept.id)}
                    >
                      <View style={[styles.deptPickerIconBg, { backgroundColor: icon.color + '22' }]}>
                        <Ionicons name={icon.iconName} size={16} color={icon.color} />
                      </View>
                      <Text style={[styles.deptPickerText, active && styles.deptPickerTextActive]}>{dept.name}</Text>
                      {active && <Ionicons name="checkmark" size={18} color="#8b5cf6" />}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Status — only shown in Edit mode */}
              {modalMode === 'edit' && (
                <>
                  <Text style={styles.inputLabel}>Status</Text>
                  <View style={styles.statusRow}>
                    {USER_STATUS_OPTIONS.map((s) => {
                      const active = formStatus === s;
                      const dotColor = s === 'offline' ? '#64748b' : '#22c55e';
                      return (
                        <TouchableOpacity
                          key={s}
                          style={[styles.statusChip, active && styles.statusChipActive]}
                          onPress={() => setFormStatus(s)}
                        >
                          <View style={[styles.statusChipDot, { backgroundColor: dotColor }]} />
                          <Text style={[styles.statusChipText, active && styles.statusChipTextActive]}>
                            {s.charAt(0).toUpperCase() + s.slice(1)}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </>
              )}

              {/* Buttons */}
              <View style={styles.modalButtons}>
                <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={closeModal}>
                  <Text style={styles.buttonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.saveButton]}
                  onPress={modalMode === 'edit' ? handleUpdate : handleCreate}
                  disabled={submitting}
                >
                  {submitting ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.buttonText}>
                      {modalMode === 'edit' ? 'Update' : 'Create'}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },

  // Header
  header:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  backButton: { padding: 8 },
  title:      { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  addButton:  { width: 38, height: 38, borderRadius: 19, backgroundColor: '#8b5cf6', alignItems: 'center', justifyContent: 'center' },

  // Filter chips
  filterScroll: { borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  filterList:   { paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  chip:         { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: '#1e293b', borderWidth: 1, borderColor: '#334155' },
  chipActive:   { backgroundColor: '#8b5cf6', borderColor: '#8b5cf6' },
  chipText:     { color: '#94a3b8', fontSize: 13, fontWeight: '500' },
  chipTextActive: { color: '#fff' },

  // List
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list:      { padding: 16 },
  card:      { backgroundColor: '#1e293b', borderRadius: 14, padding: 14, marginBottom: 10, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#334155' },
  avatar:    { width: 48, height: 48, borderRadius: 24, backgroundColor: '#334155', alignItems: 'center', justifyContent: 'center', marginRight: 14, position: 'relative' },
  avatarText:{ color: '#fff', fontSize: 19, fontWeight: 'bold' },
  onlineDot: { position: 'absolute', bottom: 1, right: 1, width: 12, height: 12, borderRadius: 6, borderWidth: 2, borderColor: '#0f172a' },
  info:      { flex: 1 },
  userName:  { color: '#fff', fontSize: 16, fontWeight: '600', marginBottom: 3 },
  deptTag:   { flexDirection: 'row', alignItems: 'center', marginBottom: 3 },
  deptTagDot:{ width: 7, height: 7, borderRadius: 4, marginRight: 5 },
  deptTagText:{ fontSize: 12, fontWeight: '500' },
  userPhone: { color: '#64748b', fontSize: 12 },
  cardRight: { alignItems: 'flex-end' },
  statusLabel:{ fontSize: 12, fontWeight: '600', textTransform: 'capitalize' },
  emptyText: { color: '#64748b', textAlign: 'center', marginTop: 48, fontSize: 15 },

  // Modal
  modalOverlay:  { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  modalContent:  { backgroundColor: '#1e293b', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '88%' },
  modalHeaderRow:{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle:    { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  modalScroll:   { },
  inputLabel:    { color: '#94a3b8', fontSize: 13, fontWeight: '500', marginBottom: 5, marginTop: 2 },
  input:         { backgroundColor: '#334155', borderRadius: 10, padding: 12, color: '#fff', fontSize: 15, marginBottom: 14 },

  // Dept picker inside modal
  deptPicker:            { maxHeight: 160, marginBottom: 16, backgroundColor: '#334155', borderRadius: 10, overflow: 'hidden' },
  deptPickerItem:        { flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  deptPickerItemActive:  { backgroundColor: '#475569' },
  deptPickerIconBg:      { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  deptPickerText:        { color: '#cbd5e1', fontSize: 14, flex: 1 },
  deptPickerTextActive:  { color: '#fff', fontWeight: '600' },

  // Status chips (edit mode only)
  statusRow:             { flexDirection: 'row', gap: 8, marginBottom: 16 },
  statusChip:            { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#334155', borderWidth: 1, borderColor: '#475569' },
  statusChipActive:      { backgroundColor: '#8b5cf6', borderColor: '#8b5cf6' },
  statusChipDot:         { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  statusChipText:        { color: '#94a3b8', fontSize: 13, fontWeight: '500' },
  statusChipTextActive:  { color: '#fff' },

  // Buttons
  modalButtons:  { flexDirection: 'row', gap: 12, marginTop: 4 },
  modalButton:   { flex: 1, padding: 14, borderRadius: 10, alignItems: 'center' },
  cancelButton:  { backgroundColor: '#475569' },
  saveButton:    { backgroundColor: '#8b5cf6' },
  buttonText:    { color: '#fff', fontWeight: '600', fontSize: 16 },
});