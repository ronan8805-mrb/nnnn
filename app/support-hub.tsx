import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Linking,
    Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import axios from 'axios';
import { theme } from '../styles/theme';
import { useLanguage } from './_layout';

import { API_URL } from '../utils/config';

interface Service {
    id: number;
    name: string;
    phone: string;
    description: string;
    category: string;
    website: string;
}

export default function SupportHubScreen() {
    const router = useRouter();
    const { t } = useLanguage();
    const [services, setServices] = useState<Service[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchServices();
    }, []);

    const fetchServices = async () => {
        try {
            const response = await axios.get(`${API_URL}/support-services`);
            if (response.data && Array.isArray(response.data)) {
                setServices(response.data);
            } else {
                throw new Error('Invalid data format');
            }
        } catch (error) {
            console.error('Error fetching services:', error);
            // Fallback data
            setServices([
                {
                    id: 1,
                    name: 'Dublin Rape Crisis Centre',
                    phone: '1800 77 8888',
                    description: '24-hour confidential helpline for those affected by sexual violence.',
                    category: 'Sexual Violence',
                    website: 'https://www.drcc.ie'
                },
                {
                    id: 2,
                    name: "Women's Aid",
                    phone: '1800 341 900',
                    description: 'Support for women affected by domestic abuse.',
                    category: 'Domestic Violence',
                    website: 'https://www.womensaid.ie'
                },
                {
                    id: 3,
                    name: 'Samaritans',
                    phone: '116 123',
                    description: 'Free 24-hour emotional support for anyone in distress.',
                    category: 'Mental Health',
                    website: 'https://www.samaritans.org/ireland'
                }
            ]);
        } finally {
            setLoading(false);
        }
    };

    const handleCall = (phone: string) => {
        Linking.openURL(`tel:${phone.replace(/\s/g, '')}`);
    };

    const handleWebsite = (url: string) => {
        Linking.openURL(url);
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => router.canGoBack() ? router.back() : router.replace('/home')}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <Text style={styles.backButton}>← Back</Text>
                </TouchableOpacity>
                <Text style={styles.title}>Support Hub</Text>
            </View>

            <ScrollView style={styles.content}>
                <View style={styles.introBox}>
                    <Text style={styles.introTitle}>We're here for you.</Text>
                    <Text style={styles.introText}>
                        If you've been affected by a crime or traumatic event, these organizations provide confidential support, advice, and counseling.
                    </Text>
                </View>

                {services.map((service) => (
                    <View key={service.id} style={styles.card}>
                        <View style={styles.cardHeader}>
                            <Text style={styles.serviceName}>{service.name}</Text>
                            <View style={styles.categoryBadge}>
                                <Text style={styles.categoryText}>{service.category}</Text>
                            </View>
                        </View>

                        <Text style={styles.description}>{service.description}</Text>

                        <View style={styles.actionRow}>
                            <TouchableOpacity
                                style={styles.callButton}
                                onPress={() => handleCall(service.phone)}
                            >
                                <Text style={styles.callButtonText}>📞 Call {service.phone}</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.webButton}
                                onPress={() => handleWebsite(service.website)}
                            >
                                <Text style={styles.webButtonText}>Visit Website</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                ))}

                <View style={styles.emergencyBox}>
                    <Text style={styles.emergencyTitle}>In immediate danger?</Text>
                    <TouchableOpacity
                        style={styles.sosButton}
                        onPress={() => router.push('/home')}
                    >
                        <Text style={styles.sosButtonText}>ACTIVATE SOS</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.spacer} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: theme.spacing.lg,
        paddingTop: theme.spacing.xxl,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    backButton: {
        color: theme.colors.accent,
        fontSize: theme.fonts.size.medium,
        fontWeight: theme.fonts.weight.bold,
        marginRight: theme.spacing.md,
    },
    title: {
        fontSize: theme.fonts.size.large,
        fontWeight: theme.fonts.weight.bold,
        color: theme.colors.text,
    },
    content: {
        padding: theme.spacing.lg,
    },
    introBox: {
        marginBottom: theme.spacing.xl,
    },
    introTitle: {
        fontSize: theme.fonts.size.xlarge,
        fontWeight: theme.fonts.weight.bold,
        color: theme.colors.text,
        marginBottom: theme.spacing.sm,
    },
    introText: {
        color: theme.colors.textSecondary,
        fontSize: theme.fonts.size.medium,
        lineHeight: 22,
    },
    card: {
        backgroundColor: theme.colors.border,
        borderRadius: theme.borderRadius.md,
        padding: theme.spacing.md,
        marginBottom: theme.spacing.lg,
        borderLeftWidth: 4,
        borderLeftColor: theme.colors.accent,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: theme.spacing.sm,
    },
    serviceName: {
        fontSize: theme.fonts.size.large,
        fontWeight: theme.fonts.weight.bold,
        color: theme.colors.text,
        flex: 1,
        marginRight: theme.spacing.sm,
    },
    categoryBadge: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    categoryText: {
        color: theme.colors.textSecondary,
        fontSize: 10,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    description: {
        color: theme.colors.textSecondary,
        fontSize: theme.fonts.size.medium,
        marginBottom: theme.spacing.md,
        lineHeight: 20,
    },
    actionRow: {
        flexDirection: 'row',
        gap: 10,
    },
    callButton: {
        flex: 2,
        backgroundColor: theme.colors.accent,
        padding: theme.spacing.sm,
        borderRadius: theme.borderRadius.sm,
        alignItems: 'center',
    },
    callButtonText: {
        color: theme.colors.text,
        fontWeight: 'bold',
        fontSize: theme.fonts.size.medium,
    },
    webButton: {
        flex: 1,
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: theme.colors.textSecondary,
        padding: theme.spacing.sm,
        borderRadius: theme.borderRadius.sm,
        alignItems: 'center',
    },
    webButtonText: {
        color: theme.colors.textSecondary,
        fontSize: theme.fonts.size.medium,
    },
    emergencyBox: {
        marginTop: theme.spacing.lg,
        alignItems: 'center',
        padding: theme.spacing.lg,
        backgroundColor: 'rgba(255, 0, 0, 0.1)',
        borderRadius: theme.borderRadius.md,
        borderWidth: 1,
        borderColor: theme.colors.sos,
    },
    emergencyTitle: {
        color: theme.colors.sos,
        fontWeight: 'bold',
        marginBottom: theme.spacing.md,
    },
    sosButton: {
        backgroundColor: theme.colors.sos,
        paddingHorizontal: theme.spacing.xl,
        paddingVertical: theme.spacing.sm,
        borderRadius: theme.borderRadius.md,
    },
    sosButtonText: {
        color: theme.colors.text,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    spacer: {
        height: 40,
    },
    chatButton: {
        backgroundColor: theme.colors.primary,
        padding: theme.spacing.lg,
        borderRadius: theme.borderRadius.md,
        alignItems: 'center',
        marginBottom: theme.spacing.xl,
        borderWidth: 1,
        borderColor: theme.colors.accent,
        ...theme.shadows.glow,
    },
    chatButtonText: {
        color: theme.colors.text,
        fontSize: theme.fonts.size.large,
        fontWeight: 'bold',
    },
});
