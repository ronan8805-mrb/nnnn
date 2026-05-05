import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ScrollView,
    Alert,
    ActivityIndicator,
    Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import axios from 'axios';
import { theme } from '../styles/theme';
import { Ionicons } from '@expo/vector-icons';

import { API_URL } from '../utils/config';

const GUARDIAN_TYPES = ['Friend', 'Family', 'Parent', 'Garda'];

interface Guardian {
    id: number;
    username: string;
    type: string;
    can_track: boolean;
    created_at: string;
}

export default function GuardiansScreen() {
    const router = useRouter();
    const [username, setUsername] = useState('');
    const [selectedType, setSelectedType] = useState('Friend');
    const [guardians, setGuardians] = useState<Guardian[]>([]);
    const [loading, setLoading] = useState(true);
    const [adding, setAdding] = useState(false);

    useEffect(() => {
        fetchGuardians();
    }, []);

    const fetchGuardians = async () => {
        try {
            const response = await axios.get(`${API_URL}/guardians/1`); // TODO: Get user_id from auth
            setGuardians(response.data.guardians);
        } catch (error) {
            console.error('Error fetching guardians:', error);
        } finally {
            setLoading(false);
        }
    };

    const addGuardian = async () => {
        if (!username.trim()) {
            Alert.alert('Error', 'Please enter a username');
            return;
        }

        setAdding(true);
        try {
            await axios.post(`${API_URL}/guardians/add`, {
                user_id: 1, // TODO: Get from auth
                guardian_username: username.trim(),
                guardian_type: selectedType,
            });

            Alert.alert('Success', `@${username} added as ${selectedType}`);
            setUsername('');
            fetchGuardians();
        } catch (error: any) {
            const message = error.response?.data?.detail || 'Failed to add guardian';
            Alert.alert('Error', message);
        } finally {
            setAdding(false);
        }
    };

    const toggleTracking = async (guardianId: number, currentStatus: boolean) => {
        try {
            await axios.put(`${API_URL}/guardians/${guardianId}`, {
                can_track: !currentStatus,
            });
            fetchGuardians();
        } catch (error) {
            Alert.alert('Error', 'Failed to update tracking permission');
        }
    };

    const removeGuardian = async (guardianId: number, username: string) => {
        Alert.alert(
            'Remove Guardian',
            `Remove @${username} from your guardians?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Remove',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await axios.delete(`${API_URL}/guardians/${guardianId}`);
                            fetchGuardians();
                        } catch (error) {
                            Alert.alert('Error', 'Failed to remove guardian');
                        }
                    },
                },
            ]
        );
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'Friend':
                return 'people';
            case 'Family':
                return 'home';
            case 'Parent':
                return 'heart';
            case 'Garda':
                return 'shield';
            default:
                return 'person';
        }
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'Friend':
                return '#4CAF50';
            case 'Family':
                return '#2196F3';
            case 'Parent':
                return '#E91E63';
            case 'Garda':
                return '#FF5722';
            default:
                return theme.colors.primary;
        }
    };

    if (loading) {
        return (
            <View style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Guardians</Text>
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
                <Text style={styles.headerTitle}>Guardians</Text>
                <TouchableOpacity onPress={fetchGuardians} style={styles.refreshButton}>
                    <Ionicons name="refresh" size={20} color={theme.colors.primary} />
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.content}>
                {/* Info Card */}
                <View style={styles.infoCard}>
                    <Ionicons name="information-circle" size={24} color={theme.colors.primary} />
                    <Text style={styles.infoText}>
                        Guardians can track your location during Safe Walk and receive SOS alerts
                    </Text>
                </View>

                {/* Add Guardian Section */}
                <View style={styles.addSection}>
                    <Text style={styles.sectionTitle}>Add Guardian</Text>

                    {/* Type Selector */}
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeScroll}>
                        {GUARDIAN_TYPES.map((type) => (
                            <TouchableOpacity
                                key={type}
                                style={[
                                    styles.typeChip,
                                    selectedType === type && { backgroundColor: getTypeColor(type) },
                                ]}
                                onPress={() => setSelectedType(type)}
                            >
                                <Ionicons
                                    name={getTypeIcon(type) as any}
                                    size={18}
                                    color={selectedType === type ? '#FFF' : theme.colors.text}
                                />
                                <Text
                                    style={[
                                        styles.typeChipText,
                                        selectedType === type && styles.typeChipTextSelected,
                                    ]}
                                >
                                    @{type}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    {/* Username Input */}
                    <View style={styles.inputContainer}>
                        <TextInput
                            style={styles.input}
                            value={username}
                            onChangeText={setUsername}
                            placeholder="Enter username..."
                            placeholderTextColor={theme.colors.textSecondary}
                            autoCapitalize="none"
                        />
                        <TouchableOpacity
                            style={[styles.addButton, adding && styles.addButtonDisabled]}
                            onPress={addGuardian}
                            disabled={adding}
                        >
                            {adding ? (
                                <ActivityIndicator size="small" color="#FFF" />
                            ) : (
                                <Ionicons name="add" size={24} color="#FFF" />
                            )}
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Guardians List */}
                <View style={styles.listSection}>
                    <Text style={styles.sectionTitle}>
                        My Guardians ({guardians.length})
                    </Text>

                    {guardians.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <Ionicons name="people-outline" size={64} color={theme.colors.textSecondary} />
                            <Text style={styles.emptyText}>No guardians added yet</Text>
                            <Text style={styles.emptySubtext}>
                                Add trusted contacts to track you during emergencies
                            </Text>
                        </View>
                    ) : (
                        guardians.map((guardian) => (
                            <View key={guardian.id} style={styles.guardianCard}>
                                <View style={styles.guardianHeader}>
                                    <View
                                        style={[
                                            styles.guardianIcon,
                                            { backgroundColor: `${getTypeColor(guardian.type)}20` },
                                        ]}
                                    >
                                        <Ionicons
                                            name={getTypeIcon(guardian.type) as any}
                                            size={24}
                                            color={getTypeColor(guardian.type)}
                                        />
                                    </View>
                                    <View style={styles.guardianInfo}>
                                        <Text style={styles.guardianUsername}>@{guardian.username}</Text>
                                        <View
                                            style={[
                                                styles.typeBadge,
                                                { backgroundColor: getTypeColor(guardian.type) },
                                            ]}
                                        >
                                            <Text style={styles.typeBadgeText}>{guardian.type}</Text>
                                        </View>
                                    </View>
                                    <TouchableOpacity
                                        onPress={() => removeGuardian(guardian.id, guardian.username)}
                                        style={styles.removeButton}
                                    >
                                        <Ionicons name="trash-outline" size={20} color={theme.colors.error} />
                                    </TouchableOpacity>
                                </View>

                                <View style={styles.trackingRow}>
                                    <View style={styles.trackingInfo}>
                                        <Ionicons
                                            name="location"
                                            size={16}
                                            color={theme.colors.textSecondary}
                                        />
                                        <Text style={styles.trackingLabel}>Can track my location</Text>
                                    </View>
                                    <Switch
                                        value={guardian.can_track}
                                        onValueChange={() => toggleTracking(guardian.id, guardian.can_track)}
                                        trackColor={{ false: '#767577', true: theme.colors.primary }}
                                        thumbColor={guardian.can_track ? '#FFF' : '#f4f3f4'}
                                    />
                                </View>
                            </View>
                        ))
                    )}
                </View>
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
    content: {
        flex: 1,
    },
    infoCard: {
        flexDirection: 'row',
        backgroundColor: `${theme.colors.primary}15`,
        margin: theme.spacing.lg,
        padding: theme.spacing.md,
        borderRadius: theme.borderRadius.md,
        borderLeftWidth: 4,
        borderLeftColor: theme.colors.primary,
    },
    infoText: {
        flex: 1,
        marginLeft: theme.spacing.sm,
        fontSize: theme.fonts.size.small,
        color: theme.colors.text,
        lineHeight: 20,
    },
    addSection: {
        backgroundColor: theme.colors.surface,
        padding: theme.spacing.lg,
        marginBottom: theme.spacing.md,
    },
    sectionTitle: {
        fontSize: theme.fonts.size.large,
        fontWeight: theme.fonts.weight.bold,
        color: theme.colors.text,
        marginBottom: theme.spacing.md,
    },
    typeScroll: {
        marginBottom: theme.spacing.md,
    },
    typeChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.background,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
        borderRadius: theme.borderRadius.md,
        marginRight: theme.spacing.sm,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    typeChipText: {
        marginLeft: theme.spacing.xs,
        color: theme.colors.text,
        fontSize: theme.fonts.size.small,
        fontWeight: theme.fonts.weight.medium,
    },
    typeChipTextSelected: {
        color: '#FFF',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    input: {
        flex: 1,
        backgroundColor: theme.colors.background,
        borderRadius: theme.borderRadius.md,
        padding: theme.spacing.md,
        fontSize: theme.fonts.size.medium,
        color: theme.colors.text,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    addButton: {
        marginLeft: theme.spacing.sm,
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: theme.colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        ...theme.shadows.medium,
    },
    addButtonDisabled: {
        opacity: 0.6,
    },
    listSection: {
        padding: theme.spacing.lg,
    },
    emptyContainer: {
        alignItems: 'center',
        paddingVertical: theme.spacing.xxl * 2,
    },
    emptyText: {
        fontSize: theme.fonts.size.medium,
        fontWeight: theme.fonts.weight.bold,
        color: theme.colors.textSecondary,
        marginTop: theme.spacing.md,
    },
    emptySubtext: {
        fontSize: theme.fonts.size.small,
        color: theme.colors.textSecondary,
        marginTop: theme.spacing.sm,
        textAlign: 'center',
    },
    guardianCard: {
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.md,
        padding: theme.spacing.lg,
        marginBottom: theme.spacing.md,
        ...theme.shadows.small,
    },
    guardianHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: theme.spacing.md,
    },
    guardianIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: theme.spacing.md,
    },
    guardianInfo: {
        flex: 1,
    },
    guardianUsername: {
        fontSize: theme.fonts.size.medium,
        fontWeight: theme.fonts.weight.bold,
        color: theme.colors.text,
        marginBottom: theme.spacing.xs,
    },
    typeBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: 2,
        borderRadius: theme.borderRadius.sm,
    },
    typeBadgeText: {
        fontSize: theme.fonts.size.small,
        fontWeight: theme.fonts.weight.bold,
        color: '#FFF',
    },
    removeButton: {
        padding: theme.spacing.sm,
    },
    trackingRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: theme.spacing.md,
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
    },
    trackingInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    trackingLabel: {
        marginLeft: theme.spacing.sm,
        fontSize: theme.fonts.size.small,
        color: theme.colors.text,
    },
});
