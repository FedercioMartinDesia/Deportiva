import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../constants';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

export default function HomeOwnerScreen({ navigation }) {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [stats, setStats] = useState({
    totalCanchas: 0,
    reservasHoy: 0,
    reservasMes: 0,
    ingresosMes: 0,
  });
  const [showIngresos, setShowIngresos] = useState(false);

  useEffect(() => {
    loadStats();
    loadNotificationCount();
    // Cargar cada 10 segundos
    const interval = setInterval(loadNotificationCount, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadNotificationCount = async () => {
    try {
      const response = await api.get('/notificaciones/count');
      if (response.data.success) {
        setNotificationCount(response.data.count || 0);
      }
    } catch (error) {
      console.log('Error loading notification count');
    }
  };

  const loadStats = async () => {
    try {
      setLoading(true);
      // TODO: Implementar endpoint de estadísticas
      // const response = await api.get('/owner/stats');
      // setStats(response.data.data);
      
      // Datos mock por ahora
      setStats({
        totalCanchas: 4,
        reservasHoy: 3,
        reservasMes: 45,
        ingresosMes: 225000,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadStats();
  };

  const StatCard = ({ icon, title, value, color, onPress }) => (
    <TouchableOpacity 
      style={styles.statCard}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.statIconContainer, { backgroundColor: color + '15' }]}>
        <Ionicons name={icon} size={28} color={color} />
      </View>
      <Text style={[styles.statValue, { color: color }]}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
    </TouchableOpacity>
  );

  const ActionButton = ({ icon, title, color, onPress }) => (
    <TouchableOpacity 
      style={styles.actionButton}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.actionIconContainer, { backgroundColor: color + '15' }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <View style={styles.actionTextContainer}>
        <Text style={styles.actionTitle}>{title}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={COLORS.gray} />
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient 
        colors={[COLORS.primary, COLORS.primaryDark]} 
        style={[styles.header, { paddingTop: insets.top + 20 }]}
      >
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.greeting}>Bienvenido, {user?.nombre}</Text>
            <Text style={styles.subGreeting}>Panel de Propietario</Text>
          </View>
          <TouchableOpacity 
            style={styles.notificationButton}
            onPress={() => navigation.navigate('Notifications')}
          >
            <Ionicons name="notifications-outline" size={24} color={COLORS.white} />
            {notificationCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {notificationCount > 9 ? '9+' : notificationCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.content}>
          <Text style={styles.sectionTitle}>Resumen de Hoy</Text>
          <View style={styles.statsGrid}>
            <StatCard
              icon="business"
              title="Mis Espacios"
              value={stats.totalCanchas}
              color={COLORS.primary}
              onPress={() => navigation.navigate('MisCanchas')}
            />
            <StatCard
              icon="calendar"
              title="Reservas Hoy"
              value={stats.reservasHoy}
              color="#FF6B6B"
              onPress={() => navigation.navigate('ReservasOwner')}
            />
            <StatCard
              icon="trending-up"
              title="Del Mes"
              value={stats.reservasMes}
              color="#4ECDC4"
            />
            <View style={styles.statCard}>
              <TouchableOpacity 
                style={styles.eyeButton}
                onPress={() => setShowIngresos(!showIngresos)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons 
                  name={showIngresos ? "eye" : "eye-off"} 
                  size={18} 
                  color={COLORS.gray} 
                />
              </TouchableOpacity>
              <View style={[styles.statIconContainer, { backgroundColor: '#2ECC71' + '15' }]}>
                <Ionicons name="cash" size={28} color="#2ECC71" />
              </View>
              <Text style={[styles.statValue, { color: '#2ECC71' }]}>
                {showIngresos ? `$${stats.ingresosMes.toLocaleString()}` : '••••••'}
              </Text>
              <Text style={styles.statTitle}>Ingresos</Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Acciones Rápidas</Text>
          <View style={styles.actionsContainer}>
            <ActionButton
              icon="calendar"
              title="Gestionar Reservas"
              color={COLORS.primary}
              onPress={() => navigation.navigate('MisReservas')}
            />
            <ActionButton
              icon="megaphone"
              title="Enviar Notificación"
              color="#10B981"
              onPress={() => navigation.navigate('EnviarNotificacion')}
            />
            <ActionButton
              icon="warning"
              title="Aplicar Sanciones"
              color="#E53935"
              onPress={() => navigation.navigate('Sanciones')}
            />
          </View>
        </View>
      </ScrollView>
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
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  subGreeting: {
    fontSize: 14,
    color: COLORS.white,
    opacity: 0.9,
    marginTop: 4,
  },
  notificationButton: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#FF6B6B',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  badgeText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: 'bold',
  },
  content: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginBottom: 15,
    marginTop: 10,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
    marginBottom: 5,
  },
  statCard: {
    width: '47%',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    margin: 6,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    position: 'relative',
  },
  eyeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    padding: 4,
    zIndex: 1,
  },
  statIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 13,
    color: COLORS.gray,
    fontWeight: '500',
    textAlign: 'center',
  },
  actionsContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.background,
  },
  actionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  actionTextContainer: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.dark,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: 15,
    padding: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.dark,
    marginBottom: 4,
  },
  infoText: {
    fontSize: 13,
    color: COLORS.gray,
    lineHeight: 18,
  },
});