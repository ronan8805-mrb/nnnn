import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Animated,
    Dimensions,
    Easing,
    Platform
} from 'react-native';

const { width, height } = Dimensions.get('window');

interface JarvisWrapperProps {
    children: React.ReactNode;
    showRings?: boolean;
    showTelemetry?: boolean;
}

export default function JarvisWrapper({ children, showRings = false, showTelemetry = false }: JarvisWrapperProps) {
    const rotateOuter = useRef(new Animated.Value(0)).current;
    const rotateInner = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (showRings) {
            Animated.loop(
                Animated.timing(rotateOuter, {
                    toValue: 1,
                    duration: 15000,
                    easing: Easing.linear,
                    useNativeDriver: Platform.OS !== 'web',
                })
            ).start();

            Animated.loop(
                Animated.timing(rotateInner, {
                    toValue: 1,
                    duration: 10000,
                    easing: Easing.linear,
                    useNativeDriver: Platform.OS !== 'web',
                })
            ).start();
        }
    }, [showRings]);

    const spinOuter = rotateOuter.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
    const spinInner = rotateInner.interpolate({ inputRange: [0, 1], outputRange: ['360deg', '0deg'] });

    return (
        <View style={styles.container}>
            {/* Deep space tech background grid */}
            <View style={styles.bgGrid} />

            {/* Jarvis HUD Core Rings (Optional) */}
            {showRings && (
                <View style={styles.hudContainer}>
                    <Animated.View style={[styles.hudRingOuter, { transform: [{ rotate: spinOuter }] }]} />
                    <Animated.View style={[styles.hudRingInner, { transform: [{ rotate: spinInner }] }]} />
                </View>
            )}

            {/* Top Left Telemetry */}
            {showTelemetry && (
                <View style={styles.telemetryContainer}>
                    <View style={styles.hudDataCorner}>
                        <Text style={styles.hudDataText}>SYS.ONLINE // 99.9%</Text>
                        <Text style={styles.hudDataText}>LOC: IRELAND_CORE</Text>
                    </View>
                </View>
            )}

            {/* The actual screen content goes here */}
            <View style={styles.content}>
                {children}
            </View>
            
            {/* Bottom Telemetry */}
            {showTelemetry && (
                <View style={styles.footerTelemetry}>
                    <Text style={styles.footerText}>SYSTEM: NOMINAL</Text>
                    <View style={styles.hudLines}>
                        <View style={styles.hudLineShort} />
                        <View style={styles.hudLineLong} />
                        <View style={styles.hudLineShort} />
                    </View>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#020617', // Pitch black/deep navy
        overflow: 'hidden',
    },
    bgGrid: {
        ...StyleSheet.absoluteFillObject,
        opacity: 0.02,
        backgroundColor: '#020617',
        backgroundImage: 'linear-gradient(#00f3ff 1px, transparent 1px), linear-gradient(90deg, #00f3ff 1px, transparent 1px)',
        backgroundSize: '40px 40px',
    } as any,

    hudContainer: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        width: 800,
        height: 800,
        marginLeft: -400,
        marginTop: -400,
        justifyContent: 'center',
        alignItems: 'center',
        opacity: 0.05,
        zIndex: 0,
        pointerEvents: 'none',
    },
    hudRingOuter: {
        position: 'absolute',
        width: 600,
        height: 600,
        borderRadius: 300,
        borderWidth: 2,
        borderColor: '#00f3ff',
        borderStyle: 'dashed',
    },
    hudRingInner: {
        position: 'absolute',
        width: 450,
        height: 450,
        borderRadius: 225,
        borderWidth: 4,
        borderColor: '#fbbf24',
        borderStyle: 'dotted',
        opacity: 0.5,
    },
    content: {
        flex: 1,
        zIndex: 2,
    },
    telemetryContainer: {
        position: 'absolute',
        top: Platform.OS === 'web' ? 40 : 60,
        right: 20,
        zIndex: 10,
    },
    hudDataCorner: {
        backgroundColor: 'rgba(0, 243, 255, 0.1)',
        padding: 10,
        borderRightWidth: 2,
        borderRightColor: '#00f3ff',
    },
    hudDataText: {
        color: '#00f3ff',
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
        fontSize: 10,
        letterSpacing: 2,
    },
    footerTelemetry: {
        position: 'absolute',
        bottom: 20,
        left: 0,
        right: 0,
        alignItems: 'center',
        zIndex: 10,
    },
    footerText: {
        color: '#00f3ff',
        fontSize: 10,
        letterSpacing: 4,
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
        marginBottom: 8,
    },
    hudLines: {
        flexDirection: 'row',
        gap: 4,
    },
    hudLineShort: {
        width: 20,
        height: 2,
        backgroundColor: '#00f3ff',
        opacity: 0.5,
    },
    hudLineLong: {
        width: 60,
        height: 2,
        backgroundColor: '#00f3ff',
    },
});
