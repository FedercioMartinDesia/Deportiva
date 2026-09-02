import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../constants';
import { useAuth } from '../contexts/AuthContext';

export default function WelcomeScreen({ navigation }) {
  const { user, completeWelcome } = useAuth();
  const insets = useSafeAreaInsets();
  const nombre = user?.nombre || 'Usuario';
  const isPropietario = user?.rol === 'PROPIETARIO';
  
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const [isProfesor, setIsProfesor] = useState(false);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const confettiAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loadData = async () => {
      const photo = await AsyncStorage.getItem('welcomePhoto');
      if (photo) setProfilePhoto(photo);
      const pendingProfesor = await AsyncStorage.getItem('pendingProfesorSetup');
      if (pendingProfesor === 'true') setIsProfesor(true);
    };
    loadData();

    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, friction: 4, tension: 40, useNativeDriver: true }),
      ]),
      Animated.timing(slideAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
      Animated.timing(confettiAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleContinue = async () => {
    if (isNavigating) return;
    setIsNavigating(true);
    if (isProfesor) {
      navigation.navigate('ProfesorProfileSetup');
    } else {
      await completeWelcome();
    }
  };

  const content = isProfesor ? {
    subtitle: 'Tu cuenta de profesor ha sido creada exitosamente.\n¡Solo falta completar tu perfil profesional!',
    features: [
      { icon: 'school', text: 'Publicá tus clases deportivas' },
      { icon: 'people', text: 'Gestioná tus alumnos' },
      { icon: 'cash', text: 'Cobrá por la app de forma segura' },
    ],
    emojis: ['🎾', '🏅', '📚', '💪'],
    buttonText: 'Completar perfil de profesor',
  } : isPropietario ? {
    subtitle: 'Tu cuenta de propietario ha sido creada exitosamente.\n¡Estás listo para gestionar tus espacios!',
    features: [
      { icon: 'business', text: 'Publica tus espacios deportivos' },
      { icon: 'calendar', text: 'Gestiona reservas fácilmente' },
      { icon: 'cash', text: 'Recibe pagos de forma segura' },
    ],
    emojis: ['🏟️', '⚽', '💼', '🎯'],
    buttonText: '¡Empezar a gestionar!',
  } : {
    subtitle: 'Tu cuenta ha sido creada exitosamente.\n¡Estás listo para reservar tu próxima actividad!',
    features: [
      { icon: 'search', text: 'Busca actividades cerca tuyo' },
      { icon: 'calendar', text: 'Reserva en segundos' },
      { icon: 'people', text: 'Invita a tus amigos' },
    ],
    emojis: ['🎉', '⚽', '🏆', '🎊'],
    buttonText: '¡Comenzar!',
  };

  const accentColor = isProfesor ? '#6C3CE1' : isPropietario ? '#4ECDC4' : COLORS.primary;

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={[styles.backgroundCircle1, { backgroundColor: accentColor + '10' }]} />
      <View style={[styles.backgroundCircle2, { backgroundColor: accentColor + '08' }]} />
      
      <View style={styles.content}>
        <Animated.View style={[styles.iconContainer, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
          {profilePhoto ? (
            <Image source={{ uri: profilePhoto }} style={[styles.profileImage, { borderColor: accentColor }]} />
          ) : (
            <View style={[styles.iconCircle, { backgroundColor: accentColor, shadowColor: accentColor }]}>
              <Ionicons name="checkmark" size={60} color={COLORS.white} />
            </View>
          )}
          
          <Animated.View style={[styles.confetti, styles.confetti1, { opacity: confettiAnim }]}>
            <Text style={styles.confettiEmoji}>{content.emojis[0]}</Text>
          </Animated.View>
          <Animated.View style={[styles.confetti, styles.confetti2, { opacity: confettiAnim }]}>
            <Text style={styles.confettiEmoji}>{content.emojis[1]}</Text>
          </Animated.View>
          <Animated.View style={[styles.confetti, styles.confetti3, { opacity: confettiAnim }]}>
            <Text style={styles.confettiEmoji}>{content.emojis[2]}</Text>
          </Animated.View>
          <Animated.View style={[styles.confetti, styles.confetti4, { opacity: confettiAnim }]}>
            <Text style={styles.confettiEmoji}>{content.emojis[3]}</Text>
          </Animated.View>
        </Animated.View>

        <Animated.View style={[styles.textContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <Text style={[styles.welcomeText, { color: accentColor }]}>¡Bienvenido/a!</Text>
          <Text style={styles.nameText}>{nombre}</Text>
          <Text style={styles.subtitleText}>{content.subtitle}</Text>
        </Animated.View>

        <Animated.View style={[styles.featuresContainer, { opacity: confettiAnim }]}>
          {content.features.map((feature, index) => (
            <View key={index} style={[styles.featureItem, { backgroundColor: accentColor + '08' }]}>
              <View style={styles.featureIcon}>
                <Ionicons name={feature.icon} size={20} color={accentColor} />
              </View>
              <Text style={styles.featureText}>{feature.text}</Text>
            </View>
          ))}
        </Animated.View>
      </View>

      <Animated.View style={[styles.buttonContainer, { opacity: confettiAnim }]}>
        <TouchableOpacity 
          style={[styles.continueButton, { backgroundColor: accentColor, shadowColor: accentColor }]} 
          onPress={handleContinue}
          disabled={isNavigating}
        >
          <Text style={styles.continueButtonText}>{content.buttonText}</Text>
          <Ionicons name="arrow-forward" size={20} color={COLORS.white} />
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  backgroundCircle1: {
    position: 'absolute',
    top: -100,
    right: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
  },
  backgroundCircle2: {
    position: 'absolute',
    bottom: -50,
    left: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  iconContainer: {
    marginBottom: 32,
    position: 'relative',
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
  },
  confetti: {
    position: 'absolute',
  },
  confetti1: {
    top: -20,
    left: -30,
  },
  confetti2: {
    top: -10,
    right: -30,
  },
  confetti3: {
    bottom: -10,
    left: -20,
  },
  confetti4: {
    bottom: 0,
    right: -25,
  },
  confettiEmoji: {
    fontSize: 28,
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  welcomeText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  nameText: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.dark,
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitleText: {
    fontSize: 16,
    color: COLORS.gray,
    textAlign: 'center',
    lineHeight: 24,
  },
  featuresContainer: {
    width: '100%',
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
  },
  featureIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureText: {
    fontSize: 15,
    color: COLORS.dark,
    fontWeight: '500',
  },
  buttonContainer: {
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  continueButton: {
    flexDirection: 'row',
    borderRadius: 14,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  continueButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.white,
  },
});
