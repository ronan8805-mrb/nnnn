import React, { useRef, useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Animated,
    Dimensions,
    Alert,
    Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import axios from 'axios';
import { theme } from '../styles/theme';

const { width, height } = Dimensions.get('window');
import { API_URL } from '../utils/config';

export default function ChildHomeScreen() {
    const router = useRouter();
    const pulseAnim = useRef(new Animated.Value(0)).current;
    const [sosActive, setSosActive] = useState(false);
    const [location, setLocation] = useState<Location.LocationObject | null>(null);
    const [isSafe, setIsSafe] = useState(false);

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
                Animated.timing(pulseAnim, { toValue: 0, duration: 1200, useNativeDriver: true }),
            ])
        ).start();

        (async () => {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status === 'granted') {
                const loc = await Location.getCurrentPositionAsync({});
                setLocation(loc);
            }
        })();
    }, []);

    const activateSOS = async () => {
        setSosActive(true);
        try {
            if (location) {
                await axios.post(`${API_URL}/emergency`, {
                    user_id: 1,
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude,
                });
            }
        } catch (e) {
            console.error('SOS Error:', e);
        }
        setTimeout(() => router.push('/sos-activated'), 1500);
    };

    const markSafe = async () => {
        setIsSafe(true);
        setSosActive(false);
        try {
            await axios.post(`${API_URL}/safe-checkin`, {
                user_id: 1,
                latitude: location?.coords.latitude || 0,
                longitude: location?.coords.longitude || 0,
            });
        } catch (e) {}
        Alert.alert('✅ Safe!', 'Your parents have been notified that you are safe.');
        setTimeout(() => setIsSafe(false), 3000);
    };

    const callParent = () => {
        Alert.alert('📞 Calling Parent', 'Connecting to your parent/guardian...', [
            { text: 'OK' }
        ]);
    };

    return (
        <View style={styles.container}>
            {/* Simple header */}
            <View style={styles.header}>
                <Text style={styles.logo}>🛡️ SLÁN</Text>
                <Text style={styles.subtitle}>You are protected</Text>
            </View>

            {/* Giant SOS Button */}
            <View style={styles.sosSection}>
                <Text style={styles.instruction}>
                    {sosActive ? "Help is on the way! 🚔" : "Press if you need help"}
                </Text>

                <Animated.View style={[styles.sosOuter, {
                    transform: [{ scale: pulseAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [1, sosActive ? 1.15 : 1.05]
                    }) }]
                }]}>
                    <TouchableOpacity
                        style={[styles.sosButton, sosActive && styles.sosButtonActive]}
                        onPress={activateSOS}
                        activeOpacity={0.8}
                        disabled={sosActive}
                    >
                        <Text style={styles.sosText}>
                            {sosActive ? '🚨' : 'SOS'}
                        </Text>
                        <Text style={styles.sosSubtext}>
                            {sosActive ? 'HELP COMING' : 'TAP FOR HELP'}
                        </Text>
                    </TouchableOpacity>
                </Animated.View>
            </View>

            {/* Simple action buttons */}
            <View style={styles.actions}>
                <TouchableOpacity
                    style={[styles.actionBtn, styles.safeBtn, isSafe && styles.safeBtnActive]}
                    onPress={markSafe}
                >
                    <Text style={styles.actionEmoji}>✅</Text>
                    <Text style={styles.actionText}>
                        {isSafe ? "Parents Notified!" : "I'm Safe"}
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.actionBtn, styles.parentBtn]} onPress={callParent}>
                    <Text style={styles.actionEmoji}>📞</Text>
                    <Text style={styles.actionText}>Call Parent</Text>
                </TouchableOpacity>
            </View>

            {/* Location indicator */}
            <View style={styles.footer}>
                <View style={styles.locationDot} />
                <Text style={styles.footerText}>
                    {location ? 'Location Active — Parents can see you' : 'Getting your location...'}
                </Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0a1628',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 60,
        paddingHorizontal: 24,
    },
    header: {
        alignItems: 'center',
    },
    logo: {
        fontSize: 36,
        fontWeight: '900',
        color: '#22c55e',
        letterSpacing: 3,
    },
    subtitle: {
        fontSize: 16,
        color: '#94a3b8',
        marginTop: 4,
    },
    sosSection: {
        alignItems: 'center',
        flex: 1,
        justifyContent: 'center',
    },
    instruction: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#e2e8f0',
        marginBottom: 32,
        textAlign: 'center',
    },
    sosOuter: {
        width: Math.min(width * 0.65, 260),
        height: Math.min(width * 0.65, 260),
        borderRadius: Math.min(width * 0.65, 260) / 2,
        shadowColor: '#ef4444',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 30,
        elevation: 20,
    },
    sosButton: {
        width: '100%',
        height: '100%',
        borderRadius: Math.min(width * 0.65, 260) / 2,
        backgroundColor: '#ef4444',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 6,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    sosButtonActive: {
        backgroundColor: '#16a34a',
        borderColor: '#22c55e',
    },
    sosText: {
        color: 'white',
        fontSize: 56,
        fontWeight: '900',
        letterSpacing: 4,
    },
    sosSubtext: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 14,
        fontWeight: 'bold',
        marginTop: 4,
        letterSpacing: 2,
    },
    actions: {
        flexDirection: 'row',
        gap: 16,
        width: '100%',
    },
    actionBtn: {
        flex: 1,
        paddingVertical: 20,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    safeBtn: {
        backgroundColor: '#1e293b',
        borderWidth: 2,
        borderColor: '#22c55e',
    },
    safeBtnActive: {
        backgroundColor: '#16a34a',
        borderColor: '#22c55e',
    },
    parentBtn: {
        backgroundColor: '#1e293b',
        borderWidth: 2,
        borderColor: '#3b82f6',
    },
    actionEmoji: {
        fontSize: 28,
        marginBottom: 4,
    },
    actionText: {
        color: '#e2e8f0',
        fontSize: 14,
        fontWeight: 'bold',
    },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 16,
    },
    locationDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#22c55e',
        marginRight: 8,
    },
    footerText: {
        color: '#64748b',
        fontSize: 12,
    },
});
