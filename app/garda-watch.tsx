import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Alert,
    RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import axios from 'axios';
import { theme } from '../styles/theme';

import { API_URL } from '../utils/config';

interface WatchDevice {
    watch_id: number;
    device_id: string;
    device_type: string;
    battery_level: number;
    heart_rate: number | null;
    is_active: boolean;
    last_sync: string | null;
    garda_name: string;
    garda_id: number;
}

export default function GardaWatchScreen() {
    const router = useRouter();
    const [watches, setWatches] = useState<WatchDevice[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [showRegister, setShowRegister] = useState(false);
    const [newDeviceId, setNewDeviceId] = useState('');
    const [newGardaId, setNewGardaId] = useState('');

    useEffect(() => {
        fetchWatches();
    }, []);

    const fetchWatches = async () => {
        try {
            const res = await axios.get(`${API_URL}/watch/all`);
            setWatches(res.data);
        } catch (e) {
            // Mock data fallback
            setWatches([
                { watch_id: 1, device_id: 'GRM-001-A4F2', device_type: 'Garmin Instinct 2 Solar', battery_level: 87, heart_rate: 72, is_active: true, last_sync: new Date().toISOString(), garda_name: 'Garda Murphy', garda_id: 1 },
                { watch_id: 2, device_id: 'GRM-002-B3E1', device_type: 'Garmin Instinct 2 Solar', battery_level: 45, heart_rate: 68, is_active: true, last_sync: new Date(Date.now() - 3600000).toISOString(), garda_name: 'Garda Kelly', garda_id: 2 },
                { watch_id: 3, device_id: 'GRM-003-C7D9', device_type: 'Garmin Instinct 2 Solar', battery_level: 12, heart_rate: null, is_active: false, last_sync: new Date(Date.now() - 86400000).toISOString(), garda_name: "Garda O'Brien", garda_id: 3 },
            ]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const registerWatch = async () => {
        if (!newDeviceId.trim() || !newGardaId.trim()) {
            Alert.alert('Error', 'Please enter both Device ID and Garda ID');
            return;
        }
        try {
            await axios.post(`${API_URL}/watch/register`, {
                garda_id: parseInt(newGardaId),
                device_id: newDeviceId.trim(),
                device_type: 'Garmin Instinct 2 Solar',
            });
            Alert.alert('✅ Registered', 'Smartwatch has been registered successfully.');
            setShowRegister(false);
            setNewDeviceId('');
            setNewGardaId('');
            fetchWatches();
        } catch (e: any) {
            Alert.alert('Error', e?.response?.data?.detail || 'Failed to register watch');
        }
    };

    const getBatteryColor = (level: number) => {
        if (level > 60) return '#22c55e';
        if (level > 25) return '#fbbf24';
        return '#ef4444';
    };

    const getTimeSince = (dateStr: string | null) => {
        if (!dateStr) return 'Never';
        const diff = Date.now() - new Date(dateStr).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return 'Just now';
        if (mins < 60) return `${mins}m ago`;
        const hours = Math.floor(mins / 60);
        if (hours < 24) return `${hours}h ago`;
        return `${Math.floor(hours / 24)}d ago`;
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Text style={styles.backButton}>← Back</Text>
                </TouchableOpacity>
                <Text style={styles.title}>SMARTWATCH COMMAND</Text>
                <TouchableOpacity onPress={() => setShowRegister(!showRegister)}>
                    <Text style={styles.addButton}>+ ADD</Text>
                </TouchableOpacity>
            </View>

            {/* Register Form */}
            {showRegister && (
                <View style={styles.registerForm}>
                    <Text style={styles.formTitle}>Register New Watch</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Device Serial (e.g. GRM-004-X1Y2)"
                        placeholderTextColor="#64748b"
                        value={newDeviceId}
                        onChangeText={setNewDeviceId}
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="Garda Officer ID"
                        placeholderTextColor="#64748b"
                        value={newGardaId}
                        onChangeText={setNewGardaId}
                        keyboardType="numeric"
                    />
                    <View style={styles.formActions}>
                        <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowRegister(false)}>
                            <Text style={styles.cancelText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.registerBtn} onPress={registerWatch}>
                            <Text style={styles.registerText}>Register</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            {/* Summary Stats */}
            <View style={styles.statsRow}>
                <View style={styles.statCard}>
                    <Text style={styles.statValue}>{watches.length}</Text>
                    <Text style={styles.statLabel}>Total Devices</Text>
                </View>
                <View style={styles.statCard}>
                    <Text style={[styles.statValue, { color: '#22c55e' }]}>{watches.filter(w => w.is_active).length}</Text>
                    <Text style={styles.statLabel}>Active</Text>
                </View>
                <View style={styles.statCard}>
                    <Text style={[styles.statValue, { color: '#ef4444' }]}>{watches.filter(w => w.battery_level < 20).length}</Text>
                    <Text style={styles.statLabel}>Low Battery</Text>
                </View>
            </View>

            <ScrollView
                style={styles.list}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchWatches(); }} />}
            >
                {watches.map((watch) => (
                    <View key={watch.watch_id} style={[styles.watchCard, !watch.is_active && styles.inactiveCard]}>
                        <View style={styles.watchHeader}>
                            <View style={styles.watchInfo}>
                                <Text style={styles.watchIcon}>⌚</Text>
                                <View>
                                    <Text style={styles.watchName}>{watch.garda_name}</Text>
                                    <Text style={styles.deviceId}>{watch.device_id}</Text>
                                </View>
                            </View>
                            <View style={[styles.statusBadge, watch.is_active ? styles.activeBadge : styles.offlineBadge]}>
                                <Text style={styles.statusText}>{watch.is_active ? 'ACTIVE' : 'OFFLINE'}</Text>
                            </View>
                        </View>

                        <View style={styles.metricsRow}>
                            {/* Battery */}
                            <View style={styles.metric}>
                                <Text style={styles.metricLabel}>Battery</Text>
                                <View style={styles.batteryContainer}>
                                    <View style={styles.batteryBg}>
                                        <View style={[styles.batteryFill, {
                                            width: `${watch.battery_level}%`,
                                            backgroundColor: getBatteryColor(watch.battery_level),
                                        }]} />
                                    </View>
                                    <Text style={[styles.metricValue, { color: getBatteryColor(watch.battery_level) }]}>
                                        {watch.battery_level}%
                                    </Text>
                                </View>
                            </View>

                            {/* Heart Rate */}
                            <View style={styles.metric}>
                                <Text style={styles.metricLabel}>Heart Rate</Text>
                                <Text style={styles.metricValue}>
                                    {watch.heart_rate ? `❤️ ${watch.heart_rate} BPM` : '— —'}
                                </Text>
                            </View>

                            {/* Last Sync */}
                            <View style={styles.metric}>
                                <Text style={styles.metricLabel}>Last Sync</Text>
                                <Text style={styles.metricValue}>{getTimeSince(watch.last_sync)}</Text>
                            </View>
                        </View>

                        <Text style={styles.deviceType}>{watch.device_type}</Text>
                    </View>
                ))}
                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0f172a' },
    header: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        padding: 16, paddingTop: 50, backgroundColor: '#1e293b',
        borderBottomWidth: 1, borderBottomColor: '#334155',
    },
    backButton: { color: '#fbbf24', fontWeight: 'bold' },
    title: { color: '#fbbf24', fontSize: 16, fontWeight: '800', letterSpacing: 1 },
    addButton: { color: '#22c55e', fontWeight: 'bold', fontSize: 14 },
    registerForm: {
        backgroundColor: '#1e293b', margin: 16, padding: 16, borderRadius: 12,
        borderWidth: 1, borderColor: '#334155',
    },
    formTitle: { color: '#fff', fontWeight: 'bold', fontSize: 16, marginBottom: 12 },
    input: {
        backgroundColor: '#0f172a', borderRadius: 8, padding: 12, color: '#fff',
        borderWidth: 1, borderColor: '#334155', marginBottom: 8, fontSize: 14,
    },
    formActions: { flexDirection: 'row', gap: 8, marginTop: 4 },
    cancelBtn: { flex: 1, padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#64748b', alignItems: 'center' },
    cancelText: { color: '#64748b', fontWeight: 'bold' },
    registerBtn: { flex: 1, padding: 10, borderRadius: 8, backgroundColor: '#fbbf24', alignItems: 'center' },
    registerText: { color: '#0f172a', fontWeight: 'bold' },
    statsRow: { flexDirection: 'row', padding: 16, gap: 12 },
    statCard: { flex: 1, backgroundColor: '#1e293b', borderRadius: 8, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: '#334155' },
    statValue: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
    statLabel: { color: '#64748b', fontSize: 10, marginTop: 4 },
    list: { flex: 1, paddingHorizontal: 16 },
    watchCard: {
        backgroundColor: '#1e293b', borderRadius: 12, padding: 16,
        marginBottom: 12, borderWidth: 1, borderColor: '#334155',
    },
    inactiveCard: { opacity: 0.6 },
    watchHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    watchInfo: { flexDirection: 'row', alignItems: 'center' },
    watchIcon: { fontSize: 24, marginRight: 10 },
    watchName: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
    deviceId: { color: '#64748b', fontSize: 11, fontFamily: 'monospace' },
    statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
    activeBadge: { backgroundColor: 'rgba(34,197,94,0.15)' },
    offlineBadge: { backgroundColor: 'rgba(239,68,68,0.15)' },
    statusText: { fontSize: 9, fontWeight: 'bold', color: '#94a3b8' },
    metricsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    metric: { flex: 1 },
    metricLabel: { color: '#64748b', fontSize: 10, marginBottom: 4 },
    metricValue: { color: '#e2e8f0', fontSize: 13, fontWeight: '600' },
    batteryContainer: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    batteryBg: { flex: 1, height: 6, backgroundColor: '#0f172a', borderRadius: 3, overflow: 'hidden' },
    batteryFill: { height: '100%', borderRadius: 3 },
    deviceType: { color: '#475569', fontSize: 10, marginTop: 4 },
});
