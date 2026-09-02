import React, { useState, useEffect, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Alert, Linking, Modal, View, Text, TouchableOpacity, StyleSheet, Animated, Easing } from 'react-native';
import { COLORS } from '../constants';
import { useAuth } from '../contexts/AuthContext';

// Screens
import SplashScreen from '../screens/SplashScreen';
import LoginScreen from '../screens/LoginScreen';
import RoleSelectionScreen from '../screens/RoleSelectionScreen';
import RegisterScreen from '../screens/RegisterScreen';
import RegisterOwnerScreen from '../screens/RegisterOwnerScreen';
import HomeScreen from '../screens/HomeScreen';
import HomeOwnerScreen from '../screens/HomeOwnerScreen';
import CanchasListScreen from '../screens/CanchasListScreen';
import BuscarCanchasScreen from '../screens/BuscarCanchasScreen';
import ProfileScreen from '../screens/ProfileScreen';
import MisReservasScreen from '../screens/MisReservasScreen';
import MisCanchasScreen from '../screens/MisCanchasScreen';
import EditCanchaScreen from '../screens/EditCanchaScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import NotificationsSettingsScreen from '../screens/NotificationsSettingsScreen';
import AddCanchaScreen from '../screens/AddCanchaScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import ReservasOwnerScreen from '../screens/ReservasOwnerScreen';
import FriendsScreen from '../screens/FriendsScreen';
import CanchaDetail from '../screens/CanchaDetail';
import ReservaScheduleScreen from '../screens/ReservaScheduleScreen';
import InvitacionesScreen from '../screens/InvitacionesScreen';
import InvitarAmigosScreen from '../screens/InvitarAmigosScreen';
import BuscarPartidosScreen from '../screens/BuscarPartidosScreen';
import SolicitudesPartidoScreen from '../screens/SolicitudesPartidoScreen';
import DetalleReservaScreen from '../screens/DetalleReservaScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import VerifyResetCodeScreen from '../screens/VerifyResetCodeScreen';
import ResetPasswordScreen from '../screens/ResetPasswordScreen';
import ChangePhoneScreen from '../screens/ChangePhoneScreen';
import VerifyPhoneChangeScreen from '../screens/VerifyPhoneChangeScreen';
import DetalleInvitacionScreen from '../screens/DetalleInvitacionScreen';
import WelcomeScreen from '../screens/WelcomeScreen';
import SancionesScreen from '../screens/SancionesScreen';
import AplicarSancionScreen from '../screens/AplicarSancionScreen';
import PropietarioEnviarNotificacionScreen from '../screens/PropietarioEnviarNotificacionScreen';
import VerifyRegisterPhoneScreen from '../screens/VerifyRegisterPhoneScreen';
import ProfesorProfileSetupScreen from '../screens/ProfesorProfileSetupScreen';

// Admin Screens
import AdminHomeScreen from '../screens/admin/AdminHomeScreen';
import AdminUsuariosScreen from '../screens/admin/AdminUsuariosScreen';
import AdminUsuarioDetalleScreen from '../screens/admin/AdminUsuarioDetalleScreen';
import AdminNotificacionesScreen from '../screens/admin/AdminNotificacionesScreen';

// Dentro del Stack.Navigator
const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();



// Función para abrir WhatsApp de Deportiva
const openDeportivaWhatsApp = () => {
  const phone = '5492346696420';
  const message = 'Hola! Me gustaría activar mi suscripción de propietario en Deportiva.';
  const url = `whatsapp://send?phone=${phone}&text=${encodeURIComponent(message)}`;
  
  Linking.canOpenURL(url)
    .then((supported) => {
      if (supported) {
        Linking.openURL(url);
      } else {
        Alert.alert('Oops!', 'WhatsApp no está instalado en tu dispositivo');
      }
    })
    .catch((err) => console.error('Error abriendo WhatsApp:', err));
};

