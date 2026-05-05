import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    FlatList,
    Switch,
    TextInput,
    ImageBackground,
    Animated,
    Dimensions,
    Platform,
    useWindowDimensions
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../styles/theme';
import stationsData from '../backend/data/stations.json';
import { socket, connectSocket } from '../utils/socket';
import { API_URL } from '../utils/config';
import axios from 'axios';
import JarvisWrapper from '../components/JarvisWrapper';
import TacticalMap from '../components/TacticalMap';

const isWeb = Platform.OS === 'web';
const { width: globalWidth } = Dimensions.get('window');

// --- Types ---
interface Station {
    id?: number;
    name: string;
    latitude: number;
    longitude: number;
    address: string;
}

interface SOSCall {
    id: string;
    user_id: number;
    status: 'pending' | 'accepted' | 'resolved';
    priority: 'high' | 'medium' | 'low';
    service_type: 'garda' | 'medical' | 'fire' | 'all';
    timestamp: string;
    location: string;
    distance: string;
    battery: number;
    gps_precision: string;
    stream_data: string;
    report?: string;
    resolution?: string;
}

interface Officer {
    id: string;
    name: string;
    status: 'on_duty' | 'busy' | 'offline';
    location: string;
    bpm: number;
    stress: 'Normal' | 'Elevated' | 'High' | 'Critical';
    alerts: string[];
}

