import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Image, Platform, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../src/context/AppContext';
import { useLanguage } from '../../src/context/LanguageContext';
import { categories, landmarks } from '../../src/data/departments';

export default function CreateReportScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { addReport, currentUser } = useApp(); // ← currentUser was already here, just destructure it
  const { t } = useLanguage();

  // State
  const [category, setCategory] = useState(params.category || null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState(""); 
  const [originalLocation, setOriginalLocation] = useState(null);
  const [editedLocation, setEditedLocation] = useState(null);
  const [priority, setPriority] = useState('Medium');
  const [contactInfo, setContactInfo] = useState('');
  const [mediaItems, setMediaItems] = useState([]);
  const [isLocating, setIsLocating] = useState(false);

  // Auto-fetch location when category is selected
  useEffect(() => {
    if (category && !originalLocation) {
      console.log('Fetching GPS location...');
      getCurrentLocation();
    }
  }, [category, originalLocation]);

  useEffect(() => {
    console.log('Original location:', originalLocation);
    console.log('Location text:', location);
  }, [originalLocation, location]);

  const getCategoryDetails = (id) => categories.find(c => c.id === id);
  const selectedCategoryDetails = category ? getCategoryDetails(category) : null;

  // --- Actions ---

  const getCurrentLocation = async () => {
    setIsLocating(true);
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      console.log('Location permission denied');
      setIsLocating(false);
      return;
    }

    try {
      const loc = await Location.getCurrentPositionAsync({});
      console.log('GPS coords:', loc.coords);

      const address = await Location.reverseGeocodeAsync({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });

      let locationString = '';
      if (address.length > 0) {
        const addr = address[0];
        const parts = [addr.street, addr.name, addr.city, addr.region].filter(Boolean);
        locationString = parts.join(', ');
      }

      const locationData = {
        address: locationString || 'Fetching address...',
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        timestamp: new Date().toISOString(),
      };

      setLocation(locationData.address);
      setOriginalLocation(locationData);
      setEditedLocation(null);

    } catch (error) {
      console.log('Location error', error);
    } finally {
      setIsLocating(false);
    }
  };

  const pickMedia = async (mode) => {
    if (mediaItems.length >= 5) {
      Alert.alert(t('limitReached'), t('maxEvidenceLimit'));
      return;
    }

    const hasPermission = mode.includes('camera') 
      ? (await ImagePicker.requestCameraPermissionsAsync()).granted
      : (await ImagePicker.requestMediaLibraryPermissionsAsync()).granted;

    if (!hasPermission) {
      Alert.alert(t('permissionRequired'), t('grantAccessToContinue'));
      return;
    }

    let result;
    const options = {
      allowsEditing: true,
      quality: 0.8,
    };

    if (mode === 'camera_photo') {
      result = await ImagePicker.launchCameraAsync({
        ...options,
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
      });
    } else if (mode === 'camera_video') {
      result = await ImagePicker.launchCameraAsync({
        ...options,
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      });
    } else {
      result = await ImagePicker.launchImageLibraryAsync({
        ...options,
        mediaTypes: ImagePicker.MediaTypeOptions.All,
      });
    }

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const newItem = result.assets[0];
      setMediaItems(prev => [...prev, { uri: newItem.uri, type: newItem.type }]);
    }
  };

  const removeMedia = (index) => {
    setMediaItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (!category) {
      Alert.alert(t('missingInfo'), t('selectCategory'));
      return;
    }
    if (!description.trim()) {
      Alert.alert(t('missingInfo'), t('enterDescription'));
      return;
    }
    if (!originalLocation) {
      Alert.alert('Location required');
      return;
    }

    Alert.alert(
      t('confirmSubmit'),
      t('areYouSureSubmit'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('submit'),
          onPress: async () => {
            try {
              await addReport({
                userId:     currentUser.uid,    // ← THIS is the only line added. Saves citizen's UID with the report.
                category,
                title:       title || description.slice(0, 30) + '...',
                description,
                location,
                priority,
                contactInfo,
                media:       mediaItems,
                photo:       mediaItems.length > 0 ? mediaItems[0].uri : null,
              });
              router.replace('/(user)/reports');
            } catch (e) {
              Alert.alert('Error', 'Failed to submit report');
            }
          }
        }
      ]
    );
  };

  // --- Components ---

  const renderCategorySelection = () => (
    <SafeAreaView style={styles.selectionContainer}>
      <View style={styles.selectionHeader}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.selectionTitle}>{t('selectCategory')}</Text>
        <View style={{width: 40}} />
      </View>
      
      <ScrollView contentContainerStyle={styles.categoryGrid} showsVerticalScrollIndicator={false}>
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            style={styles.categoryCardLarge}
            onPress={() => setCategory(cat.id)}
            activeOpacity={0.7}
          >
            <View style={[styles.categoryIconCircle, { backgroundColor: '#f0fdf4' }]}>
              <Text style={styles.categoryIconLarge}>{cat.icon}</Text>
            </View>
            <Text style={styles.categoryNameLarge}>{t(cat.id)}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );

  if (!category) {
    return renderCategorySelection();
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <Ionicons name="close" size={26} color="#1f2937" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{t('Submit Report')}</Text>
          <Text style={styles.headerSubtitle}>{t('Help Improve Community')}</Text>
        </View>
        <View style={styles.headerBtn} /> 
      </View>

      <ScrollView style={styles.formScroll} showsVerticalScrollIndicator={false}>
        
        {/* 1. Selected Category Card */}
        <View style={[styles.card, styles.categorySelectedCard]}>
          <View style={styles.categoryBadge}>
            <Text style={styles.badgeText}>{t('selectedCategory').toUpperCase()}</Text>
          </View>
          <View style={styles.categoryHeader}>
            <View style={styles.catInfo}>
              <View style={styles.catIconContainer}>
                <Text style={styles.catIcon}>{selectedCategoryDetails?.icon}</Text>
              </View>
              <View>
                <Text style={styles.catName}>{t(selectedCategoryDetails?.id)}</Text>
                <Text style={styles.catSubtext}>{t('reportDetailsBelow')}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={() => setCategory(null)} style={styles.changeBtn}>
              <Text style={styles.changeBtnText}>{t('change')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 2. Incident Location */}
        <View style={styles.card}>
          <View style={styles.labelRow}>
            <Text style={styles.cardLabel}>{t('Incident Location')}</Text>
            <Text style={styles.required}>*</Text>
          </View>
          
          <View style={styles.inputRow}>
            <Ionicons
              name="location-outline"
              size={20}
              color="#6366f1"
              style={{ marginRight: 10 }}
            />
            <TextInput
              style={styles.textInputFlex}
              value={location}
              onChangeText={(text) => {
                setLocation(text);
                if (originalLocation) {
                  setEditedLocation({
                    ...originalLocation,
                    address: text,
                    editedAt: new Date().toISOString(),
                  });
                }
              }}
              placeholder={t('Enter Location')}
              placeholderTextColor="#9ca3af"
            />
          </View>

          <TouchableOpacity style={styles.currentLocBtn} onPress={getCurrentLocation}>
            {isLocating ? (
              <View style={styles.locationBtnContent}>
                <Ionicons name="navigate-circle" size={18} color="#10b981" />
                <Text style={styles.currentLocText}>{t('locating')}...</Text>
              </View>
            ) : (
              <View style={styles.locationBtnContent}>
                <Ionicons name="navigate-circle-outline" size={18} color="#10b981" />
                <Text style={styles.currentLocText}>{t('Use Current Location')}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* 3. Description */}
        <View style={styles.card}>
          <View style={styles.labelRow}>
            <Text style={styles.cardLabel}>{t('describeIncident')}</Text>
            <Text style={styles.required}>*</Text>
          </View>
          <Text style={styles.fieldDescription}>{t('provideDetailedDescription')}</Text>
          
          <TextInput 
            style={styles.textArea}
            value={description}
            onChangeText={setDescription}
            placeholder={t('Enter Description')}
            placeholderTextColor="#9ca3af"
            multiline
            numberOfLines={5}
            textAlignVertical="top"
          />
          <Text style={styles.charCount}>{description.length} {t('characters')}</Text>
        </View>

        {/* 4. Evidence Section */}
        <View style={styles.card}>
          <View style={styles.evidenceHeader}>
            <Text style={styles.cardLabel}>{t('addEvidence')}</Text>
            <Text style={styles.evidenceSubtitle}>
              <Text style={styles.evidenceHighlight}>{t('photosVideos')}</Text> {t('helpVerifyReport')}
            </Text>
          </View>
          
          <View style={styles.evidenceLimits}>
            <View style={styles.limitRow}>
              <Ionicons name="images-outline" size={16} color="#1e40af" />
              <Text style={styles.limitText}>{t('upTo5Images')}</Text>
            </View>
            <View style={styles.limitRow}>
              <Ionicons name="videocam-outline" size={16} color="#1e40af" />
              <Text style={styles.limitText}>{t('or1Video')}</Text>
            </View>
            <View style={styles.limitRow}>
              <Ionicons name="document-outline" size={16} color="#1e40af" />
              <Text style={styles.limitText}>{t('max100MB')}</Text>
            </View>
          </View>

          <View style={styles.mediaGrid}>
            <TouchableOpacity 
              style={[styles.mediaCard, styles.cameraCard]} 
              onPress={() => pickMedia('camera_photo')}
            >
              <View style={styles.mediaIconCircle}>
                <Ionicons name="camera" size={28} color="#fff" />
              </View>
              <Text style={styles.mediaCardTitle}>{t('camera')}</Text>
              <Text style={styles.mediaCardDesc}>{t('takePhoto')}</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.mediaCard, styles.galleryCard]} 
              onPress={() => pickMedia('gallery')}
            >
              <View style={styles.mediaIconCircle}>
                <Ionicons name="images" size={28} color="#fff" />
              </View>
              <Text style={styles.mediaCardTitle}>{t('gallery')}</Text>
              <Text style={styles.mediaCardDesc}>{t('chooseFiles')}</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.mediaCard, styles.videoCard]} 
              onPress={() => pickMedia('camera_video')}
            >
              <View style={styles.mediaIconCircle}>
                <Ionicons name="videocam" size={28} color="#fff" />
              </View>
              <Text style={styles.mediaCardTitle}>{t('video')}</Text>
              <Text style={styles.mediaCardDesc}>{t('recordVideo')}</Text>
            </TouchableOpacity>
          </View>

          {/* Previews */}
          {mediaItems.length > 0 && (
            <View style={styles.previewSection}>
              <Text style={styles.previewHeader}>
                {t('uploaded')} ({mediaItems.length}/5)
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.mediaScroll}>
                {mediaItems.map((item, index) => (
                  <View key={index} style={styles.mediaPreviewItem}>
                    {item.type === 'video' ? (
                      <View style={styles.videoPlaceholder}>
                        <Ionicons name="play-circle" size={36} color="#fff" />
                        <Text style={styles.videoLabel}>{t('video')}</Text>
                      </View>
                    ) : (
                      <Image source={{ uri: item.uri }} style={styles.previewImage} />
                    )}
                    <TouchableOpacity style={styles.removeMediaBtn} onPress={() => removeMedia(index)}>
                      <Ionicons name="close-circle" size={26} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            </View>
          )}
        </View>

        {/* 5. Priority */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>{t('priority')}</Text>
          <Text style={styles.fieldDescription}>{t('howUrgent')}</Text>
          
          <View style={styles.priorityRow}>
            {[
              { key: 'Low', icon: 'checkmark-circle', color: '#10b981', bg: '#d1fae5' },
              { key: 'Medium', icon: 'alert-circle', color: '#f59e0b', bg: '#fef3c7' },
              { key: 'High', icon: 'warning', color: '#ef4444', bg: '#fee2e2' }
            ].map((p) => {
              const isSelected = priority === p.key;
              return (
                <TouchableOpacity 
                  key={p.key} 
                  style={[
                    styles.priorityChip,
                    { backgroundColor: isSelected ? p.color : p.bg },
                    isSelected && styles.prioritySelected
                  ]}
                  onPress={() => setPriority(p.key)}
                >
                  <Ionicons 
                    name={p.icon} 
                    size={22} 
                    color={isSelected ? '#fff' : p.color}
                    style={styles.priorityIcon}
                  />
                  <Text style={[
                    styles.priorityText, 
                    { color: isSelected ? '#fff' : p.color }
                  ]}>
                    {t(p.key.toLowerCase())}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* 6. Contact Info */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>{t('contactInfo')}</Text>
          <Text style={styles.fieldDescription}>{t('optionalForUpdates')}</Text>
          
          <View style={styles.inputRow}>
            <Ionicons name="call-outline" size={20} color="#6366f1" style={{marginRight: 10}} />
            <TextInput 
              style={styles.textInputFlex} 
              value={contactInfo}
              onChangeText={setContactInfo}
              placeholder={t('phoneOptional')}
              placeholderTextColor="#9ca3af"
              keyboardType="phone-pad"
            />
          </View>
          <View style={styles.privacyNote}>
            <Ionicons name="lock-closed" size={14} color="#059669" />
            <Text style={styles.privacyText}>{t('infoKeptConfidential')}</Text>
          </View>
        </View>

        {/* 7. Submit Button */}
        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
          <Ionicons name="checkmark-circle" size={24} color="#fff" style={{marginRight: 8}} />
          <View>
            <Text style={styles.submitBtnText}>{t('Submit Report')}</Text>
            <Text style={styles.submitBtnSubtext}>{t('Help Make Difference')}</Text>
          </View>
        </TouchableOpacity>
        
        <View style={{height: 60}} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  
  // Selection Screen
  selectionContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  selectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  selectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    padding: 16,
    gap: 12,
  },
  categoryCardLarge: {
    width: '47%',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    borderWidth: 2,
    borderColor: '#f1f5f9',
  },
  categoryIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#f0f9ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  categoryIconLarge: {
    fontSize: 32,
  },
  categoryNameLarge: {
    fontSize: 15,
    fontWeight: '700',
    color: '#374151',
    textAlign: 'center',
  },

  // Form Screen Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },
  
  formScroll: {
    padding: 16,
  },
  
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },

  // Selected Category Card
  categorySelectedCard: {
    backgroundColor: '#fefce8',
    borderColor: '#fde047',
    borderWidth: 2,
  },
  categoryBadge: {
    backgroundColor: '#fbbf24',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#78350f',
    letterSpacing: 0.5,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  catInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  catIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  catIcon: {
    fontSize: 28,
  },
  catName: {
    fontSize: 19,
    fontWeight: 'bold',
    color: '#111827',
  },
  catSubtext: {
    fontSize: 13,
    color: '#78350f',
    marginTop: 2,
  },
  changeBtn: {
    borderWidth: 2,
    borderColor: '#fbbf24',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
  },
  changeBtnText: {
    fontSize: 14,
    color: '#78350f',
    fontWeight: '600',
  },

  // Labels
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  cardLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
  },
  required: {
    fontSize: 18,
    color: '#ef4444',
    marginLeft: 4,
    fontWeight: 'bold',
  },
  fieldDescription: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 12,
  },

  // Inputs
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 14,
    backgroundColor: '#f8fafc',
    height: 54,
  },
  textInputFlex: {
    flex: 1,
    fontSize: 16,
    color: '#1f2937',
  },
  textArea: {
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 14,
    backgroundColor: '#f8fafc',
    fontSize: 16,
    color: '#1f2937',
    minHeight: 120,
  },
  charCount: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 6,
    textAlign: 'right',
  },
  
  // Location Button
  currentLocBtn: {
    marginTop: 12,
    alignSelf: 'flex-start',
  },
  locationBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#d1fae5',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 6,
  },
  currentLocText: {
    fontSize: 14,
    color: '#047857',
    fontWeight: '600',
  },

  // Evidence Section
  evidenceHeader: {
    marginBottom: 8,
  },
  evidenceSubtitle: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 4,
  },
  evidenceHighlight: {
    color: '#6366f1',
    fontWeight: '600',
  },
  evidenceLimits: {
    backgroundColor: '#f0f9ff',
    borderRadius: 10,
    padding: 12,
    marginTop: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  limitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 8,
  },
  limitText: {
    fontSize: 13,
    color: '#1e40af',
    fontWeight: '500',
  },

  // Media Grid
  mediaGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  mediaCard: {
    flex: 1,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  cameraCard: {
    backgroundColor: '#3b82f6',
  },
  galleryCard: {
    backgroundColor: '#8b5cf6',
  },
  videoCard: {
    backgroundColor: '#ec4899',
  },
  mediaIconCircle: {
    marginBottom: 8,
  },
  mediaCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 2,
  },
  mediaCardDesc: {
    fontSize: 11,
    color: '#e0e7ff',
  },

  // Media Previews
  previewSection: {
    marginTop: 20,
  },
  previewHeader: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 12,
  },
  mediaScroll: {
    maxHeight: 120,
  },
  mediaPreviewItem: {
    width: 110,
    height: 110,
    marginRight: 12,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#e5e7eb',
    borderWidth: 2,
    borderColor: '#cbd5e1',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  videoPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoLabel: {
    color: '#fff',
    fontSize: 11,
    marginTop: 4,
    fontWeight: '600',
  },
  removeMediaBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#fff',
    borderRadius: 13,
  },

  // Priority
  priorityRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  priorityChip: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  prioritySelected: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  priorityIcon: {
    marginBottom: 4,
  },
  priorityText: {
    fontSize: 14,
    fontWeight: '700',
  },

  // Privacy Note
  privacyNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    backgroundColor: '#d1fae5',
    padding: 10,
    borderRadius: 8,
  },
  privacyText: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '500',
  },

  // Submit Button
  submitBtn: {
    flexDirection: 'row',
    backgroundColor: '#10b981',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
    marginTop: 10,
  },
  submitBtnText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  submitBtnSubtext: {
    fontSize: 13,
    color: '#d1fae5',
    marginTop: 2,
  },
});
// import React, { useState, useEffect } from 'react';
// import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Image, Platform, FlatList } from 'react-native';
// import { SafeAreaView } from 'react-native-safe-area-context';
// import { useRouter, useLocalSearchParams } from 'expo-router';
// import * as ImagePicker from 'expo-image-picker';
// import * as Location from 'expo-location';
// import { Ionicons } from '@expo/vector-icons';
// import { useApp } from '../../src/context/AppContext';
// import { useLanguage } from '../../src/context/LanguageContext';
// import { categories, landmarks } from '../../src/data/departments';

