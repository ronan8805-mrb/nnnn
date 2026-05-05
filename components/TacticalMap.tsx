import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, Platform, Dimensions } from 'react-native';
import { WebView } from 'react-native-webview';

const { width: windowWidth, height: windowHeight } = Dimensions.get('window');

interface MapProps {
    mode: 'citizen' | 'garda' | 'safe-walk';
    userLocation?: { latitude: number; longitude: number };
    gardaLocation?: { latitude: number; longitude: number };
    routePath?: { latitude: number; longitude: number }[];
    incidents?: { latitude: number; longitude: number; label: string }[];
    height?: number;
    width?: number;
}

const TacticalMap: React.FC<MapProps> = ({ 
    mode, 
    userLocation = { latitude: 53.3498, longitude: -6.2603 },
    gardaLocation,
    routePath = [],
    incidents = [],
    height = windowHeight,
    width = windowWidth
}) => {
    const webViewRef = useRef<any>(null);

    const getMapHTML = () => {
        return `
<!DOCTYPE html>
<html>
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <style>
        body { margin:0; padding:0; background:#020617; overflow: hidden; }
        #map { height: 100vh; width: 100vw; background:#020617; }
        .leaflet-container { background: #020617 !important; }
        
        /* Map Vibrancy Filter */
        .leaflet-tile-container {
            filter: brightness(0.6) contrast(1.2) sepia(0.5) hue-rotate(180deg) saturate(2);
        }

        /* Jarvis Marker Styling */
        .jarvis-marker {
            background: rgba(0, 243, 255, 0.4);
            border: 2px solid #00f3ff;
            border-radius: 50%;
            width: 24px !important;
            height: 24px !important;
            box-shadow: 0 0 15px #00f3ff, inset 0 0 10px #00f3ff;
        }
        .jarvis-pulse {
            width: 50px; height: 50px;
            border-radius: 50%;
            background: rgba(0, 243, 255, 0.2);
            border: 2px solid #00f3ff;
            position: absolute;
            top: -15px; left: -15px;
            animation: pulse 2s infinite;
        }
        @keyframes pulse {
            0% { transform: scale(0.5); opacity: 1; }
            100% { transform: scale(2); opacity: 0; }
        }

        .garda-marker {
            background: rgba(56, 189, 248, 0.2);
            border: 2px solid #38bdf8;
            border-radius: 50%;
            width: 24px !important;
            height: 24px !important;
            display: flex;
            justify-content: center;
            align-items: center;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div id="map"></div>
    <script>
        const map = L.map('map', { zoomControl: false }).setView([${userLocation.latitude}, ${userLocation.longitude}], 15);
        
        L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
            attribution: 'Esri'
        }).addTo(map);

        L.tileLayer('https://stamen-tiles-{s}.a.ssl.fastly.net/toner-labels/{z}/{x}/{y}{r}.png', {
            opacity: 0.7
        }).addTo(map);

        // Heatspots (Universal Layer)
        L.circle([53.348, -6.261], { radius: 300, color: '#fbbf24', weight: 0, fillOpacity: 0.4 }).addTo(map);
        L.circle([53.355, -6.255], { radius: 500, color: '#ef4444', weight: 0, fillOpacity: 0.5 }).addTo(map);

        const markersLayer = L.layerGroup().addTo(map);

        function updateMap() {
            markersLayer.clearLayers();
            
            // Mode-specific rendering
            if ('${mode}' === 'citizen') {
                const icon = L.divIcon({ className: 'jarvis-marker', html: '<div class="jarvis-pulse"></div>' });
                L.marker([${userLocation.latitude}, ${userLocation.longitude}], {icon}).addTo(markersLayer);
            } 
            else if ('${mode}' === 'garda') {
                // Show incidents
                ${JSON.stringify(incidents)}.forEach(inc => {
                    L.circle([inc.latitude, inc.longitude], { radius: 150, color: '#ef4444', weight: 2, fillOpacity: 0.3 }).addTo(markersLayer).bindPopup(inc.label);
                });
                // Show patrols
                const patrolIcon = L.divIcon({ className: 'garda-marker', html: '🚓' });
                L.marker([53.353, -6.262], {icon: patrolIcon}).addTo(markersLayer).bindPopup('Garda Unit 3A');
            } 
            else if ('${mode}' === 'safe-walk') {
                const path = ${JSON.stringify(routePath)};
                if (path.length > 0) {
                    L.polyline(path.map(p => [p.latitude, p.longitude]), {color: '#00f3ff', weight: 3, dashArray: '10, 10'}).addTo(markersLayer);
                    const dest = path[path.length - 1];
                    L.marker([dest.latitude, dest.longitude]).addTo(markersLayer).bindPopup('DESTINATION');
                }
                // User location
                const icon = L.divIcon({ className: 'jarvis-marker', html: '<div class="jarvis-pulse"></div>' });
                L.marker([${userLocation.latitude}, ${userLocation.longitude}], {icon}).addTo(markersLayer);

                // Garda location
                if (${!!gardaLocation}) {
                    const gardaIcon = L.divIcon({ className: 'garda-marker', html: '🚓' });
                    L.marker([${gardaLocation?.latitude || 0}, ${gardaLocation?.longitude || 0}], {icon: gardaIcon}).addTo(markersLayer).bindPopup('RESPONDING UNIT');
                }
            }
        }

        updateMap();

        window.addEventListener('message', (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.type === 'updateLocation') {
                    map.setView([data.lat, data.lng]);
                    updateMap();
                }
            } catch(e) {}
        });
    </script>
</body>
</html>
        `;
    };

    return (
        <View style={{ width, height, overflow: 'hidden' }}>
            {Platform.OS === 'web' ? (
                <iframe 
                    srcDoc={getMapHTML()}
                    style={{ width: '100%', height: '100%', border: 'none' }}
                />
            ) : (
                <WebView 
                    ref={webViewRef}
                    source={{ html: getMapHTML() }} 
                    style={{ flex: 1, backgroundColor: '#020617' }}
                />
            )}
        </View>
    );
};

export default TacticalMap;