export default function GardaDashboardScreen() {
    const router = useRouter();
    const { width } = useWindowDimensions();
    const isMobile = width < 768; // Breakpoint for mobile
    
    const pulseAnim = useRef(new Animated.Value(0)).current;

    // --- State ---
    const [viewMode, setViewMode] = useState<'hq' | 'dashboard'>('hq');
    const [selectedStation, setSelectedStation] = useState<Station | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [isOnline, setIsOnline] = useState(true);
    const [activeTab, setActiveTab] = useState<'active' | 'closed'>('active');
    const [etaSeconds, setEtaSeconds] = useState(120); // 2 minutes countdown

    // --- Animation State ---
    const carPosition = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
    const [carDispatched, setCarDispatched] = useState(false);

    // Mock Data
    const [sosQueue, setSosQueue] = useState<SOSCall[]>([
        { id: '1234', user_id: 12, status: 'pending', priority: 'high', service_type: 'garda', timestamp: '14:02', location: "O'Connell St D01", distance: '0.8 km', battery: 85, gps_precision: '<5m (GPS)', stream_data: 'Data packet-Data...' },
        { id: '5678', user_id: 45, status: 'pending', priority: 'high', service_type: 'medical', timestamp: '14:02', location: 'Temple Bar D02', distance: '1.2 km', battery: 40, gps_precision: '<12m (Med)', stream_data: 'Data packet-Data...' },
        { id: '9012', user_id: 48, status: 'pending', priority: 'medium', service_type: 'fire', timestamp: '14:01', location: 'Smithfield D07', distance: '2.1 km', battery: 92, gps_precision: '<3m (High)', stream_data: 'Data packet-Data...' },
        { id: '8844', user_id: 99, status: 'resolved', priority: 'low', service_type: 'garda', timestamp: '13:55', location: 'Grafton St', distance: '0.4 km', battery: 12, gps_precision: '<8m', stream_data: 'Resolved via Unit G402', report: 'Public nuisance handled. No charges filed.' },
        { id: '7722', user_id: 102, status: 'pending', priority: 'medium', service_type: 'medical', timestamp: '14:05', location: 'Stephen\'s Green', distance: '1.5 km', battery: 67, gps_precision: '<10m', stream_data: 'Heart rate telemetry active...' },
    ]);

    const [systemLogs, setSystemLogs] = useState<string[]>([
        `[${new Date().toLocaleTimeString()}] COMMAND CENTER ONLINE`,
        `[${new Date().toLocaleTimeString()}] UNIT G234 PATROL ACTIVE - SECTOR 4`,
        `[${new Date().toLocaleTimeString()}] ENCRYPTION LAYER AES-256 SECURE`
    ]);

    const [officers, setOfficers] = useState<Officer[]>([
        { id: 'G234', name: "Aoife O'D.", status: 'on_duty', location: 'Patrol Car 4', bpm: 110, stress: 'Elevated', alerts: ['No Alerts'] },
        { id: 'G888', name: 'Liam M.', status: 'busy', location: 'Incident #402', bpm: 145, stress: 'High', alerts: ['ACTIVE INCIDENT'] },
        { id: 'G101', name: 'Seán K.', status: 'on_duty', location: 'Pearse St D01', bpm: 170, stress: 'Critical', alerts: ['MAN DOWN ALERT'] },
        { id: 'G442', name: 'Sarah T.', status: 'on_duty', location: 'O\'Connell St', bpm: 78, stress: 'Normal', alerts: ['No Alerts'] },
    ]);

    // --- Real-time Logic ---
    useEffect(() => {
        connectSocket();

        // Pulsing animation for critical alerts
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: false }),
                Animated.timing(pulseAnim, { toValue: 0, duration: 800, useNativeDriver: false }),
            ])
        ).start();

        socket.on('new_sos', (data: any) => {
            const newCall: SOSCall = {
                id: `${data.sos_id || Math.floor(1000 + Math.random() * 9000)}`,
                user_id: data.user_id,
                status: 'pending',
                priority: 'high',
                service_type: data.service_type || 'garda',
                timestamp: new Date().toLocaleTimeString('en-IE', { hour: '2-digit', minute: '2-digit' }),
                location: data.location || "Location Tracked",
                distance: '0.5 km',
                battery: Math.floor(Math.random() * 60) + 20, // Random battery 20-80%
                gps_precision: '<5m (GPS)',
                stream_data: 'Data packet-Data...'
            };

            setSosQueue(prev => [newCall, ...prev]);
        });

        socket.on('incident_resolved', (data: any) => {
            setSosQueue(prev => prev.map(call => {
                if (call.id === String(data.sos_id)) {
                    return {
                        ...call,
                        status: 'resolved',
                        report: data.report,
                        resolution: data.resolution
                    };
                }
                return call;
            }));
        });

        // CROSS-TAB SYNC LISTENER (For Investor Demo)
        const handleStorageSync = (e: StorageEvent) => {
            if (e.key === 'sos_triggered' && e.newValue) {
                const data = JSON.parse(e.newValue);
                const newCall: SOSCall = {
                    id: data.id,
                    user_id: 1,
                    status: 'pending',
                    priority: 'high',
                    service_type: data.type.toLowerCase() as any,
                    timestamp: data.timestamp,
                    location: data.location,
                    distance: '0.1 km',
                    battery: 98,
                    gps_precision: '<2m (Tactical)',
                    stream_data: `LIVE STREAM ACTIVE - ${data.name.toUpperCase()}`
                };
                
                setSosQueue(prev => {
                    // Avoid duplicates
                    if (prev.find(c => c.id === data.id)) return prev;
                    return [newCall, ...prev];
                });

                setSystemLogs(prev => [
                    `[${new Date().toLocaleTimeString()}] 🚨 EMERGENCY TRIGGER: UNIT DISPATCH REQUESTED (${data.id})`,
                    ...prev.slice(0, 10)
                ]);
            }
        };

        if (Platform.OS === 'web') {
            window.addEventListener('storage', handleStorageSync);
        }

        // Background Noise Simulator (Randomly adds logs to feel busy)
        const logTimer = setInterval(() => {
            const randomLogs = [
                "Telemetry sync with PC-402 successful",
                "Traffic density high in Sector 2 - Rerouting dispatches",
                "HQ Heartbeat: NOMINAL",
                "Unit G888 reporting on-scene at Incident #402",
                "VHF Radio check: CLEAR",
                "Smartwatch Fleet sync: 4 units online"
            ];
            const log = randomLogs[Math.floor(Math.random() * randomLogs.length)];
            setSystemLogs(prev => [`[${new Date().toLocaleTimeString()}] ${log}`, ...prev.slice(0, 10)]);
        }, 5000);

        return () => {
            socket.off('new_sos');
            socket.off('incident_resolved');
            if (Platform.OS === 'web') {
                window.removeEventListener('storage', handleStorageSync);
            }
            clearInterval(logTimer);
        };
    }, []);

    // Countdown Logic for ETA
    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (carDispatched && etaSeconds > 0) {
            timer = setInterval(() => {
                setEtaSeconds(prev => prev - 1);
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [carDispatched, etaSeconds]);

    const formatETA = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const filteredStations = stationsData.filter(station =>
        station.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        station.address.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleStationSelect = (station: Station) => {
        setSelectedStation(station);
        setViewMode('dashboard');
    };

    const handleAcceptCall = async (id: string) => {
        setSosQueue((prev) => prev.map((call) => call.id === id ? { ...call, status: 'accepted' } : call));
        
        // Trigger the map animation!
        setCarDispatched(true);
        Animated.timing(carPosition, {
            toValue: { x: -80, y: 30 }, // Moves the car left and down towards the fire icon
            duration: 4000, // 4 seconds to simulate driving
            useNativeDriver: false,
        }).start();

        // EMIT SOCKET EVENT TO CITIZEN
        console.log(`[Demo] Emitting sos_accepted for ID: ${id}`);
        socket.emit('sos_accepted', {
            sos_id: parseInt(id),
            officer_id: 'G234',
            officer_location: { lat: 53.3501, lng: -6.2612 }, // Starting point
            eta: '2:00'
        });

        // CROSS-TAB SYNC FALLBACK (For demo robustness)
        if (Platform.OS === 'web') {
            localStorage.setItem('sos_update', JSON.stringify({
                type: 'sos_accepted',
                sos_id: parseInt(id),
                officer_id: 'G234',
                location: { lat: 53.3501, lng: -6.2612 },
                timestamp: Date.now()
            }));
        }

        // Simulate officer movement updates
        let step = 0;
        const moveInterval = setInterval(() => {
            step++;
            const lat = 53.3501 - (step * 0.0001);
            const lng = -6.2612 + (step * 0.0001);
            socket.emit('officer_location_update', {
                sos_id: parseInt(id),
                location: { lat, lng }
            });
            if (step >= 20) clearInterval(moveInterval);
        }, 3000);

        try {
            await axios.post(`${API_URL}/accept-call`, {
                sos_id: parseInt(id),
                garda_id: 1
            });
        } catch (e) {
            console.error('Error accepting call:', e);
        }
    };

    const handleArrive = (id: string) => {
        setSosQueue((prev) => prev.map((call) => call.id === id ? { ...call, status: 'arrived' } : call));
        
        // Notify Citizen
        socket.emit('officer_arrived', { sos_id: parseInt(id) });
        
        if (Platform.OS === 'web') {
            localStorage.setItem('sos_update', JSON.stringify({
                type: 'officer_arrived',
                sos_id: parseInt(id),
                timestamp: Date.now()
            }));
        }
    };

    const handleResolve = (id: string) => {
        const report = "Incident secured. Evidence collected. Tactical closure complete.";
        setSosQueue((prev) => prev.map((call) => call.id === id ? { ...call, status: 'resolved', report } : call));
        
        // Notify Citizen
        socket.emit('incident_resolved', { sos_id: parseInt(id), report });
        
        if (Platform.OS === 'web') {
            localStorage.setItem('sos_update', JSON.stringify({
                type: 'incident_resolved',
                sos_id: parseInt(id),
                report,
                timestamp: Date.now()
            }));
        }
    };

    // --- Render HQ View ---
    const renderHQ = () => (
        <View style={styles.hqContainer}>
            {/* Header */}
            <View style={[styles.hqHeader, isMobile && { flexDirection: 'column', gap: 10, padding: 10 }]}>
                <View style={[styles.hqHeaderLeft, isMobile && { width: '100%', justifyContent: 'space-between' }]}>
                    <TouchableOpacity onPress={() => router.replace('/login')} style={styles.iconButton}>
                        <Ionicons name="log-out-outline" size={24} color={theme.colors.primary} />
                    </TouchableOpacity>
                    <ImageBackground source={require('../assets/harp_logo.png')} style={styles.gardaLogo} imageStyle={{ opacity: 0.8, resizeMode: 'contain' }} />
                </View>
                <View style={styles.hqTitleContainer}>
                    <Text style={[styles.hqTitle, isMobile && { fontSize: 20 }]}>AN GARDA SÍOCHÁNA</Text>
                    <Text style={[styles.hqSubtitle, isMobile && { fontSize: 10, textAlign: 'center' }]}>NATIONAL COMMAND CENTER</Text>
                </View>
                {!isMobile && (
                    <View style={styles.hqHeaderRight}>
                        <View style={styles.shieldIcon}><Ionicons name="shield-checkmark" size={28} color={theme.colors.primary} /></View>
                    </View>
                )}
            </View>

            <ScrollView style={{ flex: 1 }}>
                <View style={[styles.hqBody, isMobile && { flexDirection: 'column', padding: 10 }]}>
                    {/* Left Panel: Stats */}
                    <View style={styles.hqLeftPanel}>
                        <Text style={styles.panelTitle}>NATIONAL OVERVIEW</Text>
                        <View style={[isMobile ? { flexDirection: 'row', gap: 10 } : null]}>
                            <View style={[styles.hqStatCard, isMobile && { flex: 1, padding: 10 }]}>
                                <Text style={[styles.hqStatValue, isMobile && { fontSize: 24 }]}>14</Text>
                                <Text style={[styles.hqStatLabel, isMobile && { fontSize: 8 }]}>ACTIVE CALLS</Text>
                            </View>
                            <View style={[styles.hqStatCard, isMobile && { flex: 1, padding: 10 }]}>
                                <Text style={[styles.hqStatValue, isMobile && { fontSize: 24 }]}>195</Text>
                                <Text style={[styles.hqStatLabel, isMobile && { fontSize: 8 }]}>DISPATCHES</Text>
                            </View>
                        </View>
                    </View>

                    {/* Center Panel: Real Tactical Map */}
                    <View style={[styles.hqCenterPanel, isMobile && { minHeight: 250 }]}>
                        <TacticalMap 
                            mode="garda"
                            incidents={[
                                { latitude: 53.352, longitude: -6.265, label: 'ASSAULT IN PROGRESS' },
                                { latitude: 53.348, longitude: -6.255, label: 'FIRE ALERT' }
                            ]}
                        />
                    </View>

                    {/* Right Panel: Station Select */}
                    <View style={styles.hqRightPanel}>
                        <Text style={styles.panelTitle}>GARDA STATIONS</Text>
                        <View style={styles.searchContainer}>
                            <Ionicons name="search" size={18} color={theme.colors.textSecondary} style={styles.searchIcon} />
                            <TextInput
                                style={styles.searchInput}
                                placeholder="Search station..."
                                placeholderTextColor={theme.colors.textSecondary}
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                            />
                        </View>
                        <FlatList
                            data={filteredStations}
                            keyExtractor={(item) => item.name}
                            scrollEnabled={!isMobile} // use scrollview outer on mobile
                            renderItem={({ item }) => (
                                <TouchableOpacity style={styles.stationCard} onPress={() => handleStationSelect(item)}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.stationCardTitle}>{(item.name || 'STATION').toUpperCase()}</Text>
                                        <Text style={styles.stationCardSub}>{item.address}</Text>
                                    </View>
                                    <Ionicons name="chevron-forward" size={20} color={theme.colors.primary} />
                                </TouchableOpacity>
                            )}
                            contentContainerStyle={styles.stationList}
                        />
                    </View>
                </View>
            </ScrollView>
        </View>
    );

    // --- Render Station Dashboard View ---
    const renderDashboard = () => (
        <View style={styles.dashboardContainer}>
            {/* Header */}
            <View style={[styles.dashHeader, isMobile && { flexDirection: 'column', padding: 10, gap: 10 }]}>
                <View style={styles.dashHeaderLeft}>
                    <TouchableOpacity onPress={() => setViewMode('hq')} style={styles.iconButton}>
                        <Ionicons name="arrow-back" size={24} color={theme.colors.primary} />
                    </TouchableOpacity>
                    <View style={{ flexShrink: 1 }}>
                        <Text style={[styles.dashTitle, isMobile && { fontSize: 14 }]} numberOfLines={1}>GARDA OPERATIONS DASHBOARD</Text>
                        <Text style={[styles.dashSubtitle, isMobile && { fontSize: 10 }]}>{(selectedStation?.name || 'OFFLINE').toUpperCase()}</Text>
                    </View>
                </View>
                <View style={styles.dashHeaderRight}>
                    <Text style={styles.statusText}>{isOnline ? 'ACTIVE' : 'OFFLINE'}</Text>
                    <Switch value={isOnline} onValueChange={setIsOnline} trackColor={{ false: '#334155', true: theme.colors.primary }} />
                </View>
            </View>

            <ScrollView style={styles.dashBody} contentContainerStyle={[styles.dashBodyContent, isMobile && { padding: 10, gap: 10 }]}>
                
                {/* Top Row: Triage Queue & Map */}
                <View style={[styles.topRow, isMobile && { flexDirection: 'column-reverse', gap: 10 }]}>
                    
                    {/* LIVE TRIAGE QUEUE */}
                    <View style={[styles.triagePanel, isMobile && { padding: 10 }]}>
                        <View style={styles.panelHeaderRow}>
                            <View>
                                <Text style={styles.panelTitle}>LIVE TRIAGE QUEUE</Text>
                                <Text style={styles.panelSubtitle}>(Active Emergency Stream)</Text>
                            </View>
                            <View style={styles.tabContainer}>
                                <TouchableOpacity onPress={() => setActiveTab('active')} style={[styles.tab, activeTab === 'active' && styles.activeTab]}>
                                    <Text style={[styles.tabText, activeTab === 'active' && styles.activeTabText]}>ACTIVE</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => setActiveTab('closed')} style={[styles.tab, activeTab === 'closed' && styles.activeTab]}>
                                    <Text style={[styles.tabText, activeTab === 'closed' && styles.activeTabText]}>CLOSED</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                        
                        {/* Table Header (Desktop Only) */}
                        {!isMobile && (
                            <View style={styles.tableHeaderRow}>
                                <Text style={[styles.tableHead, { flex: 1.5 }]}>STREAM</Text>
                                <Text style={[styles.tableHead, { flex: 1 }]}>CALL ID</Text>
                                <Text style={[styles.tableHead, { flex: 1 }]}>TYPE</Text>
                                <Text style={[styles.tableHead, { flex: 2 }]}>LOCATION</Text>
                                <Text style={[styles.tableHead, { flex: 0.8 }]}>BATT</Text>
                                <Text style={[styles.tableHead, { flex: 1.2 }]}>GPS</Text>
                                <Text style={[styles.tableHead, { flex: 1.5, textAlign: 'center' }]}>ACTION</Text>
                            </View>
                        )}

                        {/* Table Body (Responsive Cards on Mobile, Rows on Desktop) */}
                        <View style={styles.tableBody}>
                            {sosQueue.filter(c => activeTab === 'active' ? c.status !== 'resolved' : c.status === 'resolved').map((call) => (
                                <View key={call.id} style={[
                                    isMobile ? styles.mobileCard : styles.tableRow,
                                    call.service_type === 'medical' ? styles.rowMedical :
                                    call.service_type === 'fire' ? styles.rowFire : styles.rowPolice
                                ]}>
                                    
                                    {isMobile ? (
                                        // MOBILE LAYOUT
                                        <View style={styles.mobileCardInner}>
                                            <View style={styles.mobileCardHeader}>
                                                <View style={styles.typeBadge}>
                                                    <Text style={styles.typeBadgeText}>
                                                        {call.service_type === 'medical' ? 'Medical' : call.service_type === 'fire' ? 'Fire' : 'Assault'}
                                                    </Text>
                                                </View>
                                                <Text style={styles.monoText}>ID: {call.id}</Text>
                                            </View>
                                            
                                            <Text style={styles.mobileLocation} numberOfLines={1}>LOC: {call.location}</Text>
                                            
                                            <View style={styles.mobileDataRow}>
                                                <View style={styles.batteryCell}>
                                                    <Ionicons name={call.battery > 50 ? "battery-full" : "battery-half"} size={14} color={call.battery > 20 ? theme.colors.success : theme.colors.error} />
                                                    <Text style={styles.tableCell}>{call.battery}%</Text>
                                                </View>
                                                <Text style={styles.tableCell}>GPS: {call.gps_precision}</Text>
                                            </View>

                                            <Text style={[styles.tableCell, styles.streamText]} numberOfLines={1}>{call.stream_data}</Text>
                                            
                                            <View style={styles.mobileActionRow}>
                                                {call.status === 'pending' ? (
                                                    <TouchableOpacity style={styles.acceptBtn} onPress={() => handleAcceptCall(call.id)}>
                                                        <Text style={styles.acceptBtnText}>ACCEPT INCIDENT</Text>
                                                    </TouchableOpacity>
                                                ) : call.status === 'accepted' ? (
                                                    <View style={styles.dispatchedBadge}>
                                                        <Text style={styles.dispatchedText}>DISPATCHED</Text>
                                                    </View>
                                                ) : (
                                                    <View style={styles.resolvedBox}>
                                                        <Text style={styles.resolvedLabel}>RESOLVED</Text>
                                                        <Text style={styles.reportText}>Report: {call.report}</Text>
                                                    </View>
                                                )}
                                            </View>
                                        </View>
                                    ) : (
                                        // DESKTOP LAYOUT
                                        <>
                                            <Text style={[styles.tableCell, styles.streamText, { flex: 1.5 }]} numberOfLines={1}>{call.stream_data}</Text>
                                            <Text style={[styles.tableCell, styles.monoText, { flex: 1 }]}>{call.id}</Text>
                                            <View style={[styles.typeBadge, { flex: 1 }]}>
                                                <Text style={styles.typeBadgeText}>
                                                    {call.service_type === 'medical' ? 'Medical' : call.service_type === 'fire' ? 'Fire' : 'Assault'}
                                                </Text>
                                            </View>
                                            <Text style={[styles.tableCell, { flex: 2 }]} numberOfLines={1}>{call.location}</Text>
                                            <View style={[styles.batteryCell, { flex: 0.8 }]}>
                                                <Ionicons name={call.battery > 50 ? "battery-full" : "battery-half"} size={16} color={call.battery > 20 ? theme.colors.success : theme.colors.error} />
                                                <Text style={styles.tableCell}>{call.battery}%</Text>
                                            </View>
                                            <Text style={[styles.tableCell, { flex: 1.2 }]} numberOfLines={1}>{call.gps_precision}</Text>
                                            
                                            <View style={{ flex: 1.5, alignItems: 'center' }}>
                                                {call.status === 'pending' ? (
                                                    <TouchableOpacity style={styles.acceptBtn} onPress={() => handleAcceptCall(call.id)}>
                                                        <Text style={styles.acceptBtnText}>ACCEPT</Text>
                                                    </TouchableOpacity>
                                                ) : (
                                                    <>
                                                        {call.status === 'accepted' && (
                                                            <View style={{ flexDirection: 'row', gap: 10 }}>
                                                                <TouchableOpacity 
                                                                    style={[styles.actionBtn, { backgroundColor: '#fbbf24' }]} 
                                                                    onPress={() => handleArrive(call.id)}
                                                                >
                                                                    <Text style={[styles.actionBtnText, { color: '#000' }]}>ARRIVED</Text>
                                                                </TouchableOpacity>
                                                                <Text style={styles.dispatchedText}>DISPATCHED</Text>
                                                            </View>
                                                        )}
                                                        {call.status === 'arrived' && (
                                                            <View style={{ flexDirection: 'row', gap: 10 }}>
                                                                <TouchableOpacity 
                                                                    style={[styles.actionBtn, { backgroundColor: '#00f3ff' }]} 
                                                                    onPress={() => handleResolve(call.id)}
                                                                >
                                                                    <Text style={[styles.actionBtnText, { color: '#000' }]}>RESOLVE</Text>
                                                                </TouchableOpacity>
                                                                <Text style={[styles.dispatchedText, { color: '#00f3ff' }]}>ARRIVED</Text>
                                                            </View>
                                                        )}
                                                        {call.status === 'resolved' && (
                                                            <View style={{ alignItems: 'flex-end', width: '100%' }}>
                                                                <Text style={[styles.dispatchedText, { color: theme.colors.success }]}>RESOLVED</Text>
                                                                <Text style={[styles.streamText, { textAlign: 'right' }]}>{call.report}</Text>
                                                            </View>
                                                        )}
                                                    </>
                                                )}
                                            </View>
                                        </>
                                    )}

                                </View>
                            ))}
                        </View>
                    </View>

                    {/* ACCEPT & DISPATCH MAP */}
                    <View style={[styles.mapPanel, isMobile && { padding: 10, minHeight: 250 }]}>
                        <View style={styles.panelHeaderRow}>
                            <Text style={styles.panelTitle}>'ACCEPT & DISPATCH' LIFECYCLE</Text>
                            <Text style={styles.panelSubtitle}>(The Rescue Tracker)</Text>
                        </View>
                        <View style={styles.mapWrapper}>
                            <TacticalMap 
                                mode="garda"
                                incidents={sosQueue.map(c => ({
                                    latitude: 53.3498 + (Math.random() * 0.01 - 0.005),
                                    longitude: -6.2603 + (Math.random() * 0.01 - 0.005),
                                    label: (c.service_type || 'INCIDENT').toUpperCase()
                                }))}
                                height={300}
                            />
                            
                            {/* Lifecycle Progress Bar */}
                            <View style={styles.lifecycleBar}>
                                <View style={styles.cycleStep}><View style={[styles.cycleDot, styles.dotGreen]}/><Text style={styles.cycleText}>RECEIVED</Text></View>
                                <View style={styles.cycleLine} />
                                <View style={styles.cycleStep}><View style={[styles.cycleDot, carDispatched ? styles.dotAmber : styles.dotGrey]}/><Text style={styles.cycleText}>ACCEPTED</Text></View>
                                <View style={styles.cycleLine} />
                                <View style={styles.cycleStep}><Animated.View style={[styles.cycleDot, carDispatched ? styles.dotRed : styles.dotGrey, carDispatched && { opacity: pulseAnim }]} /><Text style={styles.cycleText}>DISPATCHED</Text></View>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Bottom Row: Smartwatch Fleet */}
                <View style={[styles.fleetPanel, isMobile && { padding: 10 }]}>
                    <View style={styles.panelHeaderRow}>
                        <Text style={styles.panelTitle}>SMARTWATCH FLEET INTEGRATION</Text>
                        <Text style={styles.panelSubtitle}>(Garmin Command - Live active units: {officers.length})</Text>
                    </View>

                    {/* Table Header (Desktop Only) */}
                    {!isMobile && (
                        <View style={styles.tableHeaderRow}>
                            <Text style={[styles.tableHead, { flex: 1 }]}>UNIT ID</Text>
                            <Text style={[styles.tableHead, { flex: 1.5 }]}>BPM (Heart Rate)</Text>
                            <Text style={[styles.tableHead, { flex: 1 }]}>STRESS</Text>
                            <Text style={[styles.tableHead, { flex: 2 }]}>ALERTS</Text>
                        </View>
                    )}

                    <View style={{ flex: 1 }}>
                        {officers.map((officer) => (
                            <View key={officer.id} style={[
                                isMobile ? styles.mobileCard : styles.tableRow,
                                { marginBottom: isMobile ? 8 : 0 }
                            ]}>
                                {isMobile ? (
                                    // MOBILE LAYOUT
                                    <View style={styles.mobileCardInner}>
                                        <View style={styles.mobileCardHeader}>
                                            <Text style={styles.unitIdText}>Unit {officer.id}</Text>
                                            <Text style={styles.unitNameText}>({officer.name})</Text>
                                        </View>
                                        
                                        <View style={styles.mobileDataRow}>
                                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                                <Text style={[styles.bpmText, officer.bpm > 120 && { color: theme.colors.error }]}>
                                                    BPM: {officer.bpm}
                                                </Text>
                                                {officer.bpm > 120 && <Ionicons name="heart" size={14} color={theme.colors.error} style={{ marginLeft: 4 }} />}
                                            </View>
                                            <Text style={[styles.stressText, { color: officer.stress === 'Critical' || officer.stress === 'High' ? theme.colors.error : theme.colors.warning }]}>
                                                Stress: {officer.stress}
                                            </Text>
                                        </View>

                                        <View style={{ marginTop: 8 }}>
                                            {officer.alerts.map((alert, i) => (
                                                <Text key={i} style={[
                                                    styles.alertText,
                                                    alert === 'No Alerts' ? { color: theme.colors.textSecondary } : { color: theme.colors.error, fontWeight: 'bold' }
                                                ]}>
                                                    ALERTS: [{alert}]
                                                </Text>
                                            ))}
                                        </View>
                                    </View>
                                ) : (
                                    // DESKTOP LAYOUT
                                    <>
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.unitIdText}>Unit {officer.id}</Text>
                                            <Text style={styles.unitNameText}>({officer.name})</Text>
                                        </View>
                                        <View style={{ flex: 1.5, flexDirection: 'row', alignItems: 'center' }}>
                                            <Text style={[styles.bpmText, officer.bpm > 120 && { color: theme.colors.error }]}>
                                                {officer.bpm}
                                            </Text>
                                            <Text style={styles.bpmSub}> ({officer.bpm > 160 ? 'Critical' : officer.bpm > 120 ? 'High Stress' : 'Stable'})</Text>
                                            {officer.bpm > 120 && <Ionicons name="heart" size={14} color={theme.colors.error} style={{ marginLeft: 8 }} />}
                                        </View>
                                        <Text style={[styles.stressText, { flex: 1, color: officer.stress === 'Critical' || officer.stress === 'High' ? theme.colors.error : theme.colors.warning }]}>
                                            {officer.stress}
                                        </Text>
                                        <View style={{ flex: 2 }}>
                                            {officer.alerts.map((alert, i) => (
                                                <Text key={i} style={[
                                                    styles.alertText,
                                                    alert === 'No Alerts' ? { color: theme.colors.textSecondary } : { color: theme.colors.error, fontWeight: 'bold' }
                                                ]}>
                                                    [{alert}]
                                                </Text>
                                            ))}
                                        </View>
                                    </>
                                )}
                            </View>
                        ))}
                    </View>
                </View>
                
                {/* TACTICAL SYSTEM LOG PANEL */}
                <View style={[styles.logPanel, isMobile && { padding: 10 }]}>
                    <View style={styles.panelHeaderRow}>
                        <Text style={styles.panelTitle}>TACTICAL SYSTEM LOG</Text>
                        <Text style={styles.panelSubtitle}>(Real-time encrypted feed)</Text>
                    </View>
                    <View style={styles.logContainer}>
                        {systemLogs.map((log, i) => (
                            <Text key={i} style={[styles.logText, i === 0 && { color: '#00f3ff', fontWeight: 'bold' }]}>
                                {log}
                            </Text>
                        ))}
                    </View>
                </View>

            </ScrollView>
        </View>
    );

    return (
        <JarvisWrapper showRings={false} showTelemetry={true}>
            {viewMode === 'hq' ? renderHQ() : renderDashboard()}
        </JarvisWrapper>
    );
}

const styles = StyleSheet.create({
    // --- Global Colors ---
    // Background: #0f172a (slate-900)
    // Panels: #1e293b (slate-800)
    // Borders: #334155 (slate-700)
    
    // --- HQ View Styles ---
    hqContainer: { flex: 1, backgroundColor: 'transparent' },
    hqHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#00f3ff', backgroundColor: 'rgba(2, 6, 23, 0.6)' },
    hqHeaderLeft: { flexDirection: 'row', alignItems: 'center', width: 200 },
    iconButton: { padding: 8, backgroundColor: 'rgba(56, 189, 248, 0.1)', borderRadius: 8, marginRight: 16 },
    gardaLogo: { width: 40, height: 40 },
    hqTitleContainer: { alignItems: 'center', flex: 1 },
    hqTitle: { fontSize: 28, fontWeight: '900', color: theme.colors.primary, letterSpacing: 2 },
    hqSubtitle: { fontSize: 12, color: theme.colors.textSecondary, letterSpacing: 1, marginTop: 4 },
    hqHeaderRight: { width: 200, alignItems: 'flex-end' },
    shieldIcon: { opacity: 0.8 },
    
    hqBody: { flex: 1, flexDirection: isWeb ? 'row' : 'column', padding: 20, gap: 20 },
    hqLeftPanel: { flex: 1, backgroundColor: 'rgba(0, 243, 255, 0.05)', borderRadius: 8, padding: 20, borderWidth: 1, borderColor: '#00f3ff' },
    hqCenterPanel: { flex: 2, backgroundColor: 'rgba(0, 243, 255, 0.05)', borderRadius: 8, borderWidth: 1, borderColor: '#00f3ff', overflow: 'hidden' },
    hqRightPanel: { flex: 1, backgroundColor: 'rgba(0, 243, 255, 0.05)', borderRadius: 8, padding: 20, borderWidth: 1, borderColor: '#00f3ff' },
    
    panelTitle: { color: theme.colors.primary, fontSize: 14, fontWeight: 'bold', letterSpacing: 1, marginBottom: 16 },
    panelSubtitle: { color: theme.colors.textSecondary, fontSize: 12, marginBottom: 16, marginTop: -12 },
    
    hqStatCard: { backgroundColor: '#0f172a', padding: 20, borderRadius: 8, marginBottom: 16, borderWidth: 1, borderColor: '#334155', alignItems: 'center' },
    hqStatValue: { fontSize: 36, fontWeight: 'bold', color: theme.colors.text },
    hqStatLabel: { fontSize: 10, color: theme.colors.textSecondary, letterSpacing: 1, marginTop: 4 },
    
    searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0f172a', borderRadius: 8, paddingHorizontal: 12, marginBottom: 16, borderWidth: 1, borderColor: '#334155' },
    searchIcon: { marginRight: 8 },
    searchInput: { flex: 1, paddingVertical: 12, color: theme.colors.text },
    
    stationList: { paddingBottom: 20 },
    stationCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#334155' },
    stationCardTitle: { color: theme.colors.text, fontWeight: 'bold', fontSize: 14 },
    stationCardSub: { color: theme.colors.textSecondary, fontSize: 10, marginTop: 4 },

    // --- Dashboard (Station) View Styles ---
    dashboardContainer: { flex: 1, backgroundColor: 'transparent' },
    dashHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#00f3ff', backgroundColor: 'rgba(2, 6, 23, 0.6)' },
    dashHeaderLeft: { flexDirection: 'row', alignItems: 'center' },
    dashTitle: { fontSize: 18, fontWeight: '900', color: theme.colors.text, letterSpacing: 1 },
    dashSubtitle: { fontSize: 12, color: theme.colors.primary, letterSpacing: 0.5, marginTop: 2 },
    dashHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    statusText: { color: theme.colors.primary, fontSize: 12, fontWeight: 'bold', letterSpacing: 1 },
    
    dashBody: { flex: 1 },
    dashBodyContent: { padding: 20, gap: 20 },
    
    topRow: { flexDirection: isWeb && globalWidth > 1000 ? 'row' : 'column', gap: 20, minHeight: 400 },
    
    // Triage Queue Panel
    triagePanel: { flex: 1.2, backgroundColor: 'rgba(0, 243, 255, 0.05)', borderRadius: 8, padding: 20, borderWidth: 1, borderColor: '#00f3ff' },
    panelHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
    tabContainer: { flexDirection: 'row', backgroundColor: 'rgba(0, 243, 255, 0.1)', borderRadius: 4, padding: 4 },
    tab: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 4 },
    activeTab: { backgroundColor: 'rgba(0, 243, 255, 0.2)', borderWidth: 1, borderColor: '#00f3ff' },
    tabText: { color: 'rgba(0, 243, 255, 0.5)', fontSize: 10, fontWeight: 'bold', fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
    activeTabText: { color: '#00f3ff' },
    
    tableHeaderRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: theme.colors.primary, paddingBottom: 8, marginBottom: 8 },
    tableHead: { color: theme.colors.primary, fontSize: 10, fontWeight: 'bold', letterSpacing: 0.5 },
    tableBody: { flex: 1 },
    
    // Row layout for Desktop
    tableRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(0, 243, 255, 0.3)' },
    
    // Card Layout for Mobile
    mobileCard: { padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#334155', marginBottom: 8 },
    mobileCardInner: { flex: 1, gap: 8 },
    mobileCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    mobileLocation: { color: theme.colors.text, fontSize: 14, fontWeight: 'bold' },
    mobileDataRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', padding: 8, borderRadius: 4 },
    mobileActionRow: { marginTop: 8 },

    rowMedical: { backgroundColor: 'rgba(16, 185, 129, 0.03)' },
    rowFire: { backgroundColor: 'rgba(239, 68, 68, 0.03)' },
    rowPolice: { backgroundColor: 'rgba(56, 189, 248, 0.03)' },
    
    tableCell: { color: theme.colors.text, fontSize: 12 },
    streamText: { color: theme.colors.textSecondary, fontStyle: 'italic', fontSize: 10 },
    monoText: { fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', color: theme.colors.text },
    
    typeBadge: { alignSelf: 'flex-start', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.1)' },
    typeBadgeText: { color: theme.colors.text, fontSize: 10, fontWeight: 'bold' },
    
    batteryCell: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    
    acceptBtn: { backgroundColor: 'rgba(56, 189, 248, 0.1)', borderWidth: 1, borderColor: theme.colors.primary, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 4, alignItems: 'center' },
    acceptBtnText: { color: theme.colors.primary, fontWeight: 'bold', fontSize: 12 },
    actionBtn: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 4,
        justifyContent: 'center',
        alignItems: 'center',
    },
    actionBtnText: {
        fontSize: 10,
        fontWeight: '900',
    },
    dispatchedBadge: {
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: theme.colors.success,
    },
    dispatchedText: { color: theme.colors.success, fontSize: 12, fontWeight: 'bold', letterSpacing: 1 },
    resolvedBox: { backgroundColor: 'rgba(34, 197, 94, 0.1)', padding: 8, borderRadius: 4, borderWidth: 1, borderColor: 'rgba(34, 197, 94, 0.3)' },
    resolvedLabel: { color: theme.colors.success, fontSize: 10, fontWeight: 'bold', marginBottom: 4 },
    reportText: { color: theme.colors.textSecondary, fontSize: 10, fontStyle: 'italic' },
    
    // Map Panel
    mapPanel: { flex: 1, backgroundColor: 'rgba(0, 243, 255, 0.05)', borderRadius: 8, padding: 20, borderWidth: 1, borderColor: '#00f3ff' },
    mapWrapper: { flex: 1, gap: 16 },
    mapContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a' },
    mapMarker: { position: 'absolute', width: 12, height: 12, borderRadius: 6, backgroundColor: theme.colors.primary, ...theme.shadows.medium },
    mapPlaceholderBg: { flex: 1, backgroundColor: '#0f172a', borderRadius: 8, borderWidth: 1, borderColor: '#334155', position: 'relative', overflow: 'hidden', justifyContent: 'center', alignItems: 'center' },
    gridOverlay: { ...StyleSheet.absoluteFillObject, opacity: 0.1, backgroundImage: 'linear-gradient(#38bdf8 1px, transparent 1px), linear-gradient(90deg, #38bdf8 1px, transparent 1px)', backgroundSize: '20px 20px' } as any,
    mapPlaceholderText: { color: theme.colors.textSecondary, fontSize: 14, letterSpacing: 2, opacity: 0.5 },
    mapEntity: { position: 'absolute', alignItems: 'center' },
    entityIcon: { width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#fff', ...theme.shadows.small },
    entityLabel: { backgroundColor: 'rgba(0,0,0,0.7)', color: '#fff', fontSize: 10, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginTop: 4, overflow: 'hidden' },
    routeLine: { position: 'absolute', top: 12, right: 24, width: 60, height: 2, backgroundColor: theme.colors.warning, borderStyle: 'dashed' },
    etaText: { position: 'absolute', bottom: 16, backgroundColor: 'rgba(0,0,0,0.8)', color: theme.colors.warning, padding: 8, borderRadius: 8, fontWeight: 'bold', fontSize: 12 },
    
    lifecycleBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#0f172a', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#334155' },
    cycleStep: { alignItems: 'center', gap: 4 },
    cycleDot: { width: 12, height: 12, borderRadius: 6 },
    dotGreen: { backgroundColor: theme.colors.success },
    dotAmber: { backgroundColor: theme.colors.warning },
    dotRed: { backgroundColor: theme.colors.error, ...theme.shadows.medium },
    dotGrey: { backgroundColor: '#334155' },
    cycleText: { color: theme.colors.textSecondary, fontSize: 10, fontWeight: 'bold' },
    cycleLine: { flex: 1, height: 2, backgroundColor: '#334155', marginHorizontal: 8 },
    
    // Fleet Panel
    fleetPanel: { backgroundColor: 'rgba(0, 243, 255, 0.05)', borderRadius: 8, padding: 20, borderWidth: 1, borderColor: '#00f3ff' },
    unitIdText: { color: theme.colors.text, fontWeight: 'bold', fontSize: 14 },
    unitNameText: { color: theme.colors.textSecondary, fontSize: 12, marginTop: 2 },
    bpmText: { color: theme.colors.success, fontSize: 16, fontWeight: 'bold' },
    bpmSub: { color: theme.colors.textSecondary, fontSize: 10 },
    stressText: { fontSize: 14, fontWeight: 'bold' },
    alertText: { fontSize: 12 },
    
    // Log Styles
    logPanel: {
        backgroundColor: 'rgba(2, 6, 23, 0.4)',
        borderWidth: 1,
        borderColor: 'rgba(0, 243, 255, 0.2)',
        padding: 20,
        margin: 20,
        borderRadius: 4,
    },
    logContainer: {
        marginTop: 10,
    },
    logText: {
        color: 'rgba(0, 243, 255, 0.6)',
        fontSize: 10,
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
        marginBottom: 4,
    },
});
