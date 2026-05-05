import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Animated,
    Platform,
    Image,
    FlatList,
    ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { BlurView } from 'expo-blur';
import { useLanguage } from './_layout';
import { Language } from '../styles/theme';
import { Ionicons } from '@expo/vector-icons';
import JarvisWrapper from '../components/JarvisWrapper';
import LanguageSelector from '../components/LanguageSelector';

export default function AuthSelectionScreen() {
    const router = useRouter();
    const { language, setLanguage, t } = useLanguage();
    const [showLangMenu, setShowLangMenu] = React.useState(false);
    
    // Animation for the logo glow
    const pulseAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 1, duration: 2000, useNativeDriver: Platform.OS !== 'web' }),
                Animated.timing(pulseAnim, { toValue: 0, duration: 2000, useNativeDriver: Platform.OS !== 'web' }),
            ])
        ).start();
    }, []);
    
    return (
        <JarvisWrapper showRings={true} showTelemetry={false}>
            <ScrollView 
                style={styles.container}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.overlay}>
                    {/* Header (Language Selector on the Right) */}
                    <View style={styles.header}>
                        <View style={{ flex: 1 }} />
                        <TouchableOpacity style={styles.langButton} onPress={() => setShowLangMenu(true)}>
                            <Text style={styles.langText}>[ {language.toUpperCase()} ]</Text>
                            <Ionicons name="globe-outline" size={14} color="#00f3ff" style={{ marginLeft: 6 }} />
                        </TouchableOpacity>
                    </View>

                    {/* Main Content */}
                    <View style={styles.mainContent}>
                        
                        {/* The Shield/Harp Logo Container */}
                        <View style={styles.logoWrapper}>
                            <Animated.View style={[styles.logoGlow, { 
                                opacity: pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }) 
                            }]} />
                            <Image 
                                source={require('../assets/harp_logo.png')} 
                                style={styles.harpLogo}
                                resizeMode="contain"
                            />
                        </View>

                        <Text style={styles.welcomeTitle}>{t.platformTitle}</Text>
                        <Text style={styles.welcomeSubtitle}>{t.welcomeSubtitle}</Text>

                        <BlurView intensity={Platform.OS === 'web' ? 40 : 80} tint="dark" style={styles.selectionCard}>
                            
                            <View style={styles.buttonGroup}>
                                <TouchableOpacity 
                                    style={[styles.authButton, styles.registerBtn]}
                                    onPress={() => router.push('/register')}
                                    activeOpacity={0.8}
                                >
                                    <View style={styles.btnIconContainer}>
                                        <Ionicons name="finger-print" size={24} color="#00f3ff" />
                                    </View>
                                    <View style={styles.btnTextContainer}>
                                        <Text style={styles.btnTitle}>{t.register}</Text>
                                        <Text style={styles.btnSub}>Create a new account</Text>
                                    </View>
                                    <Ionicons name="chevron-forward" size={20} color="#00f3ff" />
                                </TouchableOpacity>

                                <TouchableOpacity 
                                    style={[styles.authButton, styles.loginBtn]}
                                    onPress={() => router.push('/login-form')}
                                    activeOpacity={0.8}
                                >
                                    <View style={styles.btnIconContainerNavy}>
                                        <Ionicons name="scan" size={24} color="#fbbf24" />
                                    </View>
                                    <View style={styles.btnTextContainer}>
                                        <Text style={styles.btnTitleLogin}>{t.login}</Text>
                                        <Text style={styles.btnSub}>Access your account</Text>
                                    </View>
                                    <Ionicons name="chevron-forward" size={20} color="#fbbf24" />
                                </TouchableOpacity>
                            </View>

                            <View style={styles.divider}>
                                <View style={styles.dividerLine} />
                                <Text style={styles.dividerText}>{t.officialLogin}</Text>
                                <View style={styles.dividerLine} />
                            </View>

                            <TouchableOpacity style={styles.gardaLink} onPress={() => router.push('/garda-login')} activeOpacity={0.6}>
                                <Ionicons name="shield" size={16} color="#94a3b8" style={{ marginRight: 8 }} />
                                <Text style={styles.gardaText}>{t.gardaLogin}</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={[styles.gardaLink, { marginTop: 10 }]} onPress={() => router.push('/gov-login')} activeOpacity={0.6}>
                                <Ionicons name="globe-outline" size={16} color="#fbbf24" style={{ marginRight: 8 }} />
                                <Text style={[styles.gardaText, { color: '#fbbf24' }]}>{t.govLogin}</Text>
                            </TouchableOpacity>
                        </BlurView>
                    </View>
                    <View style={{ height: 60 }} />
                </View>
            </ScrollView>

            <LanguageSelector visible={showLangMenu} onClose={() => setShowLangMenu(false)} />
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
        padding: 20,
        paddingTop: Platform.OS === 'web' ? 40 : 60,
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        width: '100%',
        maxWidth: 1200,
        alignSelf: 'center',
    },
    langButton: {
        padding: 10,
        backgroundColor: 'rgba(0, 243, 255, 0.1)',
        borderWidth: 1,
        borderColor: '#00f3ff',
        borderRadius: 4,
        flexDirection: 'row',
        alignItems: 'center',
    },
    langText: {
        color: '#00f3ff',
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
        fontSize: 14,
        fontWeight: 'bold',
    },
    
    mainContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    
    logoWrapper: {
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 30,
        position: 'relative',
    },
    logoGlow: {
        position: 'absolute',
        width: 160,
        height: 160,
        borderRadius: 80,
        backgroundColor: 'rgba(0, 243, 255, 0.2)',
        shadowColor: '#00f3ff',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 40,
    },
    harpLogo: {
        width: 220,
        height: 220,
        marginBottom: 10,
    },
    
    welcomeTitle: {
        fontSize: 24,
        fontWeight: '900',
        color: '#fff',
        letterSpacing: 4,
        textAlign: 'center',
        textShadowColor: '#00f3ff',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 10,
    },
    welcomeSubtitle: {
        fontSize: 12,
        color: '#00f3ff',
        marginBottom: 40,
        letterSpacing: 2,
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    },
    
    selectionCard: {
        padding: 30,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(0, 243, 255, 0.3)',
        backgroundColor: 'rgba(2, 6, 23, 0.6)',
        width: '100%',
        maxWidth: 480,
    },
    buttonGroup: {
        gap: 16,
        marginBottom: 24,
    },
    authButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 8,
        borderWidth: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    registerBtn: {
        borderColor: '#00f3ff',
        shadowColor: '#00f3ff',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
    },
    loginBtn: {
        borderColor: '#fbbf24',
        shadowColor: '#fbbf24',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
    },
    btnIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0, 243, 255, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
        borderWidth: 1,
        borderColor: 'rgba(0, 243, 255, 0.3)',
    },
    btnIconContainerNavy: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(251, 191, 36, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
        borderWidth: 1,
        borderColor: 'rgba(251, 191, 36, 0.3)',
    },
    btnTextContainer: {
        flex: 1,
    },
    btnTitle: {
        color: '#00f3ff',
        fontSize: 14,
        fontWeight: '900',
        letterSpacing: 1,
        marginBottom: 4,
    },
    btnTitleLogin: {
        color: '#fbbf24',
        fontSize: 14,
        fontWeight: '900',
        letterSpacing: 1,
        marginBottom: 4,
    },
    btnSub: {
        color: '#94a3b8',
        fontSize: 10,
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    },
    
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 20,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: 'rgba(0, 243, 255, 0.2)',
    },
    dividerText: {
        color: '#00f3ff',
        fontSize: 10,
        paddingHorizontal: 10,
        letterSpacing: 2,
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    },
    
    gardaLink: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        backgroundColor: 'rgba(255,255,255,0.02)',
        borderRadius: 4,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    gardaText: {
        color: '#94a3b8',
        fontSize: 12,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
});
