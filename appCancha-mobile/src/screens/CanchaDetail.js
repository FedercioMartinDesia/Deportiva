import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
  Alert,
  FlatList,
  Linking,
  Dimensions,
  Animated,
  Modal
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants';
import { canchaService } from '../services/canchaService';
import { useAuth } from '../contexts/AuthContext';
import { FutbolIcon, TenisIcon, BasquetIcon, PadelIcon, VoleyIcon } from '../components/SportIcons';
import AnimatedSportBall from '../components/AnimatedSportBall';

const screenWidth = Dimensions.get('window').width;
const PAYMENT_METHODS = {
  EFECTIVO: 'EFECTIVO',
  DIVIDIR: 'DIVIDIR_ENTRE_JUGADORES',
  PAGAR_TODO: 'PAGAR_TODO_YO'
};
const amenityIcons = {
  vestuarios: 'shirt',
  estacionamiento: 'car',
  iluminacion: 'bulb',
  parrilla: 'flame',
  buffet: 'fast-food',
  duchas: 'water',
  techada: 'home',
  torneos: 'trophy',
  escuelita: 'school',
  ayudaMedica: 'medkit',
  cumpleanos: 'balloon',
  colegios: 'people',
  camaras: 'videocam',
  gimnasio: 'barbell',
  wifi: 'wifi',
  tribuna: 'people-circle',
  gradas: 'albums',
};

// Función para formatear el deporte
const formatDeporte = (deporte) => {
  if (!deporte) return '';
  return deporte
    .split('_')
    .map(word => {
      if (word === 'FUTBOL') return 'Fútbol';
      if (word === 'FUTSAL') return 'Futsal';
      if (word === 'PADEL') return 'Pádel';
      if (word === 'VOLEY') return 'Voleibol';
      if (word === 'TENIS') return 'Tenis';
      if (word === 'BASQUET') return 'Básquet';
      return word.charAt(0) + word.slice(1).toLowerCase();
    })
    .join(' ');
};

// Función para obtener el componente SVG del deporte
const getDeporteSVGIcon = (deporte) => {
  if (!deporte) return <BasquetIcon size={80} color={COLORS.primary} />;
  const deporteUpper = deporte.toUpperCase();
  
  if (deporteUpper.includes('FUTBOL')) return <FutbolIcon size={80} color={COLORS.primary} />;
  if (deporteUpper.includes('PADEL')) return <PadelIcon size={80} color={COLORS.primary} />;
  if (deporteUpper.includes('TENIS')) return <TenisIcon size={80} color={COLORS.primary} />;
  if (deporteUpper.includes('VOLEY')) return <VoleyIcon size={80} color={COLORS.primary} />;
  if (deporteUpper.includes('BASQUET')) return <BasquetIcon size={80} color={COLORS.primary} />;
  
  return <BasquetIcon size={80} color={COLORS.primary} />;
};

