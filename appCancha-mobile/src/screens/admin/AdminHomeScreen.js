import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Animated,
  Easing,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants';
import { getEstadisticasAdmin } from '../../services/adminService';
import { useAuth } from '../../contexts/AuthContext';

// Componente de mano animada
const AnimatedWave = ({ visible }) => {
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(rotateAnim, {
            toValue: 1,
            duration: 300,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(rotateAnim, {
            toValue: -1,
            duration: 300,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(rotateAnim, {
            toValue: 0,
            duration: 300,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [visible]);

  const rotate = rotateAnim.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ['-20deg', '0deg', '20deg'],
  });

  return (
    <Animated.View style={[logoutModalStyles.iconContainer, { transform: [{ rotate }] }]}>
      <Text style={{ fontSize: 40 }}>👋</Text>
    </Animated.View>
  );
};

export default function AdminHomeScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const loadStats = async () => {
    try {
      const response = await getEstadisticasAdmin();
      if (response.success) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadStats();
  }, []);

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = () => {
    setShowLogoutModal(false);
    logout();
  };

  const StatCard = ({ icon, title, value, subtitle, color = COLORS.primary }) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <View style={styles.statInfo}>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statTitle}>{title}</Text>
        {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
      </View>
    </View>
  );

  const QuickAction = ({ icon, title, onPress, color = COLORS.primary }) => (
    <TouchableOpacity style={styles.quickAction} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.quickActionIcon, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon} size={28} color={color} />
      </View>
      <Text style={styles.quickActionText}>{title}</Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Panel de Administración</Text>
          <Text style={styles.userName}>Hola, {user?.nombre}</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <Ionicons name="log-out-outline" size={24} color={COLORS.danger} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
        }
      >
        {/* Acciones rápidas */}
        <Text style={styles.sectionTitle}>Acciones Rápidas</Text>
        <View style={styles.quickActions}>
          <QuickAction
            icon="people"
            title="Participantes"
            onPress={() => navigation.navigate('AdminUsuarios', { rol: 'JUGADOR' })}
            color={COLORS.primary}
          />
          <QuickAction
            icon="business"
            title="Propietarios"
            onPress={() => navigation.navigate('AdminUsuarios', { rol: 'PROPIETARIO' })}
            color="#FF9500"
          />
          <QuickAction
            icon="megaphone"
            title="Notificar"
            onPress={() => navigation.navigate('AdminNotificaciones')}
            color="#E91E63"
          />
          <QuickAction
            icon="search"
            title="Buscar"
            onPress={() => navigation.navigate('AdminUsuarios', { search: true })}
            color="#5856D6"
          />
        </View>

        {/* Estadísticas de Usuarios */}
        <Text style={styles.sectionTitle}>Usuarios</Text>
        <View style={styles.statsGrid}>
          <StatCard
            icon="person"
            title="Participantes"
            value={stats?.usuarios?.totalJugadores || 0}
            subtitle={`${stats?.usuarios?.jugadoresActivos || 0} activos`}
            color={COLORS.primary}
          />
          <StatCard
            icon="business"
            title="Propietarios"
            value={stats?.usuarios?.totalPropietarios || 0}
            subtitle={`${stats?.usuarios?.propietariosActivos || 0} activos`}
            color="#FF9500"
          />
        </View>

        {/* Estadísticas de Suscripciones */}
        <Text style={styles.sectionTitle}>Suscripciones</Text>
        <View style={styles.statsGrid}>
          <StatCard
            icon="checkmark-circle"
            title="Con Suscripción"
            value={stats?.usuarios?.propietariosConSuscripcion || 0}
            color="#34C759"
          />
          <StatCard
            icon="close-circle"
            title="Sin Suscripción"
            value={(stats?.usuarios?.totalPropietarios || 0) - (stats?.usuarios?.propietariosConSuscripcion || 0)}
            color={COLORS.danger}
          />
        </View>

        {/* Estadísticas de Canchas */}
        <Text style={styles.sectionTitle}>Espacios</Text>
        <View style={styles.statsGrid}>
          <StatCard
            icon="football"
            title="Total Espacios"
            value={stats?.canchas?.total || 0}
            color="#5856D6"
          />
          <StatCard
            icon="checkmark-done"
            title="Espacios Activos"
            value={stats?.canchas?.activas || 0}
            color="#34C759"
          />
        </View>

        {/* Estadísticas de Reservas */}
        <Text style={styles.sectionTitle}>Reservas</Text>
        <View style={styles.statsGrid}>
          <StatCard
            icon="calendar"
            title="Total Reservas"
            value={stats?.reservas?.total || 0}
            color="#007AFF"
          />
          <StatCard
            icon="today"
            title="Reservas Hoy"
            value={stats?.reservas?.hoy || 0}
            color="#FF2D55"
          />
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Modal de cerrar sesión */}
      <Modal
        visible={showLogoutModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowLogoutModal(false)}
      >
        <View style={logoutModalStyles.overlay}>
          <View style={logoutModalStyles.container}>
            <AnimatedWave visible={showLogoutModal} />
            <Text style={logoutModalStyles.title}>¿Ya te vas?</Text>
            <Text style={logoutModalStyles.message}>
              ¡Esperamos verte pronto!
            </Text>
            <View style={logoutModalStyles.buttonsContainer}>
              <TouchableOpacity 
                style={logoutModalStyles.stayButton}
                onPress={() => setShowLogoutModal(false)}
                activeOpacity={0.8}
              >
                <Text style={logoutModalStyles.stayButtonText}>Me quedo</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={logoutModalStyles.logoutButton}
                onPress={confirmLogout}
                activeOpacity={0.8}
              >
                <Ionicons name="log-out-outline" size={20} color={COLORS.white} />
                <Text style={logoutModalStyles.logoutButtonText}>Salir</Text>
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
    backgroundColor: '#F5F5F7',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  greeting: {
    fontSize: 14,
    color: COLORS.gray,
  },
  userName: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.dark,
  },
  logoutBtn: {
    padding: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.dark,
    marginTop: 24,
    marginBottom: 12,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickAction: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: 12,
    borderRadius: 12,
    marginHorizontal: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.dark,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  statCard: {
    width: '48%',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    margin: 4,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statInfo: {
    flex: 1,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.dark,
  },
  statTitle: {
    fontSize: 14,
    color: COLORS.gray,
    marginTop: 2,
  },
  statSubtitle: {
    fontSize: 12,
    color: COLORS.primary,
    marginTop: 4,
  },
});

// Estilos del modal de logout
const logoutModalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
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
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
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
  buttonsContainer: {
    width: '100%',
    flexDirection: 'row',
    gap: 12,
  },
  stayButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  stayButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  logoutButton: {
    flex: 1,
    backgroundColor: COLORS.danger || '#F44336',
    paddingVertical: 14,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  logoutButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
});
