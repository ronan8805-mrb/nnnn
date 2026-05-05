import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Alert,
    Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import axios from 'axios';
import { theme } from '../styles/theme';
import { API_URL } from '../utils/config';

export default function GovAlertsScreen() {
    const router = useRouter();
    const [alertText, setAlertText] = useState('');
    const [selectedRegion, setSelectedRegion] = useState('Nationwide');
    const [isCritical, setIsCritical] = useState(false);
    const [isBroadcasting, setIsBroadcasting] = useState(false);

    const handleBroadcast = () => {
        if (!alertText) {
            Alert.alert('Incomplete Protocol', 'Please enter alert message content.');
            return;
        }

        Alert.alert(
            '⚠️ AUTHORIZE BROADCAST',
            `You are about to broadcast this alert to ${(selectedRegion || 'NATIONAL').toUpperCase()}.\n\nPriority: ${isCritical ? 'CRITICAL' : 'ADVISORY'}\n\nDo you have multi-signatory authorization?`,
            [
                { text: 'Cancel', style: 'cancel' },
                { 
                    text: 'INITIATE', 
                    style: 'destructive',
                    onPress: async () => {
                        setIsBroadcasting(true);
                        try {
                            await axios.post(`${API_URL}/national-alert`, {
                                message: alertText,
                                region: selectedRegion,
                                is_critical: isCritical
                            });
                            Alert.alert('PROTOCOL SUCCESS', 'National Reverse Alert has been transmitted across the SLÁN node network.');
                            setAlertText('');
                        } catch (e) {
                            Alert.alert('System Error', 'Failed to transmit alert to the national node.');
                        } finally {
                            setIsBroadcasting(false);
                        }
                    }
                }
            ]
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Text style={styles.backText}>← Dashboard</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>REVERSE ALERT CONSOLE</Text>
                <View style={styles.secureBadge}>
                    <Text style={styles.secureText}>SECURE-CHANNELS</Text>
                </View>
            </View>

            <ScrollView style={styles.content}>
                <View style={styles.infoBox}>
                    <Text style={styles.infoTitle}>SYSTEM NOTICE</Text>
                    <Text style={styles.infoText}>
                        "Reverse Alerts" are pushed directly to all SLÁN-enabled devices. High-priority alerts bypass "Do Not Disturb" settings for child-linked accounts.
                    </Text>
                </View>

                {/* Composer */}
                <Text style={styles.sectionTitle}>ALERT COMPOSER</Text>
                <View style={styles.composerCard}>
                    <TextInput
                        style={styles.alertInput}
                        placeholder="Enter alert message (max 240 chars)..."
                        placeholderTextColor="#475569"
                        multiline
                        maxLength={240}
                        value={alertText}
                        onChangeText={setAlertText}
                    />
                    <View style={styles.charCount}>
                        <Text style={styles.charText}>{alertText.length}/240</Text>
                    </View>
                </View>

                {/* Targeting */}
                <Text style={styles.sectionTitle}>TARGETING MATRIX</Text>
                <View style={styles.targetingCard}>
                    <View style={styles.settingRow}>
                        <Text style={styles.settingLabel}>Region</Text>
                        <View style={styles.regionPicker}>
                            {['Nationwide', 'Dublin', 'Cork', 'Galway'].map((r) => (
                                <TouchableOpacity 
                                    key={r} 
                                    style={[styles.regionBtn, selectedRegion === r && styles.regionBtnActive]}
                                    onPress={() => setSelectedRegion(r)}
                                >
                                    <Text style={[styles.regionBtnText, selectedRegion === r && styles.regionBtnTextActive]}>{r}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.settingRow}>
                        <View>
                            <Text style={styles.settingLabel}>Critical Override</Text>
                            <Text style={styles.settingSub}>Bypass system silencers</Text>
                        </View>
                        <Switch
                            value={isCritical}
                            onValueChange={setIsCritical}
                            trackColor={{ false: '#1e293b', true: '#ef4444' }}
                            thumbColor={isCritical ? '#fff' : '#94a3b8'}
                        />
                    </View>
                </View>

                {/* History */}
                <Text style={styles.sectionTitle}>RECENT TRANSMISSIONS</Text>
                <View style={styles.historyItem}>
                    <View style={styles.historyIcon}>
                        <Text>📢</Text>
                    </View>
                    <View style={styles.historyInfo}>
                        <Text style={styles.historyText}>"Yellow Weather Warning: High winds in Connacht. Stay indoors."</Text>
                        <Text style={styles.historyMeta}>Yesterday • 18:30 • Connacht • Success</Text>
                    </View>
                </View>

                <TouchableOpacity 
                    style={[styles.broadcastBtn, isCritical && styles.broadcastBtnCritical]} 
                    onPress={handleBroadcast}
                    disabled={isBroadcasting}
                >
                    <Text style={styles.broadcastBtnText}>
                        {isBroadcasting ? 'TRANSMITTING...' : 'INITIATE REVERSE BROADCAST'}
                    </Text>
                </TouchableOpacity>

                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#020617' },
    header: { padding: 20, paddingTop: 60, backgroundColor: '#0f172a', borderBottomWidth: 1, borderBottomColor: '#1e293b', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    backBtn: { padding: 8 },
    backText: { color: '#fbbf24', fontWeight: 'bold', fontSize: 12 },
    headerTitle: { color: '#fff', fontSize: 16, fontWeight: '900', letterSpacing: 1 },
    secureBadge: { backgroundColor: 'rgba(34, 197, 94, 0.1)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    secureText: { color: '#22c55e', fontSize: 9, fontWeight: '900' },
    content: { padding: 20 },
    infoBox: { backgroundColor: 'rgba(15, 23, 42, 0.5)', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#1e293b', marginBottom: 24 },
    infoTitle: { color: '#fbbf24', fontSize: 10, fontWeight: 'bold', marginBottom: 4 },
    infoText: { color: '#94a3b8', fontSize: 12, lineHeight: 18 },
    sectionTitle: { color: '#94a3b8', fontSize: 11, fontWeight: '900', letterSpacing: 1.5, marginBottom: 16 },
    composerCard: { backgroundColor: '#0f172a', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: '#1e293b', marginBottom: 24 },
    alertInput: { color: '#fff', fontSize: 16, height: 120, textAlignVertical: 'top' },
    charCount: { alignItems: 'flex-end', marginTop: 10 },
    charText: { color: '#475569', fontSize: 12, fontWeight: 'bold' },
    targetingCard: { backgroundColor: '#0f172a', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: '#1e293b', marginBottom: 24 },
    settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    settingLabel: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
    settingSub: { color: '#64748b', fontSize: 11, marginTop: 2 },
    regionPicker: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12, width: '100%' },
    regionBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: '#1e293b' },
    regionBtnActive: { backgroundColor: '#fbbf24' },
    regionBtnText: { color: '#94a3b8', fontSize: 11, fontWeight: 'bold' },
    regionBtnTextActive: { color: '#020617' },
    divider: { height: 1, backgroundColor: '#1e293b', marginVertical: 20 },
    historyItem: { flexDirection: 'row', backgroundColor: '#0f172a', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#1e293b', marginBottom: 12 },
    historyIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#1e293b', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
    historyInfo: { flex: 1 },
    historyText: { color: '#e2e8f0', fontSize: 12, fontWeight: '600', marginBottom: 4 },
    historyMeta: { color: '#64748b', fontSize: 10 },
    broadcastBtn: { backgroundColor: '#fbbf24', padding: 18, borderRadius: 16, alignItems: 'center', marginTop: 20 },
    broadcastBtnCritical: { backgroundColor: '#ef4444' },
    broadcastBtnText: { color: '#020617', fontSize: 14, fontWeight: '900', letterSpacing: 1 },
});
