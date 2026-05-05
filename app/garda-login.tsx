import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    Alert,
    Image,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as LocalAuthentication from 'expo-local-authentication';
import axios from 'axios';
import { useLanguage } from './_layout';
import JarvisWrapper from '../components/JarvisWrapper';
import { theme } from '../styles/theme';

import { API_URL } from '../utils/config';

export default function GardaLoginScreen() {
    const router = useRouter();
    const { t } = useLanguage();

    const [gardaId, setGardaId] = useState('');
    const [password, setPassword] = useState('');
    const [stationId, setStationId] = useState('');

    const handleLogin = async () => {
        if (!gardaId || !password) {
            Alert.alert('Error', 'Please enter Garda ID and Password');
            return;
        }

        try {
            // Authenticate with backend
            // Allow super admin test credentials "1234" / "1234"
            if (gardaId === '1234' && password === '1234') {
                router.replace('/garda-dashboard');
                return;
            }

            // For now, simulate success
            if (gardaId === 'G12345' && password === 'password') {
                // Biometric check for Garda
                const hasHardware = await LocalAuthentication.hasHardwareAsync();
                if (hasHardware) {
                    const result = await LocalAuthentication.authenticateAsync({
                        promptMessage: 'Official Garda Authorization Required',
                    });
                    if (!result.success) {
                        Alert.alert('Error', 'Biometric authorization failed');
                        return;
                    }
                }

                router.replace('/garda-dashboard');
            } else {
                Alert.alert('Error', 'Invalid credentials');
            }
        } catch (error) {
            console.error('Login error:', error);
            Alert.alert('Error', 'Login failed');
        }
    };

    return (
        <JarvisWrapper showRings={true}>
            <KeyboardAvoidingView
                style={styles.container}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()}>
                        <Text style={styles.backButton}>← Back</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.content}>
                    <View style={styles.logoContainer}>
                        <View style={styles.badgeOuter}>
                            <View style={styles.badgeInner}>
                                <Text style={styles.badgeText}>GARDA</Text>
                            </View>
                        </View>
                        <Text style={styles.title}>Garda Access</Text>
                        <Text style={styles.subtitle}>An Garda Síochána</Text>
                    </View>

                    <View style={styles.form}>
                        <Text style={styles.label}>Garda ID</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Ex: G12345"
                            placeholderTextColor="rgba(255, 255, 255, 0.5)"
                            value={gardaId}
                            onChangeText={setGardaId}
                            autoCapitalize="characters"
                        />

                        <Text style={styles.label}>Password</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="••••••••"
                            placeholderTextColor="rgba(255, 255, 255, 0.5)"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                        />

                        <Text style={styles.label}>Station Code (Optional)</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Ex: D01"
                            placeholderTextColor="rgba(255, 255, 255, 0.5)"
                            value={stationId}
                            onChangeText={setStationId}
                        />

                        <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
                            <Text style={styles.loginButtonText}>Login</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
        </JarvisWrapper>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'transparent',
    },
    header: {
        padding: theme.spacing.lg,
        paddingTop: theme.spacing.xxl,
    },
    backButton: {
        color: theme.colors.textLight, // White text
        fontSize: theme.fonts.size.medium,
        fontWeight: theme.fonts.weight.bold,
    },
    scrollContent: {
        flexGrow: 1,
    },
    content: {
        flex: 1,
        padding: theme.spacing.xl,
        justifyContent: 'center',
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: theme.spacing.xxl,
    },
    badgeOuter: {
        width: 100,
        height: 120,
        backgroundColor: 'rgba(0, 243, 255, 0.05)',
        borderRadius: 10,
        borderWidth: 2,
        borderColor: '#00f3ff', // Cyan border
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        shadowColor: '#00f3ff',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 15,
        elevation: 10,
    },
    badgeInner: {
        width: 80,
        height: 100,
        borderWidth: 1,
        borderColor: '#00f3ff',
        justifyContent: 'center',
        alignItems: 'center',
    },
    badgeText: {
        color: '#00f3ff',
        fontWeight: '900',
        fontSize: 16,
        letterSpacing: 2,
    },
    title: {
        fontSize: 28,
        fontWeight: '900',
        color: '#fff',
        marginBottom: 4,
        textTransform: 'uppercase',
        letterSpacing: 2,
    },
    subtitle: {
        fontSize: 14,
        color: '#00f3ff', // Cyan text
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    form: {
        width: '100%',
    },
    label: {
        color: '#00f3ff',
        fontSize: 12,
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    input: {
        backgroundColor: 'rgba(0, 243, 255, 0.05)',
        borderRadius: 4,
        padding: 16,
        color: '#00f3ff',
        fontSize: 16,
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
        marginBottom: 20,
        borderWidth: 1,
        borderColor: 'rgba(0, 243, 255, 0.3)',
    },
    loginButton: {
        backgroundColor: 'rgba(0, 243, 255, 0.1)',
        borderRadius: 4,
        padding: 18,
        alignItems: 'center',
        marginTop: 10,
        borderWidth: 1,
        borderColor: '#00f3ff',
    },
    loginButtonText: {
        color: '#00f3ff',
        fontSize: 16,
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: 2,
    },
});
