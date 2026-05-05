import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    Alert,
    Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Speech from 'expo-speech';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { theme } from '../styles/theme';
import { useLanguage } from './_layout';
import KNOWLEDGE_DATA from '../assets/garda-ai-knowledge.json';

import { API_URL } from '../utils/config';

interface Message {
    id: string;
    text?: string;
    imageUri?: string;
    isAudio?: boolean;
    isLocation?: boolean;
    locationData?: {
        latitude: number;
        longitude: number;
    };
    sender: 'user' | 'ai' | 'human';
    timestamp: Date;
    intent?: string;
}

// --- Smart Chat Engine & Knowledge Base ---
const INTENTS = KNOWLEDGE_DATA.intents;
const KNOWLEDGE_BASE = KNOWLEDGE_DATA.responses;

const detectIntent = (text: string): string => {
    const lowerText = text.toLowerCase();
    for (const [intent, keywords] of Object.entries(INTENTS)) {
        if (keywords.some(k => lowerText.includes(k))) {
            return intent;
        }
    }
    return 'DEFAULT';
};

// --- TTS Helper ---
const speakMessage = async (text: string, sender: 'ai' | 'human') => {
    const isHuman = sender === 'human';
    const voices = await Speech.getAvailableVoicesAsync();
    const irishVoice = voices.find(v => v.language.includes('en-IE') || v.language.includes('ga-IE'));
    const options: Speech.SpeechOptions = {
        language: 'en-IE',
        pitch: isHuman ? 0.9 : 1.1,
        rate: 0.9,
        voice: irishVoice ? irishVoice.identifier : undefined,
    };
    Speech.speak(text, options);
};

