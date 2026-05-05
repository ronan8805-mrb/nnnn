import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    Image,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
    RefreshControl,
    Alert,
    Modal,
    SafeAreaView,
    Platform,
    StatusBar
} from 'react-native';
import { useRouter } from 'expo-router';
import axios from 'axios';
import { theme } from '../styles/theme';
import { useLanguage } from './_layout';

import { API_URL } from '../utils/config';

// --- Types ---
interface Post {
    id: number;
    user_id: number;
    user_name: string;
    user_avatar?: string;
    content: string;
    type: 'alert' | 'help' | 'info';
    location?: string;
    likes: number;
    created_at: string;
}

type Tab = 'home' | 'search' | 'communities' | 'notifications' | 'messages';

// --- Mock Data for Other Tabs ---
const MOCK_NOTIFICATIONS = [
    { id: 1, text: "Garda Murphy liked your post.", time: "2m ago", read: false },
    { id: 2, text: "New alert in Dublin 1: Suspicious Activity", time: "15m ago", read: true },
    { id: 3, text: "Sarah replied to your comment.", time: "1h ago", read: true },
];

const MOCK_MESSAGES = [
    { id: 1, user: "Community Watch", lastMessage: "Meeting at 7pm tonight.", time: "10:30 AM" },
    { id: 2, user: "John Doe", lastMessage: "Did you see that alert?", time: "Yesterday" },
];

const MOCK_COMMUNITIES = [
    { id: 1, name: "Dublin 1 Watch", members: 1250 },
    { id: 2, name: "Student Safety", members: 850 },
    { id: 3, name: "Late Night Walkers", members: 300 },
];

