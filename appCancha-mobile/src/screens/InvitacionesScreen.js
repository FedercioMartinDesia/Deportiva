// appCancha-mobile/src/screens/InvitacionesScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants';
import { notificacionService } from '../services/notificacionService';
import { Linking } from 'react-native';

export default function InvitacionesScreen() {
  const [invitaciones, setInvitaciones] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInvitaciones();
  }, []);

  const loadInvitaciones = async () => {
    try {
      const data = await notificacionService.getInvitacionesPendientes();
      setInvitaciones(data);
    } catch (error) {
      Alert.alert('Error', 'No se pudieron cargar las invitaciones');
    } finally {
      setLoading(false);
    }
  };

  const handlePagar = (link) => {
    // Abrir el link de pago en el browser o WebView
    Linking.openURL(link);
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.titulo}>{item.titulo}</Text>
        <Text style={styles.fecha}>{new Date(item.createdAt).toLocaleDateString()}</Text>
      </View>
      <Text style={styles.mensaje}>{item.mensaje}</Text>
      <TouchableOpacity
        style={styles.payButton}
        onPress={() => handlePagar(item.data.linkPago)}
      >
        <Ionicons name="card" size={20} color={COLORS.white} />
        <Text style={styles.payButtonText}>Pagar mi parte</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={invitaciones}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={<Text style={styles.empty}>No tenés invitaciones pendientes</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  card: {
    backgroundColor: '#f9f9f9',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  titulo: { fontSize: 16, fontWeight: '700', color: COLORS.black },
  fecha: { fontSize: 12, color: COLORS.gray },
  mensaje: { fontSize: 14, color: COLORS.black, marginBottom: 12 },
  payButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    borderRadius: 8,
  },
  payButtonText: { fontSize: 14, fontWeight: '600', color: COLORS.white },
  empty: { textAlign: 'center', color: COLORS.gray, marginTop: 40 },
});