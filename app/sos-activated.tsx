import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Animated,
    Alert,
    Platform,
    ScrollView
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Camera, useCameraPermissions } from 'expo-camera';
import { BlurView } from 'expo-blur';
import * as Notifications from 'expo-notifications';
import * as Location from 'expo-location';
import axios from 'axios';
import { theme } from '../styles/theme';
import EscalationProgress from '../components/EscalationProgress';
import VideoCapture from '../components/VideoCapture';
import { socket, connectSocket } from '../utils/socket';
import { API_URL } from '../utils/config';
import { useLanguage, useActiveSOS } from './_layout';
import TacticalMap from '../components/TacticalMap';

export default function SOSActivatedScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const isSilent = params.silent === 'true';
    const serviceType = params.service_type as string || 'all';
    const { t } = useLanguage();
    const { setActiveSOS, setSosData, sosData, activeSOS } = useActiveSOS();

    // Safe camera permission hook that doesn't crash on web
    const [permission, requestPermission] = Platform.OS === 'web'
        ? [{ granted: true }, async () => ({ granted: true })]
        : useCameraPermissions();

    const [countdown, setCountdown] = useState(isSilent ? 0 : 10); // 10 seconds to cancel
    const [sosId, setSosId] = useState<number | null>(null);
    const [guardiansNotified, setGuardiansNotified] = useState(0);
    const [sosActivated, setSosActivated] = useState(false);
    const [status, setStatus] = useState(sosData?.status || 'Pending Dispatch');
    const [eta, setEta] = useState(sosData?.eta || '4 min');
    const [dispatchedStation, setDispatchedStation] = useState(sosData?.station || 'Pearse St. Station');
    const [arrivalCountdown, setArrivalCountdown] = useState<number | null>(null);
    const [arrived, setArrived] = useState(false);
    const [officerLocation, setOfficerLocation] = useState<{lat: number, lng: number} | null>(null);
    const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);

    useEffect(() => {
        // Request permissions immediately if not on web
        if (Platform.OS !== 'web' && !permission?.granted && requestPermission) {
            requestPermission();
        }

        if (isSilent || activeSOS) {
            // In silent mode or if resuming active session, activate immediately
            activateSOS();
            return;
        }

        // Start countdown
        const timer = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    activateSOS();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [permission, isSilent]);

    useEffect(() => {
        connectSocket();

        socket.on('sos_accepted', (data: any) => {
            if (data.sos_id === sosId || !sosId) {
                handleSOSAccepted(data);
            }
        });

        socket.on('officer_location_update', (data: any) => {
            if (data.sos_id === sosId) {
                setOfficerLocation(data.location);
            }
        });

        socket.on('officer_arrived', (data: any) => {
            if (data.sos_id === sosId || !sosId) {
                handleOfficerArrived();
            }
        });

        socket.on('incident_resolved', (data: any) => {
            if (data.sos_id === sosId || !sosId) {
                handleIncidentResolved(data);
            }
        });

        // CROSS-TAB SYNC FALLBACK (Listen for localStorage updates from Garda Dashboard)
        const handleStorageUpdate = (e: StorageEvent) => {
            if (e.key === 'sos_update' && e.newValue) {
                const data = JSON.parse(e.newValue);
                if (data.type === 'sos_accepted') {
                    handleSOSAccepted(data);
                } else if (data.type === 'officer_arrived') {
                    handleOfficerArrived();
                } else if (data.type === 'incident_resolved') {
                    handleIncidentResolved(data);
                }
            }
        };

        if (Platform.OS === 'web') {
            window.addEventListener('storage', handleStorageUpdate);
        }

        return () => {
            socket.off('sos_accepted');
            socket.off('officer_location_update');
            if (Platform.OS === 'web') {
                window.removeEventListener('storage', handleStorageUpdate);
            }
        };
    }, [sosId]);

    const handleSOSAccepted = (data: any) => {
        setStatus('GARDA EN ROUTE');
        setEta('2:00');
        setDispatchedStation('Local Response Unit #402');
        setArrivalCountdown(120);
        setOfficerLocation(data.location || data.officer_location || { lat: 53.3501, lng: -6.2612 });
        
        if (!isSilent) {
            Alert.alert('🚨 Garda Dispatched', 'Officer Kelly has accepted your call and is responding. Stay where you are.');
        }

        // Sync to global context
        setSosData((prev: any) => ({
            ...prev,
            status: 'GARDA EN ROUTE',
            eta: '2:00',
            station: 'Local Response Unit #402',
            officer_location: data.location || data.officer_location || { lat: 53.3501, lng: -6.2612 }
        }));
    };

    const handleOfficerArrived = () => {
        setArrived(true);
        setStatus('GARDA ARRIVED SECURING SCENE');
        setEta('ARRIVED');
        setArrivalCountdown(0);
        
        if (!isSilent) {
            Alert.alert('👮 Garda On Scene', 'The responding unit has arrived at your location.');
        }

        setSosData((prev: any) => ({ ...prev, status: 'ARRIVED', eta: '0:00' }));
    };

    const [finalReport, setFinalReport] = useState<any>(null);

    const handleIncidentResolved = (data: any) => {
        setStatus('INCIDENT RESOLVED');
        setFinalReport({
            id: sosId || 5678,
            timestamp: new Date().toLocaleTimeString(),
            officer: 'Unit G234',
            summary: data.report || 'Incident resolved successfully.',
            actions: ['Secure perimeter', 'Evidence collection', 'Citizen safety verification']
        });
        setSosData(null); // Clear active state
    };

    // Arrival Countdown Effect
    useEffect(() => {
        if (arrivalCountdown === null || arrived) return;

        if (arrivalCountdown <= 0) {
            setArrived(true);
            setStatus('GARDA ARRIVED SECURING SCENE');
            setEta('0:00');
            // Trigger the resolution event for the simulation
            socket.emit('incident_resolved', { 
                sos_id: sosId || 5678, 
                report: "Bag robbed, CCTV taken, man identified", 
                resolution: "Green light, handled safely" 
            });
            Alert.alert('✅ Garda Arrived', 'The Garda unit has arrived at your location.');
            return;
        }

        const timer = setInterval(() => {
            setArrivalCountdown(prev => {
                const next = prev! - 1;
                const m = Math.floor(next / 60);
                const s = next % 60;
                setEta(`${m}:${s.toString().padStart(2, '0')}`);
                return next;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [arrivalCountdown, arrived, sosId]);

    const activateSOS = async () => {
        if (sosActivated) return; // Prevent duplicate calls

        setSosActivated(true);

        try {
            // Get current location
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Error', 'Location permission required for SOS');
                return;
            }

            const location = await Location.getCurrentPositionAsync({});
            setUserLocation({ lat: location.coords.latitude, lng: location.coords.longitude });

            const response = await axios.post(`${API_URL}/sos/activate`, {
                user_id: 1, 
                user_name: "John Doe",
                ppsn: "8805567X",
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                video_url: null,
                service_type: serviceType
            });

            // For demo purposes, align with Garda Dashboard mock IDs
            const demoId = serviceType === 'medical' ? 5678 : 
                           serviceType === 'fire' ? 9012 : 
                           1234;
            
            const finalSosId = response.data.sos_id || demoId;
            setSosId(finalSosId);
            setActiveSOS(true);
            setSosData({
                service_type: serviceType,
                status: 'Pending Dispatch'
            });
            setGuardiansNotified(response.data.guardians_notified);

            // CROSS-TAB SYNC FOR DEMO (Notify Garda Dashboard of new SOS)
            if (Platform.OS === 'web') {
                localStorage.setItem('sos_triggered', JSON.stringify({
                    id: finalSosId.toString(),
                    name: "John Doe",
                    ppsn: "8805567X",
                    location: "O'Connell St D01",
                    type: serviceType === 'medical' ? 'Medical' : serviceType === 'fire' ? 'Fire' : 'Assault',
                    timestamp: new Date().toLocaleTimeString(),
                    coords: { lat: location.coords.latitude, lng: location.coords.longitude }
                }));
            }

            // Show notification unless silent
            if (Platform.OS !== 'web' && !isSilent) {
                await Notifications.scheduleNotificationAsync({
                    content: {
                        title: "SOS ACTIVATED",
                        body: `Emergency alert sent to Garda and ${response.data.guardians_notified} guardians.`,
                    },
                    trigger: null,
                });
            }
        } catch (error) {
            console.error('SOS activation error:', error);
            // Don't show alert if silent to protect user
            if (!isSilent) {
                Alert.alert('Error', 'Failed to activate SOS. Please try again.');
            }
        }
    };

    const dispatchService = async (servicePath: string, serviceName: string) => {
        if (!sosId) return;
        try {
            const res = await axios.post(`${API_URL}/sos/${sosId}/${servicePath}`);
            if (!isSilent) Alert.alert(`✅ Dispatched`, res.data.message);
        } catch (e) {
            if (!isSilent) Alert.alert('Error', `Failed to dispatch ${serviceName}`);
        }
    };

    const handleCancel = () => {
        if (Platform.OS === 'web') {
            if (confirm("Cancel SOS? Are you sure you want to cancel the emergency alert?")) {
                router.replace('/home');
            }
        } else {
            Alert.alert(
                "Cancel SOS?",
                "Are you sure you want to cancel the emergency alert?",
                [
                    { text: "No", style: "cancel" },
                    {
                        text: "Yes, Cancel",
                        style: "destructive",
                        onPress: () => {
                            setActiveSOS(false);
                            setSosData(null);
                            router.replace('/home');
                        }
                    }
                ]
            );
        }
    };

    return (
        <View style={styles.container}>
            {/* Background Camera Evidence Recorder */}
            <VideoCapture sosId={sosId} isSilent={isSilent} />

            {/* Frosted Glass Overlay */}
            <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFillObject} />

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => router.canGoBack() ? router.back() : router.replace('/home')}
                    >
                        <Text style={styles.backButtonText}>← Back</Text>
                    </TouchableOpacity>

                    <View style={styles.liveBadge}>
                        <View style={styles.liveDot} />
                        <Text style={styles.liveText}>{isSilent ? 'SILENT MODE' : (t.liveStatus || "LIVE STATUS")}</Text>
                    </View>
                    <Text style={[styles.subHeader, isSilent && { color: '#64748b' }]}>
                        {isSilent ? 'Covert Emergency Active' : 
                         serviceType === 'medical' ? 'Medical Emergency Dispatch Active' :
                         serviceType === 'fire' ? 'Fire Brigade Dispatch Active' :
                         serviceType === 'garda' ? 'Garda Rapid Response Active' :
                         'National Emergency Services Active'}
                    </Text>

                    {/* Dispatch Lifecycle Tracker */}
                    <View style={styles.lifecycleContainer}>
                        <View style={styles.lifecycleBar}>
                            <View style={[styles.lifecyclePoint, { backgroundColor: '#22c55e' }]} />
                            <View style={[styles.lifecycleLine, (status !== 'Pending Dispatch') && { backgroundColor: '#fbbf24' }]} />
                            <View style={[styles.lifecyclePoint, (status !== 'Pending Dispatch') ? { backgroundColor: '#fbbf24' } : { backgroundColor: '#334155' }]} />
                            <View style={[styles.lifecycleLine, (status === 'GARDA ARRIVED SECURING SCENE' || status === 'INCIDENT RESOLVED') && { backgroundColor: '#00f3ff' }]} />
                            <View style={[styles.lifecyclePoint, (status === 'GARDA ARRIVED SECURING SCENE' || status === 'INCIDENT RESOLVED') ? { backgroundColor: '#00f3ff' } : { backgroundColor: '#334155' }]} />
                        </View>
                        <View style={styles.lifecycleLabels}>
                            <Text style={styles.lifecycleLabel}>RECEIVED</Text>
                            <Text style={[styles.lifecycleLabel, (status !== 'Pending Dispatch') && { color: '#fbbf24' }]}>ACCEPTED</Text>
                            <Text style={[styles.lifecycleLabel, (status === 'GARDA ARRIVED SECURING SCENE' || status === 'INCIDENT RESOLVED') && { color: '#00f3ff' }]}>ARRIVED</Text>
                        </View>
                    </View>
                </View>

                {/* Main Visual: Escalation Progress */}
                <View style={styles.progressContainer}>
                    {/* Escalation Progress Component */}
                    {sosId && <EscalationProgress sosId={sosId} />}
                </View>

                {/* ETA Card */}
                <View style={styles.etaCard}>
                    <Text style={styles.etaLabel}>{status}</Text>
                    <Text style={[styles.etaTime, status.includes('GARDA') && { color: '#00f3ff' }]}>{eta}</Text>
                    <Text style={styles.etaStation}>{dispatchedStation}</Text>
                </View>

                {/* TACTICAL MAP FEED */}
                <View style={styles.mapPanel}>
                    <Text style={styles.mapTitle}>LIVE TACTICAL RESPONSE FEED</Text>
                    <View style={styles.mapContainer}>
                        <TacticalMap 
                            mode="safe-walk"
                            userLocation={userLocation ? { latitude: userLocation.lat, longitude: userLocation.lng } : undefined}
                            gardaLocation={officerLocation ? { latitude: officerLocation.lat, longitude: officerLocation.lng } : undefined}
                            height={250}
                        />
                        {/* Simulated Garda Movement Overlay */}
                        {officerLocation && (
                            <View style={StyleSheet.absoluteFill} pointerEvents="none">
                                {/* This is a simplified simulation of the Garda icon moving on the map */}
                                {/* In a real app, the TacticalMap would handle the officer markers via props */}
                            </View>
                        )}
                    </View>
                </View>

                {/* Guardian Notification Card */}
                <View style={styles.guardianCard}>
                    <View style={styles.guardianHeader}>
                        <Text style={styles.guardianIcon}>🛡️</Text>
                        <Text style={styles.guardianTitle}>Guardians Notified</Text>
                    </View>
                    <Text style={styles.guardianCount}>
                        {sosActivated
                            ? `${guardiansNotified} Guardians have been alerted`
                            : `Notifying guardians in ${countdown}s...`
                        }
                    </Text>
                </View>

                {/* Action Buttons */}
                <View style={styles.actionContainer}>
                    {/* Final Report UI */}
                    {finalReport && (
                        <BlurView intensity={80} tint="dark" style={styles.reportCard}>
                            <View style={styles.reportHeader}>
                                <Ionicons name="checkmark-circle" size={24} color="#22c55e" />
                                <Text style={styles.reportTitle}>TACTICAL INCIDENT SUMMARY</Text>
                            </View>
                            <View style={styles.reportDivider} />
                            <View style={styles.reportRow}>
                                <Text style={styles.reportLabel}>INCIDENT ID:</Text>
                                <Text style={styles.reportValue}>#{finalReport.id}</Text>
                            </View>
                            <View style={styles.reportRow}>
                                <Text style={styles.reportLabel}>RESOLVED AT:</Text>
                                <Text style={styles.reportValue}>{finalReport.timestamp}</Text>
                            </View>
                            <View style={styles.reportRow}>
                                <Text style={styles.reportLabel}>OFFICER:</Text>
                                <Text style={styles.reportValue}>{finalReport.officer}</Text>
                            </View>
                            <View style={styles.reportSection}>
                                <Text style={styles.reportLabel}>SUMMARY:</Text>
                                <Text style={styles.reportSummary}>{finalReport.summary}</Text>
                            </View>
                            <View style={styles.reportSection}>
                                <Text style={styles.reportLabel}>ACTIONS TAKEN:</Text>
                                {finalReport.actions.map((action: string, i: number) => (
                                    <Text key={i} style={styles.reportAction}>• {action}</Text>
                                ))}
                            </View>
                            <TouchableOpacity 
                                style={styles.closeReportBtn} 
                                onPress={() => router.replace('/home')}
                            >
                                <Text style={styles.closeReportText}>RETURN TO HOME</Text>
                            </TouchableOpacity>
                        </BlurView>
                    )}

                    <TouchableOpacity
                        style={styles.chatButton}
                        onPress={() => router.push('/garda-chat')}
                    >
                        <Text style={styles.chatButtonText}>Chat with Garda Direct</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.cancelButton}
                        onPress={handleCancel}
                    >
                        <Text style={styles.cancelButtonText}>CANCEL SOS</Text>
                    </TouchableOpacity>
                </View>

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000', // Black behind camera
    },
    scrollContent: {
        flexGrow: 1,
        paddingBottom: theme.spacing.xxxl,
    },
    header: {
        padding: theme.spacing.lg,
        paddingTop: theme.spacing.xxl,
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.1)',
    },
    backButton: {
        position: 'absolute',
        left: theme.spacing.md,
        top: theme.spacing.xxl,
        zIndex: 10,
    },
    backButtonText: {
        color: theme.colors.textSecondary,
        fontSize: theme.fonts.size.medium,
    },
    liveBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 0, 0, 0.1)',
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.xs,
        borderRadius: theme.borderRadius.full,
        marginBottom: theme.spacing.sm,
    },
    liveDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: theme.colors.error,
        marginRight: theme.spacing.sm,
    },
    liveText: {
        color: theme.colors.error,
        fontWeight: 'bold',
        fontSize: theme.fonts.size.small,
    },
    subHeader: {
        fontSize: theme.fonts.size.large,
        fontWeight: theme.fonts.weight.heavy,
        color: theme.colors.text,
        letterSpacing: 1,
    },
    progressContainer: {
        marginVertical: theme.spacing.xl,
        paddingHorizontal: theme.spacing.lg,
    },
    etaCard: {
        margin: theme.spacing.lg,
        padding: theme.spacing.lg,
        backgroundColor: 'rgba(2, 6, 23, 0.6)',
        borderRadius: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(0, 243, 255, 0.3)',
        ...theme.shadows.large,
    },
    etaLabel: {
        fontSize: 12,
        color: '#00f3ff',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: theme.spacing.xs,
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    },
    etaTime: {
        fontSize: 48,
        fontWeight: '900',
        color: '#fff',
        marginBottom: theme.spacing.xs,
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    },
    etaStation: {
        fontSize: 14,
        color: '#00f3ff',
        fontWeight: 'bold',
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    },
    mapPanel: {
        marginHorizontal: theme.spacing.lg,
        marginBottom: theme.spacing.lg,
        backgroundColor: 'rgba(2, 6, 23, 0.8)',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(0, 243, 255, 0.3)',
        overflow: 'hidden',
        padding: 10,
    },
    mapTitle: {
        color: '#00f3ff',
        fontSize: 10,
        fontWeight: 'bold',
        marginBottom: 8,
        letterSpacing: 1,
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    },
    mapContainer: {
        height: 250,
        borderRadius: 8,
        overflow: 'hidden',
        backgroundColor: '#000',
    },
    guardianCard: {
        marginHorizontal: theme.spacing.lg,
        marginBottom: theme.spacing.lg,
        padding: theme.spacing.lg,
        backgroundColor: theme.colors.emeraldGlass, // Emerald tint over blur
        borderRadius: theme.borderRadius.lg,
        borderWidth: 1,
        borderColor: theme.colors.primary,
    },
    guardianHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: theme.spacing.sm,
    },
    guardianIcon: {
        fontSize: 20,
        marginRight: theme.spacing.sm,
    },
    guardianTitle: {
        fontSize: theme.fonts.size.medium,
        fontWeight: 'bold',
        color: theme.colors.text,
    },
    guardianCount: {
        fontSize: theme.fonts.size.medium,
        color: theme.colors.textSecondary,
    },
    actionContainer: {
        padding: theme.spacing.lg,
        gap: theme.spacing.md,
        paddingBottom: 40,
    },
    lifecycleContainer: {
        marginTop: 20,
        width: '100%',
        paddingHorizontal: 20,
    },
    lifecycleBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: 20,
    },
    lifecyclePoint: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#334155',
    },
    lifecycleLine: {
        flex: 1,
        height: 2,
        backgroundColor: '#334155',
        marginHorizontal: 4,
    },
    lifecycleLabels: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 8,
    },
    lifecycleLabel: {
        color: '#64748b',
        fontSize: 9,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    chatButton: {
        backgroundColor: theme.colors.background,
        padding: theme.spacing.md,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        borderWidth: 1,
        borderColor: '#334155',
    },
    reportCard: {
        padding: 24,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#22c55e',
        marginTop: 20,
    },
    reportHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 16,
    },
    reportTitle: {
        color: '#22c55e',
        fontSize: 16,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    reportDivider: {
        height: 1,
        backgroundColor: 'rgba(34, 197, 94, 0.2)',
        marginBottom: 16,
    },
    reportRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    reportLabel: {
        color: '#64748b',
        fontSize: 10,
        fontWeight: 'bold',
    },
    reportValue: {
        color: '#f8fafc',
        fontSize: 10,
    },
    reportSection: {
        marginTop: 16,
    },
    reportSummary: {
        color: '#f8fafc',
        fontSize: 12,
        lineHeight: 18,
        marginTop: 4,
    },
    reportAction: {
        color: '#94a3b8',
        fontSize: 11,
        marginTop: 4,
    },
    closeReportBtn: {
        backgroundColor: '#22c55e',
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 24,
    },
    closeReportText: {
        color: '#000',
        fontWeight: 'bold',
        fontSize: 12,
    },
    cancelButton: {
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        padding: theme.spacing.md,
        borderRadius: theme.borderRadius.full,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: theme.colors.danger,
    },
    cancelButtonText: {
        color: theme.colors.danger,
        fontSize: theme.fonts.size.medium,
        fontWeight: 'bold',
    },
});
