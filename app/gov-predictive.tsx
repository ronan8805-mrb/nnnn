import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Animated,
    Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { theme } from '../styles/theme';

const { width } = Dimensions.get('window');

export default function GovPredictiveScreen() {
    const router = useRouter();
    const [scanProgress] = useState(new Animated.Value(0));

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(scanProgress, {
                    toValue: 1,
                    duration: 3000,
                    useNativeDriver: true,
                }),
                Animated.timing(scanProgress, {
                    toValue: 0,
                    duration: 0,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, []);

    const predictions = [
        { area: 'Dublin D01', risk: 'High', confidence: '94%', reason: 'Historical Congestion + Active Social Feed Sentiment', action: 'Pre-deploy 2 Units' },
        { area: 'Cork City Centre', risk: 'Medium', confidence: '82%', reason: 'Event Surge (Concert) + Weather Delta', action: 'Monitor CCTV Node 4' },
        { area: 'Galway Salthill', risk: 'Low', confidence: '88%', reason: 'Standard Seasonal Flow', action: 'Routine Patrol' },
    ];

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Text style={styles.backText}>← Dashboard</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>AI PREDICTIVE ANALYTICS</Text>
                <View style={styles.aiBadge}>
                    <Text style={styles.aiText}>NEURAL GEN 4</Text>
                </View>
            </View>

            <ScrollView style={styles.content}>
                {/* Scanner Visualization */}
                <View style={styles.scannerContainer}>
                    <View style={styles.mapMock}>
                        <Text style={styles.mapIcon}>🗺️</Text>
                        <Animated.View style={[styles.scanLine, {
                            transform: [{
                                translateY: scanProgress.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [0, 150]
                                })
                            }]
                        }]} />
                        <View style={[styles.ping, { top: 40, left: 100 }]} />
                        <View style={[styles.ping, { top: 80, left: 180, backgroundColor: '#ef4444' }]} />
                        <View style={[styles.ping, { top: 110, left: 60 }]} />
                    </View>
                    <Text style={styles.scanningText}>HEURISTIC SCANNING NATIONWIDE...</Text>
                </View>

                {/* Risk Forecast */}
                <Text style={styles.sectionTitle}>24-HOUR INCIDENT FORECAST</Text>
                {predictions.map((p, i) => (
                    <View key={i} style={styles.predictionCard}>
                        <View style={styles.cardHeader}>
                            <Text style={styles.areaText}>{p.area}</Text>
                            <View style={[styles.riskBadge, { backgroundColor: p.risk === 'High' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(251, 191, 36, 0.1)' }]}>
                                <Text style={[styles.riskText, { color: p.risk === 'High' ? '#ef4444' : '#fbbf24' }]}>{p.risk} Risk</Text>
                            </View>
                        </View>
                        
                        <View style={styles.metricRow}>
                            <View style={styles.metric}>
                                <Text style={styles.metricLabel}>AI CONFIDENCE</Text>
                                <Text style={styles.metricValue}>{p.confidence}</Text>
                            </View>
                            <View style={styles.metric}>
                                <Text style={styles.metricLabel}>PRIMARY VECTOR</Text>
                                <Text style={styles.metricValue} numberOfLines={1}>{p.reason.split(' ')[0]}</Text>
                            </View>
                        </View>

                        <Text style={styles.reasonText}>{p.reason}</Text>

                        <View style={styles.actionBox}>
                            <Text style={styles.actionLabel}>RECOMMENDED ACTION:</Text>
                            <Text style={styles.actionText}>{p.action}</Text>
                        </View>

                        <TouchableOpacity style={styles.deployBtn}>
                            <Text style={styles.deployBtnText}>AUTHORIZE DEPLOYMENT</Text>
                        </TouchableOpacity>
                    </View>
                ))}

                <View style={styles.insightsBox}>
                    <Text style={styles.insightsTitle}>💡 SYSTEM INSIGHT</Text>
                    <Text style={styles.insightsText}>
                        "Based on current trends, we anticipate a 12% reduction in response time if units are moved from D04 to D01 within the next 45 minutes."
                    </Text>
                </View>

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
    aiBadge: { backgroundColor: 'rgba(56, 189, 248, 0.15)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    aiText: { color: '#38bdf8', fontSize: 9, fontWeight: '900' },
    content: { padding: 20 },
    scannerContainer: { backgroundColor: '#0f172a', borderRadius: 20, padding: 20, alignItems: 'center', marginBottom: 24, borderWidth: 1, borderColor: '#1e293b' },
    mapMock: { width: width - 80, height: 150, backgroundColor: '#1e293b', borderRadius: 12, justifyContent: 'center', alignItems: 'center', overflow: 'hidden', position: 'relative' },
    mapIcon: { fontSize: 80, opacity: 0.2 },
    scanLine: { position: 'absolute', top: 0, left: 0, right: 0, height: 2, backgroundColor: '#fbbf24', shadowColor: '#fbbf24', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 10 },
    ping: { position: 'absolute', width: 8, height: 8, borderRadius: 4, backgroundColor: '#fbbf24' },
    scanningText: { color: '#94a3b8', fontSize: 10, fontWeight: 'bold', marginTop: 15, letterSpacing: 1 },
    sectionTitle: { color: '#94a3b8', fontSize: 11, fontWeight: '900', letterSpacing: 1.5, marginBottom: 16 },
    predictionCard: { backgroundColor: '#0f172a', padding: 20, borderRadius: 20, borderWidth: 1, borderColor: '#1e293b', marginBottom: 16 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    areaText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
    riskBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    riskText: { fontSize: 11, fontWeight: 'bold' },
    metricRow: { flexDirection: 'row', gap: 24, marginBottom: 16 },
    metric: { flex: 1 },
    metricLabel: { color: '#64748b', fontSize: 9, fontWeight: 'bold', marginBottom: 4 },
    metricValue: { color: '#fff', fontSize: 16, fontWeight: '900' },
    reasonText: { color: '#94a3b8', fontSize: 13, lineHeight: 18, marginBottom: 16 },
    actionBox: { backgroundColor: 'rgba(15, 23, 42, 0.5)', padding: 12, borderRadius: 12, marginBottom: 16, borderLeftWidth: 3, borderLeftColor: '#fbbf24' },
    actionLabel: { color: '#fbbf24', fontSize: 10, fontWeight: 'bold', marginBottom: 4 },
    actionText: { color: '#e2e8f0', fontSize: 13, fontWeight: '600' },
    deployBtn: { backgroundColor: '#fbbf24', padding: 14, borderRadius: 12, alignItems: 'center' },
    deployBtnText: { color: '#020617', fontSize: 12, fontWeight: '900' },
    insightsBox: { backgroundColor: 'rgba(56, 189, 248, 0.05)', padding: 20, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(56, 189, 248, 0.2)' },
    insightsTitle: { color: '#38bdf8', fontSize: 14, fontWeight: 'bold', marginBottom: 8 },
    insightsText: { color: '#94a3b8', fontSize: 13, lineHeight: 20, fontStyle: 'italic' },
});
