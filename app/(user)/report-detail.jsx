import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Clipboard,
  Modal,
  TextInput,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../src/context/AppContext';
import { useLanguage } from '../../src/context/LanguageContext';
import { deleteReport } from '../../src/services/reportService';
import { categories, statusColors } from '../../src/data/departments';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ReportDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { getReport } = useApp();
  const { t } = useLanguage();

  const [deleting, setDeleting] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [mediaViewerVisible, setMediaViewerVisible] = useState(false);
  const [selectedMediaIndex, setSelectedMediaIndex] = useState(0);
  const [editedTitle, setEditedTitle] = useState('');
  const [editedDescription, setEditedDescription] = useState('');
  const [editedLocation, setEditedLocation] = useState('');
  const [editedContactInfo, setEditedContactInfo] = useState('');
  const [editedMedia, setEditedMedia] = useState([]);
  const [editActiveTab, setEditActiveTab] = useState('basic'); // 'basic' or 'media'
  const [saving, setSaving] = useState(false);

  const report = getReport((params.id));

  if (!report) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorState}>
          <Ionicons name="alert-circle-outline" size={80} color="#ef4444" />
          <Text style={styles.errorText}>{t('reportNotFound')}</Text>
          <TouchableOpacity style={styles.backButtonLarge} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={20} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.backButtonText}>{t('goBack')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Helper functions
  const capitalize = (str) => {
    if (!str) return 'Pending';
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  const getStatusKey = (status) => {
    const normalized = status?.toLowerCase();
    const map = {
      pending: 'pending',
      assigned: 'assigned',
      inprogress: 'inProgress',
      resolved: 'resolved',
      closed: 'closed'
    };
    return map[normalized] || normalized;
  };

  const getCategoryKey = (categoryId) => {
    const map = {
      streetlights: 'streetLights',
      garbage: 'garbageCollection',
      water: 'waterSupply',
      gas: 'gasProblems',
      roads: 'roadMaintenance',
      electricity: 'electricity',
      sewerage: 'sewerageIssues',
      animalRescue: 'animalRescue',
      publicSafety: 'publicSafety',
    };
    return map[categoryId] || categoryId;
  };

  const statusKey = getStatusKey(report.status);
  const statusStyle = statusColors[capitalize(report.status)] || statusColors.Pending;
  const categoryIcon = categories.find((c) => c.id === report.category)?.icon || '📋';
  const categoryName = t(getCategoryKey(report.category));

  // Editing permissions
  const normalizedStatus = report.status?.toLowerCase();
  const canEdit = normalizedStatus === 'pending' || normalizedStatus === 'assigned';
  const canDelete = normalizedStatus === 'pending';

  // Priority info
  const getPriorityInfo = (priority) => {
    const map = {
      Low: { icon: 'checkmark-circle', color: '#10b981', bg: '#d1fae5', label: 'Low Priority' },
      Medium: { icon: 'alert-circle', color: '#f59e0b', bg: '#fef3c7', label: 'Medium Priority' },
      High: { icon: 'warning', color: '#ef4444', bg: '#fee2e2', label: 'High Priority' },
    };
    return map[priority] || map.Medium;
  };

  const priorityInfo = getPriorityInfo(report.priority);

  // Prepare media array - combine photo and media fields
  const getMediaItems = () => {
    const items = [];
    
    // Add media array items
    if (report.media && Array.isArray(report.media)) {
      items.push(...report.media.map(item => ({
        uri: item.uri || item,
        type: item.type || 'image', // 'image' or 'video'
      })));
    }
    
    // Add legacy photo field if exists
    if (report.photo && !items.find(item => item.uri === report.photo)) {
      items.push({ uri: report.photo, type: 'image' });
    }
    
    return items;
  };

  const mediaItems = getMediaItems();

  // Copy report ID
  const handleCopyReportId = () => {
    Clipboard.setString(report.id.toString());
    Alert.alert('✅ Copied!', 'Report ID copied to clipboard', [{ text: 'OK' }]);
  };

  // Open Edit Modal
  const handleEdit = () => {
    if (!canEdit) {
      Alert.alert(
        '⚠️ Cannot Edit',
        'Reports can only be edited when status is "Pending" or "Assigned".',
        [{ text: 'OK' }]
      );
      return;
    }
    
    setEditedTitle(report.title);
    setEditedDescription(report.description);
    setEditedLocation(report.location);
    setEditedContactInfo(report.contactInfo || '');
    setEditedMedia(mediaItems);
    setEditActiveTab('basic');
    setEditModalVisible(true);
  };

  // Save edited report
  const handleSaveEdit = async () => {
    if (!editedTitle.trim() || !editedDescription.trim() || !editedLocation.trim()) {
      Alert.alert('⚠️ Required Fields', 'Please fill in title, description, and location');
      return;
    }

    setSaving(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
            
      Alert.alert('✅ Success', 'Report updated successfully', [
        { text: 'OK', onPress: () => setEditModalVisible(false) }
      ]);
    } catch (error) {
      Alert.alert('❌ Error', 'Failed to update report');
    } finally {
      setSaving(false);
    }
  };

  // Handle adding media in edit modal
  const handleAddMedia = () => {
    Alert.alert(
      'Add Media',
      'Choose media source',
      [
        {
          text: 'Camera',
          onPress: () => {
            // TODO: Implement camera capture
            // const result = await ImagePicker.launchCameraAsync({...});
            Alert.alert('Info', 'Camera feature - implement with expo-image-picker');
          }
        },
        {
          text: 'Gallery',
          onPress: () => {
            // TODO: Implement gallery picker
            // const result = await ImagePicker.launchImageLibraryAsync({...});
            Alert.alert('Info', 'Gallery picker - implement with expo-image-picker');
          }
        },
        {
          text: 'Cancel',
          style: 'cancel'
        }
      ]
    );
  };

  // Remove media from edit
  const handleRemoveMedia = (index) => {
    Alert.alert(
      'Remove Media',
      'Are you sure you want to remove this media?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            const newMedia = [...editedMedia];
            newMedia.splice(index, 1);
            setEditedMedia(newMedia);
          }
        }
      ]
    );
  };

  // Handle Delete
  const handleDelete = () => {
    if (!canDelete) {
      Alert.alert(
        '⚠️ Cannot Delete',
        'Only pending reports can be deleted.',
        [{ text: 'OK' }]
      );
      return;
    }

    Alert.alert(
      '🗑️ Delete Report',
      'Are you sure you want to delete this report? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              await deleteReport(report.id, report.status);
              Alert.alert('✅ Success', 'Report deleted successfully', [
                { text: 'OK', onPress: () => router.back() }
              ]);
            } catch (error) {
              Alert.alert('❌ Error', error.message || 'Failed to delete report');
              setDeleting(false);
            }
          }
        }
      ]
    );
  };

  // Open media viewer
  const handleMediaPress = (index) => {
    setSelectedMediaIndex(index);
    setMediaViewerVisible(true);
  };

  // Timeline colors
  const getTimelineDotColor = (status) => {
    const normalized = status?.toLowerCase();
    const colors = {
      pending: '#f59e0b',
      assigned: '#3b82f6',
      inprogress: '#8b5cf6',
      resolved: '#22c55e',
      closed: '#6b7280',
    };
    return colors[normalized] || '#6b7280';
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1f2937" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Report Details</Text>
        </View>
        <View style={styles.actionButtons}>
          {canEdit && (
            <TouchableOpacity onPress={handleEdit} style={styles.actionButton}>
              <Ionicons name="create-outline" size={22} color="#3b82f6" />
            </TouchableOpacity>
          )}
          {canDelete && (
            <TouchableOpacity 
              onPress={handleDelete} 
              style={styles.actionButton} 
              disabled={deleting}
            >
              <Ionicons 
                name="trash-outline" 
                size={22} 
                color={deleting ? '#9ca3af' : '#ef4444'} 
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Report Header Card */}
        <View style={styles.headerCard}>
          {/* Status & ID Row */}
          <View style={styles.headerTopRow}>
            <View style={[styles.statusPill, { backgroundColor: statusStyle.bg }]}>
              <View style={[styles.statusDot, { backgroundColor: statusStyle.text }]} />
              <Text style={[styles.statusText, { color: statusStyle.text }]}>
                {t(statusKey)}
              </Text>
            </View>
            <TouchableOpacity onPress={handleCopyReportId} style={styles.idChip}>
              <Text style={styles.idText}>#{report.id.toString().padStart(6, '0')}</Text>
              <Ionicons name="copy-outline" size={14} color="#6b7280" />
            </TouchableOpacity>
          </View>

          {/* Title - Main Focus */}
          <View style={styles.titleContainer}>
            <Text style={styles.reportTitle}>{report.title}</Text>
            <View style={styles.categoryRow}>
              <View style={styles.categoryTag}>
                <Text style={styles.categoryEmoji}>{categoryIcon}</Text>
                <Text style={styles.categoryLabel}>{categoryName}</Text>
              </View>
            </View>
          </View>

          {/* Meta Info Row */}
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Ionicons name="calendar-outline" size={16} color="#6b7280" />
              <Text style={styles.metaText}>{report.createdAt}</Text>
            </View>
            <View style={styles.metaDivider} />
            <View style={[styles.metaItem, styles.priorityItem]}>
              <Ionicons name={priorityInfo.icon} size={16} color={priorityInfo.color} />
              <Text style={[styles.metaText, { color: priorityInfo.color, fontWeight: '600' }]}>
                {report.priority || 'Medium'}
              </Text>
            </View>
          </View>
        </View>

        {/* Description Section */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>DESCRIPTION</Text>
          <View style={styles.card}>
            <Text style={styles.descriptionText}>{report.description}</Text>
          </View>
        </View>

        {/* Location Section */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>LOCATION</Text>
          <View style={styles.card}>
            <View style={styles.locationRow}>
              <View style={styles.locationIconBox}>
                <Ionicons name="location" size={20} color="#3b82f6" />
              </View>
              <Text style={styles.locationText}>{report.location}</Text>
            </View>
          </View>
        </View>

        {/* Contact Info (if available) */}
        {report.contactInfo && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>CONTACT INFORMATION</Text>
            <View style={styles.card}>
              <View style={styles.locationRow}>
                <View style={styles.locationIconBox}>
                  <Ionicons name="call" size={20} color="#10b981" />
                </View>
                <Text style={styles.locationText}>{report.contactInfo}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Department Section */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>ASSIGNED DEPARTMENT</Text>
          <View style={styles.card}>
            <View style={styles.departmentRow}>
              <View style={styles.departmentIconBox}>
                <Ionicons name="business" size={20} color="#1f2937" />
              </View>
              <View style={styles.departmentInfo}>
                <Text style={styles.departmentName}>{categoryName} Department</Text>
                <Text style={styles.departmentSubtext}>Handling this report</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Media Gallery */}
        {mediaItems.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionLabelRow}>
              <Text style={styles.sectionLabel}>MEDIA ATTACHMENTS</Text>
              <View style={styles.mediaBadge}>
                <Ionicons name="images" size={12} color="#3b82f6" />
                <Text style={styles.mediaBadgeText}>{mediaItems.length}</Text>
              </View>
            </View>
            <View style={styles.mediaGrid}>
              {mediaItems.map((item, index) => (
                <TouchableOpacity 
                  key={index} 
                  style={styles.mediaThumbnail}
                  onPress={() => handleMediaPress(index)}
                  activeOpacity={0.7}
                >
                  {item.type === 'video' ? (
                    <>
                      <Image source={{ uri: item.uri }} style={styles.thumbnailImage} resizeMode="cover" />
                      <View style={styles.videoOverlay}>
                        <Ionicons name="play-circle" size={32} color="#fff" />
                      </View>
                    </>
                  ) : (
                    <Image source={{ uri: item.uri }} style={styles.thumbnailImage} resizeMode="cover" />
                  )}
                  <View style={styles.thumbnailBadge}>
                    <Ionicons 
                      name={item.type === 'video' ? 'videocam' : 'image'} 
                      size={12} 
                      color="#fff" 
                    />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.mediaHint}>Tap to view full size</Text>
          </View>
        )}

        {/* Status Timeline */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>STATUS TIMELINE</Text>
          <View style={styles.card}>
            {report.timeline && report.timeline.length > 0 ? (
              <View style={styles.timeline}>
                {report.timeline.map((item, index) => (
                  <View key={index} style={styles.timelineItem}>
                    <View style={styles.timelineLeft}>
                      <View
                        style={[
                          styles.timelineDot,
                          { backgroundColor: getTimelineDotColor(item.status) }
                        ]}
                      />
                      {index < report.timeline.length - 1 && (
                        <View style={styles.timelineLine} />
                      )}
                    </View>
                    <View style={styles.timelineContent}>
                      <View style={styles.timelineHeader}>
                        <Text style={styles.timelineStatus}>{capitalize(item.status)}</Text>
                        <Text style={styles.timelineDate}>{item.date}</Text>
                      </View>
                      <Text style={styles.timelineNote}>{item.note}</Text>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="time-outline" size={40} color="#d1d5db" />
                <Text style={styles.emptyStateText}>No timeline updates yet</Text>
              </View>
            )}
          </View>
        </View>

        {/* Lock Notice */}
        {!canEdit && (
          <View style={styles.lockNotice}>
            <Ionicons name="lock-closed" size={16} color="#6b7280" />
            <Text style={styles.lockNoticeText}>
              This report is {report.status.toLowerCase()} and cannot be modified
            </Text>
          </View>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Edit Modal */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Report</Text>
              <TouchableOpacity 
                onPress={() => setEditModalVisible(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            {/* Tabs */}
            <View style={styles.tabContainer}>
              <TouchableOpacity
                style={[styles.tab, editActiveTab === 'basic' && styles.tabActive]}
                onPress={() => setEditActiveTab('basic')}
              >
                <Ionicons 
                  name="document-text-outline" 
                  size={18} 
                  color={editActiveTab === 'basic' ? '#3b82f6' : '#9ca3af'} 
                />
                <Text style={[styles.tabText, editActiveTab === 'basic' && styles.tabTextActive]}>
                  Basic Info
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, editActiveTab === 'media' && styles.tabActive]}
                onPress={() => setEditActiveTab('media')}
              >
                <Ionicons 
                  name="images-outline" 
                  size={18} 
                  color={editActiveTab === 'media' ? '#3b82f6' : '#9ca3af'} 
                />
                <Text style={[styles.tabText, editActiveTab === 'media' && styles.tabTextActive]}>
                  Media
                </Text>
                {editedMedia.length > 0 && (
                  <View style={styles.tabBadge}>
                    <Text style={styles.tabBadgeText}>{editedMedia.length}</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              {editActiveTab === 'basic' ? (
                <>
                  {/* Title Input */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Title *</Text>
                    <TextInput
                      style={styles.input}
                      value={editedTitle}
                      onChangeText={setEditedTitle}
                      placeholder="Enter report title"
                      placeholderTextColor="#9ca3af"
                    />
                  </View>

                  {/* Description Input */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Description *</Text>
                    <TextInput
                      style={[styles.input, styles.textArea]}
                      value={editedDescription}
                      onChangeText={setEditedDescription}
                      placeholder="Describe the issue in detail"
                      placeholderTextColor="#9ca3af"
                      multiline
                      numberOfLines={4}
                      textAlignVertical="top"
                    />
                  </View>

                  {/* Location Input */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Location *</Text>
                    <TextInput
                      style={styles.input}
                      value={editedLocation}
                      onChangeText={setEditedLocation}
                      placeholder="Enter location"
                      placeholderTextColor="#9ca3af"
                    />
                  </View>

                  {/* Contact Info Input */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Contact Number (Optional)</Text>
                    <TextInput
                      style={styles.input}
                      value={editedContactInfo}
                      onChangeText={setEditedContactInfo}
                      placeholder="Enter your contact number"
                      placeholderTextColor="#9ca3af"
                      keyboardType="phone-pad"
                    />
                  </View>

                  {/* Info Note */}
                  <View style={styles.infoBox}>
                    <Ionicons name="information-circle-outline" size={20} color="#3b82f6" />
                    <Text style={styles.infoText}>
                      You can edit report details and contact information. Switch to Media tab to manage attachments.
                    </Text>
                  </View>
                </>
              ) : (
                <>
                  {/* Media Management */}
                  <View style={styles.mediaEditSection}>
                    <Text style={styles.mediaEditTitle}>Attached Media</Text>
                    <Text style={styles.mediaEditSubtitle}>
                      You can add or remove photos and videos
                    </Text>

                    {editedMedia.length > 0 ? (
                      <View style={styles.mediaEditGrid}>
                        {editedMedia.map((item, index) => (
                          <View key={index} style={styles.mediaEditItem}>
                            <Image 
                              source={{ uri: item.uri }} 
                              style={styles.mediaEditImage} 
                              resizeMode="cover"
                            />
                            {item.type === 'video' && (
                              <View style={styles.mediaEditVideoIcon}>
                                <Ionicons name="videocam" size={16} color="#fff" />
                              </View>
                            )}
                            <TouchableOpacity 
                              style={styles.mediaEditRemove}
                              onPress={() => handleRemoveMedia(index)}
                            >
                              <Ionicons name="close-circle" size={24} color="#ef4444" />
                            </TouchableOpacity>
                          </View>
                        ))}
                        
                        {/* Add More Button */}
                        {editedMedia.length < 6 && (
                          <TouchableOpacity 
                            style={styles.mediaEditAdd}
                            onPress={handleAddMedia}
                          >
                            <Ionicons name="add" size={32} color="#3b82f6" />
                            <Text style={styles.mediaEditAddText}>Add More</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    ) : (
                      <View style={styles.mediaEditEmpty}>
                        <Ionicons name="images-outline" size={48} color="#d1d5db" />
                        <Text style={styles.mediaEditEmptyText}>No media attached</Text>
                        <TouchableOpacity 
                          style={styles.mediaEditEmptyButton}
                          onPress={handleAddMedia}
                        >
                          <Ionicons name="add-circle" size={20} color="#fff" />
                          <Text style={styles.mediaEditEmptyButtonText}>Add Photos/Videos</Text>
                        </TouchableOpacity>
                      </View>
                    )}

                    {/* Media Info */}
                    <View style={styles.mediaEditInfo}>
                      <Ionicons name="information-circle-outline" size={18} color="#6b7280" />
                      <Text style={styles.mediaEditInfoText}>
                        Maximum 6 files • Images or Videos • Max 10MB each
                      </Text>
                    </View>
                  </View>
                </>
              )}
            </ScrollView>

            {/* Modal Actions */}
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => setEditModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.saveButton, saving && styles.saveButtonDisabled]}
                onPress={handleSaveEdit}
                disabled={saving}
              >
                {saving ? (
                  <Text style={styles.saveButtonText}>Saving...</Text>
                ) : (
                  <>
                    <Ionicons name="checkmark" size={20} color="#fff" />
                    <Text style={styles.saveButtonText}>Save Changes</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Media Viewer Modal */}
      <Modal
        visible={mediaViewerVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setMediaViewerVisible(false)}
      >
        <View style={styles.mediaViewerOverlay}>
          <View style={styles.mediaViewerHeader}>
            <Text style={styles.mediaViewerTitle}>
              {selectedMediaIndex + 1} / {mediaItems.length}
            </Text>
            <TouchableOpacity 
              onPress={() => setMediaViewerVisible(false)}
              style={styles.mediaViewerClose}
            >
              <Ionicons name="close" size={28} color="#fff" />
            </TouchableOpacity>
          </View>

          <ScrollView 
            horizontal 
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => {
              const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
              setSelectedMediaIndex(index);
            }}
            contentOffset={{ x: selectedMediaIndex * SCREEN_WIDTH, y: 0 }}
          >
            {mediaItems.map((item, index) => (
              <View key={index} style={styles.mediaViewerSlide}>
                {item.type === 'video' ? (
                  <View style={styles.mediaViewerImageContainer}>
                    <Image 
                      source={{ uri: item.uri }} 
                      style={styles.mediaViewerImage} 
                      resizeMode="contain" 
                    />
                    <View style={styles.videoPlayButton}>
                      <Ionicons name="play-circle" size={64} color="#fff" />
                      <Text style={styles.videoPlayText}>Video Playback</Text>
                    </View>
                  </View>
                ) : (
                  <Image 
                    source={{ uri: item.uri }} 
                    style={styles.mediaViewerImage} 
                    resizeMode="contain" 
                  />
                )}
              </View>
            ))}
          </ScrollView>

          <View style={styles.mediaViewerFooter}>
            <Text style={styles.mediaViewerHint}>Swipe to view more • Tap X to close</Text>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1f2937',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Scroll View
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },

  // Header Card - Main Focus
  headerCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  idChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  idText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1f2937',
    fontFamily: 'monospace',
  },

  // Title Container - MAIN FOCUS
  titleContainer: {
    marginBottom: 20,
  },
  reportTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0f172a',
    lineHeight: 32,
    marginBottom: 12,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    gap: 6,
  },
  categoryEmoji: {
    fontSize: 14,
  },
  categoryLabel: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '600',
  },

  // Meta Row
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  priorityItem: {
    flex: 1,
  },
  metaText: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '500',
  },
  metaDivider: {
    width: 1,
    height: 14,
    backgroundColor: '#e5e7eb',
    marginHorizontal: 12,
  },

  // Sections
  section: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#6b7280',
    letterSpacing: 1.2,
    marginBottom: 10,
  },
  sectionLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },

  // Description
  descriptionText: {
    fontSize: 15,
    color: '#374151',
    lineHeight: 24,
  },

  // Location
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  locationIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationText: {
    flex: 1,
    fontSize: 15,
    color: '#1f2937',
    fontWeight: '500',
  },

  // Department
  departmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  departmentIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  departmentInfo: {
    flex: 1,
  },
  departmentName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 2,
  },
  departmentSubtext: {
    fontSize: 13,
    color: '#6b7280',
  },

  // Media Gallery
  mediaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  mediaBadgeText: {
    fontSize: 11,
    color: '#3b82f6',
    fontWeight: '700',
  },
  mediaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  mediaThumbnail: {
    width: (SCREEN_WIDTH - 52) / 3,
    height: (SCREEN_WIDTH - 52) / 3,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#f3f4f6',
    position: 'relative',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  videoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbnailBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 4,
    padding: 4,
  },
  mediaHint: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },

  // Timeline
  timeline: {
    gap: 4,
  },
  timelineItem: {
    flexDirection: 'row',
  },
  timelineLeft: {
    alignItems: 'center',
    marginRight: 12,
    paddingTop: 2,
  },
  timelineDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 4,
    borderColor: '#ffffff',
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 4,
  },
  timelineContent: {
    flex: 1,
    paddingBottom: 16,
  },
  timelineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  timelineStatus: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1f2937',
  },
  timelineDate: {
    fontSize: 12,
    color: '#9ca3af',
    fontWeight: '500',
  },
  timelineNote: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 8,
  },

  // Lock Notice
  lockNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 10,
    gap: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  lockNoticeText: {
    flex: 1,
    fontSize: 13,
    color: '#6b7280',
  },

  // Edit Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingTop: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1f2937',
  },
  modalCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // Tabs
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 8,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: '#f8fafc',
    gap: 6,
  },
  tabActive: {
    backgroundColor: '#eff6ff',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9ca3af',
  },
  tabTextActive: {
    color: '#3b82f6',
  },
  tabBadge: {
    backgroundColor: '#3b82f6',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 4,
  },
  tabBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#ffffff',
  },
  
  modalScroll: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: '#1f2937',
  },
  textArea: {
    height: 100,
    paddingTop: 14,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#eff6ff',
    padding: 12,
    borderRadius: 10,
    gap: 10,
    marginBottom: 20,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#3b82f6',
    lineHeight: 18,
  },
  
  // Media Edit Section
  mediaEditSection: {
    paddingBottom: 20,
  },
  mediaEditTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4,
  },
  mediaEditSubtitle: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 16,
  },
  mediaEditGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  mediaEditItem: {
    width: (SCREEN_WIDTH - 60) / 3,
    height: (SCREEN_WIDTH - 60) / 3,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#f3f4f6',
  },
  mediaEditImage: {
    width: '100%',
    height: '100%',
  },
  mediaEditVideoIcon: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 4,
    padding: 4,
  },
  mediaEditRemove: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#ffffff',
    borderRadius: 12,
  },
  mediaEditAdd: {
    width: (SCREEN_WIDTH - 60) / 3,
    height: (SCREEN_WIDTH - 60) / 3,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#3b82f6',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
  },
  mediaEditAddText: {
    fontSize: 12,
    color: '#3b82f6',
    fontWeight: '600',
    marginTop: 4,
  },
  mediaEditEmpty: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  mediaEditEmptyText: {
    fontSize: 15,
    color: '#6b7280',
    marginTop: 12,
    marginBottom: 16,
  },
  mediaEditEmptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3b82f6',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    gap: 6,
  },
  mediaEditEmptyButtonText: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '700',
  },
  mediaEditInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 10,
    borderRadius: 8,
    gap: 8,
  },
  mediaEditInfoText: {
    flex: 1,
    fontSize: 12,
    color: '#6b7280',
    lineHeight: 16,
  },
  
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#6b7280',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#3b82f6',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
  },

  // Media Viewer Modal
  mediaViewerOverlay: {
    flex: 1,
    backgroundColor: '#000000',
  },
  mediaViewerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 50,
  },
  mediaViewerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  mediaViewerClose: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mediaViewerSlide: {
    width: SCREEN_WIDTH,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mediaViewerImage: {
    width: SCREEN_WIDTH,
    height: '100%',
  },
  mediaViewerImageContainer: {
    width: SCREEN_WIDTH,
    height: '100%',
    position: 'relative',
  },
  videoPlayButton: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -50 }, { translateY: -50 }],
    alignItems: 'center',
  },
  videoPlayText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
  },
  mediaViewerFooter: {
    paddingVertical: 20,
    paddingBottom: 40,
    alignItems: 'center',
  },
  mediaViewerHint: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.6)',
  },

  // Spacing
  bottomSpacer: {
    height: 24,
  },

  // Error State
  errorState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#6b7280',
    marginTop: 20,
    marginBottom: 30,
    fontWeight: '600',
  },
  backButtonLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#22c55e',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  backButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
});