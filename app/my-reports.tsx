import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import axios from 'axios';
import { theme } from '../styles/theme';
import { Ionicons } from '@expo/vector-icons';

import { API_URL } from '../utils/config';

interface CrimeReport {
    id: number;
    incident_type: string;
    description: string;
    location_address: string;
    status: 'Pending' | 'Solved' | 'Unresolved';
    assigned_station: string;
    created_at: string;
    unread_messages: number;
}

export default function MyReportsScreen() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'current' | 'past'>('current');
    const [reports, setReports] = useState<CrimeReport[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        fetchReports();
    }, []);

    const fetchReports = async () => {
        try {
            const response = await axios.get(`${API_URL}/crime-reports/1`); // TODO: Get user_id from auth
            setReports(response.data.reports);
        } catch (error) {
            console.error('Error fetching reports:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchReports();
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Pending':
                return theme.colors.warning;
            case 'Solved':
                return theme.colors.success;
            case 'Unresolved':
                return theme.colors.error;
            default:
                return theme.colors.textSecondary;
        }
    };

    const getIncidentIcon = (type: string) => {
        switch (type) {
            case 'Theft':
                return 'bag-remove';
            case 'Assault':
                return 'warning';
            case 'Vandalism':
                return 'hammer';
            case 'Suspicious Activity':
                return 'eye';
            case 'Drug Activity':
                return 'medical';
            default:
                return 'alert-circle';
        }
    };

    const currentReports = reports.filter(r => r.status === 'Pending');
    const pastReports = reports.filter(r => r.status !== 'Pending');
    const displayReports = activeTab === 'current' ? currentReports : pastReports;

    if (loading) {
        return (
            <View style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>My Reports</Text>
                    <View style={{ width: 24 }} />
                </View>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>My Reports</Text>
                <TouchableOpacity onPress={fetchReports} style={styles.refreshButton}>
                    <Ionicons name="refresh" size={24} color={theme.colors.primary} />
                </TouchableOpacity>
            </View>

            {/* Tabs */}
            <View style={styles.tabContainer}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'current' && styles.tabActive]}
                    onPress={() => setActiveTab('current')}
                >
                    <Text style={[styles.tabText, activeTab === 'current' && styles.tabTextActive]}>
                        Current ({currentReports.length})
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'past' && styles.tabActive]}
                    onPress={() => setActiveTab('past')}
                >
                    <Text style={[styles.tabText, activeTab === 'past' && styles.tabTextActive]}>
                        Past ({pastReports.length})
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Reports List */}
            <ScrollView
                style={styles.content}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                {displayReports.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="document-text-outline" size={64} color={theme.colors.textSecondary} />
                        <Text style={styles.emptyText}>
                            {activeTab === 'current' ? 'No current reports' : 'No past reports'}
                        </Text>
                    </View>
                ) : (
                    displayReports.map((report) => (
                        <TouchableOpacity
                            key={report.id}
                            style={styles.reportCard}
                            onPress={() => router.push(`/report-detail/${report.id}`)}
                        >
                            <View style={styles.reportHeader}>
                                <View style={styles.reportIconContainer}>
                                    <Ionicons
                                        name={getIncidentIcon(report.incident_type) as any}
                                        size={24}
                                        color={theme.colors.primary}
                                    />
                                </View>
                                <View style={styles.reportInfo}>
                                    <Text style={styles.reportType}>{report.incident_type}</Text>
                                    <Text style={styles.reportLocation}>
                                        <Ionicons name="location" size={12} color={theme.colors.textSecondary} />
                                        {' '}{report.location_address}
                                    </Text>
                                </View>
                                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(report.status) }]}>
                                    <Text style={styles.statusText}>{report.status}</Text>
                                </View>
                            </View>

                            <Text style={styles.reportDescription} numberOfLines={2}>
                                {report.description}
                            </Text>

                            <View style={styles.reportFooter}>
                                <Text style={styles.reportStation}>
                                    <Ionicons name="shield" size={12} color={theme.colors.textSecondary} />
                                    {' '}{report.assigned_station}
                                </Text>
                                <View style={styles.reportMeta}>
                                    <Text style={styles.reportDate}>
                                        {new Date(report.created_at).toLocaleDateString()}
                                    </Text>
                                    {report.unread_messages > 0 && (
                                        <View style={styles.unreadBadge}>
                                            <Text style={styles.unreadText}>{report.unread_messages}</Text>
                                        </View>
                                    )}
                                </View>
                            </View>
                        </TouchableOpacity>
                    ))
                )}
            </ScrollView>

            {/* Floating Action Button */}
            <TouchableOpacity
                style={styles.fab}
                onPress={() => router.push('/report-crime')}
            >
                <Ionicons name="add" size={28} color="#FFF" />
            </TouchableOpacity>
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
        justifyContent: 'space-between',
        padding: theme.spacing.lg,
        backgroundColor: theme.colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    backButton: {
        padding: theme.spacing.sm,
    },
    refreshButton: {
        padding: theme.spacing.sm,
    },
    headerTitle: {
        fontSize: theme.fonts.size.large,
        fontWeight: theme.fonts.weight.bold,
        color: theme.colors.text,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: theme.colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    tab: {
        flex: 1,
        paddingVertical: theme.spacing.md,
        alignItems: 'center',
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    tabActive: {
        borderBottomColor: theme.colors.primary,
    },
    tabText: {
        fontSize: theme.fonts.size.medium,
        color: theme.colors.textSecondary,
        fontWeight: theme.fonts.weight.medium,
    },
    tabTextActive: {
        color: theme.colors.primary,
        fontWeight: theme.fonts.weight.bold,
    },
    content: {
        flex: 1,
    },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: theme.spacing.xxl * 2,
    },
    emptyText: {
        fontSize: theme.fonts.size.medium,
        color: theme.colors.textSecondary,
        marginTop: theme.spacing.lg,
    },
    reportCard: {
        backgroundColor: theme.colors.surface,
        marginHorizontal: theme.spacing.lg,
        marginTop: theme.spacing.lg,
        borderRadius: theme.borderRadius.md,
        padding: theme.spacing.lg,
        ...theme.shadows.small,
    },
    reportHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: theme.spacing.md,
    },
    reportIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: `${theme.colors.primary}20`,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: theme.spacing.md,
    },
    reportInfo: {
        flex: 1,
    },
    reportType: {
        fontSize: theme.fonts.size.medium,
        fontWeight: theme.fonts.weight.bold,
        color: theme.colors.text,
        marginBottom: theme.spacing.xs,
    },
    reportLocation: {
        fontSize: theme.fonts.size.small,
        color: theme.colors.textSecondary,
    },
    statusBadge: {
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: 4,
        borderRadius: theme.borderRadius.sm,
    },
    statusText: {
        fontSize: theme.fonts.size.small,
        fontWeight: theme.fonts.weight.bold,
        color: '#FFF',
    },
    reportDescription: {
        fontSize: theme.fonts.size.small,
        color: theme.colors.text,
        marginBottom: theme.spacing.md,
        lineHeight: 20,
    },
    reportFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    reportStation: {
        fontSize: theme.fonts.size.small,
        color: theme.colors.textSecondary,
    },
    reportMeta: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    reportDate: {
        fontSize: theme.fonts.size.small,
        color: theme.colors.textSecondary,
        marginRight: theme.spacing.sm,
    },
    unreadBadge: {
        backgroundColor: theme.colors.error,
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 6,
    },
    unreadText: {
        fontSize: 11,
        fontWeight: theme.fonts.weight.bold,
        color: '#FFF',
    },
    fab: {
        position: 'absolute',
        bottom: theme.spacing.xl,
        right: theme.spacing.xl,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: theme.colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        ...theme.shadows.large,
    },
});
