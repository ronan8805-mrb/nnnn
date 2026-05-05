import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ScrollView,
    Alert,
    Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import axios from 'axios';
import { theme } from '../styles/theme';
import { useLanguage } from './_layout';

import { API_URL } from '../utils/config';

export default function MedicalProfileScreen() {
    const router = useRouter();
    const { t } = useLanguage();

    const [bloodType, setBloodType] = useState('');
    const [allergies, setAllergies] = useState('');
    const [conditions, setConditions] = useState('');
    const [medications, setMedications] = useState('');
    const [emergencyContactName, setEmergencyContactName] = useState('');
    const [emergencyContactPhone, setEmergencyContactPhone] = useState('');
    const [shareAutomatically, setShareAutomatically] = useState(true);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            // Simulate fetching user ID 1
            const response = await axios.get(`${API_URL}/medical-profile/1`);
            if (response.data) {
                const data = response.data;
                setBloodType(data.blood_type || '');
                setAllergies(data.allergies || '');
                setConditions(data.conditions || '');
                setMedications(data.medications || '');
                setEmergencyContactName(data.emergency_contact_name || '');
                setEmergencyContactPhone(data.emergency_contact_phone || '');
            }
        } catch (error) {
            console.log('No existing profile or error fetching');
        }
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            await axios.post(`${API_URL}/medical-profile`, {
                user_id: 1,
                blood_type: bloodType,
                allergies: allergies,
                conditions: conditions,
                medications: medications,
                emergency_contact_name: emergencyContactName,
                emergency_contact_phone: emergencyContactPhone,
            });
            Alert.alert('Success', 'Medical profile saved successfully');
        } catch (error) {
            console.error('Error saving profile:', error);
            Alert.alert('Error', 'Failed to save profile');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Text style={styles.backButton}>← Back</Text>
                </TouchableOpacity>
                <Text style={styles.title}>{t.medicalProfile}</Text>
            </View>

            <ScrollView style={styles.content}>
                <View style={styles.infoBox}>
                    <Text style={styles.infoText}>
                        This information will be automatically shared with emergency services (Ambulance/Gardaí) when you activate SOS.
                    </Text>
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Blood Type</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="e.g. O+"
                        placeholderTextColor={theme.colors.textSecondary}
                        value={bloodType}
                        onChangeText={setBloodType}
                    />
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Allergies</Text>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        placeholder="List any allergies (e.g. Penicillin, Peanuts)"
                        placeholderTextColor={theme.colors.textSecondary}
                        value={allergies}
                        onChangeText={setAllergies}
                        multiline
                        numberOfLines={3}
                    />
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Medical Conditions</Text>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        placeholder="List chronic conditions (e.g. Diabetes, Asthma)"
                        placeholderTextColor={theme.colors.textSecondary}
                        value={conditions}
                        onChangeText={setConditions}
                        multiline
                        numberOfLines={3}
                    />
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Current Medications</Text>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        placeholder="List current medications"
                        placeholderTextColor={theme.colors.textSecondary}
                        value={medications}
                        onChangeText={setMedications}
                        multiline
                        numberOfLines={3}
                    />
                </View>

                <Text style={styles.sectionHeader}>Emergency Contact</Text>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Name</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Contact Name"
                        placeholderTextColor={theme.colors.textSecondary}
                        value={emergencyContactName}
                        onChangeText={setEmergencyContactName}
                    />
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Phone Number</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Contact Phone"
                        placeholderTextColor={theme.colors.textSecondary}
                        value={emergencyContactPhone}
                        onChangeText={setEmergencyContactPhone}
                        keyboardType="phone-pad"
                    />
                </View>

                <View style={styles.switchContainer}>
                    <Text style={styles.switchLabel}>Share automatically during SOS</Text>
                    <Switch
                        value={shareAutomatically}
                        onValueChange={setShareAutomatically}
                        trackColor={{ false: theme.colors.border, true: theme.colors.accent }}
                        thumbColor={shareAutomatically ? theme.colors.text : theme.colors.textSecondary}
                    />
                </View>

                <TouchableOpacity
                    style={[styles.saveButton, loading && styles.disabledButton]}
                    onPress={handleSave}
                    disabled={loading}
                >
                    <Text style={styles.saveButtonText}>{loading ? 'Saving...' : 'Save Profile'}</Text>
                </TouchableOpacity>

                <View style={styles.spacer} />
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
    infoBox: {
        backgroundColor: 'rgba(0, 166, 80, 0.1)',
        padding: theme.spacing.md,
        borderRadius: theme.borderRadius.md,
        marginBottom: theme.spacing.lg,
        borderLeftWidth: 4,
        borderLeftColor: theme.colors.accent,
    },
    infoText: {
        color: theme.colors.text,
        fontSize: theme.fonts.size.small,
        lineHeight: 20,
    },
    sectionHeader: {
        fontSize: theme.fonts.size.large,
        fontWeight: theme.fonts.weight.bold,
        color: theme.colors.text,
        marginTop: theme.spacing.md,
        marginBottom: theme.spacing.md,
    },
    formGroup: {
        marginBottom: theme.spacing.md,
    },
    label: {
        color: theme.colors.textSecondary,
        fontSize: theme.fonts.size.small,
        marginBottom: theme.spacing.xs,
        fontWeight: theme.fonts.weight.medium,
    },
    input: {
        backgroundColor: theme.colors.border,
        borderRadius: theme.borderRadius.md,
        padding: theme.spacing.md,
        color: theme.colors.text,
        fontSize: theme.fonts.size.medium,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    textArea: {
        height: 80,
        textAlignVertical: 'top',
    },
    switchContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: theme.spacing.md,
        marginBottom: theme.spacing.xl,
    },
    switchLabel: {
        color: theme.colors.text,
        fontSize: theme.fonts.size.medium,
    },
    saveButton: {
        backgroundColor: theme.colors.accent,
        borderRadius: theme.borderRadius.md,
        padding: theme.spacing.md,
        alignItems: 'center',
        ...theme.shadows.medium,
    },
    disabledButton: {
        opacity: 0.7,
    },
    saveButtonText: {
        color: theme.colors.text,
        fontSize: theme.fonts.size.medium,
        fontWeight: theme.fonts.weight.bold,
    },
    spacer: {
        height: 40,
    },
});
