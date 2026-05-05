import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { theme } from '../styles/theme';

const STAGES = [
    { id: 1, label: 'SOS Received by HQ' },
    { id: 2, label: 'Routing to Station' },
    { id: 3, label: 'Routing to Officer' },
    { id: 4, label: 'Garda Notified' },
];

interface Props {
    sosId?: number;
}

export default function EscalationProgress({ sosId }: Props) {
    const [currentStage, setCurrentStage] = useState(0);
    const progressAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Simulate escalation process
        const sequence = async () => {
            for (let i = 0; i < STAGES.length; i++) {
                setCurrentStage(i + 1);
                await animateProgress((i + 1) / STAGES.length);
                await new Promise(resolve => setTimeout(resolve, 1500)); // Delay between stages
            }
        };
        sequence();
    }, []);

    const animateProgress = (toValue: number) => {
        return new Promise<void>(resolve => {
            Animated.timing(progressAnim, {
                toValue,
                duration: 1000,
                useNativeDriver: false, // Width doesn't support native driver
            }).start(() => resolve());
        });
    };

    const widthInterpolation = progressAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0%', '100%'],
    });

    return (
        <View style={styles.container}>
            <View style={styles.progressBarContainer}>
                <Animated.View
                    style={[
                        styles.progressBarFill,
                        { width: widthInterpolation },
                    ]}
                />
            </View>
            <View style={styles.stagesContainer}>
                {STAGES.map((stage, index) => {
                    const isActive = index + 1 === currentStage;
                    const isCompleted = index + 1 < currentStage;

                    return (
                        <View key={stage.id} style={styles.stageRow}>
                            <View style={[
                                styles.dot,
                                (isActive || isCompleted) && styles.activeDot,
                                isActive && styles.pulsingDot
                            ]} />
                            <Text style={[
                                styles.stageLabel,
                                (isActive || isCompleted) && styles.activeLabel
                            ]}>
                                {stage.label}
                            </Text>
                            {isActive && <Text style={styles.processingText}>...</Text>}
                            {isCompleted && <Text style={styles.checkMark}>✓</Text>}
                        </View>
                    );
                })}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
        padding: theme.spacing.md,
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderRadius: theme.borderRadius.md,
        marginTop: theme.spacing.md,
    },
    progressBarContainer: {
        height: 6,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 3,
        marginBottom: theme.spacing.md,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: theme.colors.sos,
    },
    stagesContainer: {
        gap: 8,
    },
    stageRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: theme.colors.textSecondary,
        marginRight: theme.spacing.sm,
    },
    activeDot: {
        backgroundColor: theme.colors.sos,
    },
    pulsingDot: {
        backgroundColor: theme.colors.accent,
        transform: [{ scale: 1.2 }],
    },
    stageLabel: {
        color: theme.colors.textSecondary,
        fontSize: theme.fonts.size.small,
        flex: 1,
    },
    activeLabel: {
        color: theme.colors.text,
        fontWeight: 'bold',
    },
    processingText: {
        color: theme.colors.accent,
        fontSize: theme.fonts.size.small,
        fontWeight: 'bold',
    },
    checkMark: {
        color: theme.colors.success,
        fontSize: theme.fonts.size.small,
        fontWeight: 'bold',
    },
});
