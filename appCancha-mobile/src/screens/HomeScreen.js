import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Modal,
    Linking,
} from 'react-native';
import { Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../constants';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

// Banner de sugerencias optimizado
const SuggestionBanner = ({ navigation }) => (
    <View style={suggestionStyles.container}>
        <View style={suggestionStyles.content}>
            <View style={suggestionStyles.iconCircle}>
                <Ionicons name="bulb-outline" size={22} color={COLORS.primary} />
            </View>
            <View style={suggestionStyles.info}>
                <Text style={suggestionStyles.title}>¿Conoces un espacio?</Text>
                <Text style={suggestionStyles.subtitle}>Ayúdanos a agregarlo</Text>
            </View>
        </View>
        <TouchableOpacity 
            style={suggestionStyles.button} 
            onPress={() => {/* Navegación a sugerencia */}}
            activeOpacity={0.7}
        >
            <Text style={suggestionStyles.buttonText}>Sugerir</Text>
            <Ionicons name="arrow-forward" size={16} color={COLORS.white} style={{ marginLeft: 4 }} />
        </TouchableOpacity>
    </View>
);

export default function HomeScreen({ navigation }) {
    const { user } = useAuth();
    const insets = useSafeAreaInsets();
    const [notificationCount, setNotificationCount] = useState(0);
    const [showDesactivadoModal, setShowDesactivadoModal] = useState(false);

    const openWhatsAppSoporte = () => {
        const phone = '5492346696420';
        const message = `Hola, soy ${user?.nombre || 'un usuario'} y mi cuenta ha sido desactivada. Necesito ayuda.`;
        const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
        Linking.openURL(url);
    };

    useEffect(() => {
        loadNotificationCount();
        // Cargar cada 30 segundos
        const interval = setInterval(loadNotificationCount, 30000);
        return () => clearInterval(interval);
    }, []);

    // Recargar contador cuando la pantalla esté en foco
    useFocusEffect(
        useCallback(() => {
            loadNotificationCount();
        }, [])
    );

    const loadNotificationCount = async () => {
        try {
            const response = await api.get('/notificaciones/count');
            if (response.data.success) {
                setNotificationCount(response.data.count || 0);
            }
        } catch (error) {
            // Silenciosamente ignorar errores
            console.log('Error loading notification count');
        }
    };

    // Animaciones optimizadas
    const crearScale = useRef(new Animated.Value(1)).current;
    const unirmeScale = useRef(new Animated.Value(1)).current;
    const bellShake = useRef(new Animated.Value(0)).current;

    // Animación de la campana cuando hay notificaciones
    useEffect(() => {
        if (notificationCount > 0) {
            const shakeAnimation = Animated.loop(
                Animated.sequence([
                    Animated.timing(bellShake, { toValue: 1, duration: 100, useNativeDriver: true }),
                    Animated.timing(bellShake, { toValue: -1, duration: 100, useNativeDriver: true }),
                    Animated.timing(bellShake, { toValue: 1, duration: 100, useNativeDriver: true }),
                    Animated.timing(bellShake, { toValue: 0, duration: 100, useNativeDriver: true }),
                    Animated.delay(3000), // Pausa de 3 segundos entre animaciones
                ])
            );
            shakeAnimation.start();
            return () => shakeAnimation.stop();
        } else {
            bellShake.setValue(0);
        }
    }, [notificationCount]);

    const bellRotation = bellShake.interpolate({
        inputRange: [-1, 0, 1],
        outputRange: ['-15deg', '0deg', '15deg']
    });

    const pressInAnim = (scaleAnim) => {
        Animated.spring(scaleAnim, {
            toValue: 0.96,
            useNativeDriver: true,
            speed: 50,
            bounciness: 4
        }).start();
    };

    const pressOutAnim = (scaleAnim) => {
        Animated.spring(scaleAnim, {
            toValue: 1,
            useNativeDriver: true,
            speed: 50,
            bounciness: 4
        }).start();
    };

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Buenos días';
        if (hour < 20) return 'Buenas tardes';
        return 'Buenas noches';
    };

    const handleCrearReserva = () => {
        // Verificar si el usuario está activo
        if (user?.activo === false) {
            setShowDesactivadoModal(true);
            return;
        }
        navigation.navigate('BuscarCanchas', { from: 'crear' });
    };

    const handleUnirmeActividad = () => {
        // Verificar si el usuario está activo
        if (user?.activo === false) {
            setShowDesactivadoModal(true);
            return;
        }
        navigation.navigate('BuscarPartidos');
    };

    return (
        <View style={styles.container}>
            {/* Header minimalista */}
            <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
                <View style={styles.headerContent}>
                    <View style={styles.greetingContainer}>
                        <Text style={styles.greeting}>
                            {getGreeting()}
                        </Text>
                        {user && (
                            <Text style={styles.userName}>{user.nombre.split(' ')[0]}</Text>
                        )}
                    </View>
                    <TouchableOpacity 
                        onPress={() => navigation.navigate('Notifications')} 
                        style={styles.notificationButton}
                        activeOpacity={0.7}
                    >
                        <Animated.View style={[
                            styles.notificationIcon,
                            { transform: [{ rotate: bellRotation }] }
                        ]}>
                            <Ionicons 
                                name={notificationCount > 0 ? "notifications" : "notifications-outline"} 
                                size={24} 
                                color={notificationCount > 0 ? COLORS.primary : COLORS.dark} 
                            />
                            {notificationCount > 0 && (
                                <View style={styles.notificationBadge}>
                                    <Text style={styles.badgeText}>
                                        {notificationCount > 9 ? '9+' : notificationCount}
                                    </Text>
                                </View>
                            )}
                        </Animated.View>
                    </TouchableOpacity>
                </View>
            </View>
            
            {/* Contenido principal */}
            <ScrollView 
                style={styles.content} 
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {/* Acciones principales */}
                <View style={styles.actionsContainer}>
                    {/* Crear Reserva */}
                    <TouchableOpacity
                        activeOpacity={1}
                        onPress={handleCrearReserva}
                        onPressIn={() => pressInAnim(crearScale)}
                        onPressOut={() => pressOutAnim(crearScale)}
                    >
                        <Animated.View style={[
                            styles.actionCard, 
                            styles.createCard,
                            { transform: [{ scale: crearScale }] }
                        ]}>
                            <LinearGradient
                                colors={[COLORS.primary, '#00D99E']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.actionGradient}
                            >
                                <View style={styles.actionHeader}>
                                    <View style={styles.iconContainer}>
                                        <Ionicons name="add-circle" size={32} color={COLORS.white} />
                                    </View>
                                    <View style={styles.actionBadge}>
                                        <Text style={styles.badgeText}>Nuevo</Text>
                                    </View>
                                </View>
                                
                                <View style={styles.actionBody}>
                                    <Text style={styles.actionTitle}>Crear Reserva</Text>
                                    <Text style={styles.actionSubtitle}>
                                        Reserva un espacio y organiza tu actividad
                                    </Text>
                                </View>

                                <View style={styles.actionFooter}>
                                    <View style={styles.arrowCircle}>
                                        <Ionicons name="arrow-forward" size={20} color={COLORS.white} />
                                    </View>
                                </View>
                            </LinearGradient>
                        </Animated.View>
                    </TouchableOpacity>

                    {/* Unirme a Actividad */}
                    <TouchableOpacity
                        activeOpacity={1}
                        onPress={handleUnirmeActividad}
                        onPressIn={() => pressInAnim(unirmeScale)}
                        onPressOut={() => pressOutAnim(unirmeScale)}
                    >
                        <Animated.View style={[
                            styles.actionCard,
                            styles.joinCard,
                            { transform: [{ scale: unirmeScale }] }
                        ]}>
                            <LinearGradient
                                colors={['#0A1628', '#0D1F36']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.actionGradient}
                            >
                                <View style={styles.actionHeader}>
                                    <View style={styles.iconContainer}>
                                        <Ionicons name="people" size={32} color={COLORS.primary} />
                                    </View>
                                    <View style={[styles.actionBadge, styles.transparentBadge]}>
                                        <Text style={styles.badgeTextAlt}>Popular</Text>
                                    </View>
                                </View>
                                
                                <View style={styles.actionBody}>
                                    <Text style={styles.actionTitle}>Unirme a Actividad</Text>
                                    <Text style={styles.actionSubtitle}>
                                        Únete a actividades que necesitan participantes
                                    </Text>
                                </View>

                                <View style={styles.actionFooter}>
                                    <View style={[styles.arrowCircle, styles.arrowCircleAlt]}>
                                        <Ionicons name="arrow-forward" size={20} color={COLORS.primary} />
                                    </View>
                                </View>
                            </LinearGradient>
                        </Animated.View>
                    </TouchableOpacity>
                </View>

                {/* Espaciado para el banner */}
                <View style={{ height: 20 }} />
            </ScrollView>

            {/* Banner fijo inferior */}
            <SuggestionBanner navigation={navigation} />

            {/* Modal Usuario Desactivado */}
            <Modal
                visible={showDesactivadoModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowDesactivadoModal(false)}
            >
                <View style={desactivadoStyles.overlay}>
                    <View style={desactivadoStyles.content}>
                        <View style={desactivadoStyles.iconContainer}>
                            <Ionicons name="alert-circle" size={50} color="#EF4444" />
                        </View>
                        <Text style={desactivadoStyles.title}>Cuenta Desactivada</Text>
                        <Text style={desactivadoStyles.message}>
                            Tu cuenta ha sido desactivada temporalmente.{'\n'}
                            Si necesitas ayuda, comunícate con nuestro soporte.
                        </Text>
                        <TouchableOpacity 
                            style={desactivadoStyles.whatsappButton}
                            onPress={openWhatsAppSoporte}
                        >
                            <Ionicons name="logo-whatsapp" size={22} color={COLORS.white} />
                            <Text style={desactivadoStyles.whatsappText}>Contactar Soporte</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                            style={desactivadoStyles.closeButton}
                            onPress={() => setShowDesactivadoModal(false)}
                        >
                            <Text style={desactivadoStyles.closeText}>Cerrar</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

// Estilos del banner
const suggestionStyles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: COLORS.white,
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderTopWidth: 1,
        borderTopColor: '#F0F0F0',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 8,
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    iconCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.primary + '15',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    info: {
        flex: 1,
    },
    title: {
        fontSize: 15,
        fontWeight: '700',
        color: COLORS.dark,
        marginBottom: 2,
    },
    subtitle: {
        fontSize: 13,
        color: COLORS.gray,
    },
    button: {
        backgroundColor: COLORS.primary,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 10,
        marginLeft: 12,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    buttonText: {
        color: COLORS.white,
        fontSize: 14,
        fontWeight: '700',
    },
});

// Estilos principales
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FAFAFA',
    },
    header: {
        backgroundColor: COLORS.white,
        paddingBottom: 20,
        paddingHorizontal: 24,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    headerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    greetingContainer: {
        flex: 1,
    },
    greeting: {
        fontSize: 16,
        fontWeight: '500',
        color: COLORS.gray,
        marginBottom: 4,
    },
    userName: {
        fontSize: 28,
        fontWeight: '800',
        color: COLORS.dark,
        letterSpacing: -0.5,
    },
    notificationButton: {
        padding: 8,
    },
    notificationIcon: {
        position: 'relative',
    },
    notificationBadge: {
        position: 'absolute',
        top: 2,
        right: 2,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: COLORS.primary,
        borderWidth: 2,
        borderColor: COLORS.white,
    },
    content: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 100,
    },
    actionsContainer: {
        padding: 24,
        gap: 16,
    },
    actionCard: {
        borderRadius: 24,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12,
        shadowRadius: 16,
        elevation: 8,
    },
    createCard: {
        shadowColor: COLORS.primary,
        shadowOpacity: 0.25,
    },
    joinCard: {
        shadowColor: '#000',
        shadowOpacity: 0.15,
    },
    actionGradient: {
        padding: 24,
        minHeight: 200,
    },
    actionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    iconContainer: {
        width: 56,
        height: 56,
        borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.15)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    actionBadge: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    transparentBadge: {
        backgroundColor: COLORS.primary + '25',
    },
    badgeText: {
        color: COLORS.white,
        fontSize: 12,
        fontWeight: '700',
    },
    badgeTextAlt: {
        color: COLORS.primary,
        fontSize: 12,
        fontWeight: '700',
    },
    actionBody: {
        marginBottom: 20,
    },
    actionTitle: {
        fontSize: 28,
        fontWeight: '800',
        color: COLORS.white,
        marginBottom: 8,
        letterSpacing: -0.5,
    },
    actionSubtitle: {
        fontSize: 15,
        color: 'rgba(255,255,255,0.75)',
        lineHeight: 22,
    },
    actionFooter: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
    },
    arrowCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    arrowCircleAlt: {
        backgroundColor: COLORS.primary + '25',
    },
});

// Estilos del modal de desactivación
const desactivadoStyles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    content: {
        backgroundColor: COLORS.white,
        borderRadius: 20,
        padding: 24,
        alignItems: 'center',
        width: '100%',
        maxWidth: 340,
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#FEE2E2',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: 22,
        fontWeight: '700',
        color: COLORS.dark,
        marginBottom: 12,
    },
    message: {
        fontSize: 15,
        color: COLORS.gray,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 24,
    },
    whatsappButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#25D366',
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 12,
        gap: 10,
        width: '100%',
        marginBottom: 12,
    },
    whatsappText: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: '600',
    },
    closeButton: {
        paddingVertical: 12,
    },
    closeText: {
        color: COLORS.gray,
        fontSize: 15,
        fontWeight: '500',
    },
});