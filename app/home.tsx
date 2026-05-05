import React, { useRef, useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Animated,
    Alert,
    ScrollView,
    Image,
    ImageBackground,
    Dimensions,
    Platform,
    PanResponder,
    useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import NetInfo from '@react-native-community/netinfo';
import { BlurView } from 'expo-blur';
import axios from 'axios';
import { theme } from '../styles/theme';
import { createPulseAnimation } from '../styles/animations';
import { useLanguage, useActiveSOS } from './_layout';
import { enqueueAlert, flushQueue, getQueueCount } from '../utils/offlineQueue';
import { socket, connectSocket } from '../utils/socket';
import { API_URL } from '../utils/config';
import JarvisWrapper from '../components/JarvisWrapper';
import LanguageSelector from '../components/LanguageSelector';

const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';

export default function HomeScreen() {
    const router = useRouter();
    const { width } = useWindowDimensions();
    const isSmallDevice = width < 600;
    const gridItemWidth = isSmallDevice ? (width - theme.spacing.lg * 2 - theme.spacing.md) / 2 : (width - theme.spacing.lg * 2 - theme.spacing.md * 2) / 3;
    
    const { language, setLanguage, t } = useLanguage();
    const { activeSOS, sosData } = useActiveSOS();
    const pulseAnim = useRef(new Animated.Value(0)).current;

    const [location, setLocation] = useState<Location.LocationObject | null>(null);
    const [warningMessage, setWarningMessage] = useState('');
    const [sosStatus, setSosStatus] = useState<'idle' | 'activated'>('idle');
    const [isOffline, setIsOffline] = useState(false);
    const [proximityWarnings, setProximityWarnings] = useState<any[]>([]);
    const [queuedCount, setQueuedCount] = useState(0);
    const [showLangMenu, setShowLangMenu] = useState(false);

    const [panState, setPanState] = useState<'idle'|'active'|'fire'|'medical'|'garda'>('idle');
    const pan = useRef(new Animated.ValueXY()).current;

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onPanResponderGrant: () => {
                setPanState('active');
                pan.setOffset({
                    x: (pan.x as any)._value,
                    y: (pan.y as any)._value
                });
                pan.setValue({ x: 0, y: 0 });
            },
            onPanResponderMove: (_, gestureState) => {
                Animated.event([null, { dx: pan.x, dy: pan.y }], { useNativeDriver: false })(_, gestureState);
                const threshold = 30; // Reduced for faster locking on Desktop/Mouse
                if (gestureState.dy < -threshold) setPanState('fire');
                else if (gestureState.dx < -threshold) setPanState('medical');
                else if (gestureState.dx > threshold) setPanState('garda');
                else setPanState('active');
            },
            onPanResponderRelease: (_, gestureState) => {
                pan.flattenOffset();
                const threshold = 30;
                let chosenService = 'all';
                if (gestureState.dy < -threshold) chosenService = 'fire';
                else if (gestureState.dx < -threshold) chosenService = 'medical';
                else if (gestureState.dx > threshold) chosenService = 'garda';

                setPanState('idle');
                Animated.spring(pan, {
                    toValue: { x: 0, y: 0 },
                    useNativeDriver: false,
                    friction: 5
                }).start();

                activateSOS(chosenService);
            }
        })
    ).current;

    useEffect(() => {
        createPulseAnimation(pulseAnim).start();
        requestLocationPermission();
        fetchCrimeWarnings();

        // Network monitoring
        const unsubscribe = NetInfo.addEventListener(state => {
            const offline = !(state.isConnected && state.isInternetReachable !== false);
            setIsOffline(offline);
            if (!offline) {
                // Flush offline queue when we come back online
                flushQueue().then(count => {
                    if (count > 0) Alert.alert('✅ Synced', `${count} queued alert(s) have been sent.`);
                    getQueueCount().then(setQueuedCount);
                });
            }
        });

        getQueueCount().then(setQueuedCount);

        // National Alert Listener
        connectSocket();
        socket.on('national_alert', (data: any) => {
            console.log('National alert received:', data);
            setWarningMessage(`🚨 NATIONAL ALERT (${data.region}): ${data.message}`);
            if (data.is_critical) {
                Alert.alert('⚠️ CRITICAL NATIONAL ALERT', data.message);
            }
        });

        // Desktop Keyboard Controls for SOS
        let isNavigating = false;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (Platform.OS === 'web' && !isNavigating) {
                if (e.key === 'ArrowUp') {
                    isNavigating = true;
                    router.replace({ pathname: '/sos-activated', params: { service_type: 'fire' } });
                }
                else if (e.key === 'ArrowLeft') {
                    isNavigating = true;
                    router.replace({ pathname: '/sos-activated', params: { service_type: 'medical' } });
                }
                else if (e.key === 'ArrowRight') {
                    isNavigating = true;
                    router.replace({ pathname: '/sos-activated', params: { service_type: 'garda' } });
                }
            }
        };

        if (Platform.OS === 'web') {
            window.addEventListener('keydown', handleKeyDown);
        }

        return () => {
            unsubscribe();
            socket.off('national_alert');
            if (Platform.OS === 'web') {
                window.removeEventListener('keydown', handleKeyDown);
            }
        };
    }, []);

    const requestLocationPermission = async () => {
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status === 'granted') {
                const loc = await Location.getCurrentPositionAsync({});
                setLocation(loc);
                // Check proximity to danger zones
                checkProximity(loc.coords.latitude, loc.coords.longitude);
            }
        } catch (error) {
            console.error('Location permission error:', error);
        }
    };

    const checkProximity = async (lat: number, lng: number) => {
        try {
            const res = await axios.post(`${API_URL}/proximity-check`, {
                latitude: lat, longitude: lng, radius_km: 0.5
            });
            if (res.data.warning && res.data.danger_zones_nearby.length > 0) {
                setProximityWarnings(res.data.danger_zones_nearby);
                const zone = res.data.danger_zones_nearby[0];
                setWarningMessage(`⚠️ You are ${(zone.distance_km * 1000).toFixed(0)}m from ${zone.name} (${zone.risk_level} risk)`);
            }
        } catch (e) {}
    };

    const fetchCrimeWarnings = async () => {
        try {
            const response = await axios.get(`${API_URL}/crime-map`);
            if (response.data.hotspots && response.data.hotspots.length > 0) {
                const hotspot = response.data.hotspots[0];
                if (!warningMessage) {
                    setWarningMessage(`Notice: Increased activity near ${hotspot.name}`);
                }
            }
        } catch (error) {
            console.error('Error fetching crime warnings:', error);
        }
    };

    const activateSOS = async (serviceType = 'all') => {
        setSosStatus('activated');
        
        let currentLoc = location;
        if (!currentLoc) {
            try {
                const { status } = await Location.requestForegroundPermissionsAsync();
                if (status === 'granted') {
                    currentLoc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
                    setLocation(currentLoc);
                }
            } catch (e) {
                console.error('SOS Location attempt failed', e);
            }
        }

        const lat = currentLoc?.coords.latitude || 0;
        const lng = currentLoc?.coords.longitude || 0;

        if (isOffline) {
            // Queue for later if offline
            await enqueueAlert({ type: 'sos', user_id: 1, latitude: lat, longitude: lng, timestamp: new Date().toISOString() });
            const count = await getQueueCount();
            setQueuedCount(count);
            Alert.alert('📡 Offline SOS Queued', 'Your SOS has been saved and will be sent as soon as signal returns.');
        } else {
            try {
                await axios.post(`${API_URL}/emergency`, {
                    user_id: 1, latitude: lat, longitude: lng, service_type: serviceType
                });
            } catch (error) {
                // If request fails, queue it
                await enqueueAlert({ type: 'sos', user_id: 1, latitude: lat, longitude: lng, timestamp: new Date().toISOString() });
            }
        }

        setTimeout(() => {
            router.push(`/sos-activated?service_type=${serviceType}`);
            setTimeout(() => setSosStatus('idle'), 1000);
        }, 1500);
    };

    const activateSilentSOS = async () => {
        // Silent SOS — no countdown, no visual feedback, no sound
        const lat = location?.coords.latitude || 0;
        const lng = location?.coords.longitude || 0;

        if (isOffline) {
            await enqueueAlert({ type: 'silent_sos', user_id: 1, latitude: lat, longitude: lng, timestamp: new Date().toISOString() });
        } else {
            try {
                await axios.post(`${API_URL}/emergency/silent`, {
                    user_id: 1, latitude: lat, longitude: lng, is_silent: true,
                });
            } catch (e) {
                await enqueueAlert({ type: 'silent_sos', user_id: 1, latitude: lat, longitude: lng, timestamp: new Date().toISOString() });
            }
        }
        // Navigate silently — minimal UI change
        router.push('/sos-activated?silent=true');
    };

    const openLangMenu = () => {
        setShowLangMenu(true);
    };

    return (
        <JarvisWrapper showRings={true} showTelemetry={false}>
        <View style={styles.container}>
            <View style={styles.overlay}>
                {/* Custom Header */}
                <View style={styles.header}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.appTitle}>SLÁN</Text>
                        <Text style={styles.welcomeText}>
                            {language === 'ga' ? 'Dia dhuit, abhaile slán.' : 
                             language === 'es' ? 'Hola, hogar seguro.' :
                             language === 'fr' ? 'Bonjour, retour en sécurité.' :
                             language === 'de' ? 'Hallo, sicher zu Hause.' :
                             language === 'pt' ? 'Olá, em segurança.' :
                             language === 'pl' ? 'Witaj bezpiecznie w domu.' :
                             'Safe home.'}
                        </Text>
                    </View>
                    <View style={styles.headerRight}>
                        <TouchableOpacity style={styles.langButtonSmall} onPress={() => setShowLangMenu(true)}>
                            <Text style={styles.langTextSmall}>{language.toUpperCase()}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.profileCircle} onPress={() => router.push('/profile')}>
                            <Text style={styles.profileText}>JD</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Warning Banner */}
                {activeSOS && (
                    <TouchableOpacity 
                        style={styles.sosActiveBanner} 
                        onPress={() => router.push('/sos-activated')}
                    >
                        <View style={styles.sosActiveHeader}>
                            <View style={styles.pulseDotRed} />
                            <Text style={styles.sosActiveTitle}>EMERGENCY DISPATCH ACTIVE</Text>
                        </View>
                        <Text style={styles.sosActiveSub}>Garda responding to your location. Tap for live tactical feed.</Text>
                    </TouchableOpacity>
                )}

                {/* Offline Banner */}
                {isOffline && (
                    <View style={styles.offlineBanner}>
                        <Text style={styles.offlineText}>📡 Offline Mode — SOS will be sent when signal returns</Text>
                        {queuedCount > 0 && (
                            <Text style={styles.offlineQueueText}>{queuedCount} alert(s) queued</Text>
                        )}
                    </View>
                )}

                {warningMessage ? (
                    <BlurView intensity={30} tint="dark" style={styles.warningBanner}>
                        <Text style={styles.warningText}>{warningMessage}</Text>
                    </BlurView>
                ) : null}

                <ScrollView contentContainerStyle={styles.scrollContent}>
                    {/* SOS Section */}
                    <BlurView intensity={80} tint="dark" style={styles.sosCard}>
                        <Text style={styles.cardTitle}>{t.welcomeSubtitle}</Text>
                        <Text style={styles.cardSub}>Swipe UP for Fire, LEFT for Medical, RIGHT for Garda</Text>
                        
                        <View style={styles.dragContainer}>
                            {/* Tech Telemetry Ornaments */}
                            <Text style={[styles.techLine, { top: -20, left: 0 }]}>SYS.OS_V2.0 // ENCRYPTION: AES-256</Text>
                            <Text style={[styles.techLine, { top: -20, right: 0 }]}>GPS_ACCURACY: {location ? '< 5m' : 'CALIBRATING...'}</Text>
                            
                            {/* Directional Hints */}
                            {panState !== 'idle' && (
                                <>
                                    <Text style={[styles.hintIcon, styles.hintTop, panState === 'fire' && styles.hintActive]}>🔥 Fire</Text>
                                    <Text style={[styles.hintIcon, styles.hintLeft, panState === 'medical' && styles.hintActive]}>🚑 Med</Text>
                                    <Text style={[styles.hintIcon, styles.hintRight, panState === 'garda' && styles.hintActive]}>🚓 Garda</Text>
                                </>
                            )}
                            
                            <Animated.View 
                                {...panResponder.panHandlers}
                                style={[styles.sosButtonOuter, { 
                                    transform: [
                                        { translateX: pan.x },
                                        { translateY: pan.y },
                                        { scale: pulseAnim.interpolate({
                                            inputRange: [0, 1],
                                            outputRange: [1, 1.05]
                                        }) }
                                    ] 
                                }]}
                            >
                                <View
                                    style={[styles.sosButton, sosStatus === 'activated' && styles.sosButtonActivated]}
                                >
                                    <Text style={styles.sosText}>{sosStatus === 'activated' ? '✓' : 'SOS'}</Text>
                                    <Text style={styles.sosHint}>
                                        {Platform.OS === 'web' ? 'Drag or use ⬅️ ⬆️ ➡️ keys' : 'Drag to route'}
                                    </Text>
                                </View>
                            </Animated.View>
                        </View>
                    </BlurView>

                    {/* Features Grid */}
                    <View style={styles.grid}>
                        <TouchableOpacity style={[styles.gridItem, { width: gridItemWidth }]} onPress={() => router.push('/crime-map')}>
                            <Image source={require('../assets/harp_logo.png')} style={styles.gridLogoWatermark} resizeMode="contain" />
                            <Text style={styles.gridTitle}>{t.crimeMap}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.gridItem, { width: gridItemWidth }]} onPress={() => router.push('/safe-walk')}>
                            <Image source={require('../assets/harp_logo.png')} style={styles.gridLogoWatermark} resizeMode="contain" />
                            <Text style={styles.gridTitle}>{t.safeWalk}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.gridItem, { width: gridItemWidth }]} onPress={() => router.push('/report-crime')}>
                            <Image source={require('../assets/harp_logo.png')} style={styles.gridLogoWatermark} resizeMode="contain" />
                            <Text style={styles.gridTitle}>{t.report}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.gridItem, { width: gridItemWidth }]} onPress={() => router.push('/guardians')}>
                            <Image source={require('../assets/harp_logo.png')} style={styles.gridLogoWatermark} resizeMode="contain" />
                            <Text style={styles.gridTitle}>{t.guardians}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.gridItem, { width: gridItemWidth }]} onPress={() => router.push('/community-feed')}>
                            <Image source={require('../assets/harp_logo.png')} style={styles.gridLogoWatermark} resizeMode="contain" />
                            <Text style={styles.gridTitle}>{t.feed}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.gridItem, { width: gridItemWidth }]} onPress={() => router.push('/medical-profile')}>
                            <Image source={require('../assets/harp_logo.png')} style={styles.gridLogoWatermark} resizeMode="contain" />
                            <Text style={styles.gridTitle}>{t.medicalProfile}</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Community Strength */}
                    <BlurView intensity={60} tint="dark" style={styles.infoCard}>
                        <Text style={styles.infoTitle}>Protecting Ireland Together</Text>
                        <Text style={styles.infoText}>
                            You are part of a community of 12,400+ guardians across the country. 
                            Your safety is our national priority.
                        </Text>
                    </BlurView>
                </ScrollView>

                <TouchableOpacity style={styles.chatButton} onPress={() => router.push('/garda-chat')}>
                    <Text style={styles.chatIcon}>💬</Text>
                </TouchableOpacity>
            </View>
            <LanguageSelector visible={showLangMenu} onClose={() => setShowLangMenu(false)} />
        </View>
        </JarvisWrapper>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'transparent',
    },
    overlay: {
        flex: 1,
        backgroundColor: 'transparent',
        padding: theme.spacing.lg,
        paddingTop: isWeb ? theme.spacing.xl : theme.spacing.xxl,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.lg,
    },
    appTitle: {
        fontSize: 32,
        fontWeight: '900',
        color: '#00f3ff',
        letterSpacing: 4,
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    },
    welcomeText: {
        fontSize: 12,
        color: 'rgba(0, 243, 255, 0.7)',
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    langButtonSmall: {
        paddingVertical: 4,
        paddingHorizontal: 8,
        backgroundColor: 'rgba(0, 243, 255, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(0, 243, 255, 0.3)',
        borderRadius: 4,
    },
    langTextSmall: {
        color: '#00f3ff',
        fontSize: 10,
        fontWeight: '900',
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    },
    profileCircle: {
        width: 45,
        height: 45,
        borderRadius: 25,
        backgroundColor: 'rgba(0, 243, 255, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#00f3ff',
    },
    profileText: {
        color: '#00f3ff',
        fontWeight: '900',
        fontSize: 16,
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    },
    warningBanner: {
        borderRadius: theme.borderRadius.md,
        padding: theme.spacing.md,
        marginBottom: theme.spacing.lg,
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.2)',
        overflow: 'hidden',
    },
    warningText: {
        color: theme.colors.danger,
        fontWeight: 'bold',
        fontSize: 13,
    },
    scrollContent: {
        paddingBottom: theme.spacing.xxxl,
    },
    sosCard: {
        borderRadius: 16,
        padding: theme.spacing.xl,
        alignItems: 'center',
        marginBottom: theme.spacing.xl,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(0, 243, 255, 0.3)',
        backgroundColor: 'rgba(2, 6, 23, 0.6)',
    },
    cardTitle: {
        fontSize: 20,
        fontWeight: '900',
        color: '#fff',
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    cardSub: {
        fontSize: 10,
        color: '#00f3ff',
        marginBottom: theme.spacing.xl,
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
        letterSpacing: 1,
    },
    sosButtonOuter: {
        width: 140,
        height: 140,
        borderRadius: 70,
        backgroundColor: 'rgba(239, 68, 68, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
    },
    sosButton: {
        width: 110,
        height: 110,
        borderRadius: 55,
        backgroundColor: '#EF4444',
        justifyContent: 'center',
        alignItems: 'center',
        ...theme.shadows.glow,
        elevation: 10,
        shadowColor: '#EF4444',
    },
    sosButtonActivated: {
        backgroundColor: theme.colors.success,
        shadowColor: theme.colors.success,
    },
    sosText: {
        color: 'white',
        fontSize: 32,
        fontWeight: '900',
        letterSpacing: 2,
    },
    sosHint: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 10,
        fontWeight: 'bold',
        marginTop: 2,
    },
    techLine: {
        position: 'absolute',
        fontSize: 8,
        color: 'rgba(0, 243, 255, 0.4)',
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
        letterSpacing: 2,
    },
    dragContainer: {
        height: 250,
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    hintIcon: {
        position: 'absolute',
        fontSize: 14,
        fontWeight: 'bold',
        color: 'rgba(255,255,255,0.3)',
        zIndex: 1,
    },
    hintActive: {
        color: 'white',
        textShadowColor: 'rgba(255, 255, 255, 0.8)',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 10,
        transform: [{ scale: 1.2 }],
    },
    hintTop: {
        top: 20,
    },
    hintLeft: {
        left: 20,
    },
    hintRight: {
        right: 20,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginBottom: theme.spacing.xl,
    },
    gridItem: {
        aspectRatio: 0.9, 
        backgroundColor: 'rgba(2, 6, 23, 0.4)',
        borderRadius: 0, 
        padding: theme.spacing.md,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: theme.spacing.md,
        borderWidth: 1,
        borderColor: 'rgba(0, 243, 255, 0.4)',
    },
    gridLogoWatermark: {
        width: 60,
        height: 60,
        marginBottom: 12,
    },
    gridEmoji: {
        display: 'none', // Remove emojis to keep it serious
    },
    gridTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: '#00f3ff',
        textAlign: 'center',
        fontFamily: Platform.OS === 'ios' ? 'Helvetica Neue' : 'sans-serif-medium',
        letterSpacing: 1.5,
        textTransform: 'uppercase',
    },
    infoCard: {
        borderRadius: 12,
        padding: theme.spacing.lg,
        marginBottom: theme.spacing.xl,
        borderWidth: 1,
        borderColor: 'rgba(0, 243, 255, 0.3)',
        justifyContent: 'center',
        backgroundColor: 'rgba(2, 6, 23, 0.6)',
    },
    infoTitle: {
        fontSize: 14,
        fontWeight: '900',
        color: '#fff',
        marginBottom: theme.spacing.sm,
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    infoText: {
        fontSize: 11,
        color: '#00f3ff',
        lineHeight: 16,
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    },
    langFloat: {
        position: 'absolute',
        bottom: theme.spacing.xl,
        left: theme.spacing.lg,
        padding: theme.spacing.sm,
        backgroundColor: 'rgba(0, 243, 255, 0.1)',
        borderRadius: 4,
        borderWidth: 1,
        borderColor: '#00f3ff',
    },
    langFloatText: {
        fontWeight: '900',
        color: '#00f3ff',
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    },
    chatButton: {
        position: 'absolute',
        bottom: theme.spacing.xl,
        right: theme.spacing.lg,
        width: 55,
        height: 55,
        borderRadius: 30,
        backgroundColor: 'rgba(0, 243, 255, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#00f3ff',
    },
    chatIcon: {
        fontSize: 24,
    },
    sosActiveBanner: {
        margin: 20,
        padding: 16,
        backgroundColor: 'rgba(239, 68, 68, 0.15)',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#ef4444',
        ...theme.shadows.large,
    },
    sosActiveHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    sosActiveTitle: {
        color: '#ef4444',
        fontSize: 14,
        fontWeight: '900',
        letterSpacing: 1,
    },
    sosActiveSub: {
        color: '#fff',
        fontSize: 11,
        opacity: 0.8,
    },
    pulseDotRed: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#ef4444',
        marginRight: 8,
    },
    offlineBanner: {
        backgroundColor: 'rgba(239, 68, 68, 0.15)',
        borderRadius: theme.borderRadius.md,
        padding: theme.spacing.md,
        marginBottom: theme.spacing.md,
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.3)',
    },
    offlineText: {
        color: '#ef4444',
        fontWeight: 'bold',
        fontSize: 12,
        textAlign: 'center',
    },
    offlineQueueText: {
        color: '#fbbf24',
        fontSize: 11,
        textAlign: 'center',
        marginTop: 4,
    },
});
