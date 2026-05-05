import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    Platform,
    Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { useLanguage } from './_layout';
import JarvisWrapper from '../components/JarvisWrapper';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import TacticalMap from '../components/TacticalMap';

const { width, height } = Dimensions.get('window');

export default function CrimeMapScreen() {
    const router = useRouter();
    const { t } = useLanguage();
    const [loading, setLoading] = useState(true);
    const [location, setLocation] = useState<{latitude: number; longitude: number} | null>(null);

    useEffect(() => {
        const init = async () => {
            try {
                const { status } = await Location.requestForegroundPermissionsAsync();
                if (status === 'granted') {
                    const loc = await Location.getCurrentPositionAsync({});
                    setLocation({
                        latitude: loc.coords.latitude,
                        longitude: loc.coords.longitude
                    });
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        init();
    }, []);

    if (loading) {
        return (
            <JarvisWrapper>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#00f3ff" />
                    <Text style={styles.loadingText}>INITIALIZING TACTICAL FEED...</Text>
                </View>
            </JarvisWrapper>
        );
    }

    return (
        <JarvisWrapper showRings={true} showTelemetry={true}>
            <View style={styles.container}>
                <View style={styles.mapContainer}>
                    <TacticalMap 
                        mode="citizen" 
                        userLocation={location || undefined}
                    />
                </View>

                <View style={styles.overlay} pointerEvents="box-none">
                    <View style={styles.header}>
                        <TouchableOpacity onPress={() => router.replace('/home')} style={styles.backButton}>
                            <Ionicons name="chevron-back" size={24} color="#00f3ff" />
                        </TouchableOpacity>
                        <View>
                            <Text style={styles.title}>{t.crimeMap}</Text>
                            <Text style={styles.subtitle}>CITIZEN SAFETY PLATFORM | LIVE TACTICAL</Text>
                        </View>
                    </View>

                    <TouchableOpacity style={styles.sosFloating} onPress={() => router.push('/sos-activated')}>
                        <Text style={styles.sosFloatingText}>🚨 SOS</Text>
                    </TouchableOpacity>

                    <BlurView intensity={30} tint="dark" style={styles.statsPanel}>
                        <Text style={styles.statsTitle}>CITY METRICS</Text>
                        <View style={styles.statRow}>
                            <Text style={styles.statLabel}>ACTIVE HOTSPOTS</Text>
                            <Text style={styles.statValue}>12</Text>
                        </View>
                        <View style={styles.statIndicatorRow}>
                            <View style={[styles.dot, { backgroundColor: '#ef4444' }]} />
                            <Text style={styles.indicatorText}>CRITICAL ALERT</Text>
                        </View>
                    </BlurView>
                </View>
            </View>
        </JarvisWrapper>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    mapContainer: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 1,
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'transparent',
        padding: 20,
        zIndex: 10,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        color: '#00f3ff',
        marginTop: 20,
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
        fontSize: 14,
        letterSpacing: 2,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: Platform.OS === 'ios' ? 40 : 20,
        marginBottom: 15,
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
        color: '#fff',
        fontSize: 20,
        fontWeight: '900',
        letterSpacing: 2,
    },
    subtitle: {
        color: '#00f3ff',
        fontSize: 10,
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
        opacity: 0.8,
    },
    sosFloating: {
        position: 'absolute',
        bottom: 30,
        left: '50%',
        marginLeft: -70,
        width: 140,
        height: 60,
        backgroundColor: '#ef4444',
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#ef4444',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.7,
        shadowRadius: 20,
        elevation: 10,
        zIndex: 1000,
    },
    sosFloatingText: {
        color: '#fff',
        fontSize: 20,
        fontWeight: '900',
    },
    statsPanel: {
        position: 'absolute',
        bottom: 30,
        right: 20,
        width: 180,
        borderRadius: 12,
        padding: 15,
        borderWidth: 1,
        borderColor: 'rgba(0, 243, 255, 0.3)',
        overflow: 'hidden',
    },
    statsTitle: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 1,
        marginBottom: 10,
    },
    statRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    statLabel: {
        color: 'rgba(0, 243, 255, 0.7)',
        fontSize: 8,
        fontWeight: 'bold',
    },
    statValue: {
        color: '#fff',
        fontSize: 9,
        fontWeight: '900',
    },
    statIndicatorRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 5,
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        marginRight: 8,
    },
    indicatorText: {
        color: '#94a3b8',
        fontSize: 8,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
});