export default function CommunityFeedScreen() {
    const router = useRouter();
    const { t } = useLanguage();

    // State
    const [activeTab, setActiveTab] = useState<Tab>('home');
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Compose Modal State
    const [isComposeVisible, setIsComposeVisible] = useState(false);
    const [newPostText, setNewPostText] = useState('');
    const [isPosting, setIsPosting] = useState(false);

    // Search State
    const [searchQuery, setSearchQuery] = useState('');

    // Mock User ID
    const CURRENT_USER_ID = 1;

    useEffect(() => {
        if (activeTab === 'home') {
            fetchPosts();
        }
    }, [activeTab]);

    const fetchPosts = async () => {
        try {
            const response = await axios.get(`${API_URL}/feed`);
            setPosts(response.data.posts);
        } catch (error) {
            console.error('Error fetching feed:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handlePost = async () => {
        if (!newPostText.trim()) return;

        setIsPosting(true);
        try {
            await axios.post(`${API_URL}/feed`, {
                user_id: CURRENT_USER_ID,
                content: newPostText,
                type: 'info',
                location: 'Dublin City'
            });
            setNewPostText('');
            setIsComposeVisible(false);
            fetchPosts();
        } catch (error) {
            Alert.alert('Error', 'Could not post message.');
        } finally {
            setIsPosting(false);
        }
    };

    // --- Render Components ---

    const renderHeader = () => (
        <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.headerAvatarContainer}>
                <Image
                    source={{ uri: 'https://via.placeholder.com/32' }}
                    style={styles.headerAvatar}
                />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>
                {activeTab === 'home' ? 'For You' :
                    activeTab === 'search' ? 'Search' :
                        activeTab === 'communities' ? 'Communities' :
                            activeTab === 'notifications' ? 'Notifications' : 'Messages'}
            </Text>
            <TouchableOpacity style={styles.headerSettings}>
                <Text style={styles.headerIcon}>⚙️</Text>
            </TouchableOpacity>
        </View>
    );

    const renderPost = ({ item }: { item: Post }) => (
        <View style={styles.postCard}>
            <TouchableOpacity onPress={() => router.push(`/profile/${item.user_id}`)}>
                <Image
                    source={{ uri: item.user_avatar || 'https://via.placeholder.com/40' }}
                    style={styles.avatar}
                />
            </TouchableOpacity>
            <View style={styles.postContentContainer}>
                <View style={styles.postHeader}>
                    <Text style={styles.userName}>{item.user_name}</Text>
                    <Text style={styles.userHandle}>@{item.user_name.replace(/\s+/g, '').toLowerCase()}</Text>
                    <Text style={styles.dotSeparator}>·</Text>
                    <Text style={styles.timestamp}>{new Date(item.created_at).toLocaleDateString()}</Text>
                </View>

                {item.type === 'alert' && (
                    <View style={styles.alertBadge}>
                        <Text style={styles.alertText}>🚨 ALERT: {item.location}</Text>
                    </View>
                )}

                <Text style={styles.postText}>{item.content}</Text>

                <View style={styles.postActions}>
                    <TouchableOpacity style={styles.actionButton}>
                        <Text style={styles.actionIcon}>💬</Text>
                        <Text style={styles.actionCount}>2</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionButton}>
                        <Text style={styles.actionIcon}>🔁</Text>
                        <Text style={styles.actionCount}>5</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionButton}>
                        <Text style={styles.actionIcon}>❤️</Text>
                        <Text style={styles.actionCount}>{item.likes}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionButton}>
                        <Text style={styles.actionIcon}>📤</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );

    const renderFeed = () => (
        <View style={styles.contentContainer}>
            {loading ? (
                <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 20 }} />
            ) : (
                <FlatList
                    data={posts}
                    renderItem={renderPost}
                    keyExtractor={(item) => item.id.toString()}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchPosts(); }} />
                    }
                    contentContainerStyle={{ paddingBottom: 80 }}
                />
            )}
            <TouchableOpacity
                style={styles.fab}
                onPress={() => setIsComposeVisible(true)}
            >
                <Text style={styles.fabIcon}>+</Text>
            </TouchableOpacity>
        </View>
    );

    const renderSearch = () => (
        <View style={styles.contentContainer}>
            <View style={styles.searchBarContainer}>
                <TextInput
                    style={styles.searchBar}
                    placeholder="Search people, topics, alerts..."
                    placeholderTextColor={theme.colors.textSecondary}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
            </View>
            <Text style={styles.sectionHeader}>Trending in Safety</Text>
            <View style={styles.trendingItem}>
                <Text style={styles.trendingRank}>1 · Trending</Text>
                <Text style={styles.trendingTopic}>#DublinSafety</Text>
                <Text style={styles.trendingCount}>2.5K Posts</Text>
            </View>
            <View style={styles.trendingItem}>
                <Text style={styles.trendingRank}>2 · Alert</Text>
                <Text style={styles.trendingTopic}>#StormWarning</Text>
                <Text style={styles.trendingCount}>1.2K Posts</Text>
            </View>
        </View>
    );

    const renderCommunities = () => (
        <View style={styles.contentContainer}>
            <FlatList
                data={MOCK_COMMUNITIES}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                    <View style={styles.communityItem}>
                        <View style={styles.communityIcon} />
                        <View>
                            <Text style={styles.communityName}>{item.name}</Text>
                            <Text style={styles.communityMembers}>{item.members} members</Text>
                        </View>
                        <TouchableOpacity style={styles.joinButton}>
                            <Text style={styles.joinButtonText}>Join</Text>
                        </TouchableOpacity>
                    </View>
                )}
            />
        </View>
    );

    const renderNotifications = () => (
        <View style={styles.contentContainer}>
            <FlatList
                data={MOCK_NOTIFICATIONS}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                    <View style={[styles.notificationItem, !item.read && styles.unreadNotification]}>
                        <View style={styles.notificationIcon}>
                            <Text>🔔</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.notificationText}>{item.text}</Text>
                            <Text style={styles.notificationTime}>{item.time}</Text>
                        </View>
                    </View>
                )}
            />
        </View>
    );

    const renderMessages = () => (
        <View style={styles.contentContainer}>
            <FlatList
                data={MOCK_MESSAGES}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                    <View style={styles.messageItem}>
                        <Image
                            source={{ uri: 'https://via.placeholder.com/40' }}
                            style={styles.avatar}
                        />
                        <View style={{ flex: 1 }}>
                            <View style={styles.messageHeader}>
                                <Text style={styles.messageUser}>{item.user}</Text>
                                <Text style={styles.messageTime}>{item.time}</Text>
                            </View>
                            <Text style={styles.messagePreview}>{item.lastMessage}</Text>
                        </View>
                    </View>
                )}
            />
            <TouchableOpacity style={styles.fab}>
                <Text style={styles.fabIcon}>✉️</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />
            {renderHeader()}

            <View style={styles.mainContent}>
                {activeTab === 'home' && renderFeed()}
                {activeTab === 'search' && renderSearch()}
                {activeTab === 'communities' && renderCommunities()}
                {activeTab === 'notifications' && renderNotifications()}
                {activeTab === 'messages' && renderMessages()}
            </View>

            {/* Bottom Tab Bar */}
            <View style={styles.tabBar}>
                <TouchableOpacity style={styles.tabItem} onPress={() => setActiveTab('home')}>
                    <Text style={[styles.tabIcon, activeTab === 'home' && styles.activeTabIcon]}>🏠</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.tabItem} onPress={() => setActiveTab('search')}>
                    <Text style={[styles.tabIcon, activeTab === 'search' && styles.activeTabIcon]}>🔍</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.tabItem} onPress={() => setActiveTab('communities')}>
                    <Text style={[styles.tabIcon, activeTab === 'communities' && styles.activeTabIcon]}>👥</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.tabItem} onPress={() => setActiveTab('notifications')}>
                    <Text style={[styles.tabIcon, activeTab === 'notifications' && styles.activeTabIcon]}>🔔</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.tabItem} onPress={() => setActiveTab('messages')}>
                    <Text style={[styles.tabIcon, activeTab === 'messages' && styles.activeTabIcon]}>✉️</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.tabItem} onPress={() => router.push('/profile')}>
                    <Text style={styles.tabIcon}>👤</Text>
                </TouchableOpacity>
            </View>

            {/* Compose Modal */}
            <Modal
                visible={isComposeVisible}
                animationType="slide"
                presentationStyle="pageSheet"
            >
                <View style={styles.composeContainer}>
                    <View style={styles.composeHeader}>
                        <TouchableOpacity onPress={() => setIsComposeVisible(false)}>
                            <Text style={styles.cancelText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.postButton, !newPostText.trim() && styles.postButtonDisabled]}
                            onPress={handlePost}
                            disabled={!newPostText.trim() || isPosting}
                        >
                            {isPosting ? <ActivityIndicator color="white" /> : <Text style={styles.postButtonText}>Post</Text>}
                        </TouchableOpacity>
                    </View>
                    <View style={styles.composeBody}>
                        <Image
                            source={{ uri: 'https://via.placeholder.com/40' }}
                            style={styles.avatar}
                        />
                        <TextInput
                            style={styles.composeInput}
                            placeholder="What's happening?"
                            placeholderTextColor={theme.colors.textSecondary}
                            multiline
                            autoFocus
                            value={newPostText}
                            onChangeText={setNewPostText}
                        />
                    </View>
                </View>
            </Modal>

        </SafeAreaView>
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
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
        backgroundColor: theme.colors.surface,
    },
    headerAvatarContainer: {
        padding: 4,
    },
    headerAvatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: theme.colors.border,
    },
    headerTitle: {
        fontSize: theme.fonts.size.large,
        fontWeight: theme.fonts.weight.bold,
        color: theme.colors.text,
    },
    headerSettings: {
        padding: 4,
    },
    headerIcon: {
        fontSize: 20,
    },
    mainContent: {
        flex: 1,
    },
    contentContainer: {
        flex: 1,
    },
    // Post Styles
    postCard: {
        flexDirection: 'row',
        padding: theme.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
        backgroundColor: theme.colors.surface,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: theme.spacing.md,
        backgroundColor: theme.colors.border,
    },
    postContentContainer: {
        flex: 1,
    },
    postHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 2,
    },
    userName: {
        fontWeight: 'bold',
        color: theme.colors.text,
        marginRight: 4,
        fontSize: theme.fonts.size.medium,
    },
    userHandle: {
        color: theme.colors.textSecondary,
        marginRight: 4,
        fontSize: theme.fonts.size.medium,
    },
    dotSeparator: {
        color: theme.colors.textSecondary,
        marginRight: 4,
    },
    timestamp: {
        color: theme.colors.textSecondary,
        fontSize: theme.fonts.size.medium,
    },
    alertBadge: {
        backgroundColor: 'rgba(255, 59, 48, 0.1)',
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: 2,
        borderRadius: 4,
        marginBottom: theme.spacing.xs,
        alignSelf: 'flex-start',
    },
    alertText: {
        color: theme.colors.error,
        fontSize: 12,
        fontWeight: 'bold',
    },
    postText: {
        fontSize: theme.fonts.size.medium,
        color: theme.colors.text,
        lineHeight: 20,
        marginBottom: theme.spacing.md,
    },
    postActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingRight: theme.spacing.xl,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    actionIcon: {
        fontSize: 16,
        color: theme.colors.textSecondary,
        marginRight: 4,
    },
    actionCount: {
        fontSize: 12,
        color: theme.colors.textSecondary,
    },
    // FAB
    fab: {
        position: 'absolute',
        bottom: 20,
        right: 20,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: theme.colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        ...theme.shadows.large,
    },
    fabIcon: {
        fontSize: 32,
        color: 'white',
        marginTop: -4,
    },
    // Tab Bar
    tabBar: {
        flexDirection: 'row',
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
        backgroundColor: theme.colors.surface,
        paddingBottom: Platform.OS === 'ios' ? 20 : 0,
    },
    tabItem: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 12,
    },
    tabIcon: {
        fontSize: 24,
        opacity: 0.5,
    },
    activeTabIcon: {
        opacity: 1,
    },
    // Search
    searchBarContainer: {
        padding: theme.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    searchBar: {
        backgroundColor: theme.colors.background,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: 8,
        borderRadius: 20,
        fontSize: theme.fonts.size.medium,
    },
    sectionHeader: {
        fontSize: 20,
        fontWeight: 'bold',
        padding: theme.spacing.md,
        color: theme.colors.text,
    },
    trendingItem: {
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    trendingRank: {
        fontSize: 12,
        color: theme.colors.textSecondary,
        marginBottom: 2,
    },
    trendingTopic: {
        fontSize: 16,
        fontWeight: 'bold',
        color: theme.colors.text,
        marginBottom: 2,
    },
    trendingCount: {
        fontSize: 12,
        color: theme.colors.textSecondary,
    },
    // Communities
    communityItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: theme.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    communityIcon: {
        width: 48,
        height: 48,
        borderRadius: 8,
        backgroundColor: theme.colors.primary,
        marginRight: theme.spacing.md,
    },
    communityName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: theme.colors.text,
    },
    communityMembers: {
        fontSize: 14,
        color: theme.colors.textSecondary,
    },
    joinButton: {
        marginLeft: 'auto',
        backgroundColor: theme.colors.background,
        borderWidth: 1,
        borderColor: theme.colors.primary,
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 16,
    },
    joinButtonText: {
        color: theme.colors.primary,
        fontWeight: 'bold',
    },
    // Notifications
    notificationItem: {
        flexDirection: 'row',
        padding: theme.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    unreadNotification: {
        backgroundColor: 'rgba(0, 122, 255, 0.05)',
    },
    notificationIcon: {
        marginRight: theme.spacing.md,
    },
    notificationText: {
        fontSize: 14,
        color: theme.colors.text,
        marginBottom: 4,
    },
    notificationTime: {
        fontSize: 12,
        color: theme.colors.textSecondary,
    },
    // Messages
    messageItem: {
        flexDirection: 'row',
        padding: theme.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    messageHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 2,
    },
    messageUser: {
        fontWeight: 'bold',
        color: theme.colors.text,
    },
    messageTime: {
        fontSize: 12,
        color: theme.colors.textSecondary,
    },
    messagePreview: {
        color: theme.colors.textSecondary,
    },
    // Compose Modal
    composeContainer: {
        flex: 1,
        backgroundColor: theme.colors.surface,
        paddingTop: Platform.OS === 'ios' ? 40 : 20,
    },
    composeHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: theme.spacing.md,
        paddingBottom: theme.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    cancelText: {
        fontSize: 16,
        color: theme.colors.text,
    },
    postButton: {
        backgroundColor: theme.colors.primary,
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 20,
    },
    postButtonDisabled: {
        opacity: 0.5,
    },
    postButtonText: {
        color: 'white',
        fontWeight: 'bold',
    },
    composeBody: {
        flexDirection: 'row',
        padding: theme.spacing.md,
    },
    composeInput: {
        flex: 1,
        fontSize: 18,
        color: theme.colors.text,
        marginLeft: theme.spacing.md,
        marginTop: 8,
    },
});
