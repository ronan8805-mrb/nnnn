import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Animated,
    Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import axios from 'axios';
import { theme } from '../styles/theme';

import { API_URL } from '../utils/config';
import { socket, connectSocket } from '../utils/socket';

export default function LockdownModeScreen() {
    const router = useRouter();
    const pulseAnim = useRef(new Animated.Value(0)).current;
    const [status, setStatus] = useState('active'); // active, safe
    const [updates, setUpdates] = useState<string[]>([
        '14:05 - Gardaí deployed to city center sectors.',
        '14:02 - Public transport suspended until further notice.',
        '14:00 - NATIONAL LOCKDOWN ALERT ISSUED.',
    ]);

    useEffect(() => {
        // Pulsing animation for the alert icon
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 0,
                    duration: 1000,
                    useNativeDriver: true,
                }),
            ])
        ).start();

        // Connect to WebSocket for live updates
        connectSocket();

        socket.on('lockdown_update', (data: any) => {
            setUpdates((prev) => [data.message, ...prev]);
        });

        return () => {
            socket.off('lockdown_update');
        };
    }, []);

    const handleSafeCheckIn = async () => {
        try {
            await axios.post(`${API_URL}/lockdown/safe-check`, {
                user_id: 1,
                status: 'safe',
                location: '53.3498,-6.2603'
            });
            setStatus('safe');
            Alert.alert('Check-in Confirmed', 'Your safety status has been shared with your guardians.');
        } catch (error) {
            console.error('Check-in error:', error);
            Alert.alert('Error', 'Failed to check in. Please try again.');
        }
    };

    const pulseScale = pulseAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [1, 1.2],
    });

    return (
        <View style={styles.container}>
            {/* Header Alert */}
            <View style={styles.alertHeader}>
                <Animated.View style={{ transform: [{ scale: pulseScale }] }}>
                    <Text style={styles.alertIcon}>⚠️</Text>
                </Animated.View>
                <Text style={styles.alertTitle}>NATIONAL LOCKDOWN</Text>
                <Text style={styles.alertSubtitle}>IRELAND SHIELD ACTIVE</Text>
            </View>

            <View style={styles.content}>
                {/* Instructions */}
                <View style={styles.instructionBox}>
                    <Text style={styles.instructionTitle}>OFFICIAL INSTRUCTIONS</Text>
                    <Text style={styles.instructionText}>
                        1. Remain indoors immediately.{'\n'}
                        2. Move away from windows.{'\n'}
                        3. Do not use public transport.{'\n'}
                        4. Wait for official Garda updates.
                    </Text>
                </View>

                {/* Safe Check-in */}
                <View style={styles.checkInContainer}>
                    <Text style={styles.checkInLabel}>Are you safe?</Text>
                    {status === 'active' ? (
                        <TouchableOpacity
                            style={styles.checkInButton}
                            onPress={handleSafeCheckIn}
                        >
                            <Text style={styles.checkInButtonText}>I'M SAFE - NOTIFY FAMILY</Text>
                        </TouchableOpacity>
                    ) : (
                        <View style={styles.safeBadge}>
                            <Text style={styles.safeText}>✓ MARKED SAFE</Text>
                        </View>
                    )}
                </View>

                {/* Live Updates Feed */}
                <View style={styles.feedContainer}>
                    <Text style={styles.feedTitle}>LIVE GARDA UPDATES</Text>
                    {updates.map((update, index) => (
                        <View key={index} style={styles.updateItem}>
                            <View style={styles.updateDot} />
                            <Text style={styles.updateText}>{update}</Text>
                        </View>
                    ))}
                </View>

                {/* Nearest Shelter/Station */}
                <TouchableOpacity
                    style={styles.shelterButton}
                    onPress={() => router.push('/crime-map')}
                >
                    <Text style={styles.shelterButtonText}>FIND NEAREST SHELTER / STATION</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000000',
    },
    alertHeader: {
        backgroundColor: '#ef4444', // Red background
        padding: theme.spacing.xl,
        paddingTop: theme.spacing.xxl + 20,
        alignItems: 'center',
        borderBottomWidth: 4,
        borderBottomColor: '#7f1d1d',
    },
    alertIcon: {
        fontSize: 48,
        marginBottom: theme.spacing.sm,
    },
    alertTitle: {
        color: '#fff',
        fontSize: 28,
        fontWeight: '900', // Heavy bold
        letterSpacing: 2,
        textAlign: 'center',
    },
    alertSubtitle: {
        color: '#fee2e2',
        fontSize: 16,
        fontWeight: 'bold',
        letterSpacing: 4,
        marginTop: theme.spacing.xs,
    },
    content: {
        padding: theme.spacing.lg,
        flex: 1,
    },
    instructionBox: {
        backgroundColor: '#1f2937',
        padding: theme.spacing.lg,
        borderRadius: theme.borderRadius.md,
        marginBottom: theme.spacing.xl,
        borderWidth: 1,
        borderColor: '#374151',
    },
    instructionTitle: {
        color: '#fbbf24', // Amber
        fontWeight: 'bold',
        fontSize: 16,
        marginBottom: theme.spacing.md,
        letterSpacing: 1,
    },
    instructionText: {
        color: '#e5e7eb',
        fontSize: 16,
        lineHeight: 28,
    },
    checkInContainer: {
        alignItems: 'center',
        marginBottom: theme.spacing.xl,
    },
    checkInLabel: {
        color: '#9ca3af',
        marginBottom: theme.spacing.md,
    },
    checkInButton: {
        backgroundColor: theme.colors.accent,
        width: '100%',
        padding: theme.spacing.lg,
        borderRadius: theme.borderRadius.md,
        alignItems: 'center',
        ...theme.shadows.medium,
    },
    checkInButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 18,
        letterSpacing: 1,
    },
    safeBadge: {
        backgroundColor: theme.colors.success,
        width: '100%',
        padding: theme.spacing.lg,
        borderRadius: theme.borderRadius.md,
        alignItems: 'center',
    },
    safeText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 18,
        letterSpacing: 1,
    },
    feedContainer: {
        flex: 1,
    },
    feedTitle: {
        color: '#6b7280',
        fontSize: 12,
        fontWeight: 'bold',
        marginBottom: theme.spacing.md,
        letterSpacing: 1,
    },
    updateItem: {
        flexDirection: 'row',
        marginBottom: theme.spacing.md,
    },
    updateDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#ef4444',
        marginTop: 6,
        marginRight: theme.spacing.md,
    },
    updateText: {
        color: '#d1d5db',
        fontSize: 14,
        flex: 1,
    },
    shelterButton: {
        backgroundColor: '#1f2937',
        borderWidth: 1,
        borderColor: '#374151',
        padding: theme.spacing.md,
        borderRadius: theme.borderRadius.md,
        alignItems: 'center',
        marginTop: theme.spacing.md,
    },
    shelterButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
    },
});
