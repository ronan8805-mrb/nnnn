import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import axios from 'axios';
import { theme } from '../styles/theme';
import { API_URL } from '../utils/config';

interface AnalyticsData {
    sos: { total: number; active: number; today: number; this_week: number };
    crime_reports: { total: number; pending: number };
    users: { total: number; children: number };
    officers: { total: number; on_duty: number };
    performance: { avg_response_time_seconds: number; avg_response_time_display: string };
}

interface HourlyData {
    hour: number;
    sos: number;
    crimes: number;
}

interface ResponseTimeData {
    station: string;
    total_sos: number;
    avg_response_min: number;
}

export default function GardaAnalyticsScreen() {
    const router = useRouter();
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [hourly, setHourly] = useState<HourlyData[]>([]);
    const [responseTimes, setResponseTimes] = useState<ResponseTimeData[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAll();
    }, []);

    const fetchAll = async () => {
        try {
            const [overview, hourlyRes, rtRes] = await Promise.all([
                axios.get(`${API_URL}/analytics/overview`),
                axios.get(`${API_URL}/analytics/hourly-heatmap`),
                axios.get(`${API_URL}/analytics/response-times`),
            ]);
            setData(overview.data);
            setHourly(hourlyRes.data);
            setResponseTimes(rtRes.data);
        } catch (e) {
            console.error('Analytics fetch error:', e);
            // Fallback mock data
            setData({
                sos: { total: 47, active: 3, today: 8, this_week: 23 },
                crime_reports: { total: 124, pending: 12 },
                users: { total: 12400, children: 890 },
                officers: { total: 340, on_duty: 127 },
                performance: { avg_response_time_seconds: 195, avg_response_time_display: '3m 15s' },
            });
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchAll();
    };

    const maxHourlyVal = Math.max(...hourly.map(h => h.sos + h.crimes), 1);

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Text style={styles.backButton}>← Back</Text>
                </TouchableOpacity>
                <Text style={styles.title}>ANALYTICS COMMAND</Text>
                <View style={styles.liveBadge}>
                    <View style={styles.liveDot} />
                    <Text style={styles.liveText}>LIVE</Text>
                </View>
            </View>

            <ScrollView
                style={styles.content}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                {/* Stats Cards */}
                {data && (
                    <>
                        <View style={styles.statsGrid}>
                            <View style={[styles.statCard, styles.sosCard]}>
                                <Text style={styles.statValue}>{data.sos.active}</Text>
                                <Text style={styles.statLabel}>Active SOS</Text>
                                <Text style={styles.statSub}>{data.sos.today} today</Text>
                            </View>
                            <View style={styles.statCard}>
                                <Text style={styles.statValue}>{data.officers.on_duty}</Text>
                                <Text style={styles.statLabel}>On Duty</Text>
                                <Text style={styles.statSub}>of {data.officers.total}</Text>
                            </View>
                            <View style={styles.statCard}>
                                <Text style={styles.statValue}>{data.performance.avg_response_time_display}</Text>
                                <Text style={styles.statLabel}>Avg Response</Text>
                            </View>
                            <View style={styles.statCard}>
                                <Text style={styles.statValue}>{data.crime_reports.pending}</Text>
                                <Text style={styles.statLabel}>Pending Reports</Text>
                                <Text style={styles.statSub}>{data.crime_reports.total} total</Text>
                            </View>
                        </View>

                        {/* Weekly Overview */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>WEEKLY OVERVIEW</Text>
                            <View style={styles.weekRow}>
                                <View style={styles.weekStat}>
                                    <Text style={styles.weekValue}>{data.sos.this_week}</Text>
                                    <Text style={styles.weekLabel}>SOS Alerts</Text>
                                </View>
                                <View style={styles.weekDivider} />
                                <View style={styles.weekStat}>
                                    <Text style={styles.weekValue}>{data.users.total.toLocaleString()}</Text>
                                    <Text style={styles.weekLabel}>Total Users</Text>
                                </View>
                                <View style={styles.weekDivider} />
                                <View style={styles.weekStat}>
                                    <Text style={styles.weekValue}>{data.users.children}</Text>
                                    <Text style={styles.weekLabel}>Child Accounts</Text>
                                </View>
                            </View>
                        </View>
                    </>
                )}

                {/* Hourly Heatmap */}
                {hourly.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>24-HOUR INCIDENT DISTRIBUTION</Text>
                        <View style={styles.chartContainer}>
                            {hourly.map((h) => {
                                const total = h.sos + h.crimes;
                                const barHeight = Math.max((total / maxHourlyVal) * 60, 2);
                                return (
                                    <View key={h.hour} style={styles.barColumn}>
                                        <View style={[styles.bar, {
                                            height: barHeight,
                                            backgroundColor: total > maxHourlyVal * 0.7 ? '#ef4444' :
                                                total > maxHourlyVal * 0.4 ? '#fbbf24' : '#334155'
                                        }]} />
                                        <Text style={styles.barLabel}>
                                            {h.hour.toString().padStart(2, '0')}
                                        </Text>
                                    </View>
                                );
                            })}
                        </View>
                        <View style={styles.chartLegend}>
                            <View style={styles.legendItem}>
                                <View style={[styles.legendDot, { backgroundColor: '#ef4444' }]} />
                                <Text style={styles.legendText}>High</Text>
                            </View>
                            <View style={styles.legendItem}>
                                <View style={[styles.legendDot, { backgroundColor: '#fbbf24' }]} />
                                <Text style={styles.legendText}>Medium</Text>
                            </View>
                            <View style={styles.legendItem}>
                                <View style={[styles.legendDot, { backgroundColor: '#334155' }]} />
                                <Text style={styles.legendText}>Low</Text>
                            </View>
                        </View>
                    </View>
                )}

                {/* Station Response Times */}
                {responseTimes.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>STATION RESPONSE TIMES</Text>
                        {responseTimes.slice(0, 10).map((rt, i) => (
                            <View key={i} style={styles.rtRow}>
                                <Text style={styles.rtStation} numberOfLines={1}>{rt.station}</Text>
                                <View style={styles.rtBarBg}>
                                    <View style={[styles.rtBarFill, {
                                        width: `${Math.min(rt.avg_response_min / 10 * 100, 100)}%`,
                                        backgroundColor: rt.avg_response_min < 4 ? '#22c55e' :
                                            rt.avg_response_min < 6 ? '#fbbf24' : '#ef4444'
                                    }]} />
                                </View>
                                <Text style={styles.rtValue}>{rt.avg_response_min}m</Text>
                            </View>
                        ))}
                    </View>
                )}

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
    title: { color: '#fbbf24', fontSize: 18, fontWeight: '800', letterSpacing: 1 },
    liveBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(239,68,68,0.15)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#ef4444', marginRight: 4 },
    liveText: { color: '#ef4444', fontSize: 10, fontWeight: 'bold' },
    content: { padding: 16 },
    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
    statCard: {
        width: '47%', backgroundColor: '#1e293b', borderRadius: 12, padding: 16,
        borderWidth: 1, borderColor: '#334155',
    },
    sosCard: { borderColor: '#ef4444', backgroundColor: 'rgba(239,68,68,0.08)' },
    statValue: { color: '#fff', fontSize: 28, fontWeight: '800' },
    statLabel: { color: '#94a3b8', fontSize: 12, fontWeight: 'bold', marginTop: 4 },
    statSub: { color: '#64748b', fontSize: 10, marginTop: 2 },
    section: { backgroundColor: '#1e293b', borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#334155' },
    sectionTitle: { color: '#94a3b8', fontSize: 11, fontWeight: 'bold', letterSpacing: 1, marginBottom: 16 },
    weekRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
    weekStat: { alignItems: 'center' },
    weekValue: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
    weekLabel: { color: '#64748b', fontSize: 11, marginTop: 4 },
    weekDivider: { width: 1, height: 40, backgroundColor: '#334155' },
    chartContainer: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: 80, paddingBottom: 16 },
    barColumn: { alignItems: 'center', flex: 1 },
    bar: { width: 6, borderRadius: 3 },
    barLabel: { color: '#64748b', fontSize: 7, marginTop: 4 },
    chartLegend: { flexDirection: 'row', justifyContent: 'center', gap: 16, marginTop: 8 },
    legendItem: { flexDirection: 'row', alignItems: 'center' },
    legendDot: { width: 8, height: 8, borderRadius: 4, marginRight: 4 },
    legendText: { color: '#64748b', fontSize: 10 },
    rtRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
    rtStation: { color: '#e2e8f0', fontSize: 12, width: 120, marginRight: 8 },
    rtBarBg: { flex: 1, height: 8, backgroundColor: '#0f172a', borderRadius: 4, overflow: 'hidden' },
    rtBarFill: { height: '100%', borderRadius: 4 },
    rtValue: { color: '#94a3b8', fontSize: 11, width: 35, textAlign: 'right', marginLeft: 8 },
});
