import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import axios from 'axios';
import * as Speech from 'expo-speech';
import { theme } from '../../styles/theme';
import { Ionicons } from '@expo/vector-icons';

import { API_URL } from '../../utils/config';

interface ReportDetail {
    id: number;
    incident_type: string;
    description: string;
    location_address: string;
    status: string;
    assigned_station: string;
    created_at: string;
    photo_url?: string;
}

interface Message {
    id: number;
    sender_type: 'user' | 'garda';
    sender_id: number;
    message: string;
    created_at: string;
}

export default function ReportDetailScreen() {
    const router = useRouter();
    const { id } = useLocalSearchParams();
    const scrollViewRef = useRef<ScrollView>(null);

    const [report, setReport] = useState<ReportDetail | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [playingMessageId, setPlayingMessageId] = useState<number | null>(null);

    useEffect(() => {
        fetchReportDetail();
        fetchMessages();
    }, [id]);

    const fetchReportDetail = async () => {
        try {
            const response = await axios.get(`${API_URL}/crime-report/${id}`);
            setReport(response.data);
        } catch (error) {
            console.error('Error fetching report:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchMessages = async () => {
        try {
            const response = await axios.get(`${API_URL}/crime-report/${id}/messages`);
            setMessages(response.data.messages);
            // Scroll to bottom after messages load
            setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
        } catch (error) {
            console.error('Error fetching messages:', error);
        }
    };

    const sendMessage = async () => {
        if (!newMessage.trim()) return;

        setSending(true);
        try {
            await axios.post(`${API_URL}/crime-report/${id}/message`, {
                sender_type: 'user',
                sender_id: 1, // TODO: Get from auth
                message: newMessage.trim(),
            });

            // Add message to local state
            const tempMessage: Message = {
                id: Date.now(),
                sender_type: 'user',
                sender_id: 1,
                message: newMessage.trim(),
                created_at: new Date().toISOString(),
            };
            setMessages([...messages, tempMessage]);
            setNewMessage('');

            // Scroll to bottom
            setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
        } catch (error) {
            console.error('Error sending message:', error);
        } finally {
            setSending(false);
        }
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

    const toggleAudio = async (messageId: number, messageText: string) => {
        // If this message is already playing, stop it
        if (playingMessageId === messageId) {
            Speech.stop();
            setPlayingMessageId(null);
            return;
        }

        // Stop any currently playing audio
        Speech.stop();

        // Start playing this message
        setPlayingMessageId(messageId);
        Speech.speak(messageText, {
            onDone: () => setPlayingMessageId(null),
            onStopped: () => setPlayingMessageId(null),
            onError: () => setPlayingMessageId(null),
        });
    };

    if (loading || !report) {
        return (
            <View style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Report Details</Text>
                    <View style={{ width: 24 }} />
                </View>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                </View>
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={0}
        >
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Report #{report.id}</Text>
                <TouchableOpacity onPress={fetchMessages} style={styles.refreshButton}>
                    <Ionicons name="refresh" size={20} color={theme.colors.primary} />
                </TouchableOpacity>
            </View>

            {/* Report Summary Card */}
            <View style={styles.summaryCard}>
                <View style={styles.summaryHeader}>
                    <Text style={styles.incidentType}>{report.incident_type}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(report.status) }]}>
                        <Text style={styles.statusText}>{report.status}</Text>
                    </View>
                </View>

                <Text style={styles.description}>{report.description}</Text>

                <View style={styles.metaRow}>
                    <Ionicons name="location" size={16} color={theme.colors.textSecondary} />
                    <Text style={styles.metaText}>{report.location_address}</Text>
                </View>

                <View style={styles.metaRow}>
                    <Ionicons name="shield" size={16} color={theme.colors.textSecondary} />
                    <Text style={styles.metaText}>Assigned to {report.assigned_station}</Text>
                </View>

                <View style={styles.metaRow}>
                    <Ionicons name="calendar" size={16} color={theme.colors.textSecondary} />
                    <Text style={styles.metaText}>
                        {new Date(report.created_at).toLocaleString()}
                    </Text>
                </View>
            </View>

            {/* Chat Section */}
            <View style={styles.chatHeader}>
                <Ionicons name="chatbubbles" size={20} color={theme.colors.primary} />
                <Text style={styles.chatHeaderText}>Communication with Garda</Text>
            </View>

            {/* Messages */}
            <ScrollView
                ref={scrollViewRef}
                style={styles.messagesContainer}
                contentContainerStyle={styles.messagesContent}
            >
                {messages.length === 0 ? (
                    <View style={styles.emptyChat}>
                        <Ionicons name="chatbubble-outline" size={48} color={theme.colors.textSecondary} />
                        <Text style={styles.emptyChatText}>No messages yet</Text>
                        <Text style={styles.emptyChatSubtext}>
                            Start a conversation with the assigned Garda
                        </Text>
                    </View>
                ) : (
                    messages.map((msg) => (
                        <View
                            key={msg.id}
                            style={[
                                styles.messageBubble,
                                msg.sender_type === 'user' ? styles.userMessage : styles.gardaMessage,
                            ]}
                        >
                            <View style={styles.messageHeader}>
                                <Text style={[styles.messageSender, msg.sender_type === 'garda' && { color: theme.colors.text }]}>
                                    {msg.sender_type === 'user' ? 'You' : 'Garda'}
                                </Text>
                                <View style={styles.messageHeaderRight}>
                                    <Text style={[styles.messageTime, msg.sender_type === 'garda' && { color: theme.colors.textSecondary }]}>
                                        {new Date(msg.created_at).toLocaleTimeString([], {
                                            hour: '2-digit',
                                            minute: '2-digit',
                                        })}
                                    </Text>
                                    {/* Audio toggle for Garda messages only */}
                                    {msg.sender_type === 'garda' && (
                                        <TouchableOpacity
                                            onPress={() => toggleAudio(msg.id, msg.message)}
                                            style={styles.audioButton}
                                        >
                                            <Ionicons
                                                name={playingMessageId === msg.id ? 'volume-mute' : 'volume-high'}
                                                size={18}
                                                color={playingMessageId === msg.id ? theme.colors.error : theme.colors.primary}
                                            />
                                        </TouchableOpacity>
                                    )}
                                </View>
                            </View>
                            <Text style={[styles.messageText, msg.sender_type === 'garda' && { color: theme.colors.text }]}>{msg.message}</Text>
                        </View>
                    ))
                )}
            </ScrollView>

            {/* Message Input */}
            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.input}
                    value={newMessage}
                    onChangeText={setNewMessage}
                    placeholder="Type a message..."
                    placeholderTextColor={theme.colors.textSecondary}
                    multiline
                    maxLength={500}
                />
                <TouchableOpacity
                    style={[styles.sendButton, sending && styles.sendButtonDisabled]}
                    onPress={sendMessage}
                    disabled={sending || !newMessage.trim()}
                >
                    {sending ? (
                        <ActivityIndicator size="small" color="#FFF" />
                    ) : (
                        <Ionicons name="send" size={20} color="#FFF" />
                    )}
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
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
    summaryCard: {
        backgroundColor: theme.colors.surface,
        margin: theme.spacing.lg,
        borderRadius: theme.borderRadius.md,
        padding: theme.spacing.lg,
        ...theme.shadows.medium,
    },
    summaryHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.md,
    },
    incidentType: {
        fontSize: theme.fonts.size.large,
        fontWeight: theme.fonts.weight.bold,
        color: theme.colors.text,
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
    description: {
        fontSize: theme.fonts.size.medium,
        color: theme.colors.text,
        marginBottom: theme.spacing.md,
        lineHeight: 22,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: theme.spacing.sm,
    },
    metaText: {
        fontSize: theme.fonts.size.small,
        color: theme.colors.textSecondary,
        marginLeft: theme.spacing.sm,
    },
    chatHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.md,
        backgroundColor: theme.colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    chatHeaderText: {
        fontSize: theme.fonts.size.medium,
        fontWeight: theme.fonts.weight.bold,
        color: theme.colors.text,
        marginLeft: theme.spacing.sm,
    },
    messagesContainer: {
        flex: 1,
    },
    messagesContent: {
        padding: theme.spacing.lg,
    },
    emptyChat: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: theme.spacing.xxl * 2,
    },
    emptyChatText: {
        fontSize: theme.fonts.size.medium,
        fontWeight: theme.fonts.weight.bold,
        color: theme.colors.textSecondary,
        marginTop: theme.spacing.md,
    },
    emptyChatSubtext: {
        fontSize: theme.fonts.size.small,
        color: theme.colors.textSecondary,
        marginTop: theme.spacing.sm,
    },
    messageBubble: {
        maxWidth: '80%',
        borderRadius: theme.borderRadius.md,
        padding: theme.spacing.md,
        marginBottom: theme.spacing.md,
    },
    userMessage: {
        alignSelf: 'flex-end',
        backgroundColor: theme.colors.primary,
    },
    gardaMessage: {
        alignSelf: 'flex-start',
        backgroundColor: theme.colors.surface,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    messageHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: theme.spacing.xs,
    },
    messageSender: {
        fontSize: theme.fonts.size.small,
        fontWeight: theme.fonts.weight.bold,
        color: theme.colors.textLight,
    },
    messageTime: {
        fontSize: theme.fonts.size.small,
        color: theme.colors.textLight,
        opacity: 0.7,
    },
    messageText: {
        fontSize: theme.fonts.size.medium,
        color: theme.colors.textLight,
        lineHeight: 20,
    },
    messageHeaderRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    audioButton: {
        marginLeft: theme.spacing.sm,
        padding: 2,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        padding: theme.spacing.lg,
        backgroundColor: theme.colors.surface,
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
    },
    input: {
        flex: 1,
        backgroundColor: theme.colors.background,
        borderRadius: theme.borderRadius.md,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
        fontSize: theme.fonts.size.medium,
        color: theme.colors.text,
        maxHeight: 100,
        marginRight: theme.spacing.sm,
    },
    sendButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: theme.colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    sendButtonDisabled: {
        opacity: 0.5,
    },
});
