import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';

// MapWebView: recibe props { markers: [{ id, nombre, latitud, longitud, address }], center: {lat,lon}, zoom }
export default function MapWebView({ markers = [], center = null, zoom = 13, onMarkerPress }) {
  const html = useMemo(() => {
    const markersJson = JSON.stringify(markers.map(m => ({ id: m.id, nombre: m.nombre, lat: m.latitud, lon: m.longitud, address: m.direccion || '' })));

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta name="viewport" content="initial-scale=1.0, maximum-scale=1.0" />
        <style>html,body,#map{height:100%;margin:0;padding:0}</style>
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      </head>
      <body>
        <div id="map"></div>
        <script>
          (function(){
            const markers = ${markersJson};
            const center = ${center ? JSON.stringify({ lat: center.latitude, lon: center.longitude }) : 'null'};
            const defaultCenter = center || (markers.length>0 ? { lat: markers[0].lat, lon: markers[0].lon } : { lat: 0, lon: 0 });
            const map = L.map('map').setView([defaultCenter.lat, defaultCenter.lon], ${zoom});
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '' }).addTo(map);

            markers.forEach(m => {
              if (m.lat && m.lon) {
                const marker = L.marker([m.lat, m.lon]).addTo(map);
                marker.bindPopup('<b>' + m.nombre + '</b><br/>' + (m.address || ''));
                marker.on('click', function(){
                  // Post message to React Native with marker id
                  window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'marker_click', id: m.id }));
                });
              }
            });

            // Fit bounds if multiple
            try {
              const coords = markers.filter(m=>m.lat && m.lon).map(m=>[m.lat,m.lon]);
              if (coords.length>1) {
                map.fitBounds(coords, { padding: [40,40] });
              }
            } catch(e){}
          })();
        </script>
      </body>
      </html>
    `;
  }, [markers, center, zoom]);

  const handleMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data && data.type === 'marker_click' && onMarkerPress) {
        onMarkerPress(data.id);
      }
    } catch (e) {
      // ignore
    }
  };

  return (
    <View style={styles.container}>
      <WebView originWhitelist={["*"]} source={{ html }} onMessage={handleMessage} style={styles.webview} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, overflow: 'hidden' },
  webview: { flex: 1, backgroundColor: 'transparent' }
});