// export default function CreateReportScreen() {
//   const router = useRouter();
//   const params = useLocalSearchParams();
//   const { addReport } = useApp();
//   const { t } = useLanguage();

//   // State
//   const [category, setCategory] = useState(params.category || null);
//   const [title, setTitle] = useState('');
//   const [description, setDescription] = useState('');
//   const [location, setLocation] = useState(""); 
//   const [originalLocation, setOriginalLocation] = useState(null);//GPS-based location captured automatically
//   const [editedLocation, setEditedLocation] = useState(null);//user-modified location (optional)
//   const [priority, setPriority] = useState('Medium');
//   const [contactInfo, setContactInfo] = useState('');
//   const [mediaItems, setMediaItems] = useState([]); // Array of { uri, type }
//   const [isLocating, setIsLocating] = useState(false);

//   // Auto-fetch location when category is selected (entering form)
//   useEffect(() => {
//     if (category && !originalLocation) {
//        console.log('Fetching GPS location...');
//       getCurrentLocation();
//     }
//   }, [category, originalLocation]);
//   useEffect(() => {
//     console.log('Original location:', originalLocation);
//     console.log('Location text:', location);
//   }, [originalLocation, location]);

//   const getCategoryDetails = (id) => categories.find(c => c.id === id);
//   const selectedCategoryDetails = category ? getCategoryDetails(category) : null;

