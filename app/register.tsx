import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    Switch,
    ScrollView,
    Alert,
    Animated,
    Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as LocalAuthentication from 'expo-local-authentication';
import { BlurView } from 'expo-blur';
import axios from 'axios';
import { theme } from '../styles/theme';
import { useLanguage } from './_layout';
import JarvisWrapper from '../components/JarvisWrapper';

import { API_URL } from '../utils/config';

export default function RegisterScreen() {
    const router = useRouter();
    const { language, t } = useLanguage();

    const [name, setName] = useState('');
    const [passport, setPassport] = useState('');
    const [childMode, setChildMode] = useState(false);
    const [loading, setLoading] = useState(false);

    React.useEffect(() => {
        // Background animation handled by JarvisWrapper
    }, []);



    const handleRegister = async () => {
        if (!name || !passport) {
            Alert.alert('Details Required', 'Please provide your name and Passport Number.');
            return;
        }

        setLoading(true);

        try {
            const response = await axios.post(`${API_URL}/register`, {
                name,
                passport: passport || null,
                biometric: null,
                is_child: childMode,
                parent_id: null,
            });

            if (response.data.user_id) {
                Alert.alert('Fáilte!', 'Welcome to the SLÁN network.', [
                    { text: 'Enter', onPress: () => router.replace('/home') },
                ]);
            }
        } catch (error) {
            Alert.alert('Connection Error', 'We couldn\'t connect to the Garda network. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <JarvisWrapper showRings={true}>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <BlurView intensity={Platform.OS === 'web' ? 20 : 80} tint="dark" style={styles.glassCard}>
                    <Text style={styles.title}>{t.createAccount}</Text>
                    <Text style={styles.subtitle}>{t.registerSubtitle}</Text>

                    <View style={styles.form}>
                        <Text style={styles.inputLabel}>{t.fullName}</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g. Seán Ó Riain"
                            placeholderTextColor="rgba(255,255,255,0.4)"
                            value={name}
                            onChangeText={setName}
                        />

                        <Text style={styles.inputLabel}>Passport Number</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Primary ID (e.g. Passport)"
                            placeholderTextColor="rgba(255,255,255,0.4)"
                            value={passport}
                            onChangeText={setPassport}
                        />

                        <View style={styles.switchRow}>
                            <View>
                                <Text style={styles.switchTitle}>{t.parentDependentMode}</Text>
                                <Text style={styles.switchSub}>Under 16 years of age</Text>
                            </View>
                            <Switch
                                value={childMode}
                                onValueChange={setChildMode}
                                trackColor={{ false: '#374151', true: theme.colors.primary }}
                                thumbColor={childMode ? 'white' : '#9CA3AF'}
                            />
                        </View>

                        <TouchableOpacity
                            style={styles.button}
                            onPress={handleRegister}
                            disabled={loading}
                        >
                            <Text style={styles.buttonText}>{loading ? 'Connecting...' : t.register}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity onPress={() => router.back()} style={styles.backLink}>
                            <Text style={styles.backText}>← Cancel and return to menu</Text>
                        </TouchableOpacity>
                    </View>
                </BlurView>
            </ScrollView>
        </JarvisWrapper>
    );
}

const styles = StyleSheet.create({
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: theme.spacing.xl,
        paddingTop: Platform.OS === 'web' ? 40 : 80,
        paddingBottom: 40,
    },
    glassCard: {
        padding: theme.spacing.xxl,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(0, 243, 255, 0.3)',
        backgroundColor: 'rgba(2, 6, 23, 0.6)',
        width: '100%',
        maxWidth: 480,
    },
    title: {
        fontSize: 28,
        fontWeight: '900',
        color: '#fff',
        textAlign: 'center',
        marginBottom: theme.spacing.sm,
        letterSpacing: 2,
        textTransform: 'uppercase',
    },
    subtitle: {
        fontSize: 12,
        color: '#00f3ff',
        textAlign: 'center',
        marginBottom: theme.spacing.xl,
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    },
    form: {
        gap: theme.spacing.md,
    },
    inputLabel: {
        fontSize: 12,
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
        color: '#00f3ff',
        marginBottom: -4,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    input: {
        backgroundColor: 'rgba(0, 243, 255, 0.05)',
        borderRadius: 4,
        padding: theme.spacing.lg,
        color: '#fff',
        fontSize: 16,
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
        borderWidth: 1,
        borderColor: 'rgba(0, 243, 255, 0.3)',
    },
    orText: {
        textAlign: 'center',
        color: '#00f3ff',
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
        fontSize: 10,
        letterSpacing: 2,
        marginVertical: 4,
    },
    switchRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 243, 255, 0.05)',
        padding: theme.spacing.lg,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: 'rgba(0, 243, 255, 0.3)',
        marginTop: 4,
    },
    switchTitle: {
        fontSize: 12,
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
        color: '#00f3ff',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    switchSub: {
        fontSize: 10,
        color: 'rgba(0, 243, 255, 0.5)',
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
        marginTop: 2,
    },
    button: {
        backgroundColor: 'rgba(0, 243, 255, 0.1)',
        padding: theme.spacing.lg,
        borderRadius: 4,
        alignItems: 'center',
        marginTop: theme.spacing.lg,
        borderWidth: 1,
        borderColor: '#00f3ff',
    },
    buttonText: {
        color: '#00f3ff',
        fontWeight: '900',
        fontSize: 16,
        textTransform: 'uppercase',
        letterSpacing: 2,
    },
    backLink: {
        marginTop: theme.spacing.xl,
        alignItems: 'center',
    },
    backText: {
        color: theme.colors.textSecondary,
        fontSize: 14,
        fontWeight: 'bold',
    },
});
