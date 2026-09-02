import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../constants';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

export default function NotificationsSettingsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const isPropietario = user?.rol === 'PROPIETARIO';
  const [loading, setLoading] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('enabled'); // 'enabled' o 'disabled'

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await api.get('/auth/notifications/settings');

      if (response.data.success) {
        setNotificationsEnabled(response.data.data.notificacionesActivas);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      // Alert.alert('Error', 'No se pudo cargar la configuración');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleNotifications = async (value) => {
    try {
      const response = await api.put('/auth/notifications/toggle', { activas: value });

      if (response.data.success) {
        setNotificationsEnabled(value);
        setModalType(value ? 'enabled' : 'disabled');
        setShowModal(true);
      }
    } catch (error) {
      console.error('Error toggling notifications:', error);
      // Alert.alert('Error', 'No se pudo actualizar la configuración');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.dark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notificaciones</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.content}>
        <View style={styles.section}>
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <View style={styles.iconContainer}>
                <Ionicons name="notifications" size={22} color={COLORS.primary} />
              </View>
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingTitle}>Activar Notificaciones</Text>
                <Text style={styles.settingDescription}>
                  {isPropietario 
                    ? 'Te avisaremos si confirman o cancelan reservas, o hay novedades de la app'
                    : 'Te avisaremos si te invitan a una actividad, confirman o cancelan una reserva, o hay novedades de la app'}
                </Text>
              </View>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={handleToggleNotifications}
              trackColor={{ false: COLORS.gray, true: COLORS.primary }}
              thumbColor={COLORS.white}
            />
          </View>
        </View>
      </ScrollView>

      {/* Modal de confirmación */}
      <Modal
        visible={showModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={modalStyles.overlay}>
          <View style={modalStyles.container}>
            <View style={[
              modalStyles.iconContainer, 
              { backgroundColor: modalType === 'enabled' ? COLORS.primary + '15' : COLORS.gray + '20' }
            ]}>
              <Ionicons 
                name={modalType === 'enabled' ? "notifications" : "notifications-off"} 
                size={36} 
                color={modalType === 'enabled' ? COLORS.primary : COLORS.gray} 
              />
            </View>
            <Text style={modalStyles.title}>
              {modalType === 'enabled' ? '¡Listo!' : 'Notificaciones silenciadas'}
            </Text>
            <Text style={modalStyles.message}>
              {modalType === 'enabled' 
                ? (isPropietario 
                    ? 'Te avisaremos cuando confirmen o cancelen reservas, y cuando haya novedades 🎉'
                    : 'Te avisaremos cuando te inviten a actividades, confirmen o cancelen reservas, y cuando haya novedades 🎉')
                : 'Las notificaciones seguirán llegando a la app, pero no recibirás alertas en tu celular'}
            </Text>
            <TouchableOpacity 
              style={[
                modalStyles.button,
                { backgroundColor: modalType === 'enabled' ? COLORS.primary : COLORS.gray }
              ]}
              onPress={() => setShowModal(false)}
              activeOpacity={0.8}
            >
              <Text style={modalStyles.buttonText}>Entendido</Text>
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
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.background,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.dark,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    backgroundColor: COLORS.white,
    borderRadius: 15,
    padding: 16,
    marginBottom: 20,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  settingTextContainer: {
    flex: 1,
    paddingRight: 10,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.dark,
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 13,
    color: COLORS.gray,
  },
});

// Estilos del modal
const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.dark,
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    fontSize: 15,
    color: COLORS.gray,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  button: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
});