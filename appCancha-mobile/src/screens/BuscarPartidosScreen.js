// src/screens/BuscarActividadesScreen.js
// Pantalla para ver invitaciones públicas ("Falta 1 participante - Unirse")
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Modal,
  ScrollView,
  Image,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../constants';
import { invitacionService } from '../services/invitacionService';
import { useAuth } from '../contexts/AuthContext';

const DEPORTES_ICONS = {
  'FUTBOL 5': 'football-outline',
  'FUTBOL 11': 'football-outline',
  'PADEL': 'tennisball-outline',
  'TENIS': 'tennisball-outline',
  'BASQUET': 'basketball-outline',
  'VOLEY': 'basketball-outline',
  'NATACION': 'water-outline',
  'GIMNASIO': 'fitness-outline',
  'YOGA': 'meditate-outline',
  'PILATES': 'body-outline',
};

const GENERO_LABELS = {
  'MASCULINO': 'Solo hombres',
  'FEMENINO': 'Solo mujeres',
  'INDISTINTO': 'Mixto',
};

export default function BuscarActividadesScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  
  const [invitaciones, setInvitaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filtroDeporte, setFiltroDeporte] = useState(null);
  const [joining, setJoining] = useState(null);

  useEffect(() => {
    loadInvitaciones();
  }, [filtroDeporte]);

  const loadInvitaciones = async () => {
    try {
      setLoading(true);
      const response = await invitacionService.getInvitacionesPublicas({
        deporte: filtroDeporte
      });
      if (response.success) {
        setInvitaciones(response.data || []);
      }
    } catch (error) {
      console.log('Error cargando invitaciones:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadInvitaciones();
  }, [filtroDeporte]);

  const handleSolicitarUnirse = async (invitacionId) => {
    setJoining(invitacionId);
    try {
      await invitacionService.solicitarUnirse(invitacionId);
      // Actualizar la lista
      loadInvitaciones();
    } catch (error) {
      console.log('Error solicitando unirse:', error);
      Alert.alert('Error', error.response?.data?.message || 'No se pudo enviar la solicitud');
    } finally {
      setJoining(null);
    }
  };

  const formatFecha = (fechaStr) => {
    const fecha = new Date(fechaStr);
    const hoy = new Date();
    const mañana = new Date(hoy);
    mañana.setDate(hoy.getDate() + 1);

    if (fecha.toDateString() === hoy.toDateString()) {
      return 'Hoy';
    } else if (fecha.toDateString() === mañana.toDateString()) {
      return 'Mañana';
    } else {
      return fecha.toLocaleDateString('es-AR', { 
        weekday: 'short', 
        day: 'numeric', 
        month: 'short' 
      });
    }
  };

  const PartidoCard = ({ invitacion }) => {
    const { reserva, invitador, generoRequerido, cuposDisponibles, cuposOcupados } = invitacion;
    const cuposLibres = cuposDisponibles - cuposOcupados;
    const isJoining = joining === invitacion.id;

    return (
      <View style={styles.partidoCard}>
        {/* Header con deporte y fecha */}
        <View style={styles.partidoHeader}>
          <View style={styles.deporteBadge}>
            <Ionicons 
              name={DEPORTES_ICONS[reserva.cancha?.deporte] || 'football-outline'} 
              size={16} 
              color={COLORS.white} 
            />
            <Text style={styles.deporteText}>{reserva.cancha?.deporte}</Text>
          </View>
          <View style={styles.fechaContainer}>
            <Text style={styles.fechaText}>{formatFecha(reserva.fecha)}</Text>
            <Text style={styles.horaText}>{reserva.horaInicio} hs</Text>
          </View>
        </View>

        {/* Info de la cancha */}
        <Text style={styles.canchaNombre}>{reserva.cancha?.nombre}</Text>
        <View style={styles.ubicacionRow}>
          <Ionicons name="location-outline" size={14} color={COLORS.gray} />
          <Text style={styles.ubicacionText}>
            {reserva.cancha?.direccion || reserva.cancha?.ciudad || 'Sin ubicación'}
          </Text>
        </View>

        {/* Organizador */}
        <View style={styles.organizadorRow}>
          <View style={styles.organizadorAvatar}>
            <Text style={styles.organizadorAvatarText}>
              {invitador.nombre?.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.organizadorInfo}>
            <Text style={styles.organizadorLabel}>Organiza</Text>
            <Text style={styles.organizadorNombre}>
              {invitador.nombre} {invitador.apellido}
            </Text>
          </View>
          <TouchableOpacity 
            style={styles.verPerfilButton}
            onPress={() => navigation.navigate('PerfilJugador', { userId: invitador.id })}
          >
            <Text style={styles.verPerfilText}>Ver perfil</Text>
          </TouchableOpacity>
        </View>

        {/* Info adicional */}
        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <Ionicons name="people-outline" size={16} color={COLORS.primary} />
            <Text style={styles.infoText}>
              {cuposLibres} {cuposLibres === 1 ? 'lugar' : 'lugares'}
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons 
              name={generoRequerido === 'MASCULINO' ? 'male' : generoRequerido === 'FEMENINO' ? 'female' : 'people'} 
              size={16} 
              color={COLORS.primary} 
            />
            <Text style={styles.infoText}>{GENERO_LABELS[generoRequerido]}</Text>
          </View>
        </View>

        {/* Botón unirse */}
        <TouchableOpacity
          style={[styles.unirseButton, isJoining && styles.unirseButtonDisabled]}
          onPress={() => handleSolicitarUnirse(invitacion.id)}
          disabled={isJoining}
        >
          {isJoining ? (
            <ActivityIndicator size="small" color={COLORS.white} />
          ) : (
            <>
              <Ionicons name="hand-right-outline" size={20} color={COLORS.white} />
              <Text style={styles.unirseButtonText}>Solicitar unirme</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Buscar actividades</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Subtítulo */}
      <View style={styles.subtitleContainer}>
        <Ionicons name="megaphone-outline" size={20} color={COLORS.primary} />
        <Text style={styles.subtitleText}>Actividades que buscan participantes</Text>
      </View>

      {/* Filtros de deporte */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.filtrosContainer}
        contentContainerStyle={styles.filtrosContent}
      >
        <TouchableOpacity
          style={[styles.filtroChip, !filtroDeporte && styles.filtroChipActive]}
          onPress={() => setFiltroDeporte(null)}
        >
          <Text style={[styles.filtroText, !filtroDeporte && styles.filtroTextActive]}>
            Todos
          </Text>
        </TouchableOpacity>
        {['FUTBOL 5', 'FUTBOL 11', 'PADEL', 'TENIS', 'NATACION', 'GIMNASIO', 'YOGA', 'PILATES'].map((deporte) => (
          <TouchableOpacity
            key={deporte}
            style={[styles.filtroChip, filtroDeporte === deporte && styles.filtroChipActive]}
            onPress={() => setFiltroDeporte(deporte)}
          >
            <Ionicons 
              name={DEPORTES_ICONS[deporte]} 
              size={16} 
              color={filtroDeporte === deporte ? COLORS.white : COLORS.primary} 
            />
            <Text style={[styles.filtroText, filtroDeporte === deporte && styles.filtroTextActive]}>
              {deporte}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Lista de partidos */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : invitaciones.length > 0 ? (
        <FlatList
          data={invitaciones}
          renderItem={({ item }) => <PartidoCard invitacion={item} />}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[COLORS.primary]}
            />
          }
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="search-outline" size={64} color={COLORS.lightGray} />
          <Text style={styles.emptyTitle}>No hay actividades disponibles</Text>
          <Text style={styles.emptyText}>
            No encontramos actividades que busquen participantes en este momento. ¡Volvé a intentar más tarde!
          </Text>
          <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
            <Ionicons name="refresh" size={18} color={COLORS.primary} />
            <Text style={styles.refreshButtonText}>Actualizar</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.white,
  },
  subtitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  subtitleText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.black,
  },
  filtrosContainer: {
    backgroundColor: COLORS.white,
    maxHeight: 56,
  },
  filtrosContent: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  filtroChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: COLORS.primary + '15',
    marginRight: 8,
    gap: 6,
  },
  filtroChipActive: {
    backgroundColor: COLORS.primary,
  },
  filtroText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
  },
  filtroTextActive: {
    color: COLORS.white,
  },
  listContent: {
    padding: 16,
  },
  partidoCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  partidoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  deporteBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    gap: 6,
  },
  deporteText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.white,
  },
  fechaContainer: {
    alignItems: 'flex-end',
  },
  fechaText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.black,
  },
  horaText: {
    fontSize: 13,
    color: COLORS.gray,
  },
  canchaNombre: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.black,
    marginBottom: 4,
  },
  ubicacionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 12,
  },
  ubicacionText: {
    fontSize: 13,
    color: COLORS.gray,
  },
  organizadorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    padding: 10,
    borderRadius: 10,
    marginBottom: 12,
  },
  organizadorAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  organizadorAvatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
  },
  organizadorInfo: {
    flex: 1,
    marginLeft: 10,
  },
  organizadorLabel: {
    fontSize: 11,
    color: COLORS.gray,
  },
  organizadorNombre: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.black,
  },
  verPerfilButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  verPerfilText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
  },
  infoRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 14,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoText: {
    fontSize: 13,
    color: COLORS.gray,
  },
  unirseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  unirseButtonDisabled: {
    opacity: 0.6,
  },
  unirseButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.white,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.black,
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.gray,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    backgroundColor: COLORS.primary + '15',
    gap: 8,
  },
  refreshButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
});
