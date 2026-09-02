import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  Platform,
  Alert,
  Modal,
  Animated,
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Image,
} from 'react-native';
import { Linking } from 'react-native';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { TenisIcon, FutbolIcon, BasquetIcon, PadelIcon, VoleyIcon } from '../components/SportIcons';
import { COLORS } from '../constants';
import { canchaService } from '../services/canchaService';
import ShimmerPlaceholder from '../components/ShimmerPlaceholder';
import MapWebView from '../components/MapWebView';

const DEPORTES = [
  { key: 'FUTBOL_4', label: 'Fútbol 4', icon: 'football' },
  { key: 'FUTBOL_5', label: 'Fútbol 5', icon: 'football' },
  { key: 'FUTBOL_6', label: 'Fútbol 6', icon: 'football' },
  { key: 'FUTBOL_7', label: 'Fútbol 7', icon: 'football' },
  { key: 'FUTBOL_8', label: 'Fútbol 8', icon: 'football' },
  { key: 'FUTBOL_9', label: 'Fútbol 9', icon: 'football' },
  { key: 'FUTBOL_11', label: 'Fútbol 11', icon: 'football' },
  { key: 'FUTSAL', label: 'Futsal', icon: 'football' },
  { key: 'PADEL', label: 'Pádel', icon: 'tennisball' },
  { key: 'VOLEY', label: 'Vóley', icon: 'volleyball' },
  { key: 'VOLEY_PLAYA', label: 'Vóley Playa', icon: 'volleyball' },
  { key: 'NEWCOM', label: 'Newcom', icon: 'volleyball' },
  { key: 'TENIS', label: 'Tenis', icon: 'tennisball' },
  { key: 'BASQUET', label: 'Básquet', icon: 'basketball' },
];

