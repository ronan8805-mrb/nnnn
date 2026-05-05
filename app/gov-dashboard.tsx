import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Dimensions,
    Platform,
    Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { theme } from '../styles/theme';
import JarvisWrapper from '../components/JarvisWrapper';
import { socket, connectSocket } from '../utils/socket';

const { width } = Dimensions.get('window');

export default function GovDashboardScreen() {
    const router = useRouter();

    const stats = [
        { label: 'National Safety Index', value: '88.4', trend: '+2.1%', color: '#22c55e' },
        { label: 'Projected ROI (Annual)', value: '€72.4M', trend: 'Target Exceeded', color: '#fbbf24' },
        { label: 'Avg Dispatch Latency', value: '42s', trend: '-12s', color: '#38bdf8' },
        { label: 'Active SOS Nationwide', value: '14', trend: 'Low', color: '#ef4444' },
    ];

    const [systemLogs, setSystemLogs] = useState<any[]>([
        { id: 'log1', title: 'Garda Fleet Optimization Complete', time: '14:22 • Nationwide', type: 'info', details: null },
        { id: 'log2', title: 'Heuristic Update: Dublin West Risk Increase', time: '13:05 • Region 1', type: 'warning', details: null },
    ]);
    const [selectedIncident, setSelectedIncident] = useState<any>(null);

    useEffect(() => {
        connectSocket();
        
        const handleResolved = (data: any) => {
            const newLog = {
                id: `log-${Date.now()}`,
                title: `[AI] INCIDENT RESOLVED: Call #${data.sos_id || 'UNKNOWN'}`,
                time: `${new Date().toLocaleTimeString('en-IE', { hour: '2-digit', minute: '2-digit' })} • Automated Dispatch Report`,
                type: 'success',
                details: {
                    report: data.report || "Situation handled carefully. Green light.",
                    resolution: data.resolution || "Suspect apprehended.",
                    sos_id: data.sos_id
                }
            };
            setSystemLogs(prev => [newLog, ...prev]);
        };

        socket.on('incident_resolved', handleResolved);

        return () => {
            socket.off('incident_resolved', handleResolved);
        };
    }, []);

    return (
        <JarvisWrapper showRings={false} showTelemetry={true}>
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.headerTitle}>NATIONAL COMMAND CENTER</Text>
                    <Text style={styles.headerSubtitle}>National Operations Centre • Live</Text>
                </View>
                <TouchableOpacity onPress={() => router.replace('/login')} style={styles.profileBtn}>
                    <Text style={styles.profileIcon}>🇮🇪</Text>
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.content}>
                {/* National Overview Cards */}
                <View style={styles.statsGrid}>
                    {stats.map((stat, i) => (
                        <View key={i} style={styles.statCard}>
                            <Text style={styles.statLabel}>{stat.label}</Text>
                            <Text style={[styles.statValue, { color: stat.color }]}>{stat.value}</Text>
                            <Text style={styles.statTrend}>{stat.trend}</Text>
                        </View>
                    ))}
                </View>

                {/* Primary Systems */}
                <Text style={styles.sectionTitle}>NATIONAL SYSTEMS</Text>
                <View style={styles.systemGrid}>
                    <TouchableOpacity 
                        style={styles.systemCard}
                        onPress={() => router.push('/gov-predictive')}
                    >
                        <View style={[styles.systemIcon, { backgroundColor: 'rgba(251, 191, 36, 0.1)' }]}>
                            <Text style={styles.systemEmoji}>🧠</Text>
                        </View>
                        <Text style={styles.systemTitle}>Predictive Intelligence</Text>
                        <Text style={styles.systemDesc}>AI Heuristics & Incident Forecasting</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={styles.systemCard}
                        onPress={() => router.push('/gov-alerts')}
                    >
                        <View style={[styles.systemIcon, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}>
                            <Text style={styles.systemEmoji}>📢</Text>
                        </View>
                        <Text style={styles.systemTitle}>Reverse Alerts</Text>
                        <Text style={styles.systemDesc}>National Broadcast & Target Comms</Text>
                    </TouchableOpacity>
                </View>

                {/* Regional Health */}
                <Text style={styles.sectionTitle}>REGIONAL RESPONSE HEALTH</Text>
                <View style={styles.healthContainer}>
                    {['Leinster', 'Munster', 'Connacht', 'Ulster'].map((region, i) => (
                        <View key={i} style={styles.healthRow}>
                            <Text style={styles.regionName}>{region}</Text>
                            <View style={styles.healthBarBg}>
                                <View style={[styles.healthBarFill, { width: `${85 + i * 3}%`, backgroundColor: i === 3 ? '#fbbf24' : '#22c55e' }]} />
                            </View>
                            <Text style={styles.healthValue}>{85 + i * 3}%</Text>
                        </View>
                    ))}
                </View>

                {/* Recent National Alerts */}
                <Text style={styles.sectionTitle}>LIVE SYSTEM LOGS & AI REPORTS</Text>
                <View style={styles.logCard}>
                    {systemLogs.map(log => (
                        <TouchableOpacity 
                            key={log.id} 
                            style={styles.logItem}
                            onPress={() => {
                                if (log.details) setSelectedIncident(log);
                            }}
                            disabled={!log.details}
                        >
                            <View style={[
                                styles.logDot, 
                                log.type === 'warning' ? { backgroundColor: '#fbbf24' } : 
                                log.type === 'success' ? { backgroundColor: '#22c55e', shadowColor: '#22c55e', shadowOpacity: 0.8, shadowRadius: 10, elevation: 5 } : 
                                {}
                            ]} />
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.logTitle, log.type === 'success' && { color: '#22c55e' }]}>{log.title}</Text>
                                <Text style={styles.logTime}>{log.time}</Text>
                            </View>
                            {log.details && (
                                <Text style={styles.viewReportText}>[ VIEW ]</Text>
                            )}
                        </TouchableOpacity>
                    ))}
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>

            {/* Bottom Nav Mock */}
            <View style={styles.bottomNav}>
                <TouchableOpacity style={styles.navItem}>
                    <Text style={styles.navEmoji}>🏛️</Text>
                    <Text style={styles.navTextActive}>Hub</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.navItem}>
                    <Text style={styles.navEmoji}>📊</Text>
                    <Text style={styles.navText}>Stats</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.navItem}>
                    <Text style={styles.navEmoji}>🔒</Text>
                    <Text style={styles.navText}>Security</Text>
                </TouchableOpacity>
            </View>

            {/* AI Report Detail Modal */}
            <Modal
                visible={selectedIncident !== null}
                transparent={true}
                animationType="fade"
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>COMMAND AI • CASE FILE</Text>
                            <TouchableOpacity onPress={() => setSelectedIncident(null)}>
                                <Text style={styles.modalCloseText}>✕</Text>
                            </TouchableOpacity>
                        </View>
                        
                        {selectedIncident && (
                            <ScrollView style={styles.modalBody}>
                                <Text style={styles.modalSubtitle}>{selectedIncident.title}</Text>
                                
                                {/* Simulated Heatmap / Radar */}
                                <View style={styles.heatmapContainer}>
                                    <View style={styles.heatmapGrid} />
                                    <View style={styles.heatmapPulse} />
                                    <Text style={styles.heatmapOverlayText}>LIVE SCENE SECURED</Text>
                                </View>

                                <View style={styles.reportBox}>
                                    <Text style={styles.reportLabel}>AUTOMATED SYNOPSIS:</Text>
                                    <Text style={styles.reportValue}>"{selectedIncident.details.report}"</Text>
                                </View>
                                
                                <View style={styles.reportBox}>
                                    <Text style={styles.reportLabel}>RESOLUTION METRICS:</Text>
                                    <Text style={styles.reportValue}>• {selectedIncident.details.resolution}</Text>
                                    <Text style={styles.reportValue}>• Situation Handled Carefully</Text>
                                    <Text style={styles.reportValue}>• Response Latency: 32s (Excellent)</Text>
                                    <Text style={styles.reportValue}>• CCTV Extracted & Logged</Text>
                                </View>

                                <TouchableOpacity style={styles.archiveBtn} onPress={() => setSelectedIncident(null)}>
                                    <Text style={styles.archiveBtnText}>ARCHIVE DOSSIER</Text>
                                </TouchableOpacity>
                            </ScrollView>
                        )}
                    </View>
                </View>
            </Modal>
        </View>
        </JarvisWrapper>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: 'transparent' },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 24,
        paddingTop: 80,
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
        borderBottomWidth: 1,
        borderBottomColor: '#fbbf24',
    },
    headerTitle: { color: '#fbbf24', fontSize: 20, fontWeight: '900', letterSpacing: 2, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
    headerSubtitle: { color: '#fbbf24', fontSize: 10, fontWeight: '600', opacity: 0.8, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
    profileBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#1e293b', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#fbbf24' },
    profileIcon: { fontSize: 20 },
    content: { padding: 20 },
    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
    statCard: { width: (width - 52) / 2, backgroundColor: 'rgba(251, 191, 36, 0.05)', padding: 16, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(251, 191, 36, 0.3)' },
    statLabel: { color: '#fbbf24', fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 8, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
    statValue: { fontSize: 24, fontWeight: '900', marginBottom: 4, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
    statTrend: { color: '#94a3b8', fontSize: 10, fontWeight: '600', fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
    sectionTitle: { color: '#fbbf24', fontSize: 11, fontWeight: '900', letterSpacing: 1.5, marginBottom: 16, marginTop: 8, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
    systemGrid: { gap: 12, marginBottom: 24 },
    systemCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(251, 191, 36, 0.05)', padding: 16, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(251, 191, 36, 0.3)' },
    systemIcon: { width: 48, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
    systemEmoji: { fontSize: 24 },
    systemTitle: { color: '#fbbf24', fontSize: 14, fontWeight: '900', fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
    systemDesc: { color: 'rgba(251, 191, 36, 0.7)', fontSize: 10, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', marginTop: 4 },
    healthContainer: { backgroundColor: 'rgba(251, 191, 36, 0.05)', padding: 16, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(251, 191, 36, 0.3)', marginBottom: 24 },
    healthRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    regionName: { color: '#fbbf24', fontSize: 10, width: 80, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
    healthBarBg: { flex: 1, height: 4, backgroundColor: 'rgba(251, 191, 36, 0.2)', borderRadius: 2, marginHorizontal: 12 },
    healthBarFill: { height: '100%', borderRadius: 2 },
    healthValue: { color: '#fbbf24', fontSize: 10, fontWeight: 'bold', fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
    logCard: { backgroundColor: 'rgba(251, 191, 36, 0.05)', borderRadius: 8, borderWidth: 1, borderColor: 'rgba(251, 191, 36, 0.3)', padding: 16 },
    logItem: { flexDirection: 'row', marginBottom: 16, alignItems: 'center' },
    logDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#38bdf8', marginRight: 12 },
    logTitle: { color: '#fbbf24', fontSize: 11, fontWeight: '900', fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
    logTime: { color: 'rgba(251, 191, 36, 0.7)', fontSize: 10, marginTop: 4, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
    viewReportText: { color: '#22c55e', fontSize: 10, fontWeight: 'bold', fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', marginLeft: 10 },
    bottomNav: { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: 'rgba(15, 23, 42, 0.8)', paddingVertical: 15, borderTopWidth: 1, borderTopColor: '#fbbf24', paddingBottom: 30 },
    navItem: { alignItems: 'center' },
    navEmoji: { fontSize: 20, marginBottom: 4 },
    navText: { color: 'rgba(251, 191, 36, 0.5)', fontSize: 10, fontWeight: '900', fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
    navTextActive: { color: '#fbbf24', fontSize: 10, fontWeight: '900', fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
    
    // Modal Styles
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center', padding: 20 },
    modalContent: { width: '100%', maxWidth: 600, backgroundColor: 'rgba(2, 6, 23, 0.95)', borderRadius: 12, borderWidth: 1, borderColor: '#22c55e', maxHeight: '80%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(34, 197, 94, 0.3)', backgroundColor: 'rgba(34, 197, 94, 0.1)' },
    modalTitle: { color: '#22c55e', fontSize: 14, fontWeight: '900', letterSpacing: 2, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
    modalCloseText: { color: '#22c55e', fontSize: 20, fontWeight: 'bold' },
    modalBody: { padding: 20 },
    modalSubtitle: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginBottom: 20, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
    
    heatmapContainer: { height: 180, backgroundColor: '#0f172a', borderRadius: 8, borderWidth: 1, borderColor: '#22c55e', marginBottom: 20, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
    heatmapGrid: { ...StyleSheet.absoluteFillObject, opacity: 0.2, backgroundImage: 'linear-gradient(#22c55e 1px, transparent 1px), linear-gradient(90deg, #22c55e 1px, transparent 1px)', backgroundSize: '20px 20px' } as any,
    heatmapPulse: { width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(34, 197, 94, 0.4)', borderWidth: 2, borderColor: '#22c55e' },
    heatmapOverlayText: { position: 'absolute', bottom: 10, right: 10, color: '#22c55e', fontSize: 10, fontWeight: 'bold', fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
    
    reportBox: { backgroundColor: 'rgba(34, 197, 94, 0.05)', padding: 16, borderRadius: 8, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(34, 197, 94, 0.2)' },
    reportLabel: { color: '#22c55e', fontSize: 10, fontWeight: 'bold', marginBottom: 8, letterSpacing: 1, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
    reportValue: { color: '#fff', fontSize: 12, lineHeight: 20, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', marginBottom: 4 },
    
    archiveBtn: { backgroundColor: 'rgba(34, 197, 94, 0.1)', padding: 16, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: '#22c55e', marginTop: 10 },
    archiveBtnText: { color: '#22c55e', fontSize: 12, fontWeight: 'bold', letterSpacing: 2, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
});
