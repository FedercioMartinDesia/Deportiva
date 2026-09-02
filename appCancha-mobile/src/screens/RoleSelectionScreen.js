import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../constants';

export default function RoleSelectionScreen({ navigation }) {
  const insets = useSafeAreaInsets();

  const handleRoleSelect = (role) => {
    if (role === 'JUGADOR') {
      navigation.navigate('RegisterJugador');
    } else if (role === 'PROFESOR') {
      navigation.navigate('RegisterJugador', { isProfesor: true });
    } else {
      navigation.navigate('RegisterPropietario');
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.dark} />
        </TouchableOpacity>
      </View>

      {/* Contenido principal */}
      <View style={styles.content}>
        <View style={styles.introSection}>
          <Text style={styles.mainTitle}>¿Cómo quieres usar Deportiva?</Text>
          <Text style={styles.subtitle}>
            Selecciona tu tipo de cuenta
          </Text>
        </View>

        <ScrollView
          style={styles.cardsScroll}
          contentContainerStyle={styles.cardsContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Tarjeta Participante */}
          <TouchableOpacity
            style={styles.roleCard}
            onPress={() => handleRoleSelect('JUGADOR')}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={[COLORS.primary, '#00D99E']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.cardGradient}
            >
              <View style={styles.cardTop}>
                <View style={styles.iconCircle}>
                  <Ionicons name="person" size={36} color={COLORS.white} />
                </View>
                <View style={styles.badgeContainer}>
                  <Text style={styles.badgeText}>Popular</Text>
                </View>
              </View>

              <View style={styles.cardBody}>
                <Text style={styles.roleTitle}>Participante</Text>
                <Text style={styles.roleDescription}>
                  Reserva espacios y disfruta de tus actividades
                </Text>

                <View style={styles.featuresList}>
                  <View style={styles.featureItem}>
                    <Ionicons name="checkmark-circle" size={18} color={COLORS.white} />
                    <Text style={styles.featureText}>Buscar espacios</Text>
                  </View>
                  <View style={styles.featureItem}>
                    <Ionicons name="checkmark-circle" size={18} color={COLORS.white} />
                    <Text style={styles.featureText}>Hacer reservas</Text>
                  </View>
                  <View style={styles.featureItem}>
                    <Ionicons name="checkmark-circle" size={18} color={COLORS.white} />
                    <Text style={styles.featureText}>Ver historial</Text>
                  </View>
                </View>
              </View>

              <View style={styles.cardFooter}>
                <Ionicons name="arrow-forward-circle" size={28} color={COLORS.white} />
              </View>
            </LinearGradient>
          </TouchableOpacity>

          {/* Tarjeta Propietario */}
          <TouchableOpacity
            style={styles.roleCard}
            onPress={() => handleRoleSelect('PROPIETARIO')}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={['#0A1628', '#0D2538']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.cardGradient}
            >
              <View style={styles.cardTop}>
                <View style={styles.iconCircle}>
                  <Ionicons name="business" size={36} color={COLORS.primary} />
                </View>
                <View style={[styles.badgeContainer, styles.badgeAlt]}>
                  <Text style={styles.badgeTextAlt}>Negocio</Text>
                </View>
              </View>

              <View style={styles.cardBody}>
                <Text style={styles.roleTitle}>Propietario</Text>
                <Text style={styles.roleDescription}>
                  Gestiona tus espacios y reservas
                </Text>

                <View style={styles.featuresList}>
                  <View style={styles.featureItem}>
                    <Ionicons name="checkmark-circle" size={18} color={COLORS.primary} />
                    <Text style={styles.featureText}>Publicar espacios</Text>
                  </View>
                  <View style={styles.featureItem}>
                    <Ionicons name="checkmark-circle" size={18} color={COLORS.primary} />
                    <Text style={styles.featureText}>Gestionar reservas</Text>
                  </View>
                  <View style={styles.featureItem}>
                    <Ionicons name="checkmark-circle" size={18} color={COLORS.primary} />
                    <Text style={styles.featureText}>Ver estadísticas</Text>
                  </View>
                </View>
              </View>

              <View style={styles.cardFooter}>
                <Ionicons name="arrow-forward-circle" size={28} color={COLORS.primary} />
              </View>
            </LinearGradient>
          </TouchableOpacity>

          {/* Tarjeta Profesor */}
          <TouchableOpacity
            style={styles.roleCard}
            onPress={() => handleRoleSelect('PROFESOR')}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={['#6C3CE1', '#9B6DFF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.cardGradient}
            >
              <View style={styles.cardTop}>
                <View style={styles.iconCircle}>
                  <Ionicons name="school" size={36} color={COLORS.white} />
                </View>
                <View style={[styles.badgeContainer, styles.badgeProfesor]}>
                  <Text style={styles.badgeText}>Nuevo</Text>
                </View>
              </View>

              <View style={styles.cardBody}>
                <Text style={styles.roleTitle}>Profesor</Text>
                <Text style={styles.roleDescription}>
                  Ofrecé clases y gestioná tus alumnos
                </Text>

                <View style={styles.featuresList}>
                  <View style={styles.featureItem}>
                    <Ionicons name="checkmark-circle" size={18} color={COLORS.white} />
                    <Text style={styles.featureText}>Publicar clases</Text>
                  </View>
                  <View style={styles.featureItem}>
                    <Ionicons name="checkmark-circle" size={18} color={COLORS.white} />
                    <Text style={styles.featureText}>Gestionar alumnos</Text>
                  </View>
                  <View style={styles.featureItem}>
                    <Ionicons name="checkmark-circle" size={18} color={COLORS.white} />
                    <Text style={styles.featureText}>Cobrar por la app</Text>
                  </View>
                </View>
              </View>

              <View style={styles.cardFooter}>
                <Ionicons name="arrow-forward-circle" size={28} color={COLORS.white} />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Footer fijo */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity 
          onPress={() => navigation.navigate('Login')} 
          style={styles.loginButton}
          activeOpacity={0.7}
        >
          <Text style={styles.loginText}>
            ¿Ya tienes cuenta?{' '}
            <Text style={styles.loginTextBold}>Inicia sesión</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'space-between',
  },
  introSection: {
    paddingTop: 8,
    paddingBottom: 24,
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.dark,
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.gray,
    lineHeight: 20,
  },
  cardsScroll: {
    flex: 1,
  },
  cardsContainer: {
    gap: 14,
    paddingBottom: 16,
  },
  roleCard: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  cardGradient: {
    flex: 1,
    padding: 20,
    justifyContent: 'space-between',
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  badgeAlt: {
    backgroundColor: COLORS.primary + '25',
  },
  badgeProfesor: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  badgeText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '700',
  },
  badgeTextAlt: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: '700',
  },
  cardBody: {
    flex: 1,
    justifyContent: 'center',
  },
  roleTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.white,
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  roleDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.85)',
    lineHeight: 20,
    marginBottom: 16,
  },
  featuresList: {
    gap: 10,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureText: {
    fontSize: 14,
    color: COLORS.white,
    fontWeight: '600',
  },
  cardFooter: {
    alignItems: 'flex-end',
  },
  footer: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 8,
  },
  loginButton: {
    backgroundColor: '#F5F5F5',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  loginText: {
    fontSize: 14,
    color: COLORS.gray,
  },
  loginTextBold: {
    color: COLORS.primary,
    fontWeight: '700',
  },
});