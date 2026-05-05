import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    Alert,
    Animated,
    Platform,
    ScrollView,
    useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as LocalAuthentication from 'expo-local-authentication';
import { BlurView } from 'expo-blur';
import { theme } from '../styles/theme';
import { useLanguage } from './_layout';
import JarvisWrapper from '../components/JarvisWrapper';

export default function LoginFormScreen() {
    const router = useRouter();
    const { t } = useLanguage();

    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    React.useEffect(() => {
        // ... (removed local pulseAnim since JarvisWrapper handles bg animation)
    }, []);



    const handleNameLogin = () => {
        if (!name) {
            Alert.alert('Name Required', 'Please enter your name to login.');
            return;
        }
        router.replace('/home');
    };

    const { width } = useWindowDimensions();
    const isMobile = width < 480;

    return (
        <JarvisWrapper showRings={true} showTelemetry={false}>
            <ScrollView 
                style={styles.container}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.overlay}>
                    <BlurView intensity={Platform.OS === 'web' ? 20 : 80} tint="dark" style={[styles.glassCard, isMobile && { padding: 20 }]}>
                        <Text style={[styles.title, isMobile && { fontSize: 22 }]}>{t.login}</Text>
                        <Text style={[styles.subtitle, isMobile && { marginBottom: 15 }]}>{t.loginSubtitle}</Text>

                        <View style={styles.form}>


                            <Text style={styles.inputLabel}>{t.username}</Text>
                            <TextInput
                                style={[styles.input, isMobile && { padding: 12, fontSize: 14 }]}
                                placeholder={t.username}
                                placeholderTextColor="rgba(255,255,255,0.4)"
                                value={name}
                                onChangeText={setName}
                                autoCapitalize="none"
                            />

                            <Text style={[styles.inputLabel, { marginTop: 4 }]}>{t.password}</Text>
                            <TextInput
                                style={[styles.input, isMobile && { padding: 12, fontSize: 14 }]}
                                placeholder={t.password}
                                placeholderTextColor="rgba(255,255,255,0.4)"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry
                            />

                            <TouchableOpacity
                                style={[styles.loginButton, isMobile && { padding: 12 }]}
                                onPress={handleNameLogin}
                            >
                                <Text style={[styles.loginButtonText, isMobile && { fontSize: 14 }]}>{t.login}</Text>
                            </TouchableOpacity>

                            <TouchableOpacity onPress={() => router.back()} style={styles.backLink}>
                                <Text style={styles.backText}>← Cancel and return</Text>
                            </TouchableOpacity>
                        </View>
                    </BlurView>
                </View>
            </ScrollView>
        </JarvisWrapper>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
    },
    overlay: {
        padding: theme.spacing.lg,
        alignItems: 'center',
    },
    glassCard: {
        padding: theme.spacing.xxl,
        borderRadius: 12,
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
    biometricButton: {
        flexDirection: 'row',
        backgroundColor: 'rgba(251, 191, 36, 0.1)',
        padding: theme.spacing.md,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#fbbf24',
    },
    biometricIcon: {
        fontSize: 24,
        marginRight: theme.spacing.sm,
    },
    biometricText: {
        color: '#fbbf24',
        fontWeight: '900',
        fontSize: 16,
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    dividerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: theme.spacing.lg,
    },
    divider: {
        flex: 1,
        height: 1,
        backgroundColor: 'rgba(0, 243, 255, 0.2)',
    },
    dividerText: {
        marginHorizontal: theme.spacing.md,
        color: '#00f3ff',
        fontSize: 10,
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
        letterSpacing: 2,
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
    loginButton: {
        backgroundColor: 'rgba(0, 243, 255, 0.1)',
        padding: theme.spacing.lg,
        borderRadius: 4,
        alignItems: 'center',
        marginTop: theme.spacing.sm,
        borderWidth: 1,
        borderColor: '#00f3ff',
    },
    loginButtonText: {
        color: '#00f3ff',
        fontWeight: '900',
        fontSize: 16,
        textTransform: 'uppercase',
        letterSpacing: 2,
    },
    backLink: {
        marginTop: theme.spacing.xl,
        alignItems: 'center',
        paddingVertical: theme.spacing.sm,
    },
    backText: {
        color: theme.colors.textSecondary,
        fontSize: 14,
        fontWeight: 'bold',
    },
});
