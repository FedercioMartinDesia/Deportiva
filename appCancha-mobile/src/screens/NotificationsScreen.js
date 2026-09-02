import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../constants';
import api from '../services/api';

export default function NotificationsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const response = await api.get('/notificaciones');
      if (response.data.success) {
        setNotifications(response.data.data || []);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
      // No mostrar alerta en la carga inicial, solo cuando es un refresco
      if (refreshing) {
        Alert.alert('Error', 'No se pudieron cargar las notificaciones');
      }
      // Igualmente mostrar vacío en lugar de error
      setNotifications([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadNotifications();
  };

  const deleteNotification = async (notificationId) => {
    try {
      const response = await api.delete(`/notificaciones/${notificationId}`);
      if (response.data.success) {
        setNotifications(notifications.filter(n => n.id !== notificationId));
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
      Alert.alert('Error', 'No se pudo eliminar la notificación');
    }
  };

  const handleDeleteAll = async () => {
    try {
      setDeleting(true);
      const response = await api.delete('/notificaciones');
      if (response.data.success) {
        setNotifications([]);
        setShowDeleteModal(false);
      }
    } catch (error) {
      console.error('Error deleting all notifications:', error);
      Alert.alert('Error', 'No se pudieron eliminar las notificaciones');
    } finally {
      setDeleting(false);
    }
  };

  const getNotificationIcon = (type) => {
    const icons = {
      RESERVA_CONFIRMADA: 'checkmark-circle',
      RESERVA_CANCELADA: 'close-circle',
      CANCHA_COMENTARIO: 'chatbubble',
      NUEVA_RESERVA: 'calendar',
      PAGO_RECIBIDO: 'card',
      invitacion: 'football',
      // Tipos de notificación del propietario
      PROMOCION: 'gift',
      MANTENIMIENTO: 'construct',
      CIERRE: 'close-circle',
      EVENTO: 'trophy',
      DEFAULT: 'notifications',
    };
    return icons[type] || icons.DEFAULT;
  };

  const getNotificationColor = (type) => {
    const colors = {
      RESERVA_CONFIRMADA: '#2ECC71',
      RESERVA_CANCELADA: '#FF6B6B',
      CANCHA_COMENTARIO: COLORS.primary,
      NUEVA_RESERVA: '#4ECDC4',
      PAGO_RECIBIDO: '#2ECC71',
      invitacion: COLORS.primary,
      // Tipos de notificación del propietario
      PROMOCION: '#10B981',
      MANTENIMIENTO: '#F59E0B',
      CIERRE: '#EF4444',
      EVENTO: '#8B5CF6',
      DEFAULT: COLORS.gray,
    };
    return colors[type] || colors.DEFAULT;
  };

  const getSenderInfo = (notification) => {
    // Intentar obtener info del remitente desde los datos
    if (notification.datos) {
      try {
        const datos = JSON.parse(notification.datos);
        if (datos.canchaName) return datos.canchaName;
        if (datos.propietarioNombre) return datos.propietarioNombre;
        if (datos.nombreCancha) return datos.nombreCancha;
      } catch (e) {}
    }
    // Si es del propietario (tipos específicos)
    if (['PROMOCION', 'MANTENIMIENTO', 'CIERRE', 'EVENTO'].includes(notification.tipo)) {
      return 'Propietario de espacio';
    }
    return null;
  };

  const handleNotificationPress = async (notification) => {
    console.log('Notification pressed:', notification);
    
    // Marcar como leída
    markAsRead(notification.id);
    
    // Navegar según el tipo
    if (notification.tipo === 'invitacion') {
      // Si tiene datos, usar el invitacionId directamente
      if (notification.datos) {
        try {
          const datos = JSON.parse(notification.datos);
          console.log('Datos parseados:', datos);
          if (datos.invitacionId) {
            navigation.navigate('DetalleInvitacion', { invitacionId: datos.invitacionId });
            return;
          }
        } catch (e) {
          console.log('Error parsing notification data:', e);
        }
      }
      
      // Si no tiene datos, buscar invitaciones pendientes del usuario
      try {
        const { invitacionService } = await import('../services/invitacionService');
        const response = await invitacionService.getMisInvitaciones();
        console.log('Mis invitaciones:', response);
        if (response.success && response.data && response.data.length > 0) {
          // Navegar a la primera invitación pendiente
          navigation.navigate('DetalleInvitacion', { invitacionId: response.data[0].id });
        } else {
          Alert.alert('Info', 'No hay invitaciones pendientes');
        }
      } catch (e) {
        console.log('Error fetching invitations:', e);
        Alert.alert('Error', 'No se pudieron cargar las invitaciones');
      }
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await api.put(`/notificaciones/${notificationId}/leer`);
      setNotifications(notifications.map(n => 
        n.id === notificationId ? { ...n, leida: true } : n
      ));
    } catch (error) {
      console.log('Error marking as read:', error);
    }
  };

  const formatDate = (date) => {
    const now = new Date();
    const notifDate = new Date(date);
    const diffMs = now - notifDate;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Hace unos segundos';
    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffHours < 24) return `Hace ${diffHours}h`;
    if (diffDays < 7) return `Hace ${diffDays}d`;
    
    return notifDate.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
    });
  };

  const renderNotificationItem = ({ item }) => {
    const isInvitacion = item.tipo === 'invitacion';
    const isUnread = !item.leida;
    
    return (
      <TouchableOpacity 
        style={[
          styles.notificationItem,
          isUnread && styles.notificationUnread,
          isInvitacion && styles.notificationInvitacion
        ]}
        onPress={() => handleNotificationPress(item)}
        activeOpacity={isInvitacion ? 0.7 : 1}
      >
        <View style={[styles.iconContainer, { backgroundColor: getNotificationColor(item.tipo) + '20' }]}>
          <Ionicons
            name={getNotificationIcon(item.tipo)}
            size={20}
            color={getNotificationColor(item.tipo)}
          />
        </View>

        <View style={styles.contentContainer}>
          {getSenderInfo(item) && (
            <View style={styles.senderRow}>
              <Ionicons name="business-outline" size={12} color={getNotificationColor(item.tipo)} />
              <Text style={[styles.senderText, { color: getNotificationColor(item.tipo) }]}>
                {getSenderInfo(item)}
              </Text>
            </View>
          )}
          <View style={styles.titleRow}>
            <Text style={[styles.title, isUnread && styles.titleUnread]}>{item.titulo}</Text>
            {isUnread && <View style={styles.unreadDot} />}
          </View>
          <Text style={styles.message}>{item.mensaje}</Text>
          <Text style={styles.timestamp}>{formatDate(item.createdAt)}</Text>
          {isInvitacion && (
            <View style={styles.actionHint}>
              <Text style={styles.actionHintText}>Toca para responder</Text>
              <Ionicons name="chevron-forward" size={14} color={COLORS.primary} />
            </View>
          )}
        </View>

        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => deleteNotification(item.id)}
        >
          <Ionicons name="close" size={20} color={COLORS.gray} />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.dark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notificaciones</Text>
        {notifications.length > 0 ? (
          <TouchableOpacity onPress={() => setShowDeleteModal(true)}>
            <Ionicons name="trash-outline" size={20} color="#FF6B6B" />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 24 }} />
        )}
      </View>

      {notifications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconContainer}>
            <Ionicons name="chatbubbles-outline" size={48} color={COLORS.gray} />
          </View>
          <Text style={styles.emptyTitle}>Todo tranquilo por acá</Text>
          <Text style={styles.emptyMessage}>
            Te avisaremos cuando alguien te invite a una actividad, confirmen o cancelen una reserva, o haya novedades de la app
          </Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderNotificationItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}

      {/* Modal Confirmar Eliminar */}
      <Modal
        visible={showDeleteModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalIconContainer}>
              <Ionicons name="notifications-off" size={40} color={COLORS.primary} />
            </View>
            <Text style={styles.modalTitle}>Limpiar notificaciones</Text>
            <Text style={styles.modalMessage}>
              ¿Deseas eliminar todas tus notificaciones?{'\n'}Esta acción no se puede deshacer.
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.modalCancelButton}
                onPress={() => setShowDeleteModal(false)}
                disabled={deleting}
              >
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.modalConfirmButton}
                onPress={handleDeleteAll}
                disabled={deleting}
              >
                {deleting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="trash" size={18} color="#FFFFFF" />
                    <Text style={styles.modalConfirmText}>Eliminar</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.background,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.dark,
    flex: 1,
    textAlign: 'center',
  },
  listContainer: {
    padding: 12,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  contentContainer: {
    flex: 1,
  },
  senderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  senderText: {
    fontSize: 11,
    fontWeight: '600',
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.dark,
    marginBottom: 4,
  },
  message: {
    fontSize: 13,
    color: COLORS.gray,
    marginBottom: 6,
    lineHeight: 18,
  },
  timestamp: {
    fontSize: 12,
    color: COLORS.gray,
    opacity: 0.7,
  },
  deleteButton: {
    padding: 8,
    marginLeft: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 14,
    color: COLORS.gray,
    textAlign: 'center',
    lineHeight: 22,
  },
  notificationUnread: {
    backgroundColor: COLORS.primary + '08',
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
  },
  notificationInvitacion: {
    borderWidth: 1,
    borderColor: COLORS.primary + '30',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  titleUnread: {
    fontWeight: '700',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
    marginLeft: 8,
  },
  actionHint: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 4,
  },
  actionHintText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    width: '100%',
    maxWidth: 340,
  },
  modalIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.dark,
    marginBottom: 8,
  },
  modalMessage: {
    fontSize: 15,
    color: COLORS.gray,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#F5F5F7',
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray,
  },
  modalConfirmButton: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  modalConfirmText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
