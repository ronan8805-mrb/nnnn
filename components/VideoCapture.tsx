import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Platform } from 'react-native';
import { Camera, CameraView, useCameraPermissions } from 'expo-camera';
import * as FileSystem from 'expo-file-system';
import axios from 'axios';
import { theme } from '../styles/theme';

const API_URL = 'http://localhost:8000';

interface VideoCaptureProps {
    sosId: number | null;
    isSilent?: boolean;
}

export default function VideoCapture({ sosId, isSilent = false }: VideoCaptureProps) {
    const [permission, requestPermission] = Platform.OS === 'web' 
        ? [{ granted: true }, async () => ({ granted: true })]
        : useCameraPermissions();
    const [isRecording, setIsRecording] = useState(false);
    const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
    const cameraRef = useRef<any>(null);

    useEffect(() => {
        if (!permission?.granted) {
            requestPermission();
        }
    }, [permission]);

    // In silent mode, maybe we don't start recording or we start without showing preview?
    // Let's just record automatically when we have an sosId and are not silent
    useEffect(() => {
        if (sosId && permission?.granted && !isRecording && !recordedUrl && !isSilent) {
            startRecording();
        }
    }, [sosId, permission, isSilent]);

    const startRecording = async () => {
        if (cameraRef.current) {
            setIsRecording(true);
            try {
                // Record a 10s clip for evidence
                const videoRecordPromise = cameraRef.current.recordAsync({
                    maxDuration: 10,
                });
                
                const videoData = await videoRecordPromise;
                setIsRecording(false);
                setRecordedUrl(videoData.uri);
                console.log('Video recorded to', videoData.uri);
                
                // In a real app we'd upload it to S3 here
                // For now, let's just log it
            } catch (e) {
                console.error("Failed to record video", e);
                setIsRecording(false);
            }
        }
    };

    if (!permission) {
        return <View />;
    }

    if (!permission.granted) {
        return (
            <View style={styles.container}>
                <Text style={{ textAlign: 'center', color: '#fff' }}>We need your permission to show the camera</Text>
            </View>
        );
    }

    // Hide preview completely in silent mode or on web
    if (isSilent || Platform.OS === 'web') {
        return null;
    }

    return (
        <View style={styles.container}>
            <View style={styles.cameraContainer}>
                {!recordedUrl ? (
                    <CameraView
                        style={styles.camera}
                        ref={cameraRef}
                        facing="front"
                        mode="video"
                    >
                        {isRecording && (
                            <View style={styles.recordingIndicator}>
                                <View style={styles.redDot} />
                                <Text style={styles.recordingText}>RECORDING EVIDENCE</Text>
                            </View>
                        )}
                    </CameraView>
                ) : (
                    <View style={styles.recordedContainer}>
                        <Text style={styles.recordedText}>✅ Evidence Saved</Text>
                    </View>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        zIndex: -1,
        backgroundColor: '#000',
    },
    cameraContainer: {
        flex: 1,
    },
    camera: {
        flex: 1,
        justifyContent: 'flex-start',
        padding: 16,
    },
    recordingIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
        padding: 8,
        borderRadius: 8,
        alignSelf: 'flex-start',
    },
    redDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: theme.colors.sos,
        marginRight: 8,
    },
    recordingText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 12,
    },
    recordedContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
    },
    recordedText: {
        color: '#22c55e',
        fontWeight: 'bold',
        fontSize: 16,
    }
});