export default function GardaChatScreen() {
    const router = useRouter();
    const { t } = useLanguage();
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [isHumanConnected, setIsHumanConnected] = useState(false);
    const [isTracking, setIsTracking] = useState(false);
    const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);
    const flatListRef = useRef<FlatList>(null);

    useEffect(() => {
        const greetingResponses = KNOWLEDGE_BASE.GREETING;
        const randomGreeting = greetingResponses[Math.floor(Math.random() * greetingResponses.length)];
        const initialMsg: Message = {
            id: '1',
            text: randomGreeting,
            sender: 'ai',
            timestamp: new Date(),
            intent: 'GREETING',
        };
        addMessage(initialMsg);
    }, []);

    const addMessage = (msg: Message) => {
        setMessages(prev => [...prev, msg]);
    };

    const handleSend = async () => {
        if (!inputText.trim()) return;

        const userText = inputText;
        const userMsg: Message = {
            id: Date.now().toString(),
            text: userText,
            sender: 'user',
            timestamp: new Date(),
        };
        addMessage(userMsg);
        setInputText('');
        setIsTyping(true);

        try {
            // Call real AI endpoint
            const response = await fetch(`${API_URL}/garda-chat/message`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sos_id: 1, // TODO: Get from route params
                    user_message: userText,
                }),
            });

            const data = await response.json();

            const aiMsg: Message = {
                id: Date.now().toString(),
                text: data.message,
                sender: isHumanConnected ? 'human' : 'ai',
                timestamp: new Date(data.timestamp),
            };
            addMessage(aiMsg);
            setIsTyping(false);
        } catch (error) {
            console.error('Chat error:', error);
            // Fallback to mock responses
            const intent = detectIntent(userText);
            const responses = KNOWLEDGE_BASE[intent as keyof typeof KNOWLEDGE_BASE] || KNOWLEDGE_BASE.DEFAULT;
            const responseText = Array.isArray(responses)
                ? responses[Math.floor(Math.random() * responses.length)]
                : responses;

            const aiMsg: Message = {
                id: Date.now().toString(),
                text: responseText,
                sender: 'ai',
                timestamp: new Date(),
            };
            addMessage(aiMsg);
            setIsTyping(false);
        }
    };

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 1,
        });

        if (!result.canceled) {
            const imgMsg: Message = {
                id: Date.now().toString(),
                imageUri: result.assets[0].uri,
                sender: 'user',
                timestamp: new Date(),
            };
            addMessage(imgMsg);

            // Simulate AI analysis
            setIsTyping(true);
            setTimeout(() => {
                const aiMsg: Message = {
                    id: (Date.now() + 1).toString(),
                    text: "Image received and analyzed. I've attached this to your case file.",
                    sender: isHumanConnected ? 'human' : 'ai',
                    timestamp: new Date(),
                };
                addMessage(aiMsg);
                speakMessage(aiMsg.text!, isHumanConnected ? 'human' : 'ai');
                setIsTyping(false);
            }, 2000);
        }
    };

    const sendVoiceNote = () => {
        const voiceMsg: Message = {
            id: Date.now().toString(),
            isAudio: true,
            text: "🎤 Voice Note (0:15)",
            sender: 'user',
            timestamp: new Date(),
        };
        addMessage(voiceMsg);

        setIsTyping(true);
        setTimeout(() => {
            const aiMsg: Message = {
                id: (Date.now() + 1).toString(),
                text: "Audio received. Transcribing...",
                sender: isHumanConnected ? 'human' : 'ai',
                timestamp: new Date(),
            };
            addMessage(aiMsg);
            setIsTyping(false);
        }, 1500);
    };

    const shareLiveLocation = async () => {
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission Denied', 'Location permission is required for live tracking.');
                return;
            }

            const location = await Location.getCurrentPositionAsync({});

            const locMsg: Message = {
                id: Date.now().toString(),
                isLocation: true,
                locationData: {
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude,
                },
                sender: 'user',
                timestamp: new Date(),
            };
            addMessage(locMsg);
            setIsTracking(true);

            setIsTyping(true);
            setTimeout(() => {
                const responseText = "LIVE TRACKING ACTIVATED. We have your GPS coordinates locked. Do not close the app if possible. Help is on the way.";
                const responseMsg: Message = {
                    id: (Date.now() + 1).toString(),
                    text: responseText,
                    sender: isHumanConnected ? 'human' : 'ai',
                    timestamp: new Date(),
                };
                addMessage(responseMsg);
                setIsTyping(false);
            }, 1500);

        } catch (error) {
            Alert.alert('Error', 'Could not fetch location.');
        }
    };

    const toggleAudio = (messageId: string, messageText: string, sender: 'ai' | 'human') => {
        if (playingMessageId === messageId) {
            Speech.stop();
            setPlayingMessageId(null);
            return;
        }

        Speech.stop();
        setPlayingMessageId(messageId);
        speakMessage(messageText, sender).then(() => {
            setPlayingMessageId(null);
        });
    };

    const renderMessage = ({ item }: { item: Message }) => {
        const isUser = item.sender === 'user';
        const isHuman = item.sender === 'human';

        return (
            <View style={[
                styles.messageBubble,
                isUser ? styles.userBubble : (isHuman ? styles.humanBubble : styles.aiBubble)
            ]}>
                {!isUser && (
                    <View style={styles.senderHeader}>
                        <Text style={styles.senderName}>
                            {isHuman ? '👮 Garda Sgt. Murphy' : '🤖 Garda AI Triage'}
                        </Text>
                        {item.text && (
                            <TouchableOpacity
                                onPress={() => toggleAudio(item.id, item.text!, item.sender as 'ai' | 'human')}
                                style={styles.speakerButton}
                            >
                                <Text style={styles.speakerIcon}>
                                    {playingMessageId === item.id ? '🔇' : '🔊'}
                                </Text>
                            </TouchableOpacity>
                        )}
                    </View>
                )}

                {item.imageUri ? (
                    <Image source={{ uri: item.imageUri }} style={styles.messageImage} />
                ) : item.isLocation ? (
                    <View style={styles.locationBubble}>
                        <Text style={styles.locationTitle}>📍 LIVE LOCATION SHARED</Text>
                        <Text style={styles.locationCoords}>
                            Lat: {item.locationData?.latitude.toFixed(4)}, Long: {item.locationData?.longitude.toFixed(4)}
                        </Text>
                        <Text style={styles.locationStatus}>Tracking Active • Updates every 5s</Text>
                    </View>
                ) : (
                    <Text style={[
                        styles.messageText,
                        isUser && styles.userMessageText,
                        item.isAudio && styles.audioText
                    ]}>
                        {item.text}
                    </Text>
                )}

                <Text style={styles.timestamp}>
                    {item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => router.canGoBack() ? router.back() : router.replace('/support-hub')}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <Text style={styles.backButton}>← Back</Text>
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                    <Text style={styles.title}>Garda Chat</Text>
                    {isTracking && <Text style={styles.trackingBanner}>📍 LIVE TRACKING ACTIVE</Text>}
                </View>
                {isHumanConnected && <View style={styles.liveIndicator} />}
            </View>

            <FlatList
                ref={flatListRef}
                data={messages}
                renderItem={renderMessage}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.messageList}
                onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
            />

            {isTyping && (
                <View style={styles.typingIndicator}>
                    <ActivityIndicator size="small" color={theme.colors.textSecondary} />
                    <Text style={styles.typingText}>
                        {isHumanConnected ? 'Garda Murphy is typing...' : 'AI is processing...'}
                    </Text>
                </View>
            )}

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={100}
                style={styles.inputContainer}
            >
                <TouchableOpacity style={styles.mediaButton} onPress={pickImage}>
                    <Text style={styles.mediaIcon}>📷</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.mediaButton} onPress={sendVoiceNote}>
                    <Text style={styles.mediaIcon}>🎤</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.mediaButton} onPress={shareLiveLocation}>
                    <Text style={styles.mediaIcon}>📍</Text>
                </TouchableOpacity>

                <TextInput
                    style={styles.input}
                    value={inputText}
                    onChangeText={setInputText}
                    placeholder="Type message..."
                    placeholderTextColor={theme.colors.textSecondary}
                    returnKeyType="send"
                    onSubmitEditing={handleSend}
                />
                <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
                    <Text style={styles.sendButtonText}>Send</Text>
                </TouchableOpacity>
            </KeyboardAvoidingView>
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
        padding: theme.spacing.lg,
        paddingTop: theme.spacing.xxl,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
        backgroundColor: theme.colors.surface,
        ...theme.shadows.small,
    },
    backButton: {
        color: theme.colors.accent,
        fontSize: theme.fonts.size.medium,
        fontWeight: theme.fonts.weight.bold,
        marginRight: theme.spacing.md,
    },
    title: {
        fontSize: theme.fonts.size.large,
        fontWeight: theme.fonts.weight.bold,
        color: theme.colors.text,
    },
    trackingBanner: {
        fontSize: 10,
        color: theme.colors.error,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    liveIndicator: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: theme.colors.sos,
        shadowColor: theme.colors.sos,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 10,
        elevation: 5,
    },
    messageList: {
        padding: theme.spacing.md,
    },
    messageBubble: {
        maxWidth: '80%',
        padding: theme.spacing.md,
        borderRadius: 20,
        marginBottom: theme.spacing.md,
        ...theme.shadows.small,
    },
    userBubble: {
        alignSelf: 'flex-end',
        backgroundColor: theme.colors.primary,
        borderBottomRightRadius: 4,
    },
    aiBubble: {
        alignSelf: 'flex-start',
        backgroundColor: theme.colors.surface,
        borderBottomLeftRadius: 4,
    },
    humanBubble: {
        alignSelf: 'flex-start',
        backgroundColor: '#E8F1FF',
        borderBottomLeftRadius: 4,
        borderWidth: 1,
        borderColor: theme.colors.info,
    },
    senderHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    senderName: {
        fontSize: theme.fonts.size.small,
        color: theme.colors.textSecondary,
        fontWeight: 'bold',
    },
    speakerIcon: {
        fontSize: 16,
        marginLeft: 8,
    },
    speakerButton: {
        padding: 4,
    },
    messageText: {
        color: theme.colors.text,
        fontSize: theme.fonts.size.medium,
        lineHeight: 22,
    },
    userMessageText: {
        color: '#FFFFFF',
    },
    audioText: {
        fontStyle: 'italic',
        color: theme.colors.textSecondary,
    },
    messageImage: {
        width: 200,
        height: 150,
        borderRadius: theme.borderRadius.md,
        marginTop: 4,
    },
    locationBubble: {
        alignItems: 'center',
    },
    locationTitle: {
        fontWeight: 'bold',
        color: theme.colors.textLight,
        marginBottom: 4,
    },
    locationCoords: {
        color: theme.colors.textLight,
        fontSize: 12,
        marginBottom: 4,
    },
    locationStatus: {
        color: theme.colors.accent,
        fontSize: 10,
        fontWeight: 'bold',
    },
    timestamp: {
        color: 'rgba(0, 0, 0, 0.3)',
        fontSize: 10,
        alignSelf: 'flex-end',
        marginTop: 4,
    },
    typingIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: theme.spacing.md,
        marginLeft: theme.spacing.md,
    },
    typingText: {
        color: theme.colors.textSecondary,
        marginLeft: theme.spacing.sm,
        fontSize: theme.fonts.size.small,
    },
    inputContainer: {
        flexDirection: 'row',
        padding: theme.spacing.md,
        backgroundColor: theme.colors.surface,
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
        alignItems: 'center',
    },
    mediaButton: {
        padding: theme.spacing.sm,
        marginRight: theme.spacing.xs,
    },
    mediaIcon: {
        fontSize: 24,
    },
    input: {
        flex: 1,
        backgroundColor: theme.colors.background,
        borderRadius: theme.borderRadius.full,
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.sm,
        color: theme.colors.text,
        marginRight: theme.spacing.md,
        borderWidth: 1,
        borderColor: theme.colors.border,
        height: 40,
    },
    sendButton: {
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.colors.accent,
        borderRadius: theme.borderRadius.full,
        paddingHorizontal: theme.spacing.lg,
        height: 40,
    },
    sendButtonText: {
        color: theme.colors.textLight,
        fontWeight: 'bold',
    },
});