// Componente de pelota animada
const AnimatedFootball = ({ visible }) => {
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Animación de rebote
      Animated.loop(
        Animated.sequence([
          Animated.timing(bounceAnim, {
            toValue: -8,
            duration: 400,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(bounceAnim, {
            toValue: 0,
            duration: 400,
            easing: Easing.in(Easing.quad),
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Animación de rotación sutil
      Animated.loop(
        Animated.sequence([
          Animated.timing(rotateAnim, {
            toValue: 1,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(rotateAnim, {
            toValue: 0,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [visible]);

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['-10deg', '10deg'],
  });

  return (
    <Animated.View
      style={[
        subscriptionModalStyles.iconContainer,
        {
          transform: [
            { translateY: bounceAnim },
            { rotate: rotate },
          ],
        },
      ]}
    >
      <Ionicons name="football" size={40} color={COLORS.primary} />
    </Animated.View>
  );
};

// Componente de botón WhatsApp animado
const AnimatedWhatsAppButton = ({ onPress }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Animación de pulso suave
    Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.03,
          duration: 600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }], width: '100%' }}>
      <TouchableOpacity 
        style={subscriptionModalStyles.primaryButton}
        onPress={onPress}
        activeOpacity={0.8}
      >
        <Ionicons name="logo-whatsapp" size={22} color={COLORS.white} />
        <Text style={subscriptionModalStyles.primaryButtonText}>Contactar por WhatsApp</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

// Estilos del modal de suscripción
const subscriptionModalStyles = StyleSheet.create({
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
    maxWidth: 340,
    alignItems: 'center',
  },
  iconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: COLORS.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.dark,
    textAlign: 'center',
    marginBottom: 12,
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
    gap: 10,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  secondaryButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: COLORS.gray,
    fontSize: 15,
    fontWeight: '500',
  },
});

function HomeTabs() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const isPropietario = user?.rol === 'PROPIETARIO';
  const suscripcionActiva = user?.suscripcionActiva !== false;
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);

  const handleContactWhatsApp = () => {
    setShowSubscriptionModal(false);
    openDeportivaWhatsApp();
  };
  
  return (
    <>
      {/* Modal de suscripción inactiva */}
      <Modal
        visible={showSubscriptionModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowSubscriptionModal(false)}
      >
        <View style={subscriptionModalStyles.overlay}>
          <View style={subscriptionModalStyles.container}>
            <AnimatedFootball visible={showSubscriptionModal} />
            <Text style={subscriptionModalStyles.title}>
              ¡No te pierdas las reservas!
            </Text>
            <Text style={subscriptionModalStyles.message}>
              Tu cuenta está en pausa. Activá tu suscripción para que los jugadores puedan ver tus canchas y reservar.{'\n\n'}¡Volvé a la cancha!
            </Text>
            <View style={subscriptionModalStyles.buttonsContainer}>
              <AnimatedWhatsAppButton onPress={handleContactWhatsApp} />
              <TouchableOpacity 
                style={subscriptionModalStyles.secondaryButton}
                onPress={() => setShowSubscriptionModal(false)}
                activeOpacity={0.7}
              >
                <Text style={subscriptionModalStyles.secondaryButtonText}>Ahora no</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'HomeTab') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Explorar') {
            iconName = focused ? 'search' : 'search-outline';
          } else if (route.name === 'Reservas' || route.name === 'MisCanchas') {
            iconName = focused ? (isPropietario ? 'business' : 'calendar') : (isPropietario ? 'business-outline' : 'calendar-outline');
          } else if (route.name === 'Perfil') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.gray,
        tabBarStyle: {
          height: 60 + insets.bottom,
          paddingBottom: insets.bottom > 0 ? insets.bottom : 8,
          paddingTop: 8,
          borderTopWidth: 0,
          elevation: 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        headerShown: false,
      })}
    >
      <Tab.Screen
        name="HomeTab"
        component={isPropietario ? HomeOwnerScreen : HomeScreen}
        options={{ tabBarLabel: 'Inicio' }}
      />
      {isPropietario ? (
        <Tab.Screen
          name="MisCanchas"
          component={MisCanchasScreen}
          options={{ tabBarLabel: 'Mis Canchas' }}
          listeners={{
            tabPress: (e) => {
              // Si la suscripción no está activa, bloquear y mostrar modal
              if (!suscripcionActiva) {
                e.preventDefault();
                setShowSubscriptionModal(true);
              }
            },
          }}
        />
      ) : (
        <Tab.Screen
          name="Reservas"
          component={MisReservasScreen}
          options={{ tabBarLabel: 'Reservas' }}
        />
      )}
      <Tab.Screen
        name="Perfil"
        component={ProfileScreen}
        options={{ tabBarLabel: 'Perfil' }}
      />
    </Tab.Navigator>
    </>
  );
}

function AuthStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="RoleSelection" component={RoleSelectionScreen} />
      <Stack.Screen name="RegisterJugador" component={RegisterScreen} />
      <Stack.Screen name="RegisterPropietario" component={RegisterOwnerScreen} />
      <Stack.Screen name="VerifyRegisterPhone" component={VerifyRegisterPhoneScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="VerifyResetCode" component={VerifyResetCodeScreen} />
      <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
    </Stack.Navigator>
  );
}

function MainStack({ isPropietario }) {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Main" component={HomeTabs} />
      <Stack.Screen name="CanchasList" component={CanchasListScreen} />
      <Stack.Screen name="BuscarCanchas" component={BuscarCanchasScreen} />
      <Stack.Screen name="CanchaDetail" component={CanchaDetail} />
      <Stack.Screen name="ReservaSchedule" component={ReservaScheduleScreen} />
      <Stack.Screen name="MisReservas" component={isPropietario ? ReservasOwnerScreen : MisReservasScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="ChangePhone" component={ChangePhoneScreen} />
      <Stack.Screen name="VerifyPhoneChange" component={VerifyPhoneChangeScreen} />
      <Stack.Screen name="NotificationsSettings" component={NotificationsSettingsScreen} />
      <Stack.Screen name="AddCancha" component={AddCanchaScreen} />
      <Stack.Screen name="EditCancha" component={EditCanchaScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="Friends" component={FriendsScreen} />
      <Stack.Screen name="Invitaciones" component={InvitacionesScreen} />
      <Stack.Screen name="DetalleInvitacion" component={DetalleInvitacionScreen} />
      <Stack.Screen name="InvitarAmigos" component={InvitarAmigosScreen} />
      <Stack.Screen name="BuscarPartidos" component={BuscarPartidosScreen} />
      <Stack.Screen name="SolicitudesPartido" component={SolicitudesPartidoScreen} />
      <Stack.Screen name="DetalleReserva" component={DetalleReservaScreen} />
      <Stack.Screen name="Sanciones" component={SancionesScreen} />
      <Stack.Screen name="AplicarSancion" component={AplicarSancionScreen} />
      <Stack.Screen name="EnviarNotificacion" component={PropietarioEnviarNotificacionScreen} />
    </Stack.Navigator>
  );
}

function WelcomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="ProfesorProfileSetup" component={ProfesorProfileSetupScreen} />
    </Stack.Navigator>
  );
}

// Stack de navegación para Admin (sin tabs de Inicio, Reservas, Perfil)
function AdminStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="AdminHome" component={AdminHomeScreen} />
      <Stack.Screen name="AdminUsuarios" component={AdminUsuariosScreen} />
      <Stack.Screen name="AdminUsuarioDetalle" component={AdminUsuarioDetalleScreen} />
      <Stack.Screen name="AdminNotificaciones" component={AdminNotificacionesScreen} />
    </Stack.Navigator>
  );
}

export default function AppNavigator() {
  const { isAuthenticated, loading, user, isNewUser } = useAuth();
  const [showSplash, setShowSplash] = useState(true);
  const isPropietario = user?.rol === 'PROPIETARIO';
  const isAdmin = user?.rol === 'ADMIN';

  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  if (loading) {
    return null;
  }

  // Determinar qué stack mostrar
  const getNavigatorKey = () => {
    if (!isAuthenticated) return 'auth';
    if (isNewUser) return 'welcome';
    if (isAdmin) return 'admin';
    return 'main';
  };

  const getActiveStack = () => {
    if (!isAuthenticated) {
      return <AuthStack />;
    }
    if (isNewUser) {
      return <WelcomeStack />;
    }
    if (isAdmin) {
      return <AdminStack />;
    }
    return <MainStack isPropietario={isPropietario} />;
  };

  return (
    <NavigationContainer key={getNavigatorKey()}>
      {getActiveStack()}
    </NavigationContainer>
  );
}
