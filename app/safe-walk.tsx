import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Alert,
    Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import axios from 'axios';
import { theme } from '../styles/theme';
import { useLanguage } from './_layout';
import { API_URL } from '../utils/config';
import JarvisWrapper from '../components/JarvisWrapper';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import TacticalMap from '../components/TacticalMap';

interface Guardian {
    id: number;
    name: string;
}

export default function SafeWalkScreen() {
    const router = useRouter();
    const { t } = useLanguage();

    const [journeyActive, setJourneyActive] = useState(false);
    const [journeyId, setJourneyId] = useState<number | null>(null);
    const [location, setLocation] = useState<Location.LocationObject | null>(null);
    const [guardians, setGuardians] = useState<Guardian[]>([]);
    const [guardiansNotified, setGuardiansNotified] = useState(0);
    const [locationSubscription, setLocationSubscription] = useState<Location.LocationSubscription | null>(null);

    useEffect(() => {
        requestLocationPermission();
        fetchGuardians();

        return () => {
            // Cleanup location tracking on unmount
            if (locationSubscription) {
                locationSubscription.remove();
            }
        };
    }, []);

    const fetchGuardians = async () => {
        try {
            const response = await axios.get(`${API_URL}/guardians/1`); // TODO: Get user_id from auth
            const guardiansData = response.data.guardians || [];
            // Filter guardians with tracking enabled
            const trackingGuardians = guardiansData.filter((g: any) => g.can_track);
            setGuardians(trackingGuardians.map((g: any) => ({
                id: g.id,
                name: g.guardian_username
            })));
        } catch (error) {
            console.error('Fetch guardians error:', error);
        }
    };

    const requestLocationPermission = async () => {
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status === 'granted') {
                const loc = await Location.getCurrentPositionAsync({});
                setLocation(loc);
            }
        } catch (error) {
            console.error('Location permission error:', error);
        }
    };

    const startJourney = async () => {
        let currentLoc = location;
        if (!currentLoc) {
            try {
                const { status } = await Location.requestForegroundPermissionsAsync();
                if (status === 'granted') {
                    currentLoc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
                    setLocation(currentLoc);
                }
            } catch (e) {
                console.error('Safe Walk location attempt failed', e);
            }
        }

        if (!currentLoc) {
            Alert.alert('Location Required', 'Safe Walk requires active location tracking to notify your guardians. Please enable location permissions.');
            return;
        }

        try {
            // Backend will fetch guardians automatically
            const response = await axios.post(`${API_URL}/safe-walk/start`, {
                user_id: 1,
                start_lat: currentLoc.coords.latitude,
                start_lng: currentLoc.coords.longitude,
            });

            if (response.data.journey_id) {
                setJourneyId(response.data.journey_id);
                setJourneyActive(true);
                setGuardiansNotified(response.data.guardians_notified);

                Alert.alert(
                    'Safe Walk Started',
                    `${response.data.guardians_notified} guardian${response.data.guardians_notified !== 1 ? 's are' : ' is'} now tracking you`
                );

                // Start real-time location tracking
                startLocationTracking(response.data.journey_id);
            }
        } catch (error) {
            console.error('Start journey error:', error);
            Alert.alert('Error', 'Failed to start Safe Walk');
        }
    };

    const startLocationTracking = async (jId: number) => {
        try {
            const subscription = await Location.watchPositionAsync(
                {
                    accuracy: Location.Accuracy.High,
                    timeInterval: 10000, // Update every 10 seconds
                    distanceInterval: 10, // Or every 10 meters
                },
                async (newLocation) => {
                    // Send location update to backend
                    try {
                        await axios.post(`${API_URL}/safe-walk/location-update`, {
                            journey_id: jId,
                            latitude: newLocation.coords.latitude,
                            longitude: newLocation.coords.longitude,
                        });
                        setLocation(newLocation);
                    } catch (error) {
                        console.error('Location update error:', error);
                    }
                }
            );
            setLocationSubscription(subscription);
        } catch (error) {
            console.error('Location tracking error:', error);
        }
    };

    const endJourney = async () => {
        if (!journeyId || !location) return;

        try {
            // Stop location tracking
            if (locationSubscription) {
                locationSubscription.remove();
                setLocationSubscription(null);
            }

            await axios.post(`${API_URL}/safe-walk/end`, null, {
                params: {
                    journey_id: journeyId,
                    end_lat: location.coords.latitude,
                    end_lng: location.coords.longitude,
                },
            });

            setJourneyActive(false);
            setJourneyId(null);
            Alert.alert('Safe Walk Ended', 'Your guardians have been notified that you arrived safely');
        } catch (error) {
            console.error('End journey error:', error);
            Alert.alert('Error', 'Failed to end Safe Walk');
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
                        <Text style={styles.title}>{t.safeWalk}</Text>
                        <Text style={styles.subtitle}>SECURE PROXIMITY TRACKING</Text>
                    </View>
                </View>

                <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                    {/* Status HUD */}
                    <BlurView intensity={Platform.OS === 'web' ? 20 : 60} tint="dark" style={[styles.statusCard, journeyActive && styles.statusCardActive]}>
                        <View style={styles.statusHeader}>
                            <Ionicons name="radio-outline" size={16} color={journeyActive ? '#00f3ff' : '#94a3b8'} />
                            <Text style={[styles.statusLabel, journeyActive && { color: '#00f3ff' }]}>SYSTEM STATUS</Text>
                        </View>
                        <Text style={[styles.statusValue, journeyActive && styles.statusActive]}>
                            {journeyActive ? 'TRANSMITTING LIVE COORDINATES' : 'IDLE - READY FOR DISPATCH'}
                        </Text>
                        {journeyActive && (
                            <View style={styles.activeDetails}>
                                <Text style={styles.activeSub}>GUARDIANS LINKED: {guardiansNotified}</Text>
                                <View style={styles.pulseDot} />
                            </View>
                        )}
                    </BlurView>

                    {/* Protocol Info */}
                    <View style={styles.infoGrid}>
                        <BlurView intensity={40} tint="dark" style={styles.infoBox}>
                            <Ionicons name="shield-outline" size={20} color="#00f3ff" />
                            <Text style={styles.infoBoxTitle}>AUTO-SOS</Text>
                            <Text style={styles.infoBoxText}>Activated if idle {'>'} 120s</Text>
                        </BlurView>
                        <BlurView intensity={40} tint="dark" style={styles.infoBox}>
                            <Ionicons name="navigate-outline" size={20} color="#00f3ff" />
                            <Text style={styles.infoBoxTitle}>GEO-FENCE</Text>
                            <Text style={styles.infoBoxText}>Alerts on route deviation</Text>
                        </BlurView>
                    </View>

                    {/* Guardians HUD */}
                    <Text style={styles.sectionLabel}>LINKED GUARDIANS</Text>
                    <BlurView intensity={Platform.OS === 'web' ? 20 : 60} tint="dark" style={styles.guardiansCard}>
                        {guardians.length > 0 ? guardians.map((guardian) => (
                            <View key={guardian.id} style={styles.guardianItem}>
                                <View style={styles.guardianInfo}>
                                    <View style={styles.onlineDot} />
                                    <Text style={styles.guardianName}>{(guardian.name || 'Anonymous').toUpperCase()}</Text>
                                </View>
                                <Text style={styles.guardianStatus}>LINKED</Text>
                            </View>
                        )) : (
                            <Text style={styles.noGuardians}>NO ACTIVE GUARDIANS DETECTED</Text>
                        )}
                    </BlurView>

                    {/* Telemetry View (Real Tactical Map) */}
                    <View style={styles.telemetryContainer}>
                        <View style={styles.telemetryHeader}>
                            <Text style={styles.telemetryTitle}>TACTICAL COORDINATE FEED</Text>
                            <Text style={styles.telemetryValue}>
                                {location ? `${location.coords.latitude.toFixed(6)}, ${location.coords.longitude.toFixed(6)}` : 'SCANNING...'}
                            </Text>
                        </View>
                        <View style={styles.mapGrid}>
                            <TacticalMap 
                                mode="safe-walk"
                                userLocation={location ? { latitude: location.coords.latitude, longitude: location.coords.longitude } : undefined}
                                routePath={journeyActive ? [
                                    { latitude: 53.3498, longitude: -6.2603 },
                                    { latitude: 53.345, longitude: -6.265 }
                                ] : []}
                                height={200}
                            />
                        </View>
                    </View>

                    {/* Action Interface */}
                    <View style={styles.actionContainer}>
                        {!journeyActive ? (
                            <TouchableOpacity style={styles.startButton} onPress={startJourney}>
                                <Text style={styles.startButtonText}>INITIALIZE SAFE WALK</Text>
                            </TouchableOpacity>
                        ) : (
                            <TouchableOpacity style={styles.endButton} onPress={endJourney}>
                                <Text style={styles.endButtonText}>CONFIRM SAFE ARRIVAL</Text>
                            </TouchableOpacity>
                        )}
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
    title: {
        fontSize: 20,
        fontWeight: '900',
        color: '#fff',
        letterSpacing: 2,
    },
    subtitle: {
        fontSize: 10,
        color: '#00f3ff',
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
        opacity: 0.8,
    },
    content: {
        padding: 20,
        paddingBottom: 40,
    },
    statusCard: {
        borderRadius: 12,
        padding: 20,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        backgroundColor: 'rgba(2, 6, 23, 0.4)',
        marginBottom: 20,
        overflow: 'hidden',
    },
    statusCardActive: {
        borderColor: 'rgba(0, 243, 255, 0.5)',
        backgroundColor: 'rgba(0, 243, 255, 0.05)',
    },
    statusHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    statusLabel: {
        color: '#94a3b8',
        fontSize: 10,
        fontWeight: '900',
        marginLeft: 6,
        letterSpacing: 1,
    },
    statusValue: {
        color: '#94a3b8',
        fontSize: 14,
        fontWeight: 'bold',
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    },
    statusActive: {
        color: '#00f3ff',
    },
    activeDetails: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 15,
        paddingTop: 15,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0, 243, 255, 0.2)',
    },
    activeSub: {
        color: 'rgba(0, 243, 255, 0.7)',
        fontSize: 10,
        fontWeight: 'bold',
    },
    pulseDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#00f3ff',
    },
    infoGrid: {
        flexDirection: 'row',
        gap: 15,
        marginBottom: 25,
    },
    infoBox: {
        flex: 1,
        borderRadius: 8,
        padding: 15,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
        alignItems: 'center',
        overflow: 'hidden',
    },
    infoBoxTitle: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '900',
        marginTop: 8,
        letterSpacing: 1,
    },
    infoBoxText: {
        color: '#94a3b8',
        fontSize: 8,
        textAlign: 'center',
        marginTop: 4,
    },
    sectionLabel: {
        fontSize: 10,
        fontWeight: '900',
        color: 'rgba(255,255,255,0.5)',
        marginBottom: 10,
        letterSpacing: 2,
    },
    guardiansCard: {
        borderRadius: 12,
        padding: 15,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
        backgroundColor: 'rgba(2, 6, 23, 0.4)',
        marginBottom: 25,
        overflow: 'hidden',
    },
    guardianItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    guardianInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    onlineDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#22c55e',
        marginRight: 10,
    },
    guardianName: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    guardianStatus: {
        color: '#00f3ff',
        fontSize: 10,
        fontWeight: '900',
    },
    noGuardians: {
        color: 'rgba(255,255,255,0.3)',
        fontSize: 10,
        textAlign: 'center',
        padding: 10,
        letterSpacing: 1,
    },
    telemetryContainer: {
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(0, 243, 255, 0.2)',
        overflow: 'hidden',
        marginBottom: 30,
    },
    telemetryHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 12,
        backgroundColor: 'rgba(0, 243, 255, 0.05)',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0, 243, 255, 0.1)',
    },
    telemetryTitle: {
        color: '#00f3ff',
        fontSize: 9,
        fontWeight: '900',
        letterSpacing: 1,
    },
    telemetryValue: {
        color: '#fff',
        fontSize: 9,
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    },
    mapGrid: {
        height: 200,
        backgroundColor: '#020617',
        overflow: 'hidden',
    },
    actionContainer: {
        marginTop: 10,
    },
    startButton: {
        backgroundColor: 'rgba(0, 243, 255, 0.1)',
        padding: 18,
        borderRadius: 4,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#00f3ff',
    },
    startButtonText: {
        color: '#00f3ff',
        fontSize: 16,
        fontWeight: '900',
        letterSpacing: 2,
    },
    endButton: {
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        padding: 18,
        borderRadius: 4,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#22c55e',
    },
    endButtonText: {
        color: '#22c55e',
        fontSize: 16,
        fontWeight: '900',
        letterSpacing: 2,
    },
});
