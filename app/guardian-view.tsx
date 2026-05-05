import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import axios from 'axios';
import { theme } from '../styles/theme';

import { API_URL } from '../utils/config';

interface Alert {
    id: string;
    title: string;
    message: string;
    timestamp: string;
    type: 'sos' | 'safe_walk' | 'system';
    read: boolean;
    latitude?: number;
    longitude?: number;
}

export default function GuardianViewScreen() {
    const router = useRouter();
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        fetchAlerts();

        // TODO: Add Socket.IO listener for real-time updates
        // socket.on('guardian_sos_alert', handleNewAlert);
        // socket.on('guardian_safe_walk_started', handleNewAlert);

        return () => {
            // socket.off('guardian_sos_alert');
            // socket.off('guardian_safe_walk_started');
        };
    }, []);

    const fetchAlerts = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${API_URL}/guardians/alerts/testguardian`); // TODO: Get username from auth

            // Transform backend data to Alert format
            const transformedAlerts: Alert[] = [];

            // Add SOS alerts
            if (response.data.sos_alerts) {
                response.data.sos_alerts.forEach((sos: any) => {
                    transformedAlerts.push({
                        id: `sos-${sos.id}`,
                        title: 'SOS ACTIVATED',
                        message: `${sos.user_name} has triggered an SOS alert`,
                        timestamp: new Date(sos.created_at).toLocaleString(),
                        type: 'sos',
                        read: false,
                        latitude: sos.latitude,
                        longitude: sos.longitude,
                    });
                });
            }

            // Add Safe Walk alerts
            if (response.data.safe_walk_journeys) {
                response.data.safe_walk_journeys.forEach((journey: any) => {
                    transformedAlerts.push({
                        id: `walk-${journey.id}`,
                        title: journey.status === 'Active' ? 'Safe Walk Active' : 'Safe Walk Completed',
                        message: `${journey.user_name} ${journey.status === 'Active' ? 'is on a Safe Walk' : 'completed a Safe Walk'}`,
                        timestamp: new Date(journey.start_time).toLocaleString(),
                        type: 'safe_walk',
                        read: journey.status !== 'Active',
                        latitude: journey.current_lat,
                        longitude: journey.current_lng,
                    });
                });
            }

            setAlerts(transformedAlerts);
        } catch (error) {
            console.error('Fetch alerts error:', error);
            // Keep existing alerts on error
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchAlerts();
    };

    const viewLocation = (latitude?: number, longitude?: number) => {
        if (latitude && longitude) {
            // TODO: Navigate to map view or open maps app
            console.log(`View location: ${latitude}, ${longitude}`);
        }
    };

    const renderItem = ({ item }: { item: Alert }) => (
        <TouchableOpacity style={[styles.card, !item.read && styles.unreadCard]}>
            <View style={styles.iconContainer}>
                <Text style={styles.icon}>
                    {item.type === 'sos' ? '🚨' : item.type === 'safe_walk' ? '🚶‍♀️' : '✓'}
                </Text>
            </View>
            <View style={styles.textContainer}>
                <View style={styles.headerRow}>
                    <Text style={[styles.cardTitle, item.type === 'sos' && styles.sosTitle]}>
                        {item.title}
                    </Text>
                    <Text style={styles.timestamp}>{item.timestamp}</Text>
                </View>
                <Text style={styles.message}>{item.message}</Text>

                {item.type === 'sos' && item.latitude && item.longitude && (
                    <TouchableOpacity
                        style={styles.trackButton}
                        onPress={() => viewLocation(item.latitude, item.longitude)}
                    >
                        <Text style={styles.trackButtonText}>VIEW LIVE LOCATION</Text>
                    </TouchableOpacity>
                )}
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Text style={styles.backButton}>← Back</Text>
                </TouchableOpacity>
                <Text style={styles.title}>Guardian Alerts</Text>
            </View>

            <FlatList
                data={alerts}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyText}>
                            {loading ? 'Loading alerts...' : 'No alerts yet.'}
                        </Text>
                    </View>
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: theme.spacing.lg,
        paddingTop: theme.spacing.xxl,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    backButton: {
        color: theme.colors.accent,
        fontSize: theme.fonts.size.medium,
        fontWeight: theme.fonts.weight.bold,
        marginRight: theme.spacing.md,
    },
    title: {
        fontSize: theme.fonts.size.large,
        fontWeight: theme.fonts.weight.bold,
        color: theme.colors.text,
    },
    listContent: {
        padding: theme.spacing.lg,
    },
    card: {
        flexDirection: 'row',
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.md,
        padding: theme.spacing.md,
        marginBottom: theme.spacing.md,
        ...theme.shadows.small,
    },
    unreadCard: {
        borderLeftWidth: 4,
        borderLeftColor: theme.colors.accent,
    },
    iconContainer: {
        marginRight: theme.spacing.md,
        justifyContent: 'center',
    },
    icon: {
        fontSize: 32,
    },
    textContainer: {
        flex: 1,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: theme.spacing.xs,
    },
    cardTitle: {
        fontSize: theme.fonts.size.medium,
        fontWeight: theme.fonts.weight.bold,
        color: theme.colors.text,
    },
    sosTitle: {
        color: theme.colors.error,
    },
    timestamp: {
        fontSize: theme.fonts.size.small,
        color: theme.colors.textSecondary,
    },
    message: {
        fontSize: theme.fonts.size.small,
        color: theme.colors.textSecondary,
        marginBottom: theme.spacing.sm,
    },
    trackButton: {
        backgroundColor: theme.colors.accent,
        borderRadius: theme.borderRadius.sm,
        padding: theme.spacing.sm,
        alignItems: 'center',
        marginTop: theme.spacing.xs,
    },
    trackButtonText: {
        color: theme.colors.text,
        fontSize: theme.fonts.size.small,
        fontWeight: theme.fonts.weight.bold,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: theme.spacing.xxl,
    },
    emptyText: {
        fontSize: theme.fonts.size.medium,
        color: theme.colors.textSecondary,
    },
});
