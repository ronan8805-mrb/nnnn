import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    FlatList,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import axios from 'axios';
import { theme } from '../../styles/theme';
import { useLanguage } from '../_layout';

import { API_URL } from '../../utils/config';

interface Badge {
    name: string;
    icon: string;
    description: string;
    awarded_at: string;
}

interface Profile {
    id: number;
    name: string;
    bio?: string;
    avatar_url?: string;
    reputation_score: number;
    badges: Badge[];
    posts_count: number;
}

export default function ProfileScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const { t } = useLanguage();
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) {
            fetchProfile();
        }
    }, [id]);

    const fetchProfile = async () => {
        try {
            const response = await axios.get(`${API_URL}/profile/${id}`);
            setProfile(response.data);
        } catch (error) {
            console.error('Error fetching profile:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
        );
    }

    if (!profile) {
        return (
            <View style={styles.container}>
                <Text style={styles.errorText}>User not found</Text>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Text style={styles.backButtonText}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>

                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.headerBackButton}>
                        <Text style={styles.headerBackIcon}>←</Text>
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Profile</Text>
                    <View style={{ width: 24 }} />
                </View>

                {/* Profile Card */}
                <View style={styles.profileCard}>
                    <Image
                        source={{ uri: profile.avatar_url || 'https://via.placeholder.com/100' }}
                        style={styles.avatar}
                    />
                    <Text style={styles.name}>{profile.name}</Text>
                    <Text style={styles.bio}>{profile.bio || "Community Member"}</Text>

                    <View style={styles.statsRow}>
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>{profile.reputation_score}</Text>
                            <Text style={styles.statLabel}>Reputation</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>{profile.posts_count}</Text>
                            <Text style={styles.statLabel}>Posts</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>{profile.badges.length}</Text>
                            <Text style={styles.statLabel}>Badges</Text>
                        </View>
                    </View>
                </View>

                {/* Badges Section */}
                <Text style={styles.sectionTitle}>Earned Badges</Text>
                <View style={styles.badgesGrid}>
                    {profile.badges.length > 0 ? (
                        profile.badges.map((badge, index) => (
                            <View key={index} style={styles.badgeItem}>
                                <View style={styles.badgeIconContainer}>
                                    <Text style={styles.badgeIcon}>{badge.icon === 'shield' ? '🛡️' : '⭐'}</Text>
                                </View>
                                <Text style={styles.badgeName}>{badge.name}</Text>
                            </View>
                        ))
                    ) : (
                        <Text style={styles.emptyText}>No badges earned yet.</Text>
                    )}
                </View>

                {/* Action Buttons */}
                <TouchableOpacity style={styles.messageButton}>
                    <Text style={styles.messageButtonText}>Message</Text>
                </TouchableOpacity>

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.colors.background,
    },
    scrollContent: {
        padding: theme.spacing.lg,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: theme.spacing.xl,
    },
    headerBackButton: {
        padding: theme.spacing.sm,
    },
    headerBackIcon: {
        fontSize: 24,
        color: theme.colors.text,
    },
    headerTitle: {
        fontSize: theme.fonts.size.large,
        fontWeight: theme.fonts.weight.bold,
        color: theme.colors.text,
    },
    profileCard: {
        alignItems: 'center',
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.xl,
        padding: theme.spacing.xl,
        marginBottom: theme.spacing.xl,
        ...theme.shadows.medium,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        marginBottom: theme.spacing.md,
        backgroundColor: theme.colors.border,
    },
    name: {
        fontSize: 24,
        fontWeight: theme.fonts.weight.bold,
        color: theme.colors.text,
        marginBottom: theme.spacing.xs,
    },
    bio: {
        fontSize: theme.fonts.size.medium,
        color: theme.colors.textSecondary,
        marginBottom: theme.spacing.lg,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: '100%',
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
        paddingTop: theme.spacing.lg,
    },
    statItem: {
        alignItems: 'center',
    },
    statValue: {
        fontSize: 20,
        fontWeight: theme.fonts.weight.bold,
        color: theme.colors.primary,
    },
    statLabel: {
        fontSize: theme.fonts.size.small,
        color: theme.colors.textSecondary,
    },
    sectionTitle: {
        fontSize: theme.fonts.size.large,
        fontWeight: theme.fonts.weight.bold,
        color: theme.colors.text,
        marginBottom: theme.spacing.md,
        marginLeft: theme.spacing.xs,
    },
    badgesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: theme.spacing.md,
        marginBottom: theme.spacing.xl,
    },
    badgeItem: {
        alignItems: 'center',
        width: '30%',
        backgroundColor: theme.colors.surface,
        padding: theme.spacing.md,
        borderRadius: theme.borderRadius.md,
        ...theme.shadows.small,
    },
    badgeIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(52, 199, 89, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: theme.spacing.sm,
    },
    badgeIcon: {
        fontSize: 20,
    },
    badgeName: {
        fontSize: theme.fonts.size.small,
        fontWeight: theme.fonts.weight.medium,
        color: theme.colors.text,
        textAlign: 'center',
    },
    emptyText: {
        color: theme.colors.textSecondary,
        fontStyle: 'italic',
        marginLeft: theme.spacing.xs,
    },
    messageButton: {
        backgroundColor: theme.colors.primary,
        paddingVertical: theme.spacing.md,
        borderRadius: theme.borderRadius.full,
        alignItems: 'center',
        ...theme.shadows.medium,
    },
    messageButtonText: {
        color: theme.colors.textLight,
        fontSize: theme.fonts.size.medium,
        fontWeight: theme.fonts.weight.bold,
    },
    errorText: {
        fontSize: theme.fonts.size.large,
        color: theme.colors.text,
        marginBottom: theme.spacing.md,
    },
    backButton: {
        padding: theme.spacing.md,
        backgroundColor: theme.colors.primary,
        borderRadius: theme.borderRadius.md,
    },
    backButtonText: {
        color: theme.colors.textLight,
        fontWeight: 'bold',
    },
});
