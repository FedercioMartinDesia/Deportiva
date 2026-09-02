// src/screens/DetalleInvitacionScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  Linking,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../constants';
import { invitacionService } from '../services/invitacionService';
import { useAuth } from '../contexts/AuthContext';
import { FutbolIcon, TenisIcon, BasquetIcon, PadelIcon, VoleyIcon } from '../components/SportIcons';

export default function DetalleInvitacionScreen({ route, navigation }) {
  const { invitacionId } = route.params || {};
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const [invitacion, setInvitacion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [responding, setResponding] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successData, setSuccessData] = useState({ accepted: false });

  useEffect(() => {
    loadInvitacion();
  }, [invitacionId]);

  const loadInvitacion = async () => {
    try {
      setLoading(true);
      console.log('Loading invitacion with ID:', invitacionId);
      const response = await invitacionService.getDetalleInvitacion(invitacionId);
      console.log('Response:', response);
      if (response.success) {
        setInvitacion(response.data);
      }
    } catch (error) {
      console.log('Error loading invitacion:', error.response?.data || error.message);
      Alert.alert('Error', error.response?.data?.message || 'No se pudo cargar la invitación');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleResponder = async (aceptar) => {
    setResponding(true);
    try {
      const response = await invitacionService.responderInvitacion(invitacionId, aceptar);
      if (response.success) {
        setSuccessData({ accepted: aceptar });
        setShowSuccessModal(true);
      }
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'No se pudo procesar la respuesta');
    } finally {
      setResponding(false);
    }
  };

  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'ACEPTADA': return COLORS.success;
      case 'RECHAZADA': return COLORS.error;
      case 'PENDIENTE': return COLORS.warning;
      default: return COLORS.gray;
    }
  };

  const getEstadoLabel = (estado) => {
    switch (estado) {
      case 'ACEPTADA': return 'Aceptada';
      case 'RECHAZADA': return 'Rechazada';
      case 'PENDIENTE': return 'Pendiente';
      default: return estado;
    }
  };

  const getSportIcon = (deporte, size = 48) => {
    const iconProps = { size, color: COLORS.primary };
    switch (deporte?.toUpperCase()) {
      case 'FUTBOL':
      case 'FUTBOL_5':
      case 'FUTBOL_7':
      case 'FUTBOL_11':
        return <FutbolIcon {...iconProps} />;
      case 'TENIS':
        return <TenisIcon {...iconProps} />;
      case 'BASQUET':
        return <BasquetIcon {...iconProps} />;
      case 'PADEL':
        return <PadelIcon {...iconProps} />;
      case 'VOLEY':
        return <VoleyIcon {...iconProps} />;
      default:
        return <Ionicons name="football-outline" size={size} color={COLORS.primary} />;
    }
  };

  const openInMaps = () => {
    if (cancha?.latitud && cancha?.longitud) {
      const url = `https://www.google.com/maps/search/?api=1&query=${cancha.latitud},${cancha.longitud}`;
      Linking.openURL(url);
    } else if (cancha?.direccion && cancha?.ciudad) {
      const address = encodeURIComponent(`${cancha.direccion}, ${cancha.ciudad}`);
      const url = `https://www.google.com/maps/search/?api=1&query=${address}`;
      Linking.openURL(url);
    }
  };

  const handleCancelarInvitacion = () => {
    Alert.alert(
      'Cancelar participación',
      '¿Estás seguro que quieres abandonar esta actividad?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Sí, abandonar',
          style: 'destructive',
          onPress: async () => {
            try {
              setResponding(true);
              const response = await invitacionService.responderInvitacion(invitacionId, false);
              if (response.success) {
                Alert.alert('Listo', 'Has abandonado la actividad', [
                  { text: 'OK', onPress: () => navigation.reset({
                    index: 0,
                    routes: [{ name: 'Main', params: { screen: 'Reservas' } }],
                  }) }
                ]);
              }
            } catch (error) {
              Alert.alert('Error', 'No se pudo cancelar la participación');
            } finally {
              setResponding(false);
            }
          }
        }
      ]
    );
  };

  const formatFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-AR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    });
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!invitacion) {
    return (
      <View style={[styles.container, styles.centered, { paddingTop: insets.top }]}>
        <Text style={styles.errorText}>No se encontró la invitación</Text>
      </View>
    );
  }

  const { reserva, invitador } = invitacion;
  const cancha = reserva?.cancha;
  const deporte = cancha?.deporte;
  const todosInvitados = reserva?.invitaciones || [];
  const nombreInvitador = invitador?.alias || `${invitador?.nombre} ${invitador?.apellido}`;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Invitación</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Card principal */}
        <View style={styles.mainCard}>
          <View style={styles.iconContainer}>
            {getSportIcon(deporte, 48)}
          </View>
          
          <Text style={styles.title}>¡Te invitaron a una actividad!</Text>
          
          <View style={styles.invitadorRow}>
            {invitador?.foto ? (
              <Image source={{ uri: invitador.foto }} style={styles.invitadorAvatarImage} />
            ) : (
              <View style={styles.invitadorAvatar}>
                <Text style={styles.invitadorAvatarText}>
                  {(invitador?.nombre || 'U').charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            <Text style={styles.invitadorNombre}>{nombreInvitador}</Text>
          </View>

          <View style={styles.infoBasica}>
            <View style={styles.infoItem}>
              <Ionicons name="location-outline" size={18} color={COLORS.primary} />
              <Text style={styles.infoText}>{cancha?.nombre}</Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="calendar-outline" size={18} color={COLORS.primary} />
              <Text style={styles.infoText}>{formatFecha(reserva?.fecha)}</Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="time-outline" size={18} color={COLORS.primary} />
              <Text style={styles.infoText}>{reserva?.horaInicio} - {reserva?.horaFin}</Text>
            </View>
          </View>
        </View>

        {/* Botón Ver más */}
        <TouchableOpacity
          style={styles.verMasButton}
          onPress={() => setShowDetails(!showDetails)}
        >
          <Text style={styles.verMasText}>
            {showDetails ? 'Ocultar detalles' : 'Ver más'}
          </Text>
          <Ionicons
            name={showDetails ? 'chevron-up' : 'chevron-down'}
            size={20}
            color={COLORS.primary}
          />
        </TouchableOpacity>

        {/* Detalles expandibles */}
        {showDetails && (
          <View style={styles.detailsContainer}>
            {/* Precio */}
            <View style={styles.detailCard}>
              <Text style={styles.detailTitle}>
                <Ionicons name="cash-outline" size={18} color={COLORS.primary} /> Valor
              </Text>
              <Text style={styles.precioText}>${cancha?.precioPorHora}</Text>
              <Text style={styles.precioHint}>por hora (a dividir entre participantes)</Text>
            </View>

            {/* Características del lugar */}
            <View style={styles.detailCard}>
              <Text style={styles.detailTitle}>
                <Ionicons name="business-outline" size={18} color={COLORS.primary} /> Características del lugar
              </Text>
              <View style={styles.caracteristicasGrid}>
                <View style={styles.caracteristicaItem}>
                  <Ionicons
                    name={cancha?.techada ? 'checkmark-circle' : 'close-circle'}
                    size={20}
                    color={cancha?.techada ? COLORS.success : COLORS.lightGray}
                  />
                  <Text style={styles.caracteristicaText}>Techada</Text>
                </View>
                <View style={styles.caracteristicaItem}>
                  <Ionicons
                    name={cancha?.vestuarios ? 'checkmark-circle' : 'close-circle'}
                    size={20}
                    color={cancha?.vestuarios ? COLORS.success : COLORS.lightGray}
                  />
                  <Text style={styles.caracteristicaText}>Vestuario</Text>
                </View>
                <View style={styles.caracteristicaItem}>
                  <Ionicons
                    name={cancha?.estacionamiento ? 'checkmark-circle' : 'close-circle'}
                    size={20}
                    color={cancha?.estacionamiento ? COLORS.success : COLORS.lightGray}
                  />
                  <Text style={styles.caracteristicaText}>Estacionamiento</Text>
                </View>
                <View style={styles.caracteristicaItem}>
                  <Ionicons
                    name={cancha?.buffet ? 'checkmark-circle' : 'close-circle'}
                    size={20}
                    color={cancha?.buffet ? COLORS.success : COLORS.lightGray}
                  />
                  <Text style={styles.caracteristicaText}>Buffet</Text>
                </View>
              </View>
              {cancha?.superficieTipo && (
                <View style={styles.superficieTag}>
                  <Text style={styles.superficieText}>
                    Superficie: {cancha.superficieTipo}
                  </Text>
                </View>
              )}
            </View>

            {/* Ubicación separada */}
            <View style={styles.detailCard}>
              <Text style={styles.detailTitle}>
                <Ionicons name="location-outline" size={18} color={COLORS.primary} /> Ubicación
              </Text>
              <View style={styles.ubicacionContent}>
                <View style={styles.ubicacionInfo}>
                  <Text style={styles.ubicacionDireccion}>{cancha?.direccion}</Text>
                  <Text style={styles.ubicacionCiudad}>{cancha?.ciudad}</Text>
                </View>
                <TouchableOpacity style={styles.mapaButton} onPress={openInMaps}>
                  <Ionicons name="map-outline" size={20} color={COLORS.white} />
                  <Text style={styles.mapaButtonText}>Ver mapa</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Jugadores invitados */}
            <View style={styles.detailCard}>
              <Text style={styles.detailTitle}>
                <Ionicons name="people-outline" size={18} color={COLORS.primary} /> Participantes invitados
              </Text>
              
              {/* Organizador */}
              <View style={styles.jugadorItem}>
                {reserva?.usuario?.foto ? (
                  <Image source={{ uri: reserva.usuario.foto }} style={[styles.jugadorAvatarImage, styles.organizadorAvatarImage]} />
                ) : (
                  <View style={[styles.jugadorAvatar, styles.organizadorAvatar]}>
                    <Text style={styles.jugadorAvatarText}>
                      {(reserva?.usuario?.nombre || 'O').charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}
                <View style={styles.jugadorInfo}>
                  <Text style={styles.jugadorNombre}>
                    {reserva?.usuario?.alias || `${reserva?.usuario?.nombre} ${reserva?.usuario?.apellido}`}
                  </Text>
                  <Text style={styles.organizadorTag}>Organizador</Text>
                </View>
                <View style={[styles.estadoBadge, { backgroundColor: COLORS.success + '20' }]}>
                  <View style={[styles.estadoDot, { backgroundColor: COLORS.success }]} />
                  <Text style={[styles.estadoText, { color: COLORS.success }]}>Confirmado</Text>
                </View>
              </View>

              {/* Lista de invitados */}
              {todosInvitados.map((inv) => {
                const esYo = inv.invitadoId === user?.id;
                const nombreJugador = esYo ? 'Yo' : (inv.invitado?.alias || `${inv.invitado?.nombre} ${inv.invitado?.apellido}`);
                
                return (
                  <View key={inv.id} style={styles.jugadorItem}>
                    {!esYo && inv.invitado?.foto ? (
                      <Image source={{ uri: inv.invitado.foto }} style={styles.jugadorAvatarImage} />
                    ) : (
                      <View style={[styles.jugadorAvatar, esYo && styles.yoAvatar]}>
                        {esYo ? (
                          <Text style={[styles.jugadorAvatarText, styles.yoAvatarText]}>Yo</Text>
                        ) : (
                          <Text style={styles.jugadorAvatarText}>
                            {(inv.invitado?.nombre || 'J').charAt(0).toUpperCase()}
                          </Text>
                        )}
                      </View>
                    )}
                    <View style={styles.jugadorInfo}>
                      <Text style={[styles.jugadorNombre, esYo && styles.yoNombre]}>
                        {nombreJugador}
                      </Text>
                      {esYo && inv.invitado?.nombre && (
                        <Text style={styles.nombreCompleto}>
                          {inv.invitado?.nombre} {inv.invitado?.apellido}
                        </Text>
                      )}
                    </View>
                    <View style={[styles.estadoBadge, { backgroundColor: getEstadoColor(inv.estado) + '20' }]}>
                      <View style={[styles.estadoDot, { backgroundColor: getEstadoColor(inv.estado) }]} />
                      <Text style={[styles.estadoText, { color: getEstadoColor(inv.estado) }]}>
                        {getEstadoLabel(inv.estado)}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        <View style={{ height: 140 }} />
      </ScrollView>

      {/* Botones de acción fijos */}
      {invitacion.estado === 'PENDIENTE' && (
        <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 12 }]}>
          <TouchableOpacity
            style={[styles.rejectButton, responding && styles.buttonDisabled]}
            onPress={() => handleResponder(false)}
            disabled={responding}
          >
            <Ionicons name="close" size={22} color={COLORS.error} />
            <Text style={styles.rejectButtonText}>No quiero</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.acceptButton, responding && styles.buttonDisabled]}
            onPress={() => handleResponder(true)}
            disabled={responding}
          >
            {responding ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <>
                <Ionicons name="checkmark" size={22} color={COLORS.white} />
                <Text style={styles.acceptButtonText}>Aceptar</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Botón para cancelar si ya aceptó */}
      {invitacion.estado === 'ACEPTADA' && (
        <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 12 }]}>
          <TouchableOpacity
            style={[styles.cancelButton, responding && styles.buttonDisabled]}
            onPress={handleCancelarInvitacion}
            disabled={responding}
          >
            {responding ? (
              <ActivityIndicator size="small" color={COLORS.error} />
            ) : (
              <>
                <Ionicons name="exit-outline" size={22} color={COLORS.error} />
                <Text style={styles.cancelButtonText}>Abandonar partido</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Modal de éxito */}
      <Modal
        visible={showSuccessModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {}}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={[
              styles.modalIconContainer,
              { backgroundColor: successData.accepted ? COLORS.success + '15' : COLORS.gray + '15' }
            ]}>
              <Ionicons
                name={successData.accepted ? 'checkmark-circle' : 'close-circle'}
                size={64}
                color={successData.accepted ? COLORS.success : COLORS.gray}
              />
            </View>
            <Text style={styles.modalTitle}>
              {successData.accepted ? '¡Te uniste a la actividad!' : 'Invitación rechazada'}
            </Text>
            <Text style={styles.modalSubtitle}>
              {successData.accepted
                ? 'El organizador será notificado. ¡Nos vemos!'
                : 'El organizador será notificado de tu decisión.'}
            </Text>
            {successData.accepted ? (
              <View style={styles.modalButtonsRow}>
                <TouchableOpacity
                  style={styles.modalSecondaryButton}
                  onPress={() => {
                    setShowSuccessModal(false);
                    navigation.goBack();
                  }}
                >
                  <Text style={styles.modalSecondaryButtonText}>Cerrar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalButton}
                  onPress={() => {
                    setShowSuccessModal(false);
                    navigation.reset({
                      index: 0,
                      routes: [{ name: 'Main', params: { screen: 'Reservas' } }],
                    });
                  }}
                >
                  <Ionicons name="calendar" size={18} color={COLORS.white} style={{ marginRight: 6 }} />
                  <Text style={styles.modalButtonText}>Ir a Mis Reservas</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => {
                  setShowSuccessModal(false);
                  navigation.goBack();
                }}
              >
                <Text style={styles.modalButtonText}>Entendido</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  centered: { justifyContent: 'center', alignItems: 'center' },
  errorText: { fontSize: 16, color: COLORS.gray, textAlign: 'center' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 14,
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

  content: { flex: 1, padding: 16 },

  // Card principal
  mainCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
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
    color: COLORS.black,
    marginBottom: 16,
    textAlign: 'center',
  },
  invitadorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  invitadorAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  invitadorAvatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  invitadorAvatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
  },
  invitadorNombre: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.black,
  },
  infoBasica: {
    width: '100%',
    gap: 10,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    gap: 10,
  },
  infoText: {
    fontSize: 15,
    color: COLORS.black,
    flex: 1,
  },

  // Ver más
  verMasButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 6,
  },
  verMasText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.primary,
  },

  // Detalles
  detailsContainer: {
    gap: 16,
  },
  detailCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
  },
  detailTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.black,
    marginBottom: 12,
  },
  precioText: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.primary,
    textAlign: 'center',
  },
  precioHint: {
    fontSize: 13,
    color: COLORS.gray,
    textAlign: 'center',
    marginTop: 4,
  },
  caracteristicasGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 12,
  },
  caracteristicaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    width: '45%',
  },
  caracteristicaText: {
    fontSize: 14,
    color: COLORS.black,
  },
  superficieTag: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.primary + '15',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 10,
  },
  superficieText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
  },
  ubicacionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ubicacionText: {
    fontSize: 13,
    color: COLORS.gray,
    flex: 1,
  },
  ubicacionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ubicacionInfo: {
    flex: 1,
  },
  ubicacionDireccion: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.black,
    marginBottom: 4,
  },
  ubicacionCiudad: {
    fontSize: 14,
    color: COLORS.gray,
  },
  mapaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    gap: 6,
    marginLeft: 12,
  },
  mapaButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.white,
  },

  // Jugadores
  jugadorItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  jugadorAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  jugadorAvatarImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
  },
  organizadorAvatar: {
    backgroundColor: COLORS.success + '20',
  },
  organizadorAvatarImage: {
    borderWidth: 2,
    borderColor: COLORS.success,
  },
  yoAvatar: {
    backgroundColor: COLORS.primary,
  },
  jugadorAvatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
  },
  yoAvatarText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.white,
  },
  jugadorInfo: {
    flex: 1,
  },
  jugadorNombre: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.black,
  },
  yoNombre: {
    color: COLORS.primary,
  },
  nombreCompleto: {
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 2,
  },
  organizadorTag: {
    fontSize: 12,
    color: COLORS.success,
    marginTop: 2,
  },
  estadoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  estadoDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  estadoText: {
    fontSize: 12,
    fontWeight: '600',
  },

  // Bottom bar
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  rejectButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.error + '10',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: COLORS.error + '30',
  },
  rejectButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.error,
  },
  acceptButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.success,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  acceptButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
  },
  cancelButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.error + '10',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: COLORS.error + '30',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.error,
  },
  buttonDisabled: {
    opacity: 0.6,
  },

  // Modal
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
    padding: 28,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
  },
  modalIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.black,
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 15,
    color: COLORS.gray,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  modalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    flex: 1,
  },
  modalButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.white,
    textAlign: 'center',
  },
  modalButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalSecondaryButton: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSecondaryButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.gray,
  },
});
