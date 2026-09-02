// src/screens/SolicitudesReservaScreen.js
// Pantalla para que el organizador revise solicitudes de unirse
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../constants';
import { invitacionService } from '../services/invitacionService';
import api from '../services/api';

export default function SolicitudesReservaScreen({ route, navigation }) {
  const { reservaId, invitacionId } = route.params || {};
  const insets = useSafeAreaInsets();

  const [solicitudes, setSolicitudes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showPerfilModal, setShowPerfilModal] = useState(false);
  const [perfilData, setPerfilData] = useState(null);
  const [loadingPerfil, setLoadingPerfil] = useState(false);

  useEffect(() => {
    loadSolicitudes();
  }, []);

  const loadSolicitudes = async () => {
    try {
      setLoading(true);
      const response = await invitacionService.getSolicitudesInvitacion(invitacionId);
      if (response.success) {
        setSolicitudes(response.data || []);
      }
    } catch (error) {
      console.log('Error cargando solicitudes:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPerfilUsuario = async (userId) => {
    setLoadingPerfil(true);
    setShowPerfilModal(true);
    try {
      const response = await api.get(`/usuarios/${userId}/perfil`);
      if (response.data.success) {
        setPerfilData(response.data.data);
      }
    } catch (error) {
      console.log('Error cargando perfil:', error);
      setPerfilData(null);
    } finally {
      setLoadingPerfil(false);
    }
  };

  const handleAceptar = async (solicitudId, userId) => {
    Alert.alert(
      'Aceptar participante',
      '¿Querés aceptar a este participante en tu actividad?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Aceptar',
          onPress: async () => {
            setProcessing(solicitudId);
            try {
              await invitacionService.responderSolicitud(solicitudId, true);
              Alert.alert('¡Listo!', 'El participante fue aceptado en tu actividad');
              loadSolicitudes();
            } catch (error) {
              Alert.alert('Error', error.response?.data?.message || 'No se pudo aceptar');
            } finally {
              setProcessing(null);
            }
          }
        }
      ]
    );
  };

  const handleRechazar = async (solicitudId) => {
    Alert.alert(
      'Rechazar participante',
      '¿Estás seguro de rechazar esta solicitud?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Rechazar',
          style: 'destructive',
          onPress: async () => {
            setProcessing(solicitudId);
            try {
              await invitacionService.responderSolicitud(solicitudId, false);
              loadSolicitudes();
            } catch (error) {
              Alert.alert('Error', error.response?.data?.message || 'No se pudo rechazar');
            } finally {
              setProcessing(null);
            }
          }
        }
      ]
    );
  };

  const SolicitudCard = ({ solicitud }) => {
    const { usuario, estado, createdAt } = solicitud;
    const isProcessing = processing === solicitud.id;
    const isPendiente = estado === 'PENDIENTE';

    return (
      <View style={styles.solicitudCard}>
        <TouchableOpacity 
          style={styles.userSection}
          onPress={() => loadPerfilUsuario(usuario.id)}
          activeOpacity={0.7}
        >
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {usuario.nombre?.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{usuario.nombre} {usuario.apellido}</Text>
            <Text style={styles.userAlias}>@{usuario.alias || 'sin alias'}</Text>
            <Text style={styles.solicitudTime}>
              Solicitó hace {getTimeAgo(createdAt)}
            </Text>
          </View>
          <TouchableOpacity 
            style={styles.verPerfilBtn}
            onPress={() => loadPerfilUsuario(usuario.id)}
          >
            <Ionicons name="eye-outline" size={20} color={COLORS.primary} />
          </TouchableOpacity>
        </TouchableOpacity>

        {isPendiente ? (
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[styles.actionButton, styles.rechazarButton]}
              onPress={() => handleRechazar(solicitud.id)}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <ActivityIndicator size="small" color={COLORS.error} />
              ) : (
                <>
                  <Ionicons name="close" size={18} color={COLORS.error} />
                  <Text style={styles.rechazarText}>Rechazar</Text>
                </>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.aceptarButton]}
              onPress={() => handleAceptar(solicitud.id, usuario.id)}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <ActivityIndicator size="small" color={COLORS.white} />
              ) : (
                <>
                  <Ionicons name="checkmark" size={18} color={COLORS.white} />
                  <Text style={styles.aceptarText}>Aceptar</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <View style={[
            styles.estadoBadge,
            estado === 'ACEPTADA' ? styles.estadoAceptado : styles.estadoRechazado
          ]}>
            <Ionicons 
              name={estado === 'ACEPTADA' ? 'checkmark-circle' : 'close-circle'} 
              size={16} 
              color={estado === 'ACEPTADA' ? COLORS.success : COLORS.error} 
            />
            <Text style={[
              styles.estadoText,
              estado === 'ACEPTADA' ? styles.estadoAceptadoText : styles.estadoRechazadoText
            ]}>
              {estado === 'ACEPTADA' ? 'Aceptado' : 'Rechazado'}
            </Text>
          </View>
        )}
      </View>
    );
  };

  const getTimeAgo = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins} min`;
    if (diffHours < 24) return `${diffHours}h`;
    return `${diffDays}d`;
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Solicitudes</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Contenido */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : solicitudes.length > 0 ? (
        <FlatList
          data={solicitudes}
          renderItem={({ item }) => <SolicitudCard solicitud={item} />}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="people-outline" size={64} color={COLORS.lightGray} />
          <Text style={styles.emptyTitle}>Sin solicitudes</Text>
          <Text style={styles.emptyText}>
            Aún no hay participantes que quieran unirse a tu actividad
          </Text>
        </View>
      )}

      {/* Modal de perfil */}
      <Modal
        visible={showPerfilModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPerfilModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Perfil del participante</Text>
              <TouchableOpacity onPress={() => setShowPerfilModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.black} />
              </TouchableOpacity>
            </View>

            {loadingPerfil ? (
              <View style={styles.modalLoading}>
                <ActivityIndicator size="large" color={COLORS.primary} />
              </View>
            ) : perfilData ? (
              <ScrollView style={styles.perfilContent} showsVerticalScrollIndicator={false}>
                {/* Avatar y nombre */}
                <View style={styles.perfilHeader}>
                  <View style={styles.perfilAvatar}>
                    <Text style={styles.perfilAvatarText}>
                      {perfilData.nombre?.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <Text style={styles.perfilNombre}>
                    {perfilData.nombre} {perfilData.apellido}
                  </Text>
                  <Text style={styles.perfilAlias}>@{perfilData.alias || 'sin alias'}</Text>
                </View>

                {/* Stats */}
                <View style={styles.statsRow}>
                  <View style={styles.statItem}>
                    <Text style={styles.statNumber}>{perfilData.partidosJugados || 0}</Text>
                    <Text style={styles.statLabel}>Actividades</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statItem}>
                    <Text style={styles.statNumber}>{perfilData.amigos || 0}</Text>
                    <Text style={styles.statLabel}>Amigos</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statItem}>
                    <View style={styles.ratingRow}>
                      <Ionicons name="star" size={16} color="#FFD700" />
                      <Text style={styles.statNumber}>{perfilData.rating || '-'}</Text>
                    </View>
                    <Text style={styles.statLabel}>Rating</Text>
                  </View>
                </View>

                {/* Info adicional */}
                <View style={styles.infoSection}>
                  {perfilData.ciudad && (
                    <View style={styles.infoRow}>
                      <Ionicons name="location-outline" size={18} color={COLORS.gray} />
                      <Text style={styles.infoText}>{perfilData.ciudad}</Text>
                    </View>
                  )}
                  {perfilData.deporteFavorito && (
                    <View style={styles.infoRow}>
                      <Ionicons name="football-outline" size={18} color={COLORS.gray} />
                      <Text style={styles.infoText}>Deporte favorito: {perfilData.deporteFavorito}</Text>
                    </View>
                  )}
                  <View style={styles.infoRow}>
                    <Ionicons name="calendar-outline" size={18} color={COLORS.gray} />
                    <Text style={styles.infoText}>
                      Miembro desde {new Date(perfilData.createdAt).toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })}
                    </Text>
                  </View>
                </View>
              </ScrollView>
            ) : (
              <View style={styles.modalLoading}>
                <Text style={styles.errorText}>No se pudo cargar el perfil</Text>
              </View>
            )}
          </View>
        </View>
      </Modal>
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
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    padding: 16,
  },
  solicitudCard: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.white,
  },
  userInfo: {
    flex: 1,
    marginLeft: 12,
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.black,
  },
  userAlias: {
    fontSize: 13,
    color: COLORS.gray,
    marginTop: 2,
  },
  solicitudTime: {
    fontSize: 12,
    color: COLORS.lightGray,
    marginTop: 4,
  },
  verPerfilBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 6,
  },
  rechazarButton: {
    backgroundColor: COLORS.error + '15',
  },
  aceptarButton: {
    backgroundColor: COLORS.primary,
  },
  rechazarText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.error,
  },
  aceptarText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.white,
  },
  estadoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  estadoAceptado: {
    backgroundColor: COLORS.success + '15',
  },
  estadoRechazado: {
    backgroundColor: COLORS.error + '15',
  },
  estadoText: {
    fontSize: 14,
    fontWeight: '600',
  },
  estadoAceptadoText: {
    color: COLORS.success,
  },
  estadoRechazadoText: {
    color: COLORS.error,
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
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.black,
  },
  modalLoading: {
    padding: 40,
    alignItems: 'center',
  },
  perfilContent: {
    padding: 20,
  },
  perfilHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  perfilAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  perfilAvatarText: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.white,
  },
  perfilNombre: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.black,
  },
  perfilAlias: {
    fontSize: 14,
    color: COLORS.gray,
    marginTop: 4,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#e0e0e0',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.black,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  infoSection: {
    gap: 12,
    paddingBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  infoText: {
    fontSize: 14,
    color: COLORS.gray,
  },
  errorText: {
    fontSize: 14,
    color: COLORS.gray,
  },
});
