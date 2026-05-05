import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Modal,
    FlatList,
    Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../app/_layout';
import { Language } from '../styles/theme';

interface LanguageSelectorProps {
    visible: boolean;
    onClose: () => void;
}

export default function LanguageSelector({ visible, onClose }: LanguageSelectorProps) {
    const { language, setLanguage } = useLanguage();

    const languages: { code: Language; name: string; flag: string }[] = [
        { code: 'en', name: 'English', flag: '🇬🇧' },
        { code: 'ga', name: 'Gaeilge', flag: '🇮🇪' },
        { code: 'es', name: 'Español', flag: '🇪🇸' },
        { code: 'fr', name: 'Français', flag: '🇫🇷' },
        { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
        { code: 'it', name: 'Italiano', flag: '🇮🇹' },
        { code: 'pt', name: 'Português', flag: '🇵🇹' },
        { code: 'pl', name: 'Polski', flag: '🇵🇱' },
        { code: 'ro', name: 'Română', flag: '🇷🇴' },
        { code: 'nl', name: 'Nederlands', flag: '🇳🇱' },
    ];

    const selectLanguage = (code: Language) => {
        setLanguage(code);
        onClose();
    };

    return (
        <Modal visible={visible} transparent={true} animationType="fade">
            <View style={styles.modalOverlay}>
                <BlurView intensity={80} tint="dark" style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Select Language</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close" size={24} color="#fff" />
                        </TouchableOpacity>
                    </View>
                    <FlatList
                        data={languages}
                        keyExtractor={(item) => item.code}
                        renderItem={({ item }) => (
                            <TouchableOpacity 
                                style={[styles.langItem, language === item.code && styles.langItemActive]} 
                                onPress={() => selectLanguage(item.code)}
                            >
                                <Text style={styles.langItemFlag}>{item.flag}</Text>
                                <Text style={[styles.langItemText, language === item.code && styles.langItemTextActive]}>{item.name}</Text>
                                {language === item.code && <Ionicons name="checkmark" size={18} color="#00f3ff" />}
                            </TouchableOpacity>
                        )}
                    />
                </BlurView>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        width: '100%',
        maxWidth: 400,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(0, 243, 255, 0.3)',
        overflow: 'hidden',
        padding: 20,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        paddingBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.1)',
    },
    modalTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '900',
        letterSpacing: 1,
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    },
    langItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        borderRadius: 8,
        marginBottom: 8,
        backgroundColor: 'rgba(255,255,255,0.02)',
    },
    langItemActive: {
        backgroundColor: 'rgba(0, 243, 255, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(0, 243, 255, 0.3)',
    },
    langItemFlag: {
        fontSize: 20,
        marginRight: 15,
    },
    langItemText: {
        color: '#94a3b8',
        fontSize: 16,
        fontWeight: 'bold',
        flex: 1,
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    },
    langItemTextActive: {
        color: '#00f3ff',
    },
});
