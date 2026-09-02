// appCancha-mobile/src/screens/DetalleReservaScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
  TextInput,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../constants';
import { reservaService } from '../services/reservaService';
import { useAuth } from '../contexts/AuthContext';
import { FutbolIcon, TenisIcon, BasquetIcon, PadelIcon, VoleyIcon } from '../components/SportIcons';

// Función para obtener el icono SVG del deporte
const getDeporteIcon = (deporte, size = 32, color = COLORS.primary) => {
  if (!deporte) return <FutbolIcon size={size} color={color} />;
  const deporteUpper = deporte.toUpperCase();
  
  if (deporteUpper.includes('FUTBOL') || deporteUpper === 'FUTSAL') {
    return <FutbolIcon size={size} color={color} />;
  }
  if (deporteUpper.includes('PADEL')) {
    return <PadelIcon size={size} color={color} />;
  }
  if (deporteUpper.includes('TENIS')) {
    return <TenisIcon size={size} color={color} />;
  }
  if (deporteUpper.includes('VOLEY')) {
    return <VoleyIcon size={size} color={color} />;
  }
  if (deporteUpper.includes('BASQUET')) {
    return <BasquetIcon size={size} color={color} />;
  }
  
  return <FutbolIcon size={size} color={color} />;
};

export default function DetalleReservaScreen({ route, navigation }) {
  const { reservaId } = route.params || {};
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  
  const [reserva, setReserva] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cantidadCupos, setCantidadCupos] = useState('1');
  const [processingPayment, setProcessingPayment] = useState(false);

  useEffect(() => {
    loadReserva();
  }, [reservaId]);

  const loadReserva = async () => {
    try {
      setLoading(true);
      const response = await reservaService.getReservaById(reservaId);
      if (response.success) {
        setReserva(response.data);
      } else {
        Alert.alert('Error', 'No se pudo cargar el detalle de la reserva');
        navigation.goBack();
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo cargar el detalle de la reserva');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handlePagarCupo = async () => {
    if (!reserva) return;
    const cupos = parseInt(cantidadCupos, 10);
    if (Number.isNaN(cupos) || cupos < 1) {
      Alert.alert('Error', 'Ingresá una cantidad de cupos válida');
      return;
    }

    try {
      setProcessingPayment(true);
      const response = await reservaService.createPagoReserva(reserva.id, cupos);
      if (response.success && response.data?.init_point) {
        Linking.openURL(response.data.init_point);
      } else {
        Alert.alert('Error', 'No se pudo iniciar el pago');
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo iniciar el pago');
    } finally {
      setProcessingPayment(false);
    }
  };

  const handlePagarSaldoOrganizador = async () => {
    if (!reserva) return;
    try {
      setProcessingPayment(true);
      const response = await reservaService.pagarSaldoOrganizador(reserva.id);
      if (response.success && response.data?.init_point) {
        Linking.openURL(response.data.init_point);
      } else {
        Alert.alert('Error', 'No se pudo iniciar el pago del saldo');
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo iniciar el pago del saldo');
    } finally {
      setProcessingPayment(false);
    }
  };

  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'CONFIRMADA': return COLORS.success;
      case 'CANCELADA': return COLORS.error;
      case 'PENDIENTE': return COLORS.warning;
      default: return COLORS.gray;
    }
  };

  const esPagoEfectivo = reserva?.metodoPago === 'EFECTIVO';

  if (loading) {
    return (
      <View style={[styles.container, styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!reserva) {
    return (
      <View style={[styles.container, styles.centered, { paddingTop: insets.top }]}>
        <Text style={styles.errorText}>No se encontró la reserva</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detalle de Reserva</Text>
        <TouchableOpacity onPress={loadReserva} style={styles.refreshButton}>
          <Ionicons name="refresh" size={22} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Card principal de la cancha */}
        <View style={styles.canchaCard}>
          {(reserva.cancha?.imagenPrincipal || reserva.cancha?.imagenes?.[0]) ? (
            <Image 
              source={{ uri: reserva.cancha.imagenPrincipal || reserva.cancha.imagenes[0] }} 
              style={styles.canchaImage} 
            />
          ) : (
            <View style={styles.canchaIconContainer}>
              {getDeporteIcon(reserva.cancha?.deporte, 32, COLORS.primary)}
            </View>
          )}
          <View style={styles.canchaInfo}>
            <Text style={styles.canchaNombre}>{reserva.cancha?.nombre}</Text>
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={14} color={COLORS.gray} />
              <Text style={styles.canchaLocation} numberOfLines={1}>
                {reserva.cancha?.direccion}, {reserva.cancha?.ciudad}
              </Text>
            </View>
            <View style={styles.deporteTag}>
              <Text style={styles.deporteText}>
                {reserva.cancha?.deporte?.replace('_', ' ')}
              </Text>
            </View>
          </View>
        </View>

        {/* Estado de la reserva */}
        <View style={styles.estadoCard}>
          <View style={styles.estadoHeader}>
            <Text style={styles.sectionTitle}>Estado de la Reserva</Text>
            <View style={[styles.estadoBadge, { backgroundColor: getEstadoColor(esPagoEfectivo ? 'CONFIRMADA' : reserva.estado) }]}>
              <Text style={styles.estadoBadgeText}>
                {esPagoEfectivo ? 'CONFIRMADA' : reserva.estado}
              </Text>
            </View>
          </View>
        </View>

        {/* Fecha */}
        <View style={styles.infoCard}>
          <View style={styles.fechaRow}>
            <View style={styles.fechaIconContainer}>
              <Ionicons name="calendar" size={24} color={COLORS.primary} />
            </View>
            <View style={styles.fechaInfo}>
              <Text style={styles.fechaLabel}>Fecha</Text>
              <Text style={styles.fechaValue}>
                {new Date(reserva.fecha).toLocaleDateString('es-AR', { 
                  weekday: 'long', 
                  day: 'numeric', 
                  month: 'long' 
                })}
              </Text>
            </View>
          </View>
        </View>

        {/* Horario */}
        <View style={styles.infoCard}>
          <View style={styles.fechaRow}>
            <View style={styles.fechaIconContainer}>
              <Ionicons name="time" size={24} color={COLORS.primary} />
            </View>
            <View style={styles.fechaInfo}>
              <Text style={styles.fechaLabel}>Horario</Text>
              <Text style={styles.fechaValue}>{reserva.horaInicio} - {reserva.horaFin}</Text>
            </View>
          </View>
        </View>

        {/* Información de pago */}
        <View style={styles.infoCard}>
          <Text style={styles.sectionTitle}>Información de Pago</Text>
          
          {esPagoEfectivo ? (
            <View style={styles.efectivoContainer}>
              <View style={styles.efectivoIconContainer}>
                <Ionicons name="cash-outline" size={32} color={COLORS.success} />
              </View>
              <Text style={styles.efectivoTitle}>Pago en efectivo en el lugar</Text>
              <Text style={styles.efectivoTotal}>${reserva.precioTotal}</Text>
              <Text style={styles.efectivoSubtitle}>
                Total a pagar entre todos los participantes
              </Text>
            </View>
          ) : (
            <>
              <View style={styles.montosContainer}>
                <View style={styles.montoRow}>
                  <Text style={styles.montoLabel}>Total</Text>
                  <Text style={styles.montoValue}>${reserva.precioTotal}</Text>
                </View>
                <View style={styles.montoRow}>
                  <Text style={styles.montoLabel}>Pagado</Text>
                  <Text style={[styles.montoValue, { color: COLORS.success }]}>
                    ${reserva.montoPagadoTotal || 0}
                  </Text>
                </View>
                <View style={[styles.montoRow, styles.montoRowTotal]}>
                  <Text style={styles.montoLabelTotal}>Restante</Text>
                  <Text style={styles.montoValueTotal}>
                    ${(reserva.precioTotal || 0) - (reserva.montoPagadoTotal || 0)}
                  </Text>
                </View>
              </View>

              {/* Lista de pagos */}
              <View style={styles.pagosSection}>
                <Text style={styles.pagosTitle}>Pagos realizados</Text>
                {!reserva.pagos || reserva.pagos.length === 0 ? (
                  <View style={styles.noPagos}>
                    <Ionicons name="wallet-outline" size={24} color={COLORS.lightGray} />
                    <Text style={styles.noPagosText}>Aún no hay pagos registrados</Text>
                  </View>
                ) : (
                  reserva.pagos.map((pago) => (
                    <View key={pago.id} style={styles.pagoItem}>
                      {pago.usuario?.foto ? (
                        <Image source={{ uri: pago.usuario.foto }} style={styles.pagoAvatarImage} />
                      ) : (
                        <View style={styles.pagoAvatar}>
                          <Text style={styles.pagoAvatarText}>
                            {(pago.usuario?.nombre || 'J').charAt(0).toUpperCase()}
                          </Text>
                        </View>
                      )}
                      <View style={styles.pagoInfo}>
                        <Text style={styles.pagoUsuario}>
                          {pago.usuario?.alias ||
                            `${pago.usuario?.nombre || ''} ${pago.usuario?.apellido || ''}`.trim() ||
                            'Participante'}
                        </Text>
                        <Text style={styles.pagoEstadoText}>{pago.estado}</Text>
                      </View>
                      <Text style={styles.pagoMonto}>${pago.monto}</Text>
                    </View>
                  ))
                )}
              </View>

              {/* Pagar cupos */}
              <View style={styles.pagarCuposSection}>
                <Text style={styles.pagarCuposTitle}>Pagar cupos</Text>
                <View style={styles.pagarCuposRow}>
                  <TextInput
                    style={styles.cuposInput}
                    value={cantidadCupos}
                    onChangeText={setCantidadCupos}
                    keyboardType="number-pad"
                    placeholder="1"
                  />
                  <TouchableOpacity
                    style={[styles.pagarButton, processingPayment && styles.pagarButtonDisabled]}
                    onPress={handlePagarCupo}
                    disabled={processingPayment}
                  >
                    {processingPayment ? (
                      <ActivityIndicator size="small" color={COLORS.white} />
                    ) : (
                      <>
                        <Ionicons name="card-outline" size={18} color={COLORS.white} />
                        <Text style={styles.pagarButtonText}>Pagar cupo</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              {/* Pagar saldo restante (solo organizador) */}
              {reserva.usuario?.id === user?.id &&
                !reserva.pagado &&
                reserva.estado !== 'CANCELADA' && (
                  <TouchableOpacity
                    style={[styles.pagarSaldoButton, processingPayment && styles.pagarButtonDisabled]}
                    onPress={handlePagarSaldoOrganizador}
                    disabled={processingPayment}
                  >
                    <Ionicons name="wallet-outline" size={20} color={COLORS.white} />
                    <Text style={styles.pagarSaldoButtonText}>Pagar saldo restante</Text>
                  </TouchableOpacity>
                )}
            </>
          )}
        </View>

        {/* Organizador */}
        <View style={styles.infoCard}>
          <Text style={styles.sectionTitle}>Organizador</Text>
          <View style={styles.organizadorRow}>
            {reserva.usuario?.foto ? (
              <Image source={{ uri: reserva.usuario.foto }} style={styles.organizadorAvatarImage} />
            ) : (
              <View style={styles.organizadorAvatar}>
                <Text style={styles.organizadorAvatarText}>
                  {(reserva.usuario?.nombre || 'U').charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            <View style={styles.organizadorInfo}>
              <Text style={styles.organizadorNombre}>
                {reserva.usuario?.nombre} {reserva.usuario?.apellido}
              </Text>
              {reserva.usuario?.id === user?.id && (
                <Text style={styles.organizadorTag}>Sos el organizador</Text>
              )}
            </View>
          </View>
        </View>

        {/* Invitados */}
        {reserva.invitaciones && reserva.invitaciones.length > 0 && (
          <View style={styles.infoCard}>
            <Text style={styles.sectionTitle}>Participantes invitados</Text>
            {reserva.invitaciones.map((inv) => {
              const getEstadoInvColor = (estado) => {
                switch (estado) {
                  case 'ACEPTADA': return COLORS.success;
                  case 'RECHAZADA': return COLORS.error;
                  case 'PENDIENTE': return COLORS.warning;
                  default: return COLORS.gray;
                }
              };
              const getEstadoInvLabel = (estado) => {
                switch (estado) {
                  case 'ACEPTADA': return 'Aceptada';
                  case 'RECHAZADA': return 'Rechazada';
                  case 'PENDIENTE': return 'Pendiente';
                  default: return estado;
                }
              };
              const nombreMostrar = inv.invitado?.alias || 
                `${inv.invitado?.nombre || ''} ${inv.invitado?.apellido || ''}`.trim() || 
                'Participante';
              
              return (
                <View key={inv.id} style={styles.invitadoItem}>
                  {inv.invitado?.foto ? (
                    <Image source={{ uri: inv.invitado.foto }} style={styles.invitadoAvatarImage} />
                  ) : (
                    <View style={styles.invitadoAvatar}>
                      <Text style={styles.invitadoAvatarText}>
                        {(inv.invitado?.nombre || 'J').charAt(0).toUpperCase()}
                      </Text>
                    </View>
                  )}
                  <View style={styles.invitadoInfo}>
                    <Text style={styles.invitadoNombre}>{nombreMostrar}</Text>
                    {inv.invitado?.alias && (
                      <Text style={styles.invitadoNombreCompleto}>
                        {inv.invitado?.nombre} {inv.invitado?.apellido}
                      </Text>
                    )}
                  </View>
                  <View style={[styles.invitadoEstadoBadge, { backgroundColor: getEstadoInvColor(inv.estado) + '20' }]}>
                    <View style={[styles.invitadoEstadoDot, { backgroundColor: getEstadoInvColor(inv.estado) }]} />
                    <Text style={[styles.invitadoEstadoText, { color: getEstadoInvColor(inv.estado) }]}>
                      {getEstadoInvLabel(inv.estado)}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
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
    justifyContent: 'center' 
  },
  headerTitle: { 
    fontSize: 18, 
    fontWeight: '700', 
    color: COLORS.white 
  },
  refreshButton: { 
    width: 40, 
    height: 40, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  
  content: { flex: 1, padding: 16 },
  
  // Card de cancha
  canchaCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  canchaImage: {
    width: 60,
    height: 60,
    borderRadius: 12,
    marginRight: 14,
  },
  canchaIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: COLORS.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  canchaInfo: { flex: 1 },
  canchaNombre: { 
    fontSize: 18, 
    fontWeight: '700', 
    color: COLORS.black,
    marginBottom: 4,
  },
  locationRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 8,
  },
  canchaLocation: { 
    fontSize: 13, 
    color: COLORS.gray, 
    marginLeft: 4,
    flex: 1,
  },
  deporteTag: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.primary + '15',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  deporteText: { 
    fontSize: 12, 
    fontWeight: '600', 
    color: COLORS.primary 
  },
  
  // Estado card
  estadoCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  estadoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: { 
    fontSize: 16, 
    fontWeight: '700', 
    color: COLORS.black 
  },
  estadoBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  estadoBadgeText: { 
    fontSize: 13, 
    fontWeight: '700', 
    color: COLORS.white 
  },
  efectivoNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary + '10',
    padding: 12,
    borderRadius: 10,
    marginTop: 12,
  },
  efectivoNoteText: { 
    fontSize: 13, 
    color: COLORS.primary, 
    marginLeft: 8,
    flex: 1,
  },
  
  // Info card
  infoCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  
  // Fecha/Horario row style
  fechaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fechaIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: COLORS.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  fechaInfo: {
    flex: 1,
  },
  fechaLabel: {
    fontSize: 12,
    color: COLORS.gray,
    marginBottom: 2,
  },
  fechaValue: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.black,
    textTransform: 'capitalize',
  },
  
  // Efectivo container
  efectivoContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  efectivoIconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: COLORS.success + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  efectivoTitle: { 
    fontSize: 16, 
    fontWeight: '700', 
    color: COLORS.black,
    marginBottom: 8,
  },
  efectivoTotal: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.success,
    marginBottom: 4,
  },
  efectivoSubtitle: { 
    fontSize: 13, 
    color: COLORS.gray,
    textAlign: 'center',
  },
  
  // Montos
  montosContainer: {
    marginTop: 12,
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 12,
  },
  montoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  montoLabel: { fontSize: 14, color: COLORS.gray },
  montoValue: { fontSize: 14, fontWeight: '600', color: COLORS.black },
  montoRowTotal: {
    borderTopWidth: 1,
    borderTopColor: '#E8E8E8',
    marginTop: 4,
    paddingTop: 12,
  },
  montoLabelTotal: { fontSize: 15, fontWeight: '700', color: COLORS.black },
  montoValueTotal: { fontSize: 18, fontWeight: '700', color: COLORS.primary },
  
  // Pagos section
  pagosSection: { marginTop: 16 },
  pagosTitle: { 
    fontSize: 14, 
    fontWeight: '600', 
    color: COLORS.black,
    marginBottom: 10,
  },
  noPagos: {
    alignItems: 'center',
    paddingVertical: 16,
    backgroundColor: COLORS.background,
    borderRadius: 10,
  },
  noPagosText: { 
    fontSize: 13, 
    color: COLORS.gray, 
    marginTop: 6 
  },
  pagoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
  },
  pagoAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  pagoAvatarImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
  },
  pagoAvatarText: { 
    fontSize: 14, 
    fontWeight: '700', 
    color: COLORS.primary 
  },
  pagoInfo: { flex: 1 },
  pagoUsuario: { 
    fontSize: 14, 
    fontWeight: '600', 
    color: COLORS.black 
  },
  pagoEstadoText: { 
    fontSize: 12, 
    color: COLORS.gray 
  },
  pagoMonto: { 
    fontSize: 15, 
    fontWeight: '700', 
    color: COLORS.success 
  },
  
  // Pagar cupos
  pagarCuposSection: { marginTop: 16 },
  pagarCuposTitle: { 
    fontSize: 14, 
    fontWeight: '600', 
    color: COLORS.black,
    marginBottom: 10,
  },
  pagarCuposRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cuposInput: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  pagarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    gap: 6,
  },
  pagarButtonDisabled: { opacity: 0.6 },
  pagarButtonText: { 
    fontSize: 14, 
    fontWeight: '600', 
    color: COLORS.white 
  },
  
  pagarSaldoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.success,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 16,
    gap: 8,
  },
  pagarSaldoButtonText: { 
    fontSize: 15, 
    fontWeight: '600', 
    color: COLORS.white 
  },
  
  // Organizador
  organizadorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  organizadorAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  organizadorAvatarImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  organizadorAvatarText: { 
    fontSize: 18, 
    fontWeight: '700', 
    color: COLORS.primary 
  },
  organizadorInfo: { flex: 1 },
  organizadorNombre: { 
    fontSize: 15, 
    fontWeight: '600', 
    color: COLORS.black 
  },
  organizadorTag: { 
    fontSize: 12, 
    color: COLORS.primary, 
    marginTop: 2 
  },
  // Invitados
  invitadoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: 12,
    borderRadius: 12,
    marginTop: 10,
  },
  invitadoAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  invitadoAvatarImage: {
    width: 42,
    height: 42,
    borderRadius: 21,
    marginRight: 12,
  },
  invitadoAvatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
  },
  invitadoInfo: {
    flex: 1,
  },
  invitadoNombre: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.black,
  },
  invitadoNombreCompleto: {
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 2,
  },
  invitadoEstadoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  invitadoEstadoDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  invitadoEstadoText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
