import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { theme } from '../styles/theme';

const { width } = Dimensions.get('window');

export default function SplashScreen() {
    const router = useRouter();
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.8)).current;

    useEffect(() => {
        // Animations
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 1000,
                useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
                toValue: 1,
                friction: 4,
                tension: 40,
                useNativeDriver: true,
            }),
        ]).start();

        // Navigate to login after 3 seconds
        const timer = setTimeout(() => {
            router.replace('/login');
        }, 3000);

        return () => clearTimeout(timer);
    }, []);

    return (
        <View style={styles.container}>
            <Animated.View
                style={[
                    styles.content,
                    {
                        opacity: fadeAnim,
                        transform: [{ scale: scaleAnim }],
                    },
                ]}
            >
                <View style={styles.logoWrapper}>
                    <Image 
                        source={require('../assets/harp_logo.png')} 
                        style={styles.mainLogo}
                        resizeMode="contain"
                    />
                </View>
                <Text style={styles.title}>SLÁN</Text>
                <Text style={styles.subtitle}>Safety. Location. Alert. Network.</Text>
            </Animated.View>

            <View style={styles.footer}>
                <Text style={styles.footerText}>Protecting Ireland Together</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        alignItems: 'center',
    },
    logoWrapper: {
        width: 150,
        height: 150,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: theme.spacing.xl,
    },
    mainLogo: {
        width: '100%',
        height: '100%',
        shadowColor: theme.colors.primary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 20,
    },
    title: {
        color: theme.colors.text,
        fontSize: 48,
        fontWeight: 'bold',
        marginBottom: theme.spacing.sm,
        letterSpacing: 4,
    },
    subtitle: {
        color: theme.colors.textSecondary,
        fontSize: theme.fonts.size.medium,
        letterSpacing: 1,
    },
    footer: {
        position: 'absolute',
        bottom: theme.spacing.xxl,
    },
    footerText: {
        color: theme.colors.textSecondary,
        fontSize: theme.fonts.size.small,
        opacity: 0.6,
    },
});