//   // --- Actions ---

//   const getCurrentLocation = async () => {
//     setIsLocating(true);
//     const { status } = await Location.requestForegroundPermissionsAsync();
//     if (status !== 'granted') {
//       console.log('Location permission denied');
//       setIsLocating(false);
//       return;
//     }

//     try {
//       const loc = await Location.getCurrentPositionAsync({});
//       console.log('GPS coords:', loc.coords);

//       const address = await Location.reverseGeocodeAsync({
//         latitude: loc.coords.latitude,
//         longitude: loc.coords.longitude,
//       });

//       let locationString = '';
//       if (address.length > 0) {
//         const addr = address[0];
//         const parts = [addr.street, addr.name, addr.city, addr.region].filter(Boolean);
//         locationString = parts.join(', ');
//       }

//       const locationData = {
//         address: locationString || 'Fetching address...',
//         latitude: loc.coords.latitude,
//         longitude: loc.coords.longitude,
//         timestamp: new Date().toISOString(),
//       };

//       // 🔹 This is the key change
//       setLocation(locationData.address);
//       setOriginalLocation(locationData);
//       setEditedLocation(null); // reset edits

//     } catch (error) {
//       console.log('Location error', error);
//     } finally {
//       setIsLocating(false);
//     }
//   };


//   const pickMedia = async (mode) => {
//     // mode: 'camera_photo' | 'camera_video' | 'gallery'
    
