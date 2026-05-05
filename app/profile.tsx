import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    Image,
    ScrollView,
    Modal,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import axios from 'axios';
import { theme } from '../styles/theme';

import { API_URL } from '../utils/config';

export default function ProfileScreen() {
    const router = useRouter();
    const USER_ID = 1; // Hardcoded for now

    // User profile state
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState({
        name: 'Test User',
        username: '@testuser',
        bio: 'Keeping my community safe with SLÁN 🛡️',
        location: 'Dublin, Ireland',
        avatar: 'https://i.pravatar.cc/150?img=68',
        postsCount: 12,
        followersCount: 234,
        followingCount: 189,
        reputationScore: 450,
    });

    // Edit state
    const [editedProfile, setEditedProfile] = useState({ ...profile });

    // Load profile from backend
    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            const response = await axios.get(`${API_URL}/profile/${USER_ID}`);
            const data = response.data;
            const loadedProfile = {
                name: data.name,
                username: data.username,
                bio: data.bio || 'Keeping my community safe with SLÁN 🛡️',
                location: data.location || 'Dublin, Ireland',
                avatar: data.avatar_url || 'https://i.pravatar.cc/150?img=68',
                postsCount: data.posts_count || 0,
                followersCount: 234, // Mock for now
                followingCount: 189, // Mock for now
                reputationScore: data.reputation_score || 0,
            };
            setProfile(loadedProfile);
            setEditedProfile(loadedProfile);
        } catch (error) {
            console.error('Error loading profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            await axios.put(`${API_URL}/profile/${USER_ID}`, {
                name: editedProfile.name,
                username: editedProfile.username,
                bio: editedProfile.bio,
                location: editedProfile.location,
                avatar_url: editedProfile.avatar,
            });
            setProfile(editedProfile);
            setIsEditing(false);
            Alert.alert('Success', 'Profile updated successfully!');
        } catch (error: any) {
            console.error('Error saving profile:', error);
            Alert.alert('Error', error.response?.data?.detail || 'Failed to save profile');
        }
    };

    const handleCancel = () => {
        setEditedProfile({ ...profile });
        setIsEditing(false);
    };

    if (loading) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Text style={styles.backText}>←</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Profile</Text>
                <TouchableOpacity
                    onPress={() => setIsEditing(!isEditing)}
                    style={styles.editButton}
                >
                    <Text style={styles.editButtonText}>
                        {isEditing ? 'Cancel' : 'Edit'}
                    </Text>
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {/* Profile Picture */}
                <View style={styles.avatarContainer}>
                    <Image
                        source={{ uri: profile.avatar }}
                        style={styles.avatar}
                    />
                    {isEditing && (
                        <TouchableOpacity style={styles.changePhotoButton}>
                            <Text style={styles.changePhotoText}>Change Photo</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Stats */}
                <View style={styles.statsContainer}>
                    <View style={styles.statItem}>
                        <Text style={styles.statNumber}>{profile.postsCount}</Text>
                        <Text style={styles.statLabel}>Posts</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text style={styles.statNumber}>{profile.followersCount}</Text>
                        <Text style={styles.statLabel}>Followers</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text style={styles.statNumber}>{profile.followingCount}</Text>
                        <Text style={styles.statLabel}>Following</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text style={styles.statNumber}>{profile.reputationScore}</Text>
                        <Text style={styles.statLabel}>Reputation</Text>
                    </View>
                </View>

                {/* Profile Info */}
                <View style={styles.infoContainer}>
                    {isEditing ? (
                        <>
                            <Text style={styles.label}>Name</Text>
                            <TextInput
                                style={styles.input}
                                value={editedProfile.name}
                                onChangeText={(text) => setEditedProfile({ ...editedProfile, name: text })}
                                placeholder="Your name"
                                placeholderTextColor={theme.colors.textSecondary}
                            />

                            <Text style={styles.label}>Username</Text>
                            <TextInput
                                style={styles.input}
                                value={editedProfile.username}
                                onChangeText={(text) => setEditedProfile({ ...editedProfile, username: text })}
                                placeholder="@username"
                                placeholderTextColor={theme.colors.textSecondary}
                            />

                            <Text style={styles.label}>Bio</Text>
                            <TextInput
                                style={[styles.input, styles.bioInput]}
                                value={editedProfile.bio}
                                onChangeText={(text) => setEditedProfile({ ...editedProfile, bio: text })}
                                placeholder="Tell us about yourself"
                                placeholderTextColor={theme.colors.textSecondary}
                                multiline
                                numberOfLines={3}
                            />

                            <Text style={styles.label}>Location</Text>
                            <TextInput
                                style={styles.input}
                                value={editedProfile.location}
                                onChangeText={(text) => setEditedProfile({ ...editedProfile, location: text })}
                                placeholder="Your location"
                                placeholderTextColor={theme.colors.textSecondary}
                            />

                            <TouchableOpacity
                                style={styles.saveButton}
                                onPress={handleSave}
                            >
                                <Text style={styles.saveButtonText}>Save Changes</Text>
                            </TouchableOpacity>
                        </>
                    ) : (
                        <>
                            <Text style={styles.name}>{profile.name}</Text>
                            <Text style={styles.username}>{profile.username}</Text>
                            <Text style={styles.bio}>{profile.bio}</Text>
                            <View style={styles.locationRow}>
                                <Text style={styles.locationIcon}>📍</Text>
                                <Text style={styles.location}>{profile.location}</Text>
                            </View>
                        </>
                    )}
                </View>

                {/* Badges Section */}
                {!isEditing && (
                    <View style={styles.badgesContainer}>
                        <Text style={styles.sectionTitle}>Badges & Achievements</Text>
                        <View style={styles.badgesGrid}>
                            <View style={styles.badge}>
                                <Text style={styles.badgeIcon}>🛡️</Text>
                                <Text style={styles.badgeName}>Guardian</Text>
                            </View>
                            <View style={styles.badge}>
                                <Text style={styles.badgeIcon}>⭐</Text>
                                <Text style={styles.badgeName}>Trusted</Text>
                            </View>
                            <View style={styles.badge}>
                                <Text style={styles.badgeIcon}>🚨</Text>
                                <Text style={styles.badgeName}>Alert Hero</Text>
                            </View>
                            <View style={styles.badge}>
                                <Text style={styles.badgeIcon}>💬</Text>
                                <Text style={styles.badgeName}>Active</Text>
                            </View>
                        </View>
                    </View>
                )}

                {/* Recent Activity */}
                {!isEditing && (
                    <View style={styles.activityContainer}>
                        <Text style={styles.sectionTitle}>Recent Activity</Text>
                        <View style={styles.activityItem}>
                            <Text style={styles.activityIcon}>📝</Text>
                            <View style={styles.activityContent}>
                                <Text style={styles.activityText}>Posted a safety alert</Text>
                                <Text style={styles.activityTime}>2 hours ago</Text>
                            </View>
                        </View>
                        <View style={styles.activityItem}>
                            <Text style={styles.activityIcon}>❤️</Text>
                            <View style={styles.activityContent}>
                                <Text style={styles.activityText}>Liked 5 community posts</Text>
                                <Text style={styles.activityTime}>5 hours ago</Text>
                            </View>
                        </View>
                        <View style={styles.activityItem}>
                            <Text style={styles.activityIcon}>🚶</Text>
                            <View style={styles.activityContent}>
                                <Text style={styles.activityText}>Completed Safe Walk</Text>
                                <Text style={styles.activityTime}>Yesterday</Text>
                            </View>
                        </View>
                    </View>
                )}
            </ScrollView>
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
        padding: theme.spacing.md,
        backgroundColor: theme.colors.primary,
        paddingTop: theme.spacing.xl,
    },
    backButton: {
        padding: theme.spacing.sm,
    },
    backText: {
        fontSize: 24,
        color: theme.colors.textLight,
    },
    headerTitle: {
        fontSize: theme.fonts.size.large,
        fontWeight: theme.fonts.weight.bold,
        color: theme.colors.textLight,
    },
    editButton: {
        padding: theme.spacing.sm,
    },
    editButtonText: {
        color: theme.colors.accent,
        fontSize: theme.fonts.size.medium,
        fontWeight: theme.fonts.weight.bold,
    },
    content: {
        padding: theme.spacing.lg,
    },
    avatarContainer: {
        alignItems: 'center',
        marginBottom: theme.spacing.lg,
    },
    avatar: {
        width: 120,
        height: 120,
        borderRadius: 60,
        borderWidth: 4,
        borderColor: theme.colors.accent,
    },
    changePhotoButton: {
        marginTop: theme.spacing.sm,
        padding: theme.spacing.sm,
    },
    changePhotoText: {
        color: theme.colors.accent,
        fontSize: theme.fonts.size.small,
        fontWeight: theme.fonts.weight.bold,
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: theme.spacing.xl,
        paddingVertical: theme.spacing.md,
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.md,
    },
    statItem: {
        alignItems: 'center',
    },
    statNumber: {
        fontSize: theme.fonts.size.xlarge,
        fontWeight: theme.fonts.weight.bold,
        color: theme.colors.accent,
    },
    statLabel: {
        fontSize: theme.fonts.size.small,
        color: theme.colors.textSecondary,
        marginTop: theme.spacing.xs,
    },
    infoContainer: {
        marginBottom: theme.spacing.xl,
    },
    name: {
        fontSize: theme.fonts.size.xlarge,
        fontWeight: theme.fonts.weight.bold,
        color: theme.colors.text,
        textAlign: 'center',
        marginBottom: theme.spacing.xs,
    },
    username: {
        fontSize: theme.fonts.size.medium,
        color: theme.colors.textSecondary,
        textAlign: 'center',
        marginBottom: theme.spacing.md,
    },
    bio: {
        fontSize: theme.fonts.size.medium,
        color: theme.colors.text,
        textAlign: 'center',
        marginBottom: theme.spacing.md,
        lineHeight: 22,
    },
    locationRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    locationIcon: {
        fontSize: 16,
        marginRight: theme.spacing.xs,
    },
    location: {
        fontSize: theme.fonts.size.medium,
        color: theme.colors.textSecondary,
    },
    label: {
        fontSize: theme.fonts.size.small,
        fontWeight: theme.fonts.weight.bold,
        color: theme.colors.text,
        marginBottom: theme.spacing.xs,
        marginTop: theme.spacing.md,
    },
    input: {
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.md,
        padding: theme.spacing.md,
        fontSize: theme.fonts.size.medium,
        color: theme.colors.text,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    bioInput: {
        height: 80,
        textAlignVertical: 'top',
    },
    saveButton: {
        backgroundColor: theme.colors.accent,
        borderRadius: theme.borderRadius.md,
        padding: theme.spacing.md,
        alignItems: 'center',
        marginTop: theme.spacing.xl,
    },
    saveButtonText: {
        color: theme.colors.textLight,
        fontSize: theme.fonts.size.medium,
        fontWeight: theme.fonts.weight.bold,
    },
    badgesContainer: {
        marginBottom: theme.spacing.xl,
    },
    sectionTitle: {
        fontSize: theme.fonts.size.large,
        fontWeight: theme.fonts.weight.bold,
        color: theme.colors.text,
        marginBottom: theme.spacing.md,
    },
    badgesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: theme.spacing.md,
    },
    badge: {
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.md,
        padding: theme.spacing.md,
        alignItems: 'center',
        width: '22%',
    },
    badgeIcon: {
        fontSize: 32,
        marginBottom: theme.spacing.xs,
    },
    badgeName: {
        fontSize: theme.fonts.size.small,
        color: theme.colors.text,
        textAlign: 'center',
    },
    activityContainer: {
        marginBottom: theme.spacing.xl,
    },
    activityItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.md,
        padding: theme.spacing.md,
        marginBottom: theme.spacing.sm,
    },
    activityIcon: {
        fontSize: 24,
        marginRight: theme.spacing.md,
    },
    activityContent: {
        flex: 1,
    },
    activityText: {
        fontSize: theme.fonts.size.medium,
        color: theme.colors.text,
        marginBottom: theme.spacing.xs,
    },
    activityTime: {
        fontSize: theme.fonts.size.small,
        color: theme.colors.textSecondary,
    },
});