export default function CanchaDetail({ route, navigation }) {
  const { canchaId } = route.params;
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [cancha, setCancha] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const flatListRef = useRef(null);
  const [showPaymentOptions, setShowPaymentOptions] = useState(false);
  const [showPhoneSelector, setShowPhoneSelector] = useState(false);
  
  useEffect(() => {
    loadCanchaDetail();
  }, []);

  const loadCanchaDetail = async () => {
    try {
      setLoading(true);
      console.log('🔄 Cargando cancha con ID:', canchaId);
      const data = await canchaService.getCanchaById(canchaId);
      console.log('✅ Cancha cargada:', data);
      console.log('📷 imagenPrincipal:', data?.imagenPrincipal);
      console.log('📷 imagenes array:', data?.imagenes);
      setCancha(data);
    } catch (error) {
      console.error('❌ Error al cargar detalles de cancha:', error);
      Alert.alert('Error', 'No se pudieron cargar los detalles del espacio');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const openMap = () => {
    if (cancha?.latitud && cancha?.longitud) {
      const mapUrl = `https://www.google.com/maps/search/?api=1&query=${cancha.latitud},${cancha.longitud}`;
      Linking.openURL(mapUrl).catch(err =>
        Alert.alert('Error', 'No se pudo abrir Google Maps')
      );
    }
  };

  const getTelefonos = () => {
    const telefonos = [];
    if (cancha?.propietario?.telefono) {
      telefonos.push({ nombre: 'Principal', numero: cancha.propietario.telefono });
    }
    if (cancha?.telefonos && Array.isArray(cancha.telefonos)) {
      cancha.telefonos.forEach(t => {
        if (t.numero && !telefonos.find(tel => tel.numero === t.numero)) {
          telefonos.push({ nombre: t.nombre || 'Contacto', numero: t.codigoPais ? `${t.codigoPais}${t.numero}` : t.numero });
        }
      });
    }
    return telefonos;
  };

  const openWhatsApp = () => {
    const telefonos = getTelefonos();
    if (telefonos.length === 0) {
      Alert.alert('Sin teléfono', 'Este espacio no tiene un número de contacto');
      return;
    }
    if (telefonos.length === 1) {
      enviarWhatsApp(telefonos[0].numero);
    } else {
      setShowPhoneSelector(true);
    }
  };

  const enviarWhatsApp = (telefono) => {
    const phone = telefono.replace(/\D/g, '');
    const message = `Hola, me interesa reservar ${espacio.nombre}`;
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    Linking.openURL(url).catch(err =>
      Alert.alert('Error', 'No se pudo abrir WhatsApp')
    );
    setShowPhoneSelector(false);
  };

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!cancha) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Text style={styles.errorText}>No se encontró el espacio</Text>
      </View>
    );
  }

  // Debug: mostrar datos recibidos
  console.log('🔍 Datos de cancha:', {
    nombre: cancha.nombre,
    precio: cancha.precioPorHora,
    direccion: cancha.direccion,
    ciudad: cancha.ciudad,
    provincia: cancha.provincia,
    descripcion: cancha.descripcion,
    imagenes: cancha.imagenes?.length || 0,
    imagenPrincipal: !!cancha.imagenPrincipal,
  });

  // Combinar imágenes evitando duplicados
  const images = cancha.imagenPrincipal 
    ? [cancha.imagenPrincipal, ...(cancha.imagenes || []).filter(img => img !== cancha.imagenPrincipal)]
    : (cancha.imagenes || []);

  console.log('🖼️ Imágenes totales:', images.length);
  console.log('🖼️ Array de imágenes:', images);

  const currentImage = images[activeImageIndex];

  // Amenities disponibles
  const amenities = [
    { key: 'vestuarios', label: 'Vestuarios', value: cancha.vestuarios },
    { key: 'estacionamiento', label: 'Estacionamiento', value: cancha.estacionamiento },
    { key: 'iluminacion', label: 'Iluminación', value: cancha.iluminacion },
    { key: 'parrilla', label: 'Parrilla', value: cancha.parrilla },
    { key: 'buffet', label: 'Buffet', value: cancha.buffet },
    { key: 'duchas', label: 'Duchas', value: cancha.duchas },
    { key: 'wifi', label: 'WiFi', value: cancha.wifi },
    { key: 'gimnasio', label: 'Gimnasio', value: cancha.gimnasio },
    { key: 'camaras', label: 'Cámaras', value: cancha.camaras },
    { key: 'tribuna', label: 'Tribuna', value: cancha.tribuna },
    { key: 'gradas', label: 'Gradas', value: cancha.gradas },
    { key: 'torneos', label: 'Torneos', value: cancha.torneos },
    { key: 'escuelita', label: 'Escuelita', value: cancha.escuelita },
    { key: 'ayudaMedica', label: 'Ayuda Médica', value: cancha.ayudaMedica },
    { key: 'cumpleanos', label: 'Cumpleaños', value: cancha.cumpleanos },
    { key: 'colegios', label: 'Colegios', value: cancha.colegios },
  ].filter(a => a.value === true);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detalles del espacio</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Debug: mostrar datos si falta información */}
        {(!cancha.nombre || !cancha.precioPorHora || !cancha.direccion) && (
          <View style={styles.debugBox}>
            <Text style={styles.debugTitle}>⚠️ Datos incompletos:</Text>
            <Text style={styles.debugText}>nombre: {cancha.nombre || 'FALTA'}</Text>
            <Text style={styles.debugText}>precio: {cancha.precioPorHora || 'FALTA'}</Text>
            <Text style={styles.debugText}>direccion: {cancha.direccion || 'FALTA'}</Text>
            <Text style={styles.debugText}>ciudad: {cancha.ciudad || 'FALTA'}</Text>
          </View>
        )}

        {/* Galería de imágenes con scroll horizontal */}
        {images && images.length > 0 ? (
          <View style={styles.imageGalleryContainer}>
            <FlatList
              ref={flatListRef}
              data={images}
              keyExtractor={(_, index) => `img-${index}`}
              renderItem={({ item, index }) => (
                <View style={{ width: screenWidth }}>
                  <Image 
                    source={{ uri: item }} 
                    style={styles.mainImage}
                    onError={() => console.log('❌ Error cargando imagen:', item)}
                  />
                </View>
              )}
              horizontal
              pagingEnabled
              bounces={false}
              scrollEventThrottle={16}
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(event) => {
                const contentOffsetX = event.nativeEvent.contentOffset.x;
                const newIndex = Math.round(contentOffsetX / screenWidth);
                setActiveImageIndex(newIndex);
              }}
              nestedScrollEnabled={false}
            />
            {/* Puntitos indicadores */}
            {images && images.length > 1 && (
              <View style={styles.imageDots}>
                {images.map((_, index) => (
                  <TouchableOpacity
                    key={`dot-${index}`}
                    style={[
                      styles.dot,
                      activeImageIndex === index && styles.dotActive
                    ]}
                    onPress={() => {
                      setActiveImageIndex(index);
                      flatListRef.current?.scrollToIndex({ 
                        index, 
                        animated: true,
                        viewPosition: 0 
                      });
                    }}
                  />
                ))}
              </View>
            )}
          </View>
        ) : (
          <View style={styles.noImagesContainer}>
            <AnimatedSportBall deporte={cancha.deporte} size={80} />
            <Text style={styles.noImagesText}>Ups, el propietario no ha{'\n'}cargado imágenes aún</Text>
          </View>
        )}

        {/* Nombre, deporte y precio */}
        <View style={styles.headerInfo}>
          <View style={styles.headerLeft}>
            <Text style={styles.canchaNombre}>{cancha.nombre}</Text>
            <Text style={styles.deporteText}>{formatDeporte(cancha.deporte)}</Text>
          </View>
          <View style={styles.priceSection}>
            <Text style={styles.precio}>${cancha.precioPorHora}</Text>
            <Text style={styles.precioLabel}>por hora</Text>
          </View>
        </View>

        {/* Ubicación */}
        <TouchableOpacity 
          style={styles.locationCard}
          onPress={openMap}
          activeOpacity={0.7}
        >
          <View style={styles.locationHeader}>
            <Ionicons name="location" size={22} color={COLORS.primary} />
            <Text style={styles.locationTitle}>Ubicación</Text>
          </View>
          <Text style={styles.locationAddress}>{cancha.direccion}</Text>
          <Text style={styles.locationCity}>
            {cancha.ciudad}, {cancha.provincia} {cancha.codigoPostal && `- ${cancha.codigoPostal}`}
          </Text>
          <View style={styles.mapButton}>
            <Ionicons name="map" size={16} color={COLORS.primary} />
            <Text style={styles.mapButtonText}>Ver en mapa</Text>
          </View>
        </TouchableOpacity>

        {/* Información general */}
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Información de la cancha</Text>
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <View style={styles.infoIconBox}>
                <Ionicons name="home" size={20} color={COLORS.primary} />
              </View>
              <Text style={styles.infoLabel}>Superficie</Text>
              <Text style={styles.infoValue}>{cancha.superficieTipo}</Text>
            </View>
            <View style={styles.infoItem}>
              <View style={styles.infoIconBox}>
                <Ionicons name="people" size={20} color={COLORS.primary} />
              </View>
              <Text style={styles.infoLabel}>Capacidad</Text>
              <Text style={styles.infoValue}>{cancha.capacidadJugadores} jug.</Text>
            </View>
            <View style={styles.infoItem}>
              <View style={styles.infoIconBox}>
                <Ionicons name={cancha.techada ? "home" : "cloud-outline"} size={20} color={COLORS.primary} />
              </View>
              <Text style={styles.infoLabel}>Tipo</Text>
              <Text style={styles.infoValue}>{cancha.techada ? 'Techada' : 'Al aire libre'}</Text>
            </View>
            {cancha.horasLimiteCancelacion && (
              <View style={styles.infoItem}>
                <View style={styles.infoIconBox}>
                  <Ionicons name="time" size={20} color={COLORS.primary} />
                </View>
                <Text style={styles.infoLabel}>Cancela</Text>
                <Text style={styles.infoValue}>{cancha.horasLimiteCancelacion}h</Text>
              </View>
            )}
          </View>
        </View>

        {/* Amenities */}
        {amenities.length > 0 && (
          <View style={styles.amenitiesSection}>
            <Text style={styles.sectionTitle}>Servicios</Text>
            <View style={styles.amenitiesGrid}>
              {amenities.map((amenity) => (
                <View key={amenity.key} style={styles.amenityChip}>
                  <Ionicons 
                    name={amenityIcons[amenity.key] || "checkmark-circle"} 
                    size={18} 
                    color={COLORS.primary} 
                  />
                  <Text style={styles.amenityLabel}>{amenity.label}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Descripción */}
        {cancha.descripcion && (
          <View style={styles.descriptionSection}>
            <Text style={styles.sectionTitle}>Descripción</Text>
            <View style={styles.descriptionBox}>
              <Text style={styles.descriptionText}>{cancha.descripcion}</Text>
            </View>
          </View>
        )}

        {/* Propietario */}
        {cancha.propietario && (
          <View style={styles.propietarioSection}>
            <Text style={styles.sectionTitle}>Contacto del propietario</Text>
            <View style={styles.propietarioCard}>
              <View style={styles.propietarioAvatar}>
                <Ionicons name="person-circle" size={50} color={COLORS.primary} />
              </View>
              <View style={styles.propietarioInfo}>
                <Text style={styles.propietarioNombre}>
                  {cancha.propietario.nombre} {cancha.propietario.apellido}
                </Text>
                
              </View>
              {cancha.propietario.telefono && (
                <TouchableOpacity 
                  style={styles.whatsappButton}
                  onPress={openWhatsApp}
                  activeOpacity={0.7}
                >
                  <Ionicons name="logo-whatsapp" size={24} color={COLORS.white} />
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* Horarios de apertura y cierre */}
        {cancha.horarios && cancha.horarios.length > 0 && (
          <View style={styles.horarioSection}>
            <Text style={styles.sectionTitle}>Horarios de apertura y cierre</Text>
            {cancha.horarios.map((horario, index) => (
              <View key={index} style={styles.horarioItem}>
                <Text style={styles.horarioDia}>
                  {['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'][horario.diaSemana]}
                </Text>
                <Text style={styles.horarioHora}>{horario.horaInicio} - {horario.horaFin}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Días especiales */}
        {cancha.diasEspeciales && cancha.diasEspeciales.length > 0 && (
          <View style={styles.excepcionesSection}>
            <Text style={styles.sectionTitle}>Días especiales</Text>
            {cancha.diasEspeciales.map((dia, index) => (
              <View key={index} style={styles.excepcionItem}>
                <View style={styles.excepcionHeader}>
                  <Ionicons 
                    name={dia.tipo === 'cerrado' ? 'close-circle' : 'time'} 
                    size={18} 
                    color={dia.tipo === 'cerrado' ? '#E53935' : '#FF9800'} 
                  />
                  <Text style={styles.excepcionFecha}>
                    {new Date(dia.fecha).toLocaleDateString('es-AR', { 
                      weekday: 'short', 
                      day: 'numeric', 
                      month: 'short' 
                    })}
                  </Text>
                </View>
                <Text style={[
                  styles.excepcionTipo, 
                  { color: dia.tipo === 'cerrado' ? '#E53935' : '#FF9800' }
                ]}>
                  {dia.tipo === 'cerrado' 
                    ? 'Cerrado' 
                    : `${dia.horaApertura} - ${dia.horaCierre}`}
                </Text>
                {dia.motivo && (
                  <Text style={styles.excepcionMotivo}>{dia.motivo}</Text>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Servicios personalizados */}
        {cancha.serviciosPersonalizados && cancha.serviciosPersonalizados.length > 0 && (
          <View style={styles.serviciosSection}>
            <Text style={styles.sectionTitle}>Servicios adicionales</Text>
            <View style={styles.serviciosGrid}>
              {cancha.serviciosPersonalizados.map((servicio, index) => (
                <View key={index} style={styles.servicioChip}>
                  <Ionicons name="checkmark-circle" size={16} color={COLORS.primary} />
                  <Text style={styles.servicioText}>{servicio}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Espaciado al final */}
        <View style={{ height: 100 }} />
      </ScrollView>
      
      <Modal
  visible={showPaymentOptions}
  transparent
  animationType="slide"
  onRequestClose={() => setShowPaymentOptions(false)}
>
  <View style={styles.paymentModalOverlay}>
    <View style={styles.paymentModalContent}>
      {/* Header del modal */}
      <View style={styles.paymentModalHeader}>
        <View style={styles.paymentModalHandle} />
        <Text style={styles.paymentModalTitle}>¿Cómo querés pagar?</Text>
        <Text style={styles.paymentModalSubtitle}>Elegí la forma de pago que prefieras</Text>
      </View>

      {/* Opciones de pago */}
      <View style={styles.paymentOptionsContainer}>
        {/* Pagar en efectivo */}
        <TouchableOpacity
          style={styles.paymentOptionCard}
          activeOpacity={0.7}
          onPress={() => {
            setShowPaymentOptions(false);
            navigation.navigate('ReservaSchedule', {
              canchaId,
              tipoPago: PAYMENT_METHODS.EFECTIVO
            });
          }}
        >
          <View style={[styles.paymentOptionIcon, { backgroundColor: COLORS.primary + '15' }]}>
            <Ionicons name="cash-outline" size={28} color={COLORS.primary} />
          </View>
          <View style={styles.paymentOptionInfo}>
            <Text style={styles.paymentOptionTitle}>Pagar en efectivo</Text>
            <Text style={styles.paymentOptionDesc}>Abonás en la cancha antes de jugar</Text>
          </View>
          <Ionicons name="chevron-forward" size={22} color={COLORS.gray} />
        </TouchableOpacity>

        {/* Dividir el pago - Solo si tiene MP */}
        {cancha.tieneMercadoPago && (
          <TouchableOpacity
            style={styles.paymentOptionCard}
            activeOpacity={0.7}
            onPress={() => {
              setShowPaymentOptions(false);
              navigation.navigate('ReservaSchedule', {
                canchaId,
                tipoPago: PAYMENT_METHODS.DIVIDIR
              });
            }}
          >
            <View style={[styles.paymentOptionIcon, { backgroundColor: COLORS.secondary + '15' }]}>
              <Ionicons name="people-outline" size={28} color={COLORS.secondary} />
            </View>
            <View style={styles.paymentOptionInfo}>
              <Text style={styles.paymentOptionTitle}>Dividir entre jugadores</Text>
              <Text style={styles.paymentOptionDesc}>Cada uno paga su parte con Mercado Pago</Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color={COLORS.gray} />
          </TouchableOpacity>
        )}

        {/* Pagar todo yo - Solo si tiene MP */}
        {cancha.tieneMercadoPago && (
          <TouchableOpacity
            style={styles.paymentOptionCard}
            activeOpacity={0.7}
            onPress={() => {
              setShowPaymentOptions(false);
              navigation.navigate('ReservaSchedule', {
                canchaId,
                tipoPago: PAYMENT_METHODS.PAGAR_TODO
              });
            }}
          >
            <View style={[styles.paymentOptionIcon, { backgroundColor: '#9C27B0' + '15' }]}>
              <Ionicons name="card-outline" size={28} color="#9C27B0" />
            </View>
            <View style={styles.paymentOptionInfo}>
              <Text style={styles.paymentOptionTitle}>Pagar todo yo</Text>
              <Text style={styles.paymentOptionDesc}>Pagás el total ahora con Mercado Pago</Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color={COLORS.gray} />
          </TouchableOpacity>
        )}

        {/* Mensaje si no tiene MP */}
        {!cancha.tieneMercadoPago && (
          <View style={styles.noMpMessage}>
            <Ionicons name="information-circle-outline" size={20} color={COLORS.gray} />
            <Text style={styles.noMpText}>
              El pago online no está disponible para esta cancha
            </Text>
          </View>
        )}
      </View>

      {/* Botón cancelar */}
      <TouchableOpacity
        style={styles.paymentCancelButton}
        activeOpacity={0.7}
        onPress={() => setShowPaymentOptions(false)}
      >
        <Text style={styles.paymentCancelText}>Cancelar</Text>
      </TouchableOpacity>
    </View>
  </View>
</Modal>

{/* Modal selector de teléfono para WhatsApp */}
<Modal
  visible={showPhoneSelector}
  transparent
  animationType="fade"
  onRequestClose={() => setShowPhoneSelector(false)}
>
  <View style={styles.phoneModalOverlay}>
    <View style={styles.phoneModalContent}>
      <View style={styles.phoneModalHeader}>
        <View style={styles.phoneModalIconCircle}>
          <Ionicons name="logo-whatsapp" size={28} color="#25D366" />
        </View>
        <Text style={styles.phoneModalTitle}>Elegir contacto</Text>
        <Text style={styles.phoneModalSubtitle}>¿A cuál número deseas enviar el mensaje?</Text>
      </View>
      
      <View style={styles.phoneList}>
        {getTelefonos().map((tel, index) => (
          <TouchableOpacity
            key={index}
            style={styles.phoneOption}
            activeOpacity={0.7}
            onPress={() => enviarWhatsApp(tel.numero)}
          >
            <View style={styles.phoneOptionLeft}>
              <Ionicons name="call" size={20} color={COLORS.primary} />
              <View>
                <Text style={styles.phoneOptionName}>{tel.nombre}</Text>
                <Text style={styles.phoneOptionNumber}>{tel.numero}</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.gray} />
          </TouchableOpacity>
        ))}
      </View>
      
      <TouchableOpacity
        style={styles.phoneCancelButton}
        activeOpacity={0.7}
        onPress={() => setShowPhoneSelector(false)}
      >
        <Text style={styles.phoneCancelText}>Cancelar</Text>
      </TouchableOpacity>
    </View>
  </View>
</Modal>

      {/* Botón flotante de reserva - solo para jugadores */}
      {user?.rol !== 'PROPIETARIO' && (
        <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 12 }]}>
          <TouchableOpacity 
            style={styles.reserveButton}
            activeOpacity={0.8}
            onPress={() => setShowPaymentOptions(true)}
          >
            <Ionicons name="calendar" size={20} color={COLORS.white} />
            <Text style={styles.reserveButtonText}>Reservar</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
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
  content: {
    flex: 1,
  },
  debugBox: {
    backgroundColor: '#fff3cd',
    borderLeftWidth: 4,
    borderLeftColor: '#ff9800',
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginHorizontal: 16,
    marginVertical: 10,
    borderRadius: 8,
  },
  debugTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ff6f00',
    marginBottom: 6,
  },
  debugText: {
    fontSize: 12,
    color: '#ff6f00',
    fontWeight: '500',
    marginBottom: 3,
  },
  imageGalleryContainer: {
    position: 'relative',
    backgroundColor: '#f5f5f5',
    width: screenWidth,
  },
  imageItemContainer: {
    width: screenWidth,
    height: 320,
  },
  mainImage: {
    width: '100%',
    height: 320,
    backgroundColor: '#e0e0e0',
  },
  noImagesContainer: {
    width: '100%',
    height: 320,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  noImagesText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.black,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 24,
  },
  noImagesSubtext: {
    marginTop: 4,
    fontSize: 12,
    color: COLORS.gray + '99',
  },
  imageDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 8,
    backgroundColor: COLORS.white,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.gray + '80',
  },
  dotActive: {
    backgroundColor: COLORS.primary,
    width: 10,
    height: 10,
  },
  headerInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerLeft: {
    flex: 1,
  },
  canchaNombre: {
    fontSize: 26,
    fontWeight: '700',
    color: COLORS.black,
    marginBottom: 6,
  },
  deporteText: {
    fontSize: 14,
    color: COLORS.gray,
    fontWeight: '600',
  },
  priceSection: {
    alignItems: 'flex-end',
  },
  precio: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.primary,
  },
  precioLabel: {
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 4,
    fontWeight: '500',
  },
  locationCard: {
    marginHorizontal: 16,
    marginVertical: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  locationTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.black,
    marginLeft: 8,
  },
  locationAddress: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.black,
    marginBottom: 4,
  },
  locationCity: {
    fontSize: 14,
    color: COLORS.gray,
    marginBottom: 10,
    fontWeight: '500',
  },
  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 8,
  },
  mapButtonText: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '700',
  },
  infoSection: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.black,
    marginBottom: 14,
  },
  infoGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  infoItem: {
    flex: 1,
    backgroundColor: '#f9f9f9',
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  infoIconBox: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: COLORS.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 12,
    color: COLORS.gray,
    fontWeight: '600',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.black,
    textAlign: 'center',
  },
  amenitiesSection: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  amenitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  amenityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary + '12',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.primary + '30',
  },
  amenityLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.black,
    marginLeft: 8,
  },
  descriptionSection: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  descriptionBox: {
    backgroundColor: '#f9f9f9',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  descriptionText: {
    fontSize: 14,
    color: COLORS.black,
    lineHeight: 22,
  },
  propietarioSection: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  propietarioCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 12,
  },
  propietarioAvatar: {
    marginRight: 12,
  },
  propietarioInfo: {
    flex: 1,
  },
  propietarioNombre: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.black,
  },
  propietarioEmail: {
    fontSize: 13,
    color: COLORS.gray,
    marginTop: 2,
    fontWeight: '500',
  },
  propietarioTelefono: {
    fontSize: 13,
    color: COLORS.primary,
    marginTop: 2,
    fontWeight: '600',
  },
  whatsappButton: {
    backgroundColor: '#25D366',
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
  },
  horarioSection: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  horarioItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    marginBottom: 8,
  },
  horarioDia: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.black,
  },
  horarioHora: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '700',
  },
  bottomBar: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  reserveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  reserveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
  },
  errorText: {
    fontSize: 16,
    color: COLORS.gray,
    textAlign: 'center',
  },
  // Estilos del modal de pago
  paymentModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  paymentModalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 34,
  },
  paymentModalHeader: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  paymentModalHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    marginBottom: 16,
  },
  paymentModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.black,
    marginBottom: 4,
  },
  paymentModalSubtitle: {
    fontSize: 14,
    color: COLORS.gray,
  },
  paymentOptionsContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 12,
  },
  paymentOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    paddingVertical: 16,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  paymentOptionIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  paymentOptionInfo: {
    flex: 1,
  },
  paymentOptionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.black,
    marginBottom: 3,
  },
  paymentOptionDesc: {
    fontSize: 13,
    color: COLORS.gray,
  },
  paymentCancelButton: {
    marginTop: 16,
    marginHorizontal: 16,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
  },
  paymentCancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.gray,
  },
  noMpMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 10,
    marginTop: 8,
    gap: 8,
  },
  noMpText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.gray,
    lineHeight: 18,
  },
  // Estilos de Excepciones/Días especiales
  excepcionesSection: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  excepcionItem: {
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  excepcionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  excepcionFecha: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.dark,
    marginLeft: 8,
  },
  excepcionTipo: {
    fontSize: 13,
    fontWeight: '500',
    marginLeft: 26,
  },
  excepcionMotivo: {
    fontSize: 12,
    color: COLORS.gray,
    marginLeft: 26,
    marginTop: 2,
    fontStyle: 'italic',
  },
  // Estilos de Servicios personalizados
  serviciosSection: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  serviciosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  servicioChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary + '10',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    gap: 6,
  },
  servicioText: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.dark,
  },
  // Estilos del modal selector de teléfono
  phoneModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  phoneModalContent: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    width: '100%',
    maxWidth: 340,
    overflow: 'hidden',
  },
  phoneModalHeader: {
    alignItems: 'center',
    paddingTop: 24,
    paddingBottom: 16,
    paddingHorizontal: 20,
  },
  phoneModalIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#25D36615',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  phoneModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.dark,
    marginBottom: 4,
  },
  phoneModalSubtitle: {
    fontSize: 14,
    color: COLORS.gray,
    textAlign: 'center',
  },
  phoneList: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  phoneOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8F9FA',
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
  },
  phoneOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  phoneOptionName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.dark,
  },
  phoneOptionNumber: {
    fontSize: 13,
    color: COLORS.gray,
    marginTop: 2,
  },
  phoneCancelButton: {
    paddingVertical: 16,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  phoneCancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.gray,
  },
});
