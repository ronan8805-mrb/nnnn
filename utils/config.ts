import { Platform } from 'react-native';

// Central API configuration for SLÁN
// In production, set EXPO_PUBLIC_API_URL environment variable on Vercel
// e.g., EXPO_PUBLIC_API_URL=https://slan-api.onrender.com

const getApiUrl = (): string => {
    // Check for environment variable first (production)
    if (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_API_URL) {
        return process.env.EXPO_PUBLIC_API_URL;
    }
    // Fallback to localhost for development
    return 'http://localhost:8000';
};

export const API_URL = getApiUrl();
