import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, TextInput, Modal, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../../styles/theme';
import axios from 'axios';
import { API_URL } from '../../../utils/config';

// Define interfaces for our data
interface Station {
    id: number;
    name: string;
    address: string;
    latitude: number;
    longitude: number;
}

interface Post {
    id: string;
    station_name: string;
    content: string;
    timestamp: string;
    likes: number;
    is_official: boolean;
}

export default function StationProfileScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const stationName = typeof id === 'string' ? decodeURIComponent(id) : '';

    const [station, setStation] = useState<Station | null>(null);
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [newPostContent, setNewPostContent] = useState('');

    // Fetch station details and posts
    useEffect(() => {
        const fetchData = async () => {
            try {
                // In a real app, we'd fetch station details by ID or name.
                // For now, we'll mock the station details based on the name param
                // or fetch from a station endpoint if available.
                // Let's assume we have basic details from the param.
                setStation({
                    id: 0, // Placeholder
                    name: stationName,
                    address: 'Dublin, Ireland', // Placeholder
                    latitude: 53.3498,
                    longitude: -6.2603,
                });

                // Fetch posts for this station
                const response = await axios.get(`${API_URL}/station/${encodeURIComponent(stationName)}/posts`);
                setPosts(response.data);
            } catch (error) {
                console.error('Error fetching data:', error);
                // Don't alert on initial load failure to avoid spamming if backend is down
            } finally {
                setLoading(false);
            }
        };

        if (stationName) {
            fetchData();
        }
    }, [stationName]);

    const handleCreatePost = async () => {
        if (!newPostContent.trim()) {
            Alert.alert('Error', 'Post content cannot be empty');
            return;
        }

        try {
            await axios.post(`${API_URL}/station/${encodeURIComponent(stationName)}/posts`, {
                content: newPostContent,
                is_official: true // Assuming station posts are official
            });

            // Refresh posts
            const response = await axios.get(`${API_URL}/station/${encodeURIComponent(stationName)}/posts`);
            setPosts(response.data);

            setNewPostContent('');
            setModalVisible(false);
            Alert.alert('Success', 'Post created successfully');
        } catch (error) {
            console.error('Error creating post:', error);
            Alert.alert('Error', 'Failed to create post');
        }
    };

    const handleLikePost = async (postId: string) => {
        try {
            await axios.post(`${API_URL}/posts/${postId}/like`);
            // Update local state to reflect the like
            setPosts(currentPosts =>
                currentPosts.map(post =>
                    post.id === postId ? { ...post, likes: post.likes + 1 } : post
                )
            );
        } catch (error) {
            console.error('Error liking post:', error);
        }
    };

    if (loading) {
        return (
            <View style={styles.container}>
                <Text style={{ padding: 20, color: theme.colors.text }}>Loading...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={theme.colors.primary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Station Profile</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView style={styles.content}>
                {/* Banner */}
                <View style={styles.banner} />

                {/* Profile Info */}
                <View style={styles.profileInfo}>
                    <View style={styles.profileImageContainer}>
                        <View style={styles.profileImage} />
                    </View>
                    <TouchableOpacity
                        style={styles.editButton}
                        onPress={() => setModalVisible(true)}
                    >
                        <Text style={styles.editButtonText}>Edit / Post</Text>
                    </TouchableOpacity>
                </View>

                {/* Station Details */}
                <View style={styles.stationDetails}>
                    <Text style={styles.stationName}>{station?.name}</Text>
                    <Text style={styles.stationHandle}>@garda_{stationName.replace(/\s+/g, '').toLowerCase()}</Text>
                    <Text style={styles.stationBio}>
                        Official Garda Siochana Station. Serving the community of {stationName}.
                        In case of emergency, always dial 999 or 112.
                    </Text>

                    <View style={styles.locationRow}>
                        <Ionicons name="location-outline" size={16} color={theme.colors.textSecondary} style={styles.locationIcon} />
                        <Text style={styles.locationText}>{station?.address}</Text>
                    </View>

                    <View style={styles.statsRow}>
                        <Text style={styles.statText}><Text style={styles.statBold}>{posts.length}</Text> Posts</Text>
                        <Text style={styles.statText}><Text style={styles.statBold}>12.5k</Text> Followers</Text>
                    </View>
                </View>

                {/* Tabs */}
                <View style={styles.tabs}>
                    <View style={[styles.tab, styles.activeTab]}>
                        <Text style={[styles.tabText, styles.activeTabText]}>Posts</Text>
                    </View>
                    <View style={styles.tab}>
                        <Text style={styles.tabText}>Media</Text>
                    </View>
                    <View style={styles.tab}>
                        <Text style={styles.tabText}>Likes</Text>
                    </View>
                </View>

                {/* Feed */}
                <View style={styles.feed}>
                    {posts.map((post) => (
                        <View key={post.id} style={styles.postCard}>
                            <View style={styles.postHeader}>
                                <View style={styles.avatar} />
                                <View>
                                    <Text style={styles.postStationName}>{post.station_name}</Text>
                                    <Text style={styles.postHandle}>@garda_{post.station_name.replace(/\s+/g, '').toLowerCase()}</Text>
                                </View>
                                <Text style={styles.timestamp}>{post.timestamp}</Text>
                            </View>

                            {post.is_official && (
                                <View style={styles.alertBadge}>
                                    <Text style={styles.alertText}>OFFICIAL UPDATE</Text>
                                </View>
                            )}

                            <Text style={styles.postContent}>{post.content}</Text>

                            <View style={styles.actionRow}>
                                <TouchableOpacity style={styles.actionButton}>
                                    <Ionicons name="chatbubble-outline" size={20} color={theme.colors.textSecondary} />
                                    <Text style={styles.actionText}>0</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.actionButton}>
                                    <Ionicons name="repeat-outline" size={20} color={theme.colors.textSecondary} />
                                    <Text style={styles.actionText}>0</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.actionButton}
                                    onPress={() => handleLikePost(post.id)}
                                >
                                    <Ionicons name="heart-outline" size={20} color={theme.colors.textSecondary} />
                                    <Text style={styles.actionText}>{post.likes}</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.actionButton}>
                                    <Ionicons name="share-outline" size={20} color={theme.colors.textSecondary} />
                                </TouchableOpacity>
                            </View>
                        </View>
                    ))}
                </View>
            </ScrollView>

            {/* Edit/Post Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>New Station Post</Text>
                        <TextInput
                            style={styles.modalInput}
                            placeholder="What's happening?"
                            placeholderTextColor={theme.colors.textSecondary}
                            multiline
                            value={newPostContent}
                            onChangeText={setNewPostContent}
                        />
                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={styles.cancelButton}
                                onPress={() => setModalVisible(false)}
                            >
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.postButton}
                                onPress={handleCreatePost}
                            >
                                <Text style={styles.postButtonText}>Post</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
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
        paddingTop: 50,
        backgroundColor: theme.colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: theme.colors.text,
    },
    content: {
        flex: 1,
    },
    banner: {
        height: 120,
        backgroundColor: theme.colors.gardaBlue,
    },
    profileInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        paddingHorizontal: theme.spacing.md,
        marginTop: -40,
    },
    profileImageContainer: {
        padding: 4,
        backgroundColor: theme.colors.background,
        borderRadius: 50,
    },
    profileImage: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#ccc',
    },
    editButton: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: theme.colors.primary,
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 20,
        marginBottom: 10,
    },
    editButtonText: {
        color: theme.colors.primary,
        fontWeight: 'bold',
    },
    stationDetails: {
        padding: theme.spacing.md,
    },
    stationName: {
        fontSize: 22,
        fontWeight: 'bold',
        color: theme.colors.text,
    },
    stationHandle: {
        fontSize: 14,
        color: theme.colors.textSecondary,
        marginBottom: 8,
    },
    stationBio: {
        fontSize: 14,
        color: theme.colors.text,
        marginBottom: 12,
        lineHeight: 20,
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    locationIcon: {
        marginRight: 4,
    },
    locationText: {
        color: theme.colors.textSecondary,
    },
    statsRow: {
        flexDirection: 'row',
        gap: 16,
    },
    statText: {
        color: theme.colors.textSecondary,
    },
    statBold: {
        fontWeight: 'bold',
        color: theme.colors.text,
    },
    tabs: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
        marginTop: 8,
    },
    tab: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 12,
    },
    activeTab: {
        borderBottomWidth: 2,
        borderBottomColor: theme.colors.primary,
    },
    tabText: {
        fontWeight: 'bold',
        color: theme.colors.textSecondary,
    },
    activeTabText: {
        color: theme.colors.text,
    },
    feed: {
        paddingBottom: 40,
    },
    postCard: {
        padding: theme.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    postHeader: {
        flexDirection: 'row',
        marginBottom: 8,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 12,
        backgroundColor: '#ccc',
    },
    postStationName: {
        fontWeight: 'bold',
        color: theme.colors.text,
    },
    postHandle: {
        color: theme.colors.textSecondary,
        fontSize: 12,
    },
    timestamp: {
        marginLeft: 'auto',
        color: theme.colors.textSecondary,
        fontSize: 12,
    },
    alertBadge: {
        backgroundColor: 'rgba(255, 59, 48, 0.1)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        alignSelf: 'flex-start',
        marginBottom: 8,
    },
    alertText: {
        color: theme.colors.error,
        fontWeight: 'bold',
        fontSize: 12,
    },
    postContent: {
        fontSize: 16,
        color: theme.colors.text,
        lineHeight: 22,
        marginBottom: 12,
    },
    actionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingRight: 32,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    actionText: {
        fontSize: 12,
        color: theme.colors.textSecondary,
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalContent: {
        width: '90%',
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.md,
        padding: theme.spacing.lg,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: theme.spacing.md,
        color: theme.colors.text,
    },
    modalInput: {
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: theme.borderRadius.sm,
        padding: theme.spacing.md,
        height: 100,
        textAlignVertical: 'top',
        marginBottom: theme.spacing.md,
        color: theme.colors.text,
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 10,
    },
    cancelButton: {
        padding: theme.spacing.sm,
    },
    cancelButtonText: {
        color: theme.colors.textSecondary,
    },
    postButton: {
        backgroundColor: theme.colors.primary,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
        borderRadius: theme.borderRadius.sm,
    },
    postButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
});
