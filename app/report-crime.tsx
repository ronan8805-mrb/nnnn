import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ScrollView,
    Alert,
    ActivityIndicator,
    Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import { theme } from '../styles/theme';
import { Ionicons } from '@expo/vector-icons';

import { API_URL } from '../utils/config';
import JarvisWrapper from '../components/JarvisWrapper';
import { useLanguage } from './_layout';
import { BlurView } from 'expo-blur';

const INCIDENT_TYPES = [
    'Theft',
    'Assault',
    'Vandalism',
    'Suspicious Activity',
    'Drug Activity',
    'Noise Complaint',
    'Other'
];

export default function ReportCrimeScreen() {
    const router = useRouter();
    const { t } = useLanguage();
    const [incidentType, setIncidentType] = useState('');
    const [description, setDescription] = useState('');
    const [locationAddress, setLocationAddress] = useState('');
    const [latitude, setLatitude] = useState<number | null>(null);
    const [longitude, setLongitude] = useState<number | null>(null);
    const [photoUri, setPhotoUri] = useState<string | null>(null);
    const [isAnonymous, setIsAnonymous] = useState(false);
    const [loading, setLoading] = useState(false);
    const [gettingLocation, setGettingLocation] = useState(false);

    useEffect(() => {
        getCurrentLocation();
    }, []);

    const getCurrentLocation = async () => {
        setGettingLocation(true);
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status === 'granted') {
                const location = await Location.getCurrentPositionAsync({});
                setLatitude(location.coords.latitude);
                setLongitude(location.coords.longitude);

                // Reverse geocode to get address
                const [address] = await Location.reverseGeocodeAsync({
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude,
                });

                if (address) {
                    const addressStr = `${address.street || ''}, ${address.city || ''}, ${address.region || ''}`.trim();
                    setLocationAddress(addressStr);
                }
            }
        } catch (error) {
            console.error('Location error:', error);
        } finally {
            setGettingLocation(false);
        }
    };

    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission needed', 'Camera roll permission is required to upload photos');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.7,
        });

        if (!result.canceled) {
            setPhotoUri(result.assets[0].uri);
        }
    };

    const handleSubmit = async () => {
        // Validation
        if (!incidentType) {
            Alert.alert('Error', 'Please select an incident type');
            return;
        }
        if (!description.trim()) {
            Alert.alert('Error', 'Please provide a description');
            return;
        }

        let currentLat = latitude;
        let currentLng = longitude;

        if (!currentLat || !currentLng) {
            setGettingLocation(true);
            try {
                const { status } = await Location.requestForegroundPermissionsAsync();
                if (status === 'granted') {
                    const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
                    currentLat = loc.coords.latitude;
                    currentLng = loc.coords.longitude;
                    setLatitude(currentLat);
                    setLongitude(currentLng);
                    
                    // Try to get address too
                    const addr = await Location.reverseGeocodeAsync({ latitude: currentLat, longitude: currentLng });
                    if (addr.length > 0) {
                        const a = addr[0];
                        setLocationAddress(`${a.street || ''} ${a.name || ''}, ${a.city || ''}`);
                    }
                }
            } catch (e) {
                console.error('Report location attempt failed', e);
            } finally {
                setGettingLocation(false);
            }
        }

        if (!currentLat || !currentLng) {
            Alert.alert('Location Required', 'Incident reporting requires location data for emergency dispatch. Please enable location permissions.');
            return;
        }

        setLoading(true);
        try {
            const response = await axios.post(`${API_URL}/report-crime`, {
                user_id: 1, // TODO: Get from auth context
                incident_type: incidentType,
                description: description,
                location_address: locationAddress || 'Location not available',
                latitude: currentLat,
                longitude: currentLng,
                photo_url: photoUri, // TODO: Upload to server first
                is_anonymous: isAnonymous,
            });

            Alert.alert(
                'Report Submitted',
                `Your report has been submitted successfully and assigned to ${response.data.assigned_station}.`,
                [
                    {
                        text: 'View My Reports',
                        onPress: () => router.push('/my-reports'),
                    },
                    {
                        text: 'OK',
                        onPress: () => router.back(),
                    },
                ]
            );
        } catch (error) {
            console.error('Submit error:', error);
            Alert.alert('Error', 'Failed to submit report. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <JarvisWrapper showRings={true} showTelemetry={true}>
            <View style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.replace('/home')} style={styles.backButton}>
                        <Ionicons name="chevron-back" size={24} color="#00f3ff" />
                    </TouchableOpacity>
                    <View>
                        <Text style={styles.headerTitle}>{t.report}</Text>
                        <Text style={styles.headerSub}>SECURE INCIDENT FILING</Text>
                    </View>
                </View>

                <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
                    <BlurView intensity={Platform.OS === 'web' ? 20 : 60} tint="dark" style={styles.formCard}>
                        {/* Incident Type */}
                        <Text style={styles.label}>INCIDENT CATEGORY</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeScroll}>
                            {INCIDENT_TYPES.map((type) => (
                                <TouchableOpacity
                                    key={type}
                                    style={[
                                        styles.typeChip,
                                        incidentType === type && styles.typeChipSelected,
                                    ]}
                                    onPress={() => setIncidentType(type)}
                                >
                                    <Text
                                        style={[
                                            styles.typeChipText,
                                            incidentType === type && styles.typeChipTextSelected,
                                        ]}
                                    >
                                        {(type || 'INCIDENT').toUpperCase()}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        {/* Location */}
                        <Text style={styles.label}>COORDINATES / ADDRESS</Text>
                        <View style={styles.locationContainer}>
                            <TextInput
                                style={styles.input}
                                value={locationAddress}
                                onChangeText={setLocationAddress}
                                placeholder="Detecting location..."
                                placeholderTextColor="rgba(0, 243, 255, 0.3)"
                            />
                            <TouchableOpacity
                                style={styles.locationButton}
                                onPress={getCurrentLocation}
                                disabled={gettingLocation}
                            >
                                {gettingLocation ? (
                                    <ActivityIndicator size="small" color="#00f3ff" />
                                ) : (
                                    <Ionicons name="scan-outline" size={20} color="#00f3ff" />
                                )}
                            </TouchableOpacity>
                        </View>

                        {/* Description */}
                        <Text style={styles.label}>SITUATION LOG</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            value={description}
                            onChangeText={setDescription}
                            placeholder="Provide precise details of the ongoing situation..."
                            placeholderTextColor="rgba(0, 243, 255, 0.3)"
                            multiline
                            numberOfLines={4}
                            textAlignVertical="top"
                        />

                        {/* Photo Upload */}
                        <Text style={styles.label}>VISUAL EVIDENCE</Text>
                        <TouchableOpacity style={styles.photoButton} onPress={pickImage}>
                            {photoUri ? (
                                <View style={styles.photoPreview}>
                                    <Ionicons name="cloud-done" size={24} color="#22c55e" />
                                    <Text style={[styles.photoText, { color: '#22c55e' }]}>MEDIA ATTACHED</Text>
                                </View>
                            ) : (
                                <View style={styles.photoPreview}>
                                    <Ionicons name="camera-outline" size={24} color="#00f3ff" />
                                    <Text style={styles.photoText}>CAPTURE EVIDENCE</Text>
                                </View>
                            )}
                        </TouchableOpacity>

                        {/* Anonymous Checkbox */}
                        <TouchableOpacity
                            style={styles.checkboxContainer}
                            onPress={() => setIsAnonymous(!isAnonymous)}
                        >
                            <View style={[styles.checkbox, isAnonymous && styles.checkboxChecked]}>
                                {isAnonymous && <Ionicons name="checkmark" size={16} color="#00f3ff" />}
                            </View>
                            <Text style={styles.checkboxLabel}>ENCRYPT IDENTITY (ANONYMOUS)</Text>
                        </TouchableOpacity>

                        {/* Submit Button */}
                        <TouchableOpacity
                            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                            onPress={handleSubmit}
                            disabled={loading}
                        >
                            <View style={styles.submitInner}>
                                {loading ? (
                                    <ActivityIndicator size="small" color="#00f3ff" />
                                ) : (
                                    <>
                                        <Ionicons name="shield-checkmark" size={20} color="#00f3ff" style={{ marginRight: 10 }} />
                                        <Text style={styles.submitButtonText}>TRANSMIT REPORT</Text>
                                    </>
                                )}
                            </View>
                        </TouchableOpacity>
                    </BlurView>

                    <View style={styles.disclaimer}>
                        <Ionicons name="alert-circle" size={14} color="rgba(0, 243, 255, 0.5)" style={{ marginRight: 6 }} />
                        <Text style={styles.disclaimerText}>
                            False reports are subject to legal action under Irish Citizen Protection Act 2025.
                        </Text>
                    </View>
                </ScrollView>
            </View>
        </JarvisWrapper>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        paddingTop: Platform.OS === 'ios' ? 40 : 20,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0, 243, 255, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
        borderWidth: 1,
        borderColor: '#00f3ff',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '900',
        color: '#fff',
        letterSpacing: 2,
    },
    headerSub: {
        fontSize: 10,
        color: '#00f3ff',
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
        opacity: 0.8,
    },
    content: {
        flex: 1,
    },
    contentContainer: {
        padding: 20,
        paddingBottom: 60,
    },
    formCard: {
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: 'rgba(0, 243, 255, 0.3)',
        backgroundColor: 'rgba(2, 6, 23, 0.4)',
        overflow: 'hidden',
    },
    label: {
        fontSize: 12,
        fontWeight: '900',
        color: '#fff',
        marginBottom: 12,
        marginTop: 20,
        letterSpacing: 1,
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    },
    typeScroll: {
        marginBottom: 10,
    },
    typeChip: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 4,
        marginRight: 10,
        borderWidth: 1,
        borderColor: 'rgba(0, 243, 255, 0.2)',
    },
    typeChipSelected: {
        backgroundColor: 'rgba(0, 243, 255, 0.15)',
        borderColor: '#00f3ff',
    },
    typeChipText: {
        color: '#94a3b8',
        fontSize: 10,
        fontWeight: 'bold',
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    },
    typeChipTextSelected: {
        color: '#00f3ff',
    },
    locationContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    input: {
        flex: 1,
        backgroundColor: 'rgba(0, 243, 255, 0.05)',
        borderRadius: 4,
        padding: 15,
        fontSize: 14,
        color: '#fff',
        borderWidth: 1,
        borderColor: 'rgba(0, 243, 255, 0.2)',
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    },
    textArea: {
        height: 100,
    },
    locationButton: {
        marginLeft: 10,
        width: 50,
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 243, 255, 0.1)',
        borderRadius: 4,
        borderWidth: 1,
        borderColor: '#00f3ff',
    },
    photoButton: {
        backgroundColor: 'rgba(0, 243, 255, 0.05)',
        borderRadius: 4,
        padding: 20,
        borderWidth: 1,
        borderColor: 'rgba(0, 243, 255, 0.2)',
        borderStyle: 'dashed',
    },
    photoPreview: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    photoText: {
        marginLeft: 10,
        color: '#00f3ff',
        fontSize: 12,
        fontWeight: '900',
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    },
    checkboxContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 25,
    },
    checkbox: {
        width: 20,
        height: 20,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: 'rgba(0, 243, 255, 0.5)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
        backgroundColor: 'rgba(0, 243, 255, 0.05)',
    },
    checkboxChecked: {
        borderColor: '#00f3ff',
        backgroundColor: 'rgba(0, 243, 255, 0.1)',
    },
    checkboxLabel: {
        fontSize: 10,
        color: 'rgba(0, 243, 255, 0.7)',
        fontWeight: 'bold',
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    },
    submitButton: {
        marginTop: 30,
        borderRadius: 4,
        overflow: 'hidden',
    },
    submitInner: {
        backgroundColor: 'rgba(0, 243, 255, 0.1)',
        padding: 18,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#00f3ff',
    },
    submitButtonDisabled: {
        opacity: 0.5,
    },
    submitButtonText: {
        color: '#00f3ff',
        fontSize: 16,
        fontWeight: '900',
        letterSpacing: 2,
    },
    disclaimer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 20,
        paddingHorizontal: 10,
    },
    disclaimerText: {
        color: 'rgba(0, 243, 255, 0.5)',
        fontSize: 9,
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
        flex: 1,
    },
});