//     // Check limit (e.g. 5 items)
//     if (mediaItems.length >= 5) {
//       Alert.alert(t('limitReached'), t('maxEvidenceLimit'));
//       return;
//     }

//     const hasPermission = mode.includes('camera') 
//       ? (await ImagePicker.requestCameraPermissionsAsync()).granted
//       : (await ImagePicker.requestMediaLibraryPermissionsAsync()).granted;

//     if (!hasPermission) {
//       Alert.alert(t('permissionRequired'), t('grantAccessToContinue'));
//       return;
//     }

//     let result;
//     const options = {
//       allowsEditing: true,
//       quality: 0.8,
//     };

//     if (mode === 'camera_photo') {
//        result = await ImagePicker.launchCameraAsync({
//          ...options,
//          mediaTypes: ImagePicker.MediaTypeOptions.Images,
//        });
//     } else if (mode === 'camera_video') {
//        result = await ImagePicker.launchCameraAsync({
//          ...options,
//          mediaTypes: ImagePicker.MediaTypeOptions.Videos,
//        });
//     } else {
//        result = await ImagePicker.launchImageLibraryAsync({
//          ...options,
//          mediaTypes: ImagePicker.MediaTypeOptions.All,
//        });
//     }

//     if (!result.canceled && result.assets && result.assets.length > 0) {
//       // Add to array
//       const newItem = result.assets[0];
//       setMediaItems(prev => [...prev, { uri: newItem.uri, type: newItem.type }]);
//     }
//   };

//   const removeMedia = (index) => {
//     setMediaItems(prev => prev.filter((_, i) => i !== index));
//   };

//   const handleSubmit = () => {
//     if (!category) {
//        Alert.alert(t('missingInfo'), t('selectCategory'));
//        return;
//     }
//     if (!description.trim()) {
//        Alert.alert(t('missingInfo'), t('enterDescription'));
//        return;
//     }
//     if (!originalLocation) {
//       Alert.alert('Location required');
//       return;
//     }
//     const reportData = {
//       category,
//       title: title || description.slice(0, 30) + '...',
//       description,
//       priority: priority.toLowerCase(),
//       contactInfo: contactInfo || null,