export default function BuscarCanchasScreen({ navigation, route }) {
  const [step, setStep] = useState(1); // 1: Deporte, 2: Ubicación, 3: Resultados
  const [deporte, setDeporte] = useState(null);
  const [ciudad, setCiudad] = useState('');
  const [loading, setLoading] = useState(false);
  const [canchas, setCanchas] = useState([]);
  const [region, setRegion] = useState(null);
  const [mapUrl, setMapUrl] = useState(null);
  const [showFullMap, setShowFullMap] = useState(false);
  const [showMiniMap, setShowMiniMap] = useState(false);
  const [miniMapCancha, setMiniMapCancha] = useState(null);
  const [scrollOffset, setScrollOffset] = useState(0);
  const [scrollHeight, setScrollHeight] = useState(0);
  const [contentHeight, setContentHeight] = useState(0);

  // Animaciones
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const floatAnim1 = useRef(new Animated.Value(0)).current;
  const floatAnim2 = useRef(new Animated.Value(0)).current;
  const floatAnim3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (route?.params?.deporte) setDeporte(route.params.deporte);
    
    // Animación de entrada
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    // Animaciones flotantes continuas
    startFloatingAnimation(floatAnim1, 0);
    startFloatingAnimation(floatAnim2, 1000);
    startFloatingAnimation(floatAnim3, 2000);
  }, []);

  const startFloatingAnimation = (anim, delay) => {
    Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(anim, {
          toValue: -15,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(anim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const buscarPorCiudad = async () => {
    const ciudadTrim = (ciudad || '').trim();
    if (!deporte && !ciudadTrim) {
      Alert.alert('Filtros necesarios', 'Selecciona una actividad o ingresa una ciudad.');
      return;
    }

    setLoading(true);
    setStep(3);
    
    try {
      const response = await canchaService.getCanchas({ deporte, ciudad: ciudadTrim });
      if (response && response.success) {
        const data = Array.isArray(response.data) ? response.data : (response.data?.canchas || []);
        setCanchas(data);
        
        const firstWithCoords = data.find(c => c.latitud && c.longitud);
        if (firstWithCoords) {
          const lat = firstWithCoords.latitud;
          const lon = firstWithCoords.longitud;
          setRegion({ latitude: lat, longitude: lon, latitudeDelta: 0.05, longitudeDelta: 0.05 });
          setMapUrl(`https://www.google.com/maps/search/?api=1&query=${lat},${lon}`);
        } else if (data.length > 0) {
          const f = data[0];
          const composed = `${f.direccion || ''} ${f.ciudad || ''} ${f.provincia || ''}`.trim();
          if (composed) setMapUrl(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(composed)}`);
        }
      }
    } catch (error) {
      console.error('Error buscarPorCiudad:', error);
      Alert.alert('Error', 'No se pudo realizar la búsqueda.');
    } finally {
      setLoading(false);
    }
  };

  const pedirPermisoUbicacion = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Error solicitando permisos:', error);
      return false;
    }
  };

  const canchasCerca = async () => {
    const permiso = await pedirPermisoUbicacion();
    if (!permiso) {
      Alert.alert('Permiso denegado', 'No se puede acceder a tu ubicación.');
      return;
    }

    setLoading(true);
    setStep(3);

    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        maxAge: 0,
        timeout: 10000,
      });
      
      const { latitude, longitude } = location.coords;
      
      console.log('📍 Ubicación exacta:', { latitude, longitude });
      
      const response = await canchaService.getCanchasCercanas({ 
        latitud: latitude, 
        longitud: longitude, 
        radio: 50, 
        deporte 
      });
      
      console.log('🏟️ Respuesta canchas cercanas:', response);
      
      if (response && response.success) {
        const data = Array.isArray(response.data) ? response.data : (response.data || []);
        console.log(`✅ ${data.length} canchas encontradas en radio de 50 km`);
        
        setCanchas(data);
        setRegion({ latitude, longitude, latitudeDelta: 0.2, longitudeDelta: 0.2 });
        setMapUrl(`https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`);
        
        if (response.data.mensaje && response.data.mensaje.includes('todas las canchas')) {
          console.log('ℹ️ ' + response.data.mensaje);
        }
      } else {
        Alert.alert('Error', 'No se pudo obtener los espacios cercanos.');
        setLoading(false);
      }
    } catch (error) {
      console.error('❌ Error en canchasCerca:', error);
      Alert.alert('Error', 'No se pudo obtener tu ubicación. Intenta nuevamente.');
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  const resetSearch = () => {
    setStep(1);
    setDeporte(null);
    setCiudad('');
    setCanchas([]);
    setMapUrl(null);
  };

  const renderCancha = ({ item }) => {
    let url = null;
    if (item.latitud && item.longitud) {
      url = `https://www.google.com/maps/search/?api=1&query=${item.latitud},${item.longitud}`;
    } else {
      const composed = `${item.direccion || ''} ${item.ciudad || ''} ${item.provincia || ''}`.trim();
      if (composed) url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(composed)}`;
    }

    const openMap = async () => {
      try {
        const can = await Linking.canOpenURL(url);
        if (can) await Linking.openURL(url);
        else Alert.alert('Error', 'No se puede abrir el mapa.');
      } catch (err) {
        console.error('openMap error', err);
        Alert.alert('Error', 'No se pudo abrir el mapa.');
      }
    };

    const imageUrl = item.imagenPrincipal || (item.imagenes && item.imagenes.length > 0 ? item.imagenes[0] : null);

    return (
      <TouchableOpacity 
        style={styles.canchaCard} 
        onPress={() => navigation.navigate('CanchaDetail', { canchaId: item.id })}
        activeOpacity={0.8}
      >
        {/* Imagen prominente - solo si existe */}
        {imageUrl && (
          <View style={styles.canchaImageWrapper}>
            <Image source={{ uri: imageUrl }} style={styles.canchaImageFull} />
            {/* Badge de precio superpuesto */}
            <View style={styles.priceOverlay}>
              <Text style={styles.priceOverlayText}>${item.precioPorHora || '--'}/h</Text>
            </View>
          </View>
        )}

        {/* Info y detalles */}
        <View style={[styles.canchaDetailsWrapper, !imageUrl && styles.canchaDetailsWrapperWithPrice]}>
          {/* Precio cuando no hay imagen */}
          {!imageUrl && (
            <View style={styles.priceRowNoImage}>
              <Text style={styles.priceNoImage}>${item.precioPorHora || '--'}/h</Text>
            </View>
          )}

          <View style={styles.canchaHeader}>
            <View style={styles.canchaHeaderLeft}>
              <Text style={styles.canchaTitle} numberOfLines={1}>{item.nombre}</Text>
              <Text style={styles.canchaAddress} numberOfLines={1}>
                {[item.direccion, item.ciudad].filter(Boolean).join(', ')}
              </Text>
            </View>
            {item.distancia !== undefined && item.distancia !== null && (
              <View style={styles.distanceBadge}>
                <Ionicons name="location" size={14} color={COLORS.primary} />
                <Text style={styles.distanceText}>{item.distancia} km</Text>
              </View>
            )}
          </View>

          {/* Características rápidas */}
          <View style={styles.canchaFeaturesRow}>
            <View style={styles.featureBadge}>
              <Ionicons name="cube-outline" size={16} color={COLORS.primary} />
              <Text style={styles.featureBadgeText}>Espacio</Text>
            </View>
            {item.iluminacion && (
              <View style={styles.featureBadge}>
                <Ionicons name="bulb-outline" size={16} color={COLORS.primary} />
                <Text style={styles.featureBadgeText}>Luz</Text>
              </View>
            )}
            {item.estacionamiento && (
              <View style={styles.featureBadge}>
                <Ionicons name="car-outline" size={16} color={COLORS.primary} />
                <Text style={styles.featureBadgeText}>Parking</Text>
              </View>
            )}
            {item.doblaje && (
              <View style={styles.featureBadge}>
                <Ionicons name="people-outline" size={16} color={COLORS.primary} />
                <Text style={styles.featureBadgeText}>Doblaje</Text>
              </View>
            )}
          </View>

          {/* Acciones */}
          {url && (
            <View style={styles.canchaActionsRow}>
              <TouchableOpacity 
                style={[styles.actionButtonRow, styles.actionButtonRowPrimary]} 
                onPress={(e) => {
                  e.stopPropagation();
                  openMap();
                }}
              >
                <Ionicons name="navigate" size={18} color={COLORS.white} />
                <Text style={styles.actionButtonRowTextPrimary}>Ubicar</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.actionButtonRow, styles.actionButtonRowPrimary]} 
                onPress={(e) => {
                  e.stopPropagation();
                  setMiniMapCancha(item);
                  setShowMiniMap(true);
                }}
              >
                <Ionicons name="map" size={18} color={COLORS.white} />
                <Text style={styles.actionButtonRowTextPrimary}>Ver mapa</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.actionButtonRow, styles.actionButtonRowPrimary]} 
                onPress={(e) => {
                  e.stopPropagation();
                  navigation.navigate('CanchaDetail', { canchaId: item.id });
                }}
              >
                <Text style={styles.actionButtonRowTextPrimary}>Detalles</Text>
                <Ionicons name="arrow-forward" size={16} color={COLORS.white} />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Divisor entre canchas */}
        <View style={styles.canchaDivider} />
      </TouchableOpacity>
    );
  };

  // Paso 1: Seleccionar Deporte
  const renderStepDeporte = () => (
    <SafeAreaView style={styles.safeArea}>
      <Animated.View style={[
        styles.stepContainer,
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
      ]}>
        {/* Iconos flotantes decorativos */}
        <Animated.View style={[styles.floatingIcon, styles.floatingIcon1, { transform: [{ translateY: floatAnim1 }] }]}>
          <Ionicons name="football" size={40} color={COLORS.primary + '20'} />
        </Animated.View>
        <Animated.View style={[styles.floatingIcon, styles.floatingIcon2, { transform: [{ translateY: floatAnim2 }] }]}>
          <Ionicons name="basketball" size={35} color={COLORS.primary + '15'} />
        </Animated.View>
        <Animated.View style={[styles.floatingIcon, styles.floatingIcon3, { transform: [{ translateY: floatAnim3 }] }]}>
          <Ionicons name="tennisball" size={30} color={COLORS.primary + '20'} />
        </Animated.View>

        <View style={styles.stepIndicatorRow}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()} 
            style={styles.stepBackButton}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.dark} />
          </TouchableOpacity>
          <View style={styles.stepIndicatorContainer}>
            <View style={[styles.stepIndicatorLine, step >= 1 && styles.stepIndicatorLineActive]} />
            <View style={[styles.stepIndicatorLine, step >= 2 && styles.stepIndicatorLineActive]} />
            <View style={[styles.stepIndicatorLine, step >= 3 && styles.stepIndicatorLineActive]} />
          </View>
          <View style={styles.stepIndicatorSpacer} />
        </View>

        <View style={styles.stepHeader}>
          <Text style={styles.stepTitle}>¿Qué actividad te interesa?</Text>
          <Text style={styles.stepSubtitle}>Selecciona tu actividad favorita</Text>
        </View>

        <View style={styles.deportesScrollWrapper}>
          <ScrollView 
            style={[styles.deportesScroll, { scrollIndicatorInsets: { right: 0 } }]}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.deportesContent}
            scrollEventThrottle={16}
            onScroll={(e) => setScrollOffset(e.nativeEvent.contentOffset.y)}
            onContentSizeChange={(w, h) => setContentHeight(h)}
            onLayout={(e) => setScrollHeight(e.nativeEvent.layout.height)}
          >
          {DEPORTES.map(d => {
            const isFutbol = d.key.startsWith('FUTBOL') || d.key === 'FUTSAL';
            const isVoley = d.key === 'VOLEY' || d.key === 'VOLEY_PLAYA' || d.key === 'NEWCOM';
            const isPadel = d.key === 'PADEL';
            const isTenis = d.key === 'TENIS';
            const isBasquet = d.key === 'BASQUET';
            
            return (
              <TouchableOpacity
                key={d.key}
                style={[styles.deporteCard, deporte === d.key && styles.deporteCardActive]}
                onPress={() => setDeporte(d.key)}
                activeOpacity={0.8}
              >
                <View style={[styles.deporteIconCircle, deporte === d.key && styles.deporteIconCircleActive]}>
                  {isFutbol ? (
                    <FutbolIcon 
                      size={32} 
                      color={deporte === d.key ? COLORS.white : COLORS.primary} 
                    />
                  ) : isVoley ? (
                    <VoleyIcon 
                      size={32} 
                      color={deporte === d.key ? COLORS.white : COLORS.primary} 
                    />
                  ) : isPadel ? (
                    <PadelIcon 
                      size={32} 
                      color={deporte === d.key ? COLORS.white : COLORS.primary} 
                    />
                  ) : isTenis ? (
                    <TenisIcon 
                      size={32} 
                      color={deporte === d.key ? COLORS.white : COLORS.primary} 
                    />
                  ) : isBasquet ? (
                    <BasquetIcon 
                      size={32} 
                      color={deporte === d.key ? COLORS.white : COLORS.primary} 
                    />
                  ) : (
                    <Ionicons 
                      name={d.icon} 
                      size={32} 
                      color={deporte === d.key ? COLORS.white : COLORS.primary} 
                    />
                  )}
                </View>
                <Text style={[styles.deporteCardLabel, deporte === d.key && styles.deporteCardLabelActive]}>
                  {d.label}
                </Text>
                {deporte === d.key && (
                  <View style={styles.checkBadge}>
                    <Ionicons name="checkmark" size={16} color={COLORS.white} />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
        
        {/* Custom scroll indicator verde */}
        {contentHeight > scrollHeight && (() => {
          const thumbHeight = Math.max(50, (scrollHeight / contentHeight) * scrollHeight);
          const maxTranslate = scrollHeight - thumbHeight;
          const scrollPercent = scrollOffset / (contentHeight - scrollHeight);
          const translateY = scrollPercent * maxTranslate;
          
          return (
            <View style={styles.scrollIndicatorTrack}>
              <Animated.View 
                style={[
                  styles.scrollIndicatorThumb,
                  {
                    height: thumbHeight,
                    transform: [{ translateY }],
                  }
                ]}
              />
            </View>
          );
        })()}
        </View>

        <View style={styles.stepActions}>
          {deporte && (
            <TouchableOpacity 
              style={styles.nextButton}
              onPress={() => setStep(2)}
              activeOpacity={0.8}
            >
              <Text style={styles.nextButtonText}>Continuar</Text>
              <Ionicons name="arrow-forward" size={20} color={COLORS.white} />
            </TouchableOpacity>
          )}
          <TouchableOpacity 
            style={styles.skipButton}
            onPress={() => setStep(2)}
            activeOpacity={0.8}
          >
            <Text style={styles.skipButtonText}>Omitir (ver todos)</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </SafeAreaView>
  );

  // Paso 2: Seleccionar Ubicación
  const renderStepUbicacion = () => (
    <Animated.View style={[
      styles.stepContainer,
      styles.stepContainerStep2,
      { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
    ]}>
      {/* Iconos flotantes decorativos */}
      <Animated.View style={[styles.floatingIcon, styles.floatingIcon4, { transform: [{ translateY: floatAnim1 }] }]}>
        <Ionicons name="location" size={50} color={COLORS.primary + '15'} />
      </Animated.View>
      <Animated.View style={[styles.floatingIcon, styles.floatingIcon5, { transform: [{ translateY: floatAnim2 }] }]}>
        <Ionicons name="navigate" size={40} color={COLORS.primary + '20'} />
      </Animated.View>

      <View style={styles.stepIndicatorRow}>
        {step === 2 && (
          <TouchableOpacity 
            onPress={() => setStep(1)} 
            style={styles.stepBackButton}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.dark} />
          </TouchableOpacity>
        )}
        <View style={styles.stepIndicatorContainer}>
          <View style={[styles.stepIndicatorLine, step >= 1 && styles.stepIndicatorLineActive]} />
          <View style={[styles.stepIndicatorLine, step >= 2 && styles.stepIndicatorLineActive]} />
          <View style={[styles.stepIndicatorLine, step >= 3 && styles.stepIndicatorLineActive]} />
        </View>
        <View style={styles.stepIndicatorSpacer} />
      </View>

      <View style={styles.stepHeader}>
        <Text style={styles.stepTitle}>Elige cómo buscar espacios</Text>
        {deporte && (
          <View style={styles.selectedChipInline}>
            <Ionicons name="checkmark-circle" size={16} color={COLORS.primary} />
            <Text style={styles.selectedChipTextInline}>
              {DEPORTES.find(d => d.key === deporte)?.label}
            </Text>
            <TouchableOpacity onPress={() => setStep(1)}>
              <Ionicons name="close-circle" size={16} color={COLORS.gray} />
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View style={styles.ubicacionOptions}>
        {/* Opción: Cerca mío */}
        <TouchableOpacity 
          style={styles.ubicacionCard}
          onPress={canchasCerca}
          activeOpacity={0.8}
        >
          <View style={styles.ubicacionIconContainer}>
            <Ionicons name="locate" size={40} color={COLORS.primary} />
          </View>
          <View style={styles.ubicacionCardContent}>
            <Text style={styles.ubicacionCardTitle}>Espacios cerca mío</Text>
            <Text style={styles.ubicacionCardSubtitle}>
              Usa tu ubicación actual
            </Text>
          </View>
          <View style={styles.ubicacionCardArrow}>
            <Ionicons name="arrow-forward" size={24} color={COLORS.primary} />
          </View>
        </TouchableOpacity>

        {/* Opción: Por ciudad */}
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>O</Text>
          <View style={styles.dividerLine} />
        </View>

        <View style={styles.ciudadCard}>
          <View style={styles.ciudadIconContainer}>
            <Ionicons name="business" size={36} color={COLORS.primary} />
          </View>
          <Text style={styles.ciudadCardTitle}>Buscar por ciudad</Text>
          
          <View style={styles.ciudadInputContainer}>
            <Ionicons name="search" size={20} color={COLORS.gray} />
            <TextInput
              style={styles.ciudadInput}
              placeholder="Ej: Buenos Aires, Rosario..."
              placeholderTextColor={COLORS.gray}
              value={ciudad}
              onChangeText={setCiudad}
              onSubmitEditing={buscarPorCiudad}
            />
            {ciudad.length > 0 && (
              <TouchableOpacity onPress={() => setCiudad('')}>
                <Ionicons name="close-circle" size={20} color={COLORS.gray} />
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity 
            style={[styles.buscarButton, !ciudad && styles.buscarButtonDisabled]}
            onPress={buscarPorCiudad}
            disabled={!ciudad}
            activeOpacity={0.8}
          >
            <Ionicons name="search" size={20} color={COLORS.white} />
            <Text style={styles.buscarButtonText}>Buscar en esta ciudad</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );

  // Paso 3: Resultados
  const renderStepResultados = () => (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.resultsContainer}>
        {/* Header con controles y progreso */}
        <View style={styles.resultasStepHeaderRow}>
          <TouchableOpacity 
            onPress={() => setStep(2)} 
            style={styles.stepBackButton}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.dark} />
          </TouchableOpacity>
          
          <View style={styles.stepIndicatorContainer}>
            <View style={[styles.stepIndicatorLine, step >= 1 && styles.stepIndicatorLineActive]} />
            <View style={[styles.stepIndicatorLine, step >= 2 && styles.stepIndicatorLineActive]} />
            <View style={[styles.stepIndicatorLine, step >= 3 && styles.stepIndicatorLineActive]} />
          </View>
          
          <View style={styles.stepIndicatorSpacer} />
        </View>

        {/* Título y filtros */}
        <View style={styles.resultasStepHeader}>
          <Text style={styles.resultasStepTitle}>Resultados</Text>
          {deporte && (
            <View style={styles.resultasSelectedChip}>
              <Ionicons name="checkmark-circle" size={16} color={COLORS.primary} />
              <Text style={styles.resultasSelectedChipText}>
                {DEPORTES.find(d => d.key === deporte)?.label}
              </Text>
            </View>
          )}
          <Text style={styles.resultasCount}>{canchas.length} espacios encontrados</Text>
        </View>

        {/* Contenido según estado */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Buscando espacios...</Text>
          </View>
        ) : (
          <View style={styles.resultsListWrapper}>
            {canchas.length > 2 ? (
              <FlatList
                data={canchas}
                keyExtractor={(item) => item.id}
                renderItem={renderCancha}
                contentContainerStyle={styles.resultsList}
                showsVerticalScrollIndicator={false}
                scrollIndicatorInsets={{ right: 1 }}
                onScroll={(e) => setScrollOffset(e.nativeEvent.contentOffset.y)}
                onContentSizeChange={(w, h) => setContentHeight(h)}
                onLayout={(e) => setScrollHeight(e.nativeEvent.layout.height)}
                scrollEventThrottle={16}
                ListEmptyComponent={
                  <View style={styles.emptyState}>
                    <View style={styles.emptyIcon}>
                      <Ionicons name="sad-outline" size={64} color={COLORS.gray} />
                    </View>
                    <Text style={styles.emptyTitle}>No encontramos espacios</Text>
                    <Text style={styles.emptySubtitle}>
                      Intenta cambiar los filtros o buscar en otra ubicación
                    </Text>
                    <TouchableOpacity 
                      style={styles.emptyButton}
                      onPress={resetSearch}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.emptyButtonText}>Buscar nuevamente</Text>
                    </TouchableOpacity>
                  </View>
                }
              />
            ) : (
              <View style={styles.resultsList}>
                {canchas.length === 0 ? (
                  <View style={styles.emptyState}>
                    <View style={styles.emptyIcon}>
                      <Ionicons name="sad-outline" size={64} color={COLORS.gray} />
                    </View>
                    <Text style={styles.emptyTitle}>No encontramos espacios</Text>
                    <Text style={styles.emptySubtitle}>
                      Intenta cambiar los filtros o buscar en otra ubicación
                    </Text>
                    <TouchableOpacity 
                      style={styles.emptyButton}
                      onPress={resetSearch}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.emptyButtonText}>Buscar nuevamente</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  canchas.map((item) => (
                    <React.Fragment key={item.id}>
                      {renderCancha({ item })}
                    </React.Fragment>
                  ))
                )}
              </View>
            )}

            {/* Custom scroll indicator verde solo si hay scroll */}
            {canchas.length > 2 && contentHeight > scrollHeight && (() => {
              const thumbHeight = Math.max(50, (scrollHeight / contentHeight) * scrollHeight);
              const maxTranslate = scrollHeight - thumbHeight;
              const scrollPercent = scrollOffset / (contentHeight - scrollHeight);
              const translateY = scrollPercent * maxTranslate;
              return (
                <View style={styles.scrollIndicatorTrack}>
                  <Animated.View 
                    style={[
                      styles.scrollIndicatorThumb,
                      {
                        height: thumbHeight,
                        transform: [{ translateY }],
                      }
                    ]}
                  />
                </View>
              );
            })()}
          </View>
        )}
      </View>
    </SafeAreaView>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAFAFA" />
      
      {/* Contenido según paso */}
      {step === 1 && renderStepDeporte()}
      {step === 2 && renderStepUbicacion()}
      {step === 3 && renderStepResultados()}

      {/* Modal mapa completo */}
      <Modal visible={showFullMap} animationType="slide" onRequestClose={() => setShowFullMap(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Mapa de espacios</Text>
            <TouchableOpacity onPress={() => setShowFullMap(false)} style={styles.closeButton}>
              <Ionicons name="close-circle" size={32} color={COLORS.primary} />
            </TouchableOpacity>
          </View>
          <View style={styles.modalContent}>
            <MapWebView
              markers={canchas.map(c => ({ 
                id: c.id, 
                nombre: c.nombre, 
                latitud: c.latitud, 
                longitud: c.longitud, 
                direccion: c.direccion 
              }))}
              center={region}
              zoom={12}
              onMarkerPress={(id) => {
                setShowFullMap(false);
                navigation.navigate('CanchaDetail', { canchaId: id });
              }}
            />
          </View>
        </View>
      </Modal>

      {/* Modal mini mapa */}
      <Modal 
        visible={showMiniMap} 
        animationType="fade" 
        transparent 
        onRequestClose={() => setShowMiniMap(false)}
      >
        <View style={styles.miniMapOverlay}>
          <View style={styles.miniMapContainer}>
            <View style={styles.miniMapHeader}>
              <Text style={styles.miniMapTitle} numberOfLines={1}>
                {miniMapCancha?.nombre}
              </Text>
              <TouchableOpacity onPress={() => setShowMiniMap(false)}>
                <Ionicons name="close-circle" size={28} color={COLORS.primary} />
              </TouchableOpacity>
            </View>
            <View style={styles.miniMapContent}>
              <MapWebView
                markers={miniMapCancha ? [{
                  id: miniMapCancha.id,
                  nombre: miniMapCancha.nombre,
                  latitud: miniMapCancha.latitud,
                  longitud: miniMapCancha.longitud,
                  direccion: miniMapCancha.direccion
                }] : []}
                center={miniMapCancha && miniMapCancha.latitud ? {
                  latitude: miniMapCancha.latitud,
                  longitude: miniMapCancha.longitud
                } : region}
                zoom={15}
                onMarkerPress={(id) => {
                  setShowMiniMap(false);
                  navigation.navigate('CanchaDetail', { canchaId: id });
                }}
              />
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
    backgroundColor: '#FAFAFA',
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  headerSafeArea: {
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerSafeAreaStep2: {
    backgroundColor: COLORS.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: Platform.OS === 'ios' ? 8 : 12,
    backgroundColor: COLORS.white,
  },
  headerStep2: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 0,
    paddingTop: 0,
    height: 48,
    backgroundColor: COLORS.white,
  },
  headerBackButton: {
    padding: 8,
    marginLeft: -8,
    marginRight: 8,
  },
  headerBackButtonStep2: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.dark,
    flex: 1,
    textAlign: 'center',
    marginRight: 24,
  },
  stepIndicator: {
    flexDirection: 'row',
    gap: 6,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E0E0E0',
  },
  stepDotActive: {
    backgroundColor: COLORS.primary,
    width: 20,
  },
  stepContainer: {
    flex: 1,
    padding: 16,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
  },
  stepContainerStep2: {
    paddingTop: 16,
  },
  floatingIcon: {
    position: 'absolute',
    zIndex: 0,
  },
  floatingIcon1: {
    top: 120,
    right: 30,
  },
  floatingIcon2: {
    top: 280,
    left: 20,
  },
  floatingIcon3: {
    bottom: 180,
    right: 50,
  },
  floatingIcon4: {
    top: 150,
    right: 40,
  },
  floatingIcon5: {
    bottom: 220,
    left: 30,
  },
  stepIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
    marginTop: 32,
  },
  stepIndicatorRowStep1: {
    justifyContent: 'center',
    paddingHorizontal: 0,
  },
  stepBackButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepIndicatorContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 0,
    justifyContent: 'center',
    flex: 1,
  },
  stepIndicatorSpacer: {
    width: 40,
  },
  stepHeader: {
    alignItems: 'center',
    marginBottom: 55,
    zIndex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  stepIndicatorLine: {
    width: 32,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E0E0E0',
  },
  stepIndicatorLineActive: {
    backgroundColor: COLORS.primary,
  },
  stepNumber: {
    display: 'none',
  },
  stepNumberText: {
    display: 'none',
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.dark,
    textAlign: 'center',
    marginBottom: 4,
  },
  stepSubtitle: {
    fontSize: 12,
    color: COLORS.gray,
    textAlign: 'center',
  },
  deportesScrollWrapper: {
    flex: 1,
    position: 'relative',
  },
  deportesScroll: {
    flex: 1,
  },
  scrollIndicatorTrack: {
    position: 'absolute',
    right: -20,
    top: 0,
    bottom: 0,
    width: 20,
  },
  scrollIndicatorThumb: {
    width: 20,
    backgroundColor: COLORS.primary,
    borderRadius: 10,
  },
  deportesContent: {
    gap: 10,
    paddingBottom: 8,
  },
  deporteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: 14,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  deporteCardActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.white,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.3,
  },
  deporteIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  deporteIconCircleActive: {
    backgroundColor: COLORS.primary,
  },
  deporteCardLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.dark,
    flex: 1,
  },
  deporteCardLabelActive: {
    color: COLORS.primary,
  },
  checkBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepActions: {
    gap: 8,
    paddingTop: 16,
    paddingBottom: 12,
    marginBottom: 8,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 6,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  nextButtonText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '700',
  },
  skipButton: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  skipButtonText: {
    color: COLORS.gray,
    fontSize: 13,
    fontWeight: '600',
  },
  selectedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary + '15',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    alignSelf: 'center',
    marginBottom: 12,
    gap: 6,
  },
  selectedChipText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  selectedChipInline: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary + '15',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'center',
    marginTop: 8,
    gap: 5,
  },
  selectedChipTextInline: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  ubicacionOptions: {
    flex: 1,
  },
  ubicacionCard: {
    backgroundColor: COLORS.white,
    padding: 14,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  ubicacionIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: COLORS.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    flexShrink: 0,
  },
  ubicacionCardContent: {
    flex: 1,
  },
  ubicacionCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.dark,
    marginBottom: 2,
  },
  ubicacionCardSubtitle: {
    fontSize: 12,
    color: COLORS.gray,
    lineHeight: 16,
  },
  ubicacionCardArrow: {
    marginLeft: 8,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.gray,
  },
  ciudadCard: {
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  ciudadIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 10,
  },
  ciudadCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.dark,
    textAlign: 'center',
    marginBottom: 12,
  },
  ciudadInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 12,
    gap: 10,
  },
  ciudadInput: {
    flex: 1,
    fontSize: 15,
    color: COLORS.dark,
  },
  buscarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buscarButtonDisabled: {
    backgroundColor: COLORS.gray,
    shadowOpacity: 0,
  },
  buscarButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '700',
  },
  backButtonStep: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    marginTop: 8,
    gap: 4,
  },
  backButtonText: {
    color: COLORS.gray,
    fontSize: 13,
    fontWeight: '600',
  },
  resultsWrapper: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.gray,
    fontWeight: '600',
  },
  resultsHeader: {
    backgroundColor: COLORS.white,
    padding: 12,
    borderRadius: 14,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 4,
  },
  resultsInfo: {
    flex: 1,
    paddingRight: 8,
  },
  resultsCount: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.dark,
    marginBottom: 2,
  },
  resultsFilter: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '700',
    backgroundColor: COLORS.primary + '10',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary + '08',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 6,
  },
  resetButtonText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  floatingMapButton: {
    position: 'absolute',
    bottom: 24,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 26,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
    zIndex: 999,
  },
  floatingMapText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '700',
  },
  resultsList: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 120,
  },
  canchaCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    overflow: 'hidden',
  },
  canchaImageWrapper: {
    width: '100%',
    height: 180,
    position: 'relative',
    backgroundColor: '#F5F5F5',
    overflow: 'hidden',
  },
  canchaImageFull: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  canchaImagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.primary + '08',
  },
  priceOverlay: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
  },
  priceOverlayText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '800',
  },
  canchaDetailsWrapper: {
    padding: 14,
  },
  canchaDetailsWrapperWithPrice: {
    paddingTop: 12,
  },
  priceRowNoImage: {
    marginBottom: 10,
  },
  priceNoImage: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.primary,
  },
  canchaHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  canchaHeaderLeft: {
    flex: 1,
    marginRight: 8,
  },
  canchaTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.dark,
    marginBottom: 3,
  },
  canchaAddress: {
    fontSize: 13,
    color: COLORS.gray,
  },
  distanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary + '10',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  distanceText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '700',
  },
  canchaFeaturesRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  featureBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary + '08',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  featureBadgeText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '700',
  },
  canchaActionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  actionButtonRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.gray + '30',
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  actionButtonRowText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '700',
  },
  actionButtonRowPrimary: {
    backgroundColor: COLORS.primary,
  },
  actionButtonRowTextPrimary: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '800',
  },
  resultsContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  resultasStepHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 48,
    marginBottom: 12,
  },
  resultasStepHeader: {
    alignItems: 'center',
    marginBottom: 20,
    paddingVertical: 8,
  },
  resultasStepTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.dark,
    marginBottom: 8,
  },
  resultasSelectedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary + '10',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 5,
    marginBottom: 10,
  },
  resultasSelectedChipText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  resultasCount: {
    fontSize: 14,
    color: COLORS.gray,
    fontWeight: '600',
  },
  resultsListWrapper: {
    flex: 1,
    position: 'relative',
  },
  resultsList: {
    paddingVertical: 8,
    paddingBottom: 120,
    paddingRight: 10,
  },
  scrollIndicatorTrack: {
    position: 'absolute',
    right: -20,
    top: 0,
    bottom: 0,
    width: 20,
  },
  scrollIndicatorThumb: {
    width: 20,
    backgroundColor: COLORS.primary,
    borderRadius: 10,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.dark,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.gray,
    textAlign: 'center',
    paddingHorizontal: 32,
    lineHeight: 20,
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    alignSelf: 'stretch',
    marginHorizontal: 40,
  },
  emptyButtonText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '700',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.white,
    paddingTop: 50,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.dark,
  },
  closeButton: {
    padding: 4,
  },
  modalContent: {
    flex: 1,
  },
  miniMapOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    padding: 20,
  },
  miniMapContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    overflow: 'hidden',
    maxHeight: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 16,
  },
  miniMapHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  miniMapTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.dark,
    flex: 1,
    marginRight: 12,
  },
  miniMapContent: {
    height: 300,
  },
  canchaDivider: {
    height: 1,
    backgroundColor: COLORS.gray + '40',
    marginVertical: 8,
    marginHorizontal: 8,
    borderRadius: 1,
  },
});