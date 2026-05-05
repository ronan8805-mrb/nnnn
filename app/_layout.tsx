import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import React, { createContext, useState, useContext } from 'react';
import { View } from 'react-native';
import { Language, translations } from '../styles/theme';

// Language Context
interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: typeof translations.en;
}

const LanguageContext = createContext<LanguageContextType>({
    language: 'en',
    setLanguage: () => { },
    t: translations.en,
});

export const useLanguage = () => useContext(LanguageContext);

// Active SOS Context
interface ActiveSOSContextType {
    activeSOS: boolean;
    setActiveSOS: (active: boolean) => void;
    sosData: any;
    setSosData: (data: any) => void;
}

const ActiveSOSContext = createContext<ActiveSOSContextType>({
    activeSOS: false,
    setActiveSOS: () => {},
    sosData: null,
    setSosData: () => {},
});

export const useActiveSOS = () => useContext(ActiveSOSContext);

export default function RootLayout() {
    const [language, setLanguage] = useState<Language>('en');
    const [activeSOS, setActiveSOS] = useState(false);
    const [sosData, setSosData] = useState(null);

    const value = {
        language,
        setLanguage,
        t: translations[language],
    };

    const sosValue = {
        activeSOS,
        setActiveSOS,
        sosData,
        setSosData,
    };

    return (
        <LanguageContext.Provider value={value}>
            <ActiveSOSContext.Provider value={sosValue}>
                <SafeAreaProvider>
                    <StatusBar style="light" />
                    <Stack
                        screenOptions={{
                            headerShown: false,
                            contentStyle: { backgroundColor: '#000000' },
                            animation: 'fade',
                        }}
                    >
                        <Stack.Screen name="index" />
                        <Stack.Screen name="login" options={{ title: 'Welcome to SLÁN' }} />
                        <Stack.Screen name="login-form" options={{ title: 'Login' }} />
                        <Stack.Screen name="register" options={{ title: 'Register' }} />
                        <Stack.Screen name="home" />
                        <Stack.Screen name="sos-activated" />
                        <Stack.Screen name="safe-walk" />
                        <Stack.Screen name="garda-login" />
                        <Stack.Screen name="garda-dashboard" />
                        <Stack.Screen name="crime-map" />
                        <Stack.Screen name="medical-profile" />
                        <Stack.Screen name="support-hub" />
                        <Stack.Screen name="lockdown-mode" />
                        <Stack.Screen name="settings" />
                        <Stack.Screen name="guardian-view" />
                        <Stack.Screen name="report-crime" />
                        <Stack.Screen name="my-reports" />
                        <Stack.Screen name="guardians" />
                        <Stack.Screen name="profile" />
                        <Stack.Screen name="garda-analytics" />
                        <Stack.Screen name="garda-chat" />
                        <Stack.Screen name="child-home" />
                        <Stack.Screen name="gov-login" />
                        <Stack.Screen name="gov-dashboard" />
                        <Stack.Screen name="gov-predictive" />
                        <Stack.Screen name="gov-alerts" />
                    </Stack>
                </SafeAreaProvider>
            </ActiveSOSContext.Provider>
        </LanguageContext.Provider>
    );
}