//       location: {
//         original: originalLocation,
//         edited: editedLocation, // can be null
//       },

//       media: mediaItems,
//       createdAt: new Date().toISOString(),
//       status: 'pending',
//     };

//     console.log(reportData);
//     Alert.alert(
//       t('confirmSubmit'),
//       t('areYouSureSubmit'),
//       [
//         { text: t('cancel'), style: 'cancel' },
//         {
//           text: t('submit'),
//           onPress: async () => {
//             try {
//               await addReport({
//                 category,
//                 title: title || description.slice(0, 30) + '...',
//                 description,
//                 location,
//                 priority,
//                 contactInfo,
//                 media: mediaItems,
//                 photo: mediaItems.length > 0 ? mediaItems[0].uri : null,
//               });
//               router.replace('/(user)/reports');
//             } catch (e) {
//               Alert.alert('Error', 'Failed to submit report');
//             }
//           }
//         }
//       ]
//     );
//   };

//   // --- Components ---

//   const renderCategorySelection = () => (
//     <SafeAreaView style={styles.selectionContainer}>
//       <View style={styles.selectionHeader}>
//         <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
//           <Ionicons name="arrow-back" size={24} color="#374151" />
//         </TouchableOpacity>
//         <Text style={styles.selectionTitle}>{t('selectCategory')}</Text>
//         <View style={{width: 40}} />
//       </View>
      
//       <ScrollView contentContainerStyle={styles.categoryGrid} showsVerticalScrollIndicator={false}>
//         {categories.map((cat) => (
//           <TouchableOpacity
//             key={cat.id}
//             style={styles.categoryCardLarge}
//             onPress={() => setCategory(cat.id)}
//             activeOpacity={0.7}
//           >
//              <View style={[styles.categoryIconCircle, { backgroundColor: '#f0fdf4' }]}>
//                <Text style={styles.categoryIconLarge}>{cat.icon}</Text>
//             </View>
//             <Text style={styles.categoryNameLarge}>{t(cat.id)}</Text>
//           </TouchableOpacity>
//         ))}
//       </ScrollView>
//     </SafeAreaView>
//   );

//   if (!category) {
//     return renderCategorySelection();
//   }

//   return (
//     <SafeAreaView style={styles.container}>
//       {/* Header - Enhanced */}
//       <View style={styles.header}>
//         <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
//           <Ionicons name="close" size={26} color="#1f2937" />
//         </TouchableOpacity>
//         <View style={styles.headerCenter}>
//           <Text style={styles.headerTitle}>{t('Submit Report')}</Text>
//           <Text style={styles.headerSubtitle}>{t('Help Improve Community')}</Text>
//         </View>
//         <View style={styles.headerBtn} /> 
//       </View>

//       <ScrollView style={styles.formScroll} showsVerticalScrollIndicator={false}>
        
//         {/* 1. Selected Category Card - Enhanced */}
//         <View style={[styles.card, styles.categorySelectedCard]}>
//           <View style={styles.categoryBadge}>
//             <Text style={styles.badgeText}>{t('selectedCategory').toUpperCase()}</Text>
//           </View>
//           <View style={styles.categoryHeader}>
//             <View style={styles.catInfo}>
//               <View style={styles.catIconContainer}>
//                 <Text style={styles.catIcon}>{selectedCategoryDetails?.icon}</Text>
//               </View>
//               <View>
//                 <Text style={styles.catName}>{t(selectedCategoryDetails?.id)}</Text>
//                 <Text style={styles.catSubtext}>{t('reportDetailsBelow')}</Text>
//               </View>
//             </View>
//             <TouchableOpacity onPress={() => setCategory(null)} style={styles.changeBtn}>
//               <Text style={styles.changeBtnText}>{t('change')}</Text>
//             </TouchableOpacity>
//           </View>
//         </View>

//         {/* 2. Incident Location - Enhanced with Required Indicator */}
//         <View style={styles.card}>
//           <View style={styles.labelRow}>
//             <Text style={styles.cardLabel}>{t('Incident Location')}</Text>
//             <Text style={styles.required}>*</Text>
//           </View>
//           {/* <Text style={styles.fieldDescription}>{t('whereDidThisOccur')}</Text> */}
          
//           <View style={styles.inputRow}>
//             <Ionicons
//               name="location-outline"
//               size={20}
//               color="#6366f1"
//               style={{ marginRight: 10 }}
//             />
//             <TextInput
//               style={styles.textInputFlex}
//               value={location}
//               onChangeText={(text) => {
//                 setLocation(text);

//                 if (originalLocation) {
//                   setEditedLocation({
//                     ...originalLocation,
//                     address: text,
//                     editedAt: new Date().toISOString(),
//                   });
//                 }
//               }}
//               placeholder={t('Enter Location')}
//               placeholderTextColor="#9ca3af"
//             />
//           </View>

          
//           <TouchableOpacity style={styles.currentLocBtn} onPress={getCurrentLocation}>
//              {isLocating ? (
//                <View style={styles.locationBtnContent}>
//                  <Ionicons name="navigate-circle" size={18} color="#10b981" />
//                  <Text style={styles.currentLocText}>{t('locating')}...</Text>
//                </View>
//              ) : (
//                <View style={styles.locationBtnContent}>
//                  <Ionicons name="navigate-circle-outline" size={18} color="#10b981" />
//                  <Text style={styles.currentLocText}>{t('Use Current Location')}</Text>
//                </View>
//              )}
//           </TouchableOpacity>
//         </View>

//         {/* 3. Description - Enhanced with Required Indicator */}
//         <View style={styles.card}>
//           <View style={styles.labelRow}>
//             <Text style={styles.cardLabel}>{t('describeIncident')}</Text>
//             <Text style={styles.required}>*</Text>
//           </View>
//           <Text style={styles.fieldDescription}>{t('provideDetailedDescription')}</Text>
          
//           <TextInput 
//             style={styles.textArea}
//             value={description}
//             onChangeText={setDescription}
//             placeholder={t('Enter Description')}
//             placeholderTextColor="#9ca3af"
//             multiline
//             numberOfLines={5}
//             textAlignVertical="top"
//           />
//           <Text style={styles.charCount}>{description.length} {t('characters')}</Text>
//         </View>

//         {/* 4. Evidence Section - Completely Redesigned */}
//         <View style={styles.card}>
//           <View style={styles.evidenceHeader}>
//             <Text style={styles.cardLabel}>{t('addEvidence')}</Text>
//             <Text style={styles.evidenceSubtitle}>
//               <Text style={styles.evidenceHighlight}>{t('photosVideos')}</Text> {t('helpVerifyReport')}
//             </Text>
//           </View>
          
//           <View style={styles.evidenceLimits}>
//             <View style={styles.limitRow}>
//               <Ionicons name="images-outline" size={16} color="#1e40af" />
//               <Text style={styles.limitText}>{t('upTo5Images')}</Text>
//             </View>
//             <View style={styles.limitRow}>
//               <Ionicons name="videocam-outline" size={16} color="#1e40af" />
//               <Text style={styles.limitText}>{t('or1Video')}</Text>
//             </View>
//             <View style={styles.limitRow}>
//               <Ionicons name="document-outline" size={16} color="#1e40af" />
//               <Text style={styles.limitText}>{t('max100MB')}</Text>
//             </View>
//           </View>

//           {/* Media Action Cards - Separate Cards Design */}
//           <View style={styles.mediaGrid}>
//             <TouchableOpacity 
//               style={[styles.mediaCard, styles.cameraCard]} 
//               onPress={() => pickMedia('camera_photo')}
//             >
//               <View style={styles.mediaIconCircle}>
//                 <Ionicons name="camera" size={28} color="#fff" />
//               </View>
//               <Text style={styles.mediaCardTitle}>{t('camera')}</Text>
//               <Text style={styles.mediaCardDesc}>{t('takePhoto')}</Text>
//             </TouchableOpacity>

//             <TouchableOpacity 
//               style={[styles.mediaCard, styles.galleryCard]} 
//               onPress={() => pickMedia('gallery')}
//             >
//               <View style={styles.mediaIconCircle}>
//                 <Ionicons name="images" size={28} color="#fff" />
//               </View>
//               <Text style={styles.mediaCardTitle}>{t('gallery')}</Text>
//               <Text style={styles.mediaCardDesc}>{t('chooseFiles')}</Text>
//             </TouchableOpacity>

//             <TouchableOpacity 
//               style={[styles.mediaCard, styles.videoCard]} 
//               onPress={() => pickMedia('camera_video')}
//             >
//               <View style={styles.mediaIconCircle}>
//                 <Ionicons name="videocam" size={28} color="#fff" />
//               </View>
//               <Text style={styles.mediaCardTitle}>{t('video')}</Text>
//               <Text style={styles.mediaCardDesc}>{t('recordVideo')}</Text>
//             </TouchableOpacity>
//           </View>

//           {/* Previews - Enhanced */}
//           {mediaItems.length > 0 && (
//             <View style={styles.previewSection}>
//               <Text style={styles.previewHeader}>
//                 {t('uploaded')} ({mediaItems.length}/5)
//               </Text>
//               <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.mediaScroll}>
//                 {mediaItems.map((item, index) => (
//                   <View key={index} style={styles.mediaPreviewItem}>
//                      {item.type === 'video' ? (
//                        <View style={styles.videoPlaceholder}>
//                          <Ionicons name="play-circle" size={36} color="#fff" />
//                          <Text style={styles.videoLabel}>{t('video')}</Text>
//                        </View>
//                      ) : (
//                        <Image source={{ uri: item.uri }} style={styles.previewImage} />
//                      )}
//                      <TouchableOpacity style={styles.removeMediaBtn} onPress={() => removeMedia(index)}>
//                        <Ionicons name="close-circle" size={26} color="#ef4444" />
//                      </TouchableOpacity>
//                   </View>
//                 ))}
//               </ScrollView>
//             </View>
//           )}
//         </View>

//         {/* 5. Priority - Enhanced with Colors and Better Design */}
//         <View style={styles.card}>
//           <Text style={styles.cardLabel}>{t('priority')}</Text>
//           <Text style={styles.fieldDescription}>{t('howUrgent')}</Text>
          
//           <View style={styles.priorityRow}>
//             {[
//               { key: 'Low', icon: 'checkmark-circle', color: '#10b981', bg: '#d1fae5' },
//               { key: 'Medium', icon: 'alert-circle', color: '#f59e0b', bg: '#fef3c7' },
//               { key: 'High', icon: 'warning', color: '#ef4444', bg: '#fee2e2' }
//             ].map((p) => {
//                const isSelected = priority === p.key;
//                return (
//                  <TouchableOpacity 
//                    key={p.key} 
//                    style={[
//                      styles.priorityChip,
//                      { backgroundColor: isSelected ? p.color : p.bg },
//                      isSelected && styles.prioritySelected
//                    ]}
//                    onPress={() => setPriority(p.key)}
//                  >
//                    <Ionicons 
//                      name={p.icon} 
//                      size={22} 
//                      color={isSelected ? '#fff' : p.color}
//                      style={styles.priorityIcon}
//                    />
//                    <Text style={[
//                      styles.priorityText, 
//                      { color: isSelected ? '#fff' : p.color }
//                    ]}>
//                      {t(p.key.toLowerCase())}
//                    </Text>
//                  </TouchableOpacity>
//                );
//             })}
//           </View>
//         </View>

