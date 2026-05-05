import { Animated, Easing } from 'react-native';

// Pulsing glow animation for SOS button
export const createPulseAnimation = (animatedValue: Animated.Value) => {
    return Animated.loop(
        Animated.sequence([
            Animated.timing(animatedValue, {
                toValue: 1,
                duration: 1000,
                easing: Easing.inOut(Easing.ease),
                useNativeDriver: true,
            }),
            Animated.timing(animatedValue, {
                toValue: 0,
                duration: 1000,
                easing: Easing.inOut(Easing.ease),
                useNativeDriver: true,
            }),
        ])
    );
};

// Bat-Signal style glow effect
export const createBatSignalGlow = (animatedValue: Animated.Value) => {
    return Animated.loop(
        Animated.sequence([
            Animated.timing(animatedValue, {
                toValue: 1.2,
                duration: 800,
                easing: Easing.inOut(Easing.quad),
                useNativeDriver: true,
            }),
            Animated.timing(animatedValue, {
                toValue: 1,
                duration: 800,
                easing: Easing.inOut(Easing.quad),
                useNativeDriver: true,
            }),
        ])
    );
};

// Fade in animation
export const createFadeIn = (animatedValue: Animated.Value, duration: number = 500) => {
    return Animated.timing(animatedValue, {
        toValue: 1,
        duration,
        easing: Easing.ease,
        useNativeDriver: true,
    });
};

// Fade out animation
export const createFadeOut = (animatedValue: Animated.Value, duration: number = 500) => {
    return Animated.timing(animatedValue, {
        toValue: 0,
        duration,
        easing: Easing.ease,
        useNativeDriver: true,
    });
};

// Scale animation
export const createScale = (animatedValue: Animated.Value, toValue: number, duration: number = 300) => {
    return Animated.spring(animatedValue, {
        toValue,
        friction: 3,
        tension: 40,
        useNativeDriver: true,
    });
};

// Shake animation (for errors)
export const createShake = (animatedValue: Animated.Value) => {
    return Animated.sequence([
        Animated.timing(animatedValue, { toValue: 10, duration: 50, useNativeDriver: true }),
        Animated.timing(animatedValue, { toValue: -10, duration: 50, useNativeDriver: true }),
        Animated.timing(animatedValue, { toValue: 10, duration: 50, useNativeDriver: true }),
        Animated.timing(animatedValue, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]);
};

// Countdown timer animation
export const createCountdown = (animatedValue: Animated.Value, duration: number) => {
    return Animated.timing(animatedValue, {
        toValue: 0,
        duration: duration * 1000,
        easing: Easing.linear,
        useNativeDriver: false,
    });
};

// Flashing light animation (for Lost Child Beacon)
export const createFlashingLight = (animatedValue: Animated.Value) => {
    return Animated.loop(
        Animated.sequence([
            Animated.timing(animatedValue, {
                toValue: 1,
                duration: 200,
                useNativeDriver: true,
            }),
            Animated.timing(animatedValue, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            }),
        ])
    );
};
