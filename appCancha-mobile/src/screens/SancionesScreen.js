import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Image,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS } from '../constants';
import { sancionService } from '../services/sancionService';

const TIPO_SANCION_INFO = {
  BANEADO: {
    label: 'Baneado',
    icon: 'ban',
    color: '#E53935',
    bgColor: '#FFEBEE',
    description: 'No puede reservar en este espacio'
  },
  ADVERTIDO: {
    label: 'Fuera de Juego',
    icon: 'warning',
    color: '#FF9800',
    bgColor: '#FFF3E0',
    description: 'Advertencia activa'
  },
  OBSERVADO: {
    label: 'En Observación',
    icon: 'eye',
    color: '#2196F3',
    bgColor: '#E3F2FD',
    description: 'Se te alertará cuando reserve'
  }
};

export default function SancionesScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [sanciones, setSanciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [liftedParticipante, setLiftedParticipante] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [sancionToLift, setSancionToLift] = useState(null);
  const [lifting, setLifting] = useState(false);

  const loadSanciones = async () => {
    try {
      setLoading(true);
      const response = await sancionService.getMisSanciones();
      if (response.success) {
        setSanciones(response.data || []);
      }
    } catch (error) {
      console.error('Error cargando sanciones:', error);
      Alert.alert('Error', 'No se pudieron cargar las sanciones');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadSanciones();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadSanciones();
  };

  const handleEliminarSancion = (sancion) => {
    setSancionToLift(sancion);
    setShowConfirmModal(true);
  };

  const confirmLiftSancion = async () => {
    if (!sancionToLift) return;
    
    try {
      setLifting(true);
      const response = await sancionService.eliminarSancion(sancionToLift.id);
      if (response.success) {
        setShowConfirmModal(false);
        setLiftedParticipante(sancionToLift.jugador);
        setShowSuccessModal(true);
        loadSanciones();
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo levantar la sanción');
    } finally {
      setLifting(false);
    }
  };

  const renderSancionItem = ({ item }) => {
    const tipoInfo = TIPO_SANCION_INFO[item.tipo];
    
    return (
      <View style={styles.sancionCard}>
        <View style={styles.cardHeader}>
          <View style={styles.participanteInfo}>
            {item.jugador.foto ? (
              <Image source={{ uri: item.jugador.foto }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={24} color={COLORS.gray} />
              </View>
            )}
            <View style={styles.participanteDetails}>
              <Text style={styles.participanteName}>
                {item.jugador.nombre} {item.jugador.apellido}
              </Text>
              <Text style={styles.participanteEmail}>{item.jugador.email}</Text>
            </View>
          </View>
          <View style={[styles.tipoBadge, { backgroundColor: tipoInfo.bgColor }]}>
            <Ionicons name={tipoInfo.icon} size={14} color={tipoInfo.color} />
            <Text style={[styles.tipoText, { color: tipoInfo.color }]}>
              {tipoInfo.label}
            </Text>
          </View>
        </View>

        <View style={styles.motivoContainer}>
          <Text style={styles.motivoLabel}>Motivo:</Text>
          <Text style={styles.motivoText}>{item.motivo}</Text>
        </View>

        {item.espacio && (
          <View style={styles.espacioContainer}>
            <Ionicons name="location" size={14} color={COLORS.gray} />
            <Text style={styles.espacioText}>Aplica en: {item.espacio.nombre}</Text>
          </View>
        )}

        <View style={styles.cardActions}>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => navigation.navigate('AplicarSancion', { 
              participante: item.jugador,
              sancionExistente: item 
            })}
          >
            <Ionicons name="create-outline" size={18} color={COLORS.primary} />
            <Text style={styles.editButtonText}>Editar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => handleEliminarSancion(item)}
          >
            <Ionicons name="checkmark-circle-outline" size={18} color="#4CAF50" />
            <Text style={styles.removeButtonText}>Levantar</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.dark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Sanciones</Text>
        <View style={styles.addBtn} />
      </View>

      {/* Info Card */}
      <View style={styles.infoCard}>
        <Ionicons name="information-circle" size={24} color={COLORS.primary} />
        <Text style={styles.infoText}>
          Las sanciones te ayudan a gestionar participantes problemáticos. Recibirás alertas cuando reserven.
        </Text>
      </View>

      {/* Lista de sanciones */}
      <FlatList
        data={sanciones}
        renderItem={renderSancionItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="shield-checkmark" size={64} color={COLORS.gray} />
            <Text style={styles.emptyTitle}>Sin sanciones activas</Text>
            <Text style={styles.emptyText}>
              Todos los participantes están en regla. Puedes aplicar sanciones si alguien tiene mala conducta.
            </Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => navigation.navigate('AplicarSancion')}
            >
              <Ionicons name="add-circle" size={20} color={COLORS.white} />
              <Text style={styles.emptyButtonText}>Aplicar Sanción</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {/* FAB para agregar sanción */}
      {sanciones.length > 0 && (
        <TouchableOpacity
          style={[styles.fab, { bottom: insets.bottom + 20 }]}
          onPress={() => navigation.navigate('AplicarSancion')}
        >
          <Ionicons name="add" size={28} color={COLORS.white} />
        </TouchableOpacity>
      )}

      {/* Modal de Confirmación - Levantar Sanción */}
      <Modal
        visible={showConfirmModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowConfirmModal(false)}
      >
        <View style={styles.confirmModalOverlay}>
          <View style={styles.confirmModalContent}>
            <View style={styles.confirmIconContainer}>
              <Ionicons name="shield-checkmark" size={50} color="#4CAF50" />
            </View>
            <Text style={styles.confirmTitle}>Levantar Sanción</Text>
            <Text style={styles.confirmSubtitle}>
              {sancionToLift?.jugador?.nombre} {sancionToLift?.jugador?.apellido}
            </Text>
            <Text style={styles.confirmMessage}>
              ¿Estás seguro de levantar esta sanción?{'\n'}El participante podrá volver a reservar en tus espacios.
            </Text>
            <View style={styles.confirmButtons}>
              <TouchableOpacity
                style={styles.confirmCancelButton}
                onPress={() => setShowConfirmModal(false)}
                disabled={lifting}
              >
                <Text style={styles.confirmCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmAcceptButton}
                onPress={confirmLiftSancion}
                disabled={lifting}
              >
                {lifting ? (
                  <ActivityIndicator color={COLORS.white} size="small" />
                ) : (
                  <Text style={styles.confirmAcceptText}>Sí, Levantar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de Éxito - Levantar Sanción */}
      <Modal
        visible={showSuccessModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSuccessModal(false)}
      >
        <View style={styles.successModalOverlay}>
          <View style={styles.successModalContent}>
            <View style={styles.successIconContainer}>
              <Ionicons name="checkmark-circle" size={60} color="#4CAF50" />
            </View>
            <Text style={styles.successTitle}>¡Sanción Levantada!</Text>
            <Text style={styles.successSubtitle}>
              {liftedParticipante?.nombre} {liftedParticipante?.apellido}
            </Text>
            <Text style={styles.successMessage}>
              El participante puede volver a reservar en tus espacios normalmente.
            </Text>
            <TouchableOpacity
              style={styles.successButton}
              onPress={() => setShowSuccessModal(false)}
            >
              <Text style={styles.successButtonText}>Aceptar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F7',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  backBtn: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.dark,
  },
  addBtn: {
    padding: 8,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary + '10',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  infoText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 13,
    color: COLORS.dark,
    lineHeight: 18,
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  sancionCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  jugadorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F5F5F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  jugadorDetails: {
    marginLeft: 12,
    flex: 1,
  },
  jugadorName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.dark,
  },
  jugadorEmail: {
    fontSize: 13,
    color: COLORS.gray,
    marginTop: 2,
  },
  tipoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    marginLeft: 8,
  },
  tipoText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  motivoContainer: {
    backgroundColor: '#F5F5F7',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  motivoLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.gray,
    marginBottom: 4,
  },
  motivoText: {
    fontSize: 14,
    color: COLORS.dark,
    lineHeight: 20,
  },
  canchaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  canchaText: {
    fontSize: 13,
    color: COLORS.gray,
    marginLeft: 6,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#F5F5F7',
    paddingTop: 12,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.primary,
    marginLeft: 6,
  },
  removeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#E8F5E9',
  },
  removeButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4CAF50',
    marginLeft: 6,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.dark,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.gray,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  emptyButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.white,
    marginLeft: 8,
  },
  fab: {
    position: 'absolute',
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  // Estilos del Modal de Éxito
  successModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  successModalContent: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    width: '100%',
    maxWidth: 320,
  },
  successIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#4CAF50',
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.dark,
    marginBottom: 8,
    textAlign: 'center',
  },
  successMessage: {
    fontSize: 14,
    color: COLORS.gray,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  successButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 14,
    paddingHorizontal: 48,
    borderRadius: 12,
    width: '100%',
  },
  successButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  // Estilos del Modal de Confirmación
  confirmModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  confirmModalContent: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    width: '100%',
    maxWidth: 340,
  },
  confirmIconContainer: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  confirmTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.dark,
    marginBottom: 8,
  },
  confirmSubtitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#4CAF50',
    marginBottom: 8,
    textAlign: 'center',
  },
  confirmMessage: {
    fontSize: 14,
    color: COLORS.gray,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  confirmButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  confirmCancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.gray,
    alignItems: 'center',
  },
  confirmCancelText: {
    color: COLORS.gray,
    fontSize: 15,
    fontWeight: '600',
  },
  confirmAcceptButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
  },
  confirmAcceptText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '700',
  },
});