//         {/* 6. Contact Info - Enhanced */}
//         <View style={styles.card}>
//           <Text style={styles.cardLabel}>{t('contactInfo')}</Text>
//           <Text style={styles.fieldDescription}>{t('optionalForUpdates')}</Text>
          
//           <View style={styles.inputRow}>
//              <Ionicons name="call-outline" size={20} color="#6366f1" style={{marginRight: 10}} />
//              <TextInput 
//                style={styles.textInputFlex} 
//                value={contactInfo}
//                onChangeText={setContactInfo}
//                placeholder={t('phoneOptional')}
//                placeholderTextColor="#9ca3af"
//                keyboardType="phone-pad"
//              />
//           </View>
//           <View style={styles.privacyNote}>
//             <Ionicons name="lock-closed" size={14} color="#059669" />
//             <Text style={styles.privacyText}>{t('infoKeptConfidential')}</Text>
//           </View>
//         </View>

//         {/* 7. Submit Button - Enhanced */}
//         <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
//           <Ionicons name="checkmark-circle" size={24} color="#fff" style={{marginRight: 8}} />
//           <View>
//             <Text style={styles.submitBtnText}>{t('Submit Report')}</Text>
//             <Text style={styles.submitBtnSubtext}>{t('Help Make Difference')}</Text>
//           </View>
//         </TouchableOpacity>
        
//         <View style={{height: 60}} />
//       </ScrollView>
//     </SafeAreaView>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#f8fafc',
//   },
  
