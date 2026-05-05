import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const QUEUE_KEY = '@slan_offline_queue';
const API_URL = 'http://localhost:8000';

export interface QueuedAlert {
    id: string;
    type: 'sos' | 'silent_sos' | 'safe_checkin' | 'crime_report';
    user_id: number;
    latitude: number;
    longitude: number;
    timestamp: string;
    metadata?: Record<string, any>;
    retryCount: number;
}

/**
 * Add an alert to the offline queue.
 * Used when network is unavailable — queued alerts flush when connectivity returns.
 */
export async function enqueueAlert(alert: Omit<QueuedAlert, 'id' | 'retryCount'>): Promise<void> {
    try {
        const existing = await getQueue();
        const newAlert: QueuedAlert = {
            ...alert,
            id: `offline_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
            retryCount: 0,
        };
        existing.push(newAlert);
        await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(existing));
        console.log(`[Offline Queue] Enqueued ${alert.type} alert. Queue size: ${existing.length}`);
    } catch (e) {
        console.error('[Offline Queue] Failed to enqueue:', e);
    }
}

/**
 * Get all queued alerts.
 */
export async function getQueue(): Promise<QueuedAlert[]> {
    try {
        const raw = await AsyncStorage.getItem(QUEUE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

/**
 * Get the count of pending alerts in queue.
 */
export async function getQueueCount(): Promise<number> {
    const queue = await getQueue();
    return queue.length;
}

/**
 * Flush the offline queue — send all queued alerts to the backend.
 * Called automatically when network connectivity is restored.
 * Returns the number of successfully sent alerts.
 */
export async function flushQueue(): Promise<number> {
    const queue = await getQueue();
    if (queue.length === 0) return 0;

    console.log(`[Offline Queue] Flushing ${queue.length} queued alerts...`);
    const failed: QueuedAlert[] = [];
    let successCount = 0;

    for (const alert of queue) {
        try {
            switch (alert.type) {
                case 'sos':
                    await axios.post(`${API_URL}/emergency`, {
                        user_id: alert.user_id,
                        latitude: alert.latitude,
                        longitude: alert.longitude,
                    });
                    break;
                case 'silent_sos':
                    await axios.post(`${API_URL}/emergency/silent`, {
                        user_id: alert.user_id,
                        latitude: alert.latitude,
                        longitude: alert.longitude,
                        is_silent: true,
                    });
                    break;
                case 'safe_checkin':
                    await axios.post(`${API_URL}/safe-checkin`, {
                        user_id: alert.user_id,
                        latitude: alert.latitude,
                        longitude: alert.longitude,
                    });
                    break;
                case 'crime_report':
                    await axios.post(`${API_URL}/report-crime`, {
                        user_id: alert.user_id,
                        latitude: alert.latitude,
                        longitude: alert.longitude,
                        ...alert.metadata,
                    });
                    break;
            }
            successCount++;
            console.log(`[Offline Queue] Sent ${alert.type} (${alert.id})`);
        } catch (e) {
            alert.retryCount += 1;
            if (alert.retryCount < 5) {
                failed.push(alert);
                console.log(`[Offline Queue] Retry ${alert.retryCount}/5 for ${alert.id}`);
            } else {
                console.log(`[Offline Queue] Dropped ${alert.id} after 5 retries`);
            }
        }
    }

    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(failed));
    console.log(`[Offline Queue] Flush complete. Sent: ${successCount}, Remaining: ${failed.length}`);
    return successCount;
}

/**
 * Clear the entire offline queue.
 */
export async function clearQueue(): Promise<void> {
    await AsyncStorage.removeItem(QUEUE_KEY);
}
