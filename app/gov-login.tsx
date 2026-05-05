import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    Alert,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as LocalAuthentication from 'expo-local-authentication';
import { theme } from '../styles/theme';
import JarvisWrapper from '../components/JarvisWrapper';

export default function GovLoginScreen() {
    const router = useRouter();

    const [deptId, setDeptId] = useState('');
    const [accessKey, setAccessKey] = useState('');
    const [securityCode, setSecurityCode] = useState('');

    const handleLogin = async () => {
        if (!deptId || !accessKey) {
            Alert.alert('Restricted Access', 'Government ID and Access Password required.');
            return;
        }

        try {
            // Allow super admin test credentials "1234" / "1234"
            if (deptId === '1234' && accessKey === '1234') {
                router.replace('/gov-dashboard');
                return;
            }

            // For now, simulate success with specific "Gov" credentials
            if (deptId === 'GOV-HQ' && accessKey === 'SLAN-2026') {
                const hasHardware = await LocalAuthentication.hasHardwareAsync();
                if (hasHardware) {
                    const result = await LocalAuthentication.authenticateAsync({
                        promptMessage: 'National Command Authorization Required',
                    });
                    if (!result.success) {
                        Alert.alert('Authorization Failed', 'Biometric check failed.');
                        return;
                    }
                }

                router.replace('/gov-dashboard');
            } else {
                Alert.alert('Unauthorized', 'Invalid credentials for National Command Layer.');
            }
        } catch (error) {
            console.error('Login error:', error);
            Alert.alert('System Error', 'Authentication pipeline failure.');
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
                        <View style={styles.crestOuter}>
                            <View style={styles.crestInner}>
                                <Text style={styles.crestText}>☘️</Text>
                            </View>
                        </View>
                        <Text style={styles.title}>National Command</Text>
                        <Text style={styles.subtitle}>National Operations Node</Text>
                    </View>

                    <View style={styles.form}>
                        <Text style={styles.label}>Government ID</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Ex: GOV-HQ"
                            placeholderTextColor="rgba(255, 255, 255, 0.3)"
                            value={deptId}
                            onChangeText={setDeptId}
                            autoCapitalize="characters"
                        />

                        <Text style={styles.label}>Access Password</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="••••••••••••"
                            placeholderTextColor="rgba(255, 255, 255, 0.3)"
                            value={accessKey}
                            onChangeText={setAccessKey}
                            secureTextEntry
                        />

                        <Text style={styles.label}>Hardware Security Code (Optional)</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="OTP from Hardware Token"
                            placeholderTextColor="rgba(255, 255, 255, 0.3)"
                            value={securityCode}
                            onChangeText={setSecurityCode}
                        />

                        <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
                            <Text style={styles.loginButtonText}>Login</Text>
                        </TouchableOpacity>

                        <View style={styles.warningContainer}>
                            <Text style={styles.warningText}>
                                WARNING: This is a restricted government system. Unauthorized access attempts are monitored and recorded by the National Cyber Security Centre.
                            </Text>
                        </View>
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
        paddingTop: 60,
    },
    backButton: {
        color: '#94a3b8',
        fontSize: 14,
        fontWeight: 'bold',
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
        marginBottom: 40,
    },
    crestOuter: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#0f172a',
        borderWidth: 2,
        borderColor: '#fbbf24',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        shadowColor: '#fbbf24',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 15,
        elevation: 10,
    },
    crestInner: {
        width: 90,
        height: 90,
        borderRadius: 45,
        borderWidth: 1,
        borderColor: '#fbbf24',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(251, 191, 36, 0.05)',
    },
    crestText: {
        fontSize: 40,
    },
    title: {
        fontSize: 28,
        fontWeight: '900',
        color: '#fff',
        letterSpacing: 2,
        textTransform: 'uppercase',
    },
    subtitle: {
        fontSize: 14,
        color: '#fbbf24',
        fontWeight: '600',
        marginTop: 5,
        letterSpacing: 1,
    },
    form: {
        width: '100%',
    },
    label: {
        color: '#fbbf24',
        fontSize: 12,
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    input: {
        backgroundColor: 'rgba(251, 191, 36, 0.05)',
        borderRadius: 4,
        padding: 16,
        color: '#fbbf24',
        fontSize: 16,
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
        marginBottom: 20,
        borderWidth: 1,
        borderColor: 'rgba(251, 191, 36, 0.3)',
    },
    loginButton: {
        backgroundColor: 'rgba(251, 191, 36, 0.1)',
        borderRadius: 4,
        padding: 18,
        alignItems: 'center',
        marginTop: 10,
        borderWidth: 1,
        borderColor: '#fbbf24',
    },
    loginButtonText: {
        color: '#fbbf24',
        fontSize: 16,
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: 2,
    },
    warningContainer: {
        marginTop: 30,
        padding: 15,
        borderRadius: 8,
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.2)',
    },
    warningText: {
        color: '#ef4444',
        fontSize: 10,
        textAlign: 'center',
        lineHeight: 14,
        fontWeight: '600',
    },
});