//   // Selection Screen
//   selectionContainer: {
//     flex: 1,
//     backgroundColor: '#ffffff',
//   },
//   selectionHeader: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     padding: 16,
//   },
//   selectionTitle: {
//     fontSize: 20,
//     fontWeight: 'bold',
//     color: '#1f2937',
//   },
//   backButton: {
//     width: 40,
//     height: 40,
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   categoryGrid: {
//     flexDirection: 'row',
//     flexWrap: 'wrap',
//     justifyContent: 'space-between',
//     padding: 16,
//     gap: 12,
//   },
//   categoryCardLarge: {
//     width: '47%',
//     backgroundColor: '#ffffff',
//     borderRadius: 20,
//     padding: 24,
//     alignItems: 'center',
//     marginBottom: 16,
//     shadowColor: '#6366f1',
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.1,
//     shadowRadius: 12,
//     elevation: 5,
//     borderWidth: 2,
//     borderColor: '#f1f5f9',
//   },
//   categoryIconCircle: {
//     width: 64,
//     height: 64,
//     borderRadius: 32,
//     backgroundColor: '#f0f9ff',
//     alignItems: 'center',
//     justifyContent: 'center',
//     marginBottom: 12,
//   },
//   categoryIconLarge: {
//     fontSize: 32,
//   },
//   categoryNameLarge: {
//     fontSize: 15,
//     fontWeight: '700',
//     color: '#374151',
//     textAlign: 'center',
//   },

//   // Form Screen Header
//   header: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     paddingHorizontal: 16,
//     paddingVertical: 14,
//     backgroundColor: '#ffffff',
//     borderBottomWidth: 1,
//     borderBottomColor: '#e5e7eb',
//   },
//   headerBtn: {
//     width: 40,
//     height: 40,
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   headerCenter: {
//     alignItems: 'center',
//   },
//   headerTitle: {
//     fontSize: 20,
//     fontWeight: 'bold',
//     color: '#111827',
//   },
//   headerSubtitle: {
//     fontSize: 13,
//     color: '#6b7280',
//     marginTop: 2,
//   },
  
//   formScroll: {
//     padding: 16,
//   },
  
//   card: {
//     backgroundColor: '#ffffff',
//     borderRadius: 16,
//     padding: 20,
//     marginBottom: 20,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.06,
//     shadowRadius: 8,
//     elevation: 3,
//     borderWidth: 1,
//     borderColor: '#f1f5f9',
//   },

//   // Selected Category Card - Special styling
//   categorySelectedCard: {
//     backgroundColor: '#fefce8',
//     borderColor: '#fde047',
//     borderWidth: 2,
//   },
//   categoryBadge: {
//     backgroundColor: '#fbbf24',
//     paddingHorizontal: 12,
//     paddingVertical: 6,
//     borderRadius: 20,
//     alignSelf: 'flex-start',
//     marginBottom: 12,
//   },
//   badgeText: {
//     fontSize: 11,
//     fontWeight: '700',
//     color: '#78350f',
//     letterSpacing: 0.5,
//   },
//   categoryHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//   },
//   catInfo: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 14,
//   },
//   catIconContainer: {
//     width: 56,
//     height: 56,
//     borderRadius: 28,
//     backgroundColor: '#fff',
//     alignItems: 'center',
//     justifyContent: 'center',
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//     elevation: 2,
//   },
//   catIcon: {
//     fontSize: 28,
//   },
//   catName: {
//     fontSize: 19,
//     fontWeight: 'bold',
//     color: '#111827',
//   },
//   catSubtext: {
//     fontSize: 13,
//     color: '#78350f',
//     marginTop: 2,
//   },
//   changeBtn: {
//     borderWidth: 2,
//     borderColor: '#fbbf24',
//     paddingHorizontal: 16,
//     paddingVertical: 8,
//     borderRadius: 20,
//     backgroundColor: '#fff',
//   },
//   changeBtnText: {
//     fontSize: 14,
//     color: '#78350f',
//     fontWeight: '600',
//   },

//   // Labels with Required Indicator
//   labelRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: 6,
//   },
//   cardLabel: {
//     fontSize: 16,
//     fontWeight: '700',
//     color: '#1e293b',
//   },
//   required: {
//     fontSize: 18,
//     color: '#ef4444',
//     marginLeft: 4,
//     fontWeight: 'bold',
//   },
//   fieldDescription: {
//     fontSize: 13,
//     color: '#64748b',
//     marginBottom: 12,
//   },

//   // Inputs
//   inputRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     borderWidth: 2,
//     borderColor: '#e2e8f0',
//     borderRadius: 12,
//     paddingHorizontal: 14,
//     backgroundColor: '#f8fafc',
//     height: 54,
//   },
//   textInputFlex: {
//     flex: 1,
//     fontSize: 16,
//     color: '#1f2937',
//   },
//   textArea: {
//     borderWidth: 2,
//     borderColor: '#e2e8f0',
//     borderRadius: 12,
//     padding: 14,
//     backgroundColor: '#f8fafc',
//     fontSize: 16,
//     color: '#1f2937',
//     minHeight: 120,
//   },
//   charCount: {
//     fontSize: 12,
//     color: '#94a3b8',
//     marginTop: 6,
//     textAlign: 'right',
//   },
  
//   // Location Button
//   currentLocBtn: {
//     marginTop: 12,
//     alignSelf: 'flex-start',
//   },
//   locationBtnContent: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: '#d1fae5',
//     paddingHorizontal: 14,
//     paddingVertical: 10,
//     borderRadius: 20,
//     gap: 6,
//   },
//   currentLocText: {
//     fontSize: 14,
//     color: '#047857',
//     fontWeight: '600',
//   },

//   // Evidence Section
//   evidenceHeader: {
//     marginBottom: 8,
//   },
//   evidenceSubtitle: {
//     fontSize: 13,
//     color: '#64748b',
//     marginTop: 4,
//   },
//   evidenceHighlight: {
//     color: '#6366f1',
//     fontWeight: '600',
//   },
//   evidenceLimits: {
//     backgroundColor: '#f0f9ff',
//     borderRadius: 10,
//     padding: 12,
//     marginTop: 12,
//     marginBottom: 16,
//     borderLeftWidth: 4,
//     borderLeftColor: '#3b82f6',
//   },
//   limitRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: 4,
//     gap: 8,
//   },
//   limitText: {
//     fontSize: 13,
//     color: '#1e40af',
//     fontWeight: '500',
//   },

//   // Media Grid - Separate Cards
//   mediaGrid: {
//     flexDirection: 'row',
//     gap: 12,
//   },
//   mediaCard: {
//     flex: 1,
//     borderRadius: 14,
//     padding: 16,
//     alignItems: 'center',
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 6,
//     elevation: 3,
//   },
//   cameraCard: {
//     backgroundColor: '#3b82f6',
//   },
//   galleryCard: {
//     backgroundColor: '#8b5cf6',
//   },
//   videoCard: {
//     backgroundColor: '#ec4899',
//   },
//   mediaIconCircle: {
//     marginBottom: 8,
//   },
//   mediaCardTitle: {
//     fontSize: 14,
//     fontWeight: '700',
//     color: '#ffffff',
//     marginBottom: 2,
//   },
//   mediaCardDesc: {
//     fontSize: 11,
//     color: '#e0e7ff',
//   },

//   // Media Previews
//   previewSection: {
//     marginTop: 20,
//   },
//   previewHeader: {
//     fontSize: 14,
//     fontWeight: '600',
//     color: '#475569',
//     marginBottom: 12,
//   },
//   mediaScroll: {
//     maxHeight: 120,
//   },
//   mediaPreviewItem: {
//     width: 110,
//     height: 110,
//     marginRight: 12,
//     borderRadius: 12,
//     overflow: 'hidden',
//     position: 'relative',
//     backgroundColor: '#e5e7eb',
//     borderWidth: 2,
//     borderColor: '#cbd5e1',
//   },
//   previewImage: {
//     width: '100%',
//     height: '100%',
//     resizeMode: 'cover',
//   },
//   videoPlaceholder: {
//     width: '100%',
//     height: '100%',
//     backgroundColor: '#1e293b',
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   videoLabel: {
//     color: '#fff',
//     fontSize: 11,
//     marginTop: 4,
//     fontWeight: '600',
//   },
//   removeMediaBtn: {
//     position: 'absolute',
//     top: 4,
//     right: 4,
//     backgroundColor: '#fff',
//     borderRadius: 13,
//   },

//   // Priority
//   priorityRow: {
//     flexDirection: 'row',
//     gap: 12,
//     marginTop: 8,
//   },
//   priorityChip: {
//     flex: 1,
//     borderRadius: 12,
//     paddingVertical: 14,
//     alignItems: 'center',
//     justifyContent: 'center',
//     borderWidth: 2,
//     borderColor: 'transparent',
//   },
//   prioritySelected: {
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 3 },
//     shadowOpacity: 0.2,
//     shadowRadius: 6,
//     elevation: 4,
//   },
//   priorityIcon: {
//     marginBottom: 4,
//   },
//   priorityText: {
//     fontSize: 14,
//     fontWeight: '700',
//   },

//   // Privacy Note
//   privacyNote: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 6,
//     marginTop: 8,
//     backgroundColor: '#d1fae5',
//     padding: 10,
//     borderRadius: 8,
//   },
//   privacyText: {
//     fontSize: 12,
//     color: '#059669',
//     fontWeight: '500',
//   },

//   // Submit Button
//   submitBtn: {
//     flexDirection: 'row',
//     backgroundColor: '#10b981',
//     borderRadius: 16,
//     paddingVertical: 18,
//     paddingHorizontal: 20,
//     alignItems: 'center',
//     justifyContent: 'center',
//     shadowColor: '#10b981',
//     shadowOffset: { width: 0, height: 6 },
//     shadowOpacity: 0.4,
//     shadowRadius: 12,
//     elevation: 6,
//     marginTop: 10,
//   },
//   submitBtnText: {
//     fontSize: 18,
//     fontWeight: 'bold',
//     color: '#ffffff',
//   },
//   submitBtnSubtext: {
//     fontSize: 13,
//     color: '#d1fae5',
//     marginTop: 2,
//   },
// });
