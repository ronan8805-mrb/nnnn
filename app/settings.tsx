import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Switch,
    ScrollView,
    Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as FileSystem from 'expo-file-system';
import axios from 'axios';
import { theme } from '../styles/theme';
import { useLanguage } from './_layout';

import { API_URL } from '../utils/config';

export default function SettingsScreen() {
    const router = useRouter();
    const { language, setLanguage, t } = useLanguage();

    const [biometricEnabled, setBiometricEnabled] = useState(true);
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);
    const [locationSharing, setLocationSharing] = useState(true);
    const [silentPanic, setSilentPanic] = useState(true);
    const [fakeCallTrigger, setFakeCallTrigger] = useState(false);
    const [voiceDetection, setVoiceDetection] = useState(false);

    const toggleLanguage = () => {
        setLanguage(language === 'en' ? 'ga' : 'en');
    };

    const handleLogout = () => {
        Alert.alert(
            'Logout',
            'Are you sure you want to logout?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Logout',
                    style: 'destructive',
                    onPress: () => router.replace('/login')
                }
            ]
        );
    };

    const handleDataExport = async () => {
        try {
            const res = await axios.get(`${API_URL}/gdpr/export?user_id=1`);
            const fileUri = `${FileSystem.documentDirectory}SLAN_Data_Export.json`;
            await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(res.data));
            Alert.alert('✅ Data Exported', `Your data has been exported to:\n${fileUri}`);
        } catch (e) {
            Alert.alert('Error', 'Failed to export data');
        }
    };

    const handleAccountDeletion = () => {
        Alert.alert(
            '⚠️ Delete Account',
            'Under GDPR Right to Erasure, this will permanently delete your account and all associated data. This action CANNOT be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Confirm Deletion',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await axios.delete(`${API_URL}/gdpr/delete?user_id=1`);
                            Alert.alert('Deleted', 'Your account has been permanently deleted.');
                            router.replace('/login');
                        } catch (e) {
                            Alert.alert('Error', 'Failed to delete account');
                        }
                    }
                }
            ]
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Text style={styles.backButton}>← Back</Text>
                </TouchableOpacity>
                <Text style={styles.title}>Settings</Text>
            </View>

            <ScrollView style={styles.content}>
                {/* Account Section */}
                <Text style={styles.sectionHeader}>Account</Text>
                <View style={styles.section}>
                    <View style={styles.row}>
                        <Text style={styles.label}>Language (Gaelic/English)</Text>
                        <TouchableOpacity onPress={toggleLanguage} style={styles.langButton}>
                            <Text style={styles.langButtonText}>{language === 'en' ? 'English' : 'Gaeilge'}</Text>
                        </TouchableOpacity>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.row}>
                        <Text style={styles.label}>Biometric Login</Text>
                        <Switch
                            value={biometricEnabled}
                            onValueChange={setBiometricEnabled}
                            trackColor={{ false: theme.colors.border, true: theme.colors.accent }}
                            thumbColor={biometricEnabled ? theme.colors.text : theme.colors.textSecondary}
                        />
                    </View>
                </View>

                {/* Safety Features Section */}
                <Text style={styles.sectionHeader}>Safety Features (Premium)</Text>
                <View style={styles.section}>
                    <View style={styles.row}>
                        <Text style={styles.label}>Silent Panic Trigger</Text>
                        <Switch
                            value={silentPanic}
                            onValueChange={setSilentPanic}
                            trackColor={{ false: theme.colors.border, true: theme.colors.accent }}
                            thumbColor={silentPanic ? theme.colors.text : theme.colors.textSecondary}
                        />
                    </View>
                    <Text style={styles.description}>Hold Volume Down + Power for 3s to trigger SOS silently.</Text>

                    <View style={styles.divider} />

                    <View style={styles.row}>
                        <Text style={styles.label}>Fake Call Escape</Text>
                        <Switch
                            value={fakeCallTrigger}
                            onValueChange={setFakeCallTrigger}
                            trackColor={{ false: theme.colors.border, true: theme.colors.accent }}
                            thumbColor={fakeCallTrigger ? theme.colors.text : theme.colors.textSecondary}
                        />
                    </View>
                    <Text style={styles.description}>Press Power 5 times to trigger a fake incoming call.</Text>

                    <View style={styles.divider} />

                    <View style={styles.row}>
                        <Text style={styles.label}>AI Voice Distress Detection</Text>
                        <Switch
                            value={voiceDetection}
                            onValueChange={setVoiceDetection}
                            trackColor={{ false: theme.colors.border, true: theme.colors.accent }}
                            thumbColor={voiceDetection ? theme.colors.text : theme.colors.textSecondary}
                        />
                    </View>
                    <Text style={styles.description}>Microphone monitors for distress phrases like "Help me".</Text>
                </View>

                {/* Privacy Section */}
                <Text style={styles.sectionHeader}>Privacy</Text>
                <View style={styles.section}>
                    <View style={styles.row}>
                        <Text style={styles.label}>Share Location with Guardians</Text>
                        <Switch
                            value={locationSharing}
                            onValueChange={setLocationSharing}
                            trackColor={{ false: theme.colors.border, true: theme.colors.accent }}
                            thumbColor={locationSharing ? theme.colors.text : theme.colors.textSecondary}
                        />
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.row}>
                        <Text style={styles.label}>Export My Data (GDPR)</Text>
                        <TouchableOpacity style={styles.actionButton} onPress={handleDataExport}>
                            <Text style={styles.actionButtonText}>EXPORT</Text>
                        </TouchableOpacity>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.row}>
                        <Text style={[styles.label, { color: '#ef4444' }]}>Delete Account (GDPR)</Text>
                        <TouchableOpacity style={[styles.actionButton, { backgroundColor: 'rgba(239, 68, 68, 0.2)' }]} onPress={handleAccountDeletion}>
                            <Text style={[styles.actionButtonText, { color: '#ef4444' }]}>ERASE</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                    <Text style={styles.logoutText}>Log Out</Text>
                </TouchableOpacity>

                <Text style={styles.version}>SLÁN v1.0.0 - Ireland's Safety Guardian</Text>
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
        padding: theme.spacing.lg,
        paddingTop: theme.spacing.xxl,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
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
    content: {
        padding: theme.spacing.lg,
    },
    sectionHeader: {
        color: theme.colors.textSecondary,
        fontSize: theme.fonts.size.small,
        fontWeight: 'bold',
        marginBottom: theme.spacing.sm,
        marginTop: theme.spacing.md,
        textTransform: 'uppercase',
    },
    section: {
        backgroundColor: theme.colors.border,
        borderRadius: theme.borderRadius.md,
        padding: theme.spacing.md,
        marginBottom: theme.spacing.md,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: theme.spacing.sm,
    },
    label: {
        color: theme.colors.text,
        fontSize: theme.fonts.size.medium,
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.1)',
        marginVertical: theme.spacing.xs,
    },
    description: {
        color: theme.colors.textSecondary,
        fontSize: 12,
        marginBottom: theme.spacing.sm,
    },
    langButton: {
        backgroundColor: theme.colors.accent,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 4,
    },
    langButtonText: {
        color: theme.colors.text,
        fontWeight: 'bold',
        fontSize: 12,
    },
    logoutButton: {
        marginTop: theme.spacing.xl,
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: '#ef4444',
        padding: theme.spacing.md,
        borderRadius: theme.borderRadius.md,
        alignItems: 'center',
    },
    logoutText: {
        color: '#ef4444',
        fontWeight: 'bold',
        fontSize: theme.fonts.size.medium,
    },
    version: {
        textAlign: 'center',
        color: theme.colors.textSecondary,
        fontSize: 12,
        marginTop: theme.spacing.xl,
        marginBottom: theme.spacing.xl,
    },
    actionButton: {
        backgroundColor: theme.colors.border,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
    },
    actionButtonText: {
        color: theme.colors.text,
        fontSize: 12,
        fontWeight: 'bold',
    },
});
