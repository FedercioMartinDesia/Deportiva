// appCancha-mobile/src/screens/ReservaScheduleScreen.js
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView, FlatList, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, formatearDeporte, JUGADORES_POR_DEPORTE } from '../constants';
import { reservaService } from '../services/reservaService';
import { useAuth } from '../contexts/AuthContext';

const PAYMENT_METHODS = {
  EFECTIVO: 'EFECTIVO',
  DIVIDIR: 'DIVIDIR_ENTRE_JUGADORES',
  PAGAR_TODO: 'PAGAR_TODO_YO'
};

// Turnos por franja horaria
const TURNOS = {
  MANANA: { id: 'MANANA', label: 'Mañana', icon: 'sunny-outline', horarios: ['08:00', '09:00', '10:00', '11:00', '12:00'] },
  TARDE: { id: 'TARDE', label: 'Tarde', icon: 'partly-sunny-outline', horarios: ['13:00', '14:00', '15:00', '16:00', '17:00', '18:00'] },
  NOCHE: { id: 'NOCHE', label: 'Noche', icon: 'moon-outline', horarios: ['19:00', '20:00', '21:00', '22:00', '23:00'] },
};

// Nombres de días y meses en español
const DIAS_SEMANA = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

// Generar próximos N días
const generarProximosDias = (cantidadDias = 30) => {
  const dias = [];
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  
  for (let i = 0; i < cantidadDias; i++) {
    const fecha = new Date(hoy);
    fecha.setDate(hoy.getDate() + i);
    dias.push({
      fecha,
      dia: fecha.getDate(),
      diaSemana: DIAS_SEMANA[fecha.getDay()],
      mes: fecha.getMonth(),
      año: fecha.getFullYear(),
      esHoy: i === 0,
    });
  }
  return dias;
};

const getJugadoresPorDeporte = (deporte) => {
  return JUGADORES_POR_DEPORTE[deporte] || 10;
};

export default function ReservaScheduleScreen({ route, navigation }) {
  const { canchaId, tipoPago } = route.params || {};
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  const [cancha, setCancha] = useState(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTurno, setSelectedTurno] = useState(null);
  const [selectedHora, setSelectedHora] = useState(null);
  const [disponibilidad, setDisponibilidad] = useState([]);
  const [loadingDisponibilidad, setLoadingDisponibilidad] = useState(false);

  // Modal de éxito
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successData, setSuccessData] = useState({ reservaId: null, mensaje: '' });

  // Días disponibles para seleccionar (próximos 30 días)
  const [diasDisponibles] = useState(() => generarProximosDias(30));
  const [mesActual, setMesActual] = useState(() => {
    const hoy = new Date();
    return { mes: hoy.getMonth(), año: hoy.getFullYear() };
  });
  const dateScrollRef = useRef(null);

  useEffect(() => {
    loadCancha();
  }, []);

  useEffect(() => {
    if (cancha && selectedDate) {
      loadDisponibilidad();
    }
  }, [cancha, selectedDate]);

  const loadCancha = async () => {
    try {
      const data = await (await import('../services/canchaService')).canchaService.getCanchaById(canchaId);
      setCancha(data);
    } catch (error) {
      Alert.alert('Error', 'No se pudo cargar el espacio');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const loadDisponibilidad = async () => {
    try {
      setLoadingDisponibilidad(true);
      const fecha = selectedDate.toISOString().split('T')[0];
      const response = await reservaService.getDisponibilidad(canchaId, fecha);
      if (response.success) {
        setDisponibilidad(response.data?.horariosOcupados || []);
      }
    } catch (error) {
      console.log('Error cargando disponibilidad:', error);
    } finally {
      setLoadingDisponibilidad(false);
    }
  };

  const handleSelectDate = (diaInfo) => {
    setSelectedDate(diaInfo.fecha);
    setSelectedTurno(null);
    setSelectedHora(null);
    // Actualizar mes actual si cambia
    if (diaInfo.mes !== mesActual.mes || diaInfo.año !== mesActual.año) {
      setMesActual({ mes: diaInfo.mes, año: diaInfo.año });
    }
  };

  const cambiarMes = (direccion) => {
    let nuevoMes = mesActual.mes + direccion;
    let nuevoAño = mesActual.año;
    
    if (nuevoMes > 11) {
      nuevoMes = 0;
      nuevoAño++;
    } else if (nuevoMes < 0) {
      nuevoMes = 11;
      nuevoAño--;
    }
    
    // Buscar el primer día disponible de ese mes
    const primerDiaDelMes = diasDisponibles.find(d => d.mes === nuevoMes && d.año === nuevoAño);
    if (primerDiaDelMes) {
      setMesActual({ mes: nuevoMes, año: nuevoAño });
      handleSelectDate(primerDiaDelMes);
      
      // Scroll al día
      const index = diasDisponibles.findIndex(d => d.mes === nuevoMes && d.año === nuevoAño);
      if (index >= 0 && dateScrollRef.current) {
        dateScrollRef.current.scrollToIndex({ index, animated: true, viewPosition: 0 });
      }
    }
  };

  const isSameDay = (date1, date2) => {
    return date1.getDate() === date2.getDate() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getFullYear() === date2.getFullYear();
  };

  const isHoraOcupada = (hora) => {
    return disponibilidad.some(h => h.startsWith(hora));
  };

  const handleSelectTurno = (turnoId) => {
    setSelectedTurno(turnoId);
    setSelectedHora(null);
  };

  const handleSelectHora = (hora) => {
    if (!isHoraOcupada(hora)) {
      setSelectedHora(hora);
    }
  };

  const handleConfirm = async () => {
    if (!cancha || !selectedHora) return;

    setCreating(true);
    try {
      const fecha = selectedDate.toISOString().split('T')[0];
      const horaInicio = selectedHora;
      const [h, m] = selectedHora.split(':').map(Number);
      const horaFin = `${String(h + 1).padStart(2, '0')}:${String(m).padStart(2, '0')}`;

      const reserva = await reservaService.createReserva({
        canchaId,
        fecha,
        horaInicio,
        horaFin,
        duracionHoras: 1
      });

      let mensaje = '';
      if (tipoPago === PAYMENT_METHODS.EFECTIVO) {
        await reservaService.confirmarPago(reserva.data.id, 'EFECTIVO');
        mensaje = 'Podrás pagar en efectivo cuando llegues.';
      } else if (tipoPago === PAYMENT_METHODS.DIVIDIR) {
        const jugadores = getJugadoresPorDeporte(cancha.deporte);
        await reservaService.createPagoReserva(reserva.data.id, jugadores);
        mensaje = 'Se dividió el pago entre los participantes.';
      } else if (tipoPago === PAYMENT_METHODS.PAGAR_TODO) {
        await reservaService.pagarSaldoOrganizador(reserva.data.id);
        mensaje = 'Se generó el link de pago.';
      }
      
      setSuccessData({ reservaId: reserva.data.id, mensaje });
      setShowSuccessModal(true);
    } catch (error) {
      console.error('Error al crear reserva:', error);
      setSuccessData({ reservaId: null, mensaje: error.response?.data?.message || 'No se pudo crear la reserva' });
      setShowSuccessModal(true);
    } finally {
      setCreating(false);
    }
  };

  const getPaymentIcon = () => {
    if (tipoPago === PAYMENT_METHODS.EFECTIVO) return 'cash-outline';
    if (tipoPago === PAYMENT_METHODS.DIVIDIR) return 'people-outline';
    return 'card-outline';
  };

  const getPaymentLabel = () => {
    if (tipoPago === PAYMENT_METHODS.EFECTIVO) return 'Pago en efectivo';
    if (tipoPago === PAYMENT_METHODS.DIVIDIR) return 'Dividir entre participantes';
    return 'Pagar todo yo';
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!cancha) {
    return (
      <View style={[styles.container, styles.centered, { paddingTop: insets.top }]}>
        <Text style={styles.errorText}>No se encontró el espacio</Text>
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
        <Text style={styles.headerTitle}>Reservar turno</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Card de la cancha */}
        <View style={styles.canchaCard}>
          <View style={styles.canchaCardLeft}>
            <Text style={styles.canchaNombre}>{cancha.nombre}</Text>
            <Text style={styles.canchaDeporte}>{formatearDeporte(cancha.deporte)}</Text>
          </View>
          <View style={styles.canchaCardRight}>
            <Text style={styles.canchaPrecio}>${cancha.precioPorHora}</Text>
            <Text style={styles.canchaPrecioLabel}>por hora</Text>
          </View>
        </View>

        {/* Selector de fecha */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            <Ionicons name="calendar-outline" size={18} color={COLORS.primary} /> Fecha
          </Text>
          {/* Selector de mes */}
          <View style={styles.monthSelector}>
            <TouchableOpacity 
              style={styles.monthArrow} 
              onPress={() => cambiarMes(-1)}
              disabled={mesActual.mes === new Date().getMonth() && mesActual.año === new Date().getFullYear()}
            >
              <Ionicons 
                name="chevron-back" 
                size={22} 
                color={mesActual.mes === new Date().getMonth() && mesActual.año === new Date().getFullYear() ? COLORS.lightGray : COLORS.primary} 
              />
            </TouchableOpacity>
            <Text style={styles.monthText}>
              {MESES[mesActual.mes]} {mesActual.año}
            </Text>
            <TouchableOpacity style={styles.monthArrow} onPress={() => cambiarMes(1)}>
              <Ionicons name="chevron-forward" size={22} color={COLORS.primary} />
            </TouchableOpacity>
          </View>

          {/* Días en scroll horizontal */}
          <FlatList
            ref={dateScrollRef}
            data={diasDisponibles}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item, index) => `dia-${index}`}
            contentContainerStyle={styles.daysScrollContent}
            renderItem={({ item: diaInfo }) => {
              const isSelected = isSameDay(selectedDate, diaInfo.fecha);
              return (
                <TouchableOpacity
                  style={[
                    styles.dayCard,
                    isSelected && styles.dayCardSelected,
                    diaInfo.esHoy && !isSelected && styles.dayCardToday
                  ]}
                  onPress={() => handleSelectDate(diaInfo)}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.dayWeekday,
                    isSelected && styles.dayTextSelected
                  ]}>
                    {diaInfo.diaSemana}
                  </Text>
                  <Text style={[
                    styles.dayNumber,
                    isSelected && styles.dayTextSelected
                  ]}>
                    {diaInfo.dia}
                  </Text>
                  {diaInfo.esHoy && (
                    <View style={[styles.todayDot, isSelected && styles.todayDotSelected]} />
                  )}
                </TouchableOpacity>
              );
            }}
            onScrollToIndexFailed={() => {}}
          />
        </View>

        {/* Selector de turno */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            <Ionicons name="time-outline" size={18} color={COLORS.primary} /> Turno
          </Text>
          <View style={styles.turnosContainer}>
            {Object.values(TURNOS).map((turno) => (
              <TouchableOpacity
                key={turno.id}
                style={[
                  styles.turnoCard,
                  selectedTurno === turno.id && styles.turnoCardSelected
                ]}
                onPress={() => handleSelectTurno(turno.id)}
                activeOpacity={0.7}
              >
                <Ionicons 
                  name={turno.icon} 
                  size={24} 
                  color={selectedTurno === turno.id ? COLORS.white : COLORS.primary} 
                />
                <Text style={[
                  styles.turnoLabel,
                  selectedTurno === turno.id && styles.turnoLabelSelected
                ]}>
                  {turno.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Horarios disponibles */}
        {selectedTurno && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              <Ionicons name="checkmark-circle-outline" size={18} color={COLORS.primary} /> Horarios disponibles
            </Text>
            {loadingDisponibilidad ? (
              <ActivityIndicator size="small" color={COLORS.primary} style={{ marginTop: 12 }} />
            ) : (
              <View style={styles.horariosGrid}>
                {TURNOS[selectedTurno].horarios.map((hora) => {
                  const ocupado = isHoraOcupada(hora);
                  const selected = selectedHora === hora;
                  return (
                    <TouchableOpacity
                      key={hora}
                      style={[
                        styles.horarioChip,
                        ocupado && styles.horarioChipOcupado,
                        selected && styles.horarioChipSelected
                      ]}
                      onPress={() => handleSelectHora(hora)}
                      disabled={ocupado}
                      activeOpacity={0.7}
                    >
                      <Text style={[
                        styles.horarioText,
                        ocupado && styles.horarioTextOcupado,
                        selected && styles.horarioTextSelected
                      ]}>
                        {hora}
                      </Text>
                      {ocupado && (
                        <Text style={styles.horarioOcupadoLabel}>Ocupado</Text>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
        )}

        {/* Forma de pago */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            <Ionicons name="wallet-outline" size={18} color={COLORS.primary} /> Forma de pago
          </Text>
          <View style={styles.paymentCard}>
            <View style={styles.paymentCardIcon}>
              <Ionicons name={getPaymentIcon()} size={22} color={COLORS.primary} />
            </View>
            <View style={styles.paymentCardInfo}>
              <Text style={styles.paymentCardTitle}>{getPaymentLabel()}</Text>
              {tipoPago === PAYMENT_METHODS.DIVIDIR && (
                <Text style={styles.paymentCardHint}>
                  Se dividirá entre {getJugadoresPorDeporte(cancha.deporte)} participantes
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* Resumen */}
        {selectedHora && (
          <View style={styles.resumenCard}>
            <Text style={styles.resumenTitle}>Resumen de tu reserva</Text>
            <View style={styles.resumenRow}>
              <Text style={styles.resumenLabel}>Espacio</Text>
              <Text style={styles.resumenValue}>{cancha.nombre}</Text>
            </View>
            <View style={styles.resumenRow}>
              <Text style={styles.resumenLabel}>Fecha</Text>
              <Text style={styles.resumenValue}>
                {selectedDate.toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' })}
              </Text>
              <Text style={styles.resumenLabel}>Horario</Text>
              <Text style={styles.resumenValue}>{selectedHora} hs</Text>
            </View>
            <View style={[styles.resumenRow, styles.resumenRowTotal]}> 
              <Text style={styles.resumenTotalLabel}>Total</Text>
              <Text style={styles.resumenTotalValue}>${cancha.precioPorHora}</Text>
            </View>
          </View>
        )}
        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Botón confirmar fijo abajo */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 12 }]}>
        <TouchableOpacity
          style={[
            styles.confirmButton,
            (!selectedHora || creating) && styles.confirmButtonDisabled
          ]}
          onPress={handleConfirm}
          disabled={!selectedHora || creating}
          activeOpacity={0.8}
        >
          {creating ? (
            <ActivityIndicator size="small" color={COLORS.white} />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={22} color={COLORS.white} />
              <Text style={styles.confirmButtonText}>Confirmar reserva</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Modal de éxito */}
      <Modal
        visible={showSuccessModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {}}
      >
        <View style={styles.successModalOverlay}>
          <View style={styles.successModalContent}>
            {successData.reservaId ? (
              <>
                <View style={styles.successIconContainer}>
                  <Ionicons name="checkmark-circle" size={64} color={COLORS.primary} />
                </View>
                <Text style={styles.successTitle}>¡Listo, ya tenés tu reserva!</Text>
                <Text style={styles.successMessage}>{successData.mensaje}</Text>
                
                <TouchableOpacity
                  style={styles.successButtonPrimary}
                  onPress={() => {
                    setShowSuccessModal(false);
                    navigation.reset({
                      index: 0,
                      routes: [{ name: 'Main', params: { screen: 'Reservas' } }],
                    });
                  }}
                >
                  <Ionicons name="calendar" size={20} color={COLORS.white} />
                  <Text style={styles.successButtonPrimaryText}>Ir a Reservas</Text>
                </TouchableOpacity>

                {/* Separador */}
                <View style={styles.successDivider}>
                  <View style={styles.successDividerLine} />
                  <Text style={styles.successDividerText}>o</Text>
                  <View style={styles.successDividerLine} />
                </View>

                {/* Pregunta de invitar amigos */}
                <Text style={styles.successInviteQuestion}>
                  ¿Querés invitar amigos dentro de la app?
                </Text>
                <Text style={styles.successInviteHint}>
                  Si invitás amigos, la reserva quedará en estado PENDIENTE hasta que acepten
                </Text>
                
                <TouchableOpacity
                  style={styles.successButtonSecondary}
                  onPress={() => {
                    setShowSuccessModal(false);
                    navigation.navigate('InvitarAmigos', { 
                      reservaId: successData.reservaId, 
                      cancha 
                    });
                  }}
                >
                  <Ionicons name="people" size={20} color={COLORS.primary} />
                  <Text style={styles.successButtonSecondaryText}>Sí, invitar amigos</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <View style={styles.errorIconContainer}>
                  <Ionicons name="close-circle" size={64} color={COLORS.error} />
                </View>
                <Text style={styles.successTitle}>Error</Text>
                <Text style={styles.successMessage}>{successData.mensaje}</Text>
                
                <TouchableOpacity
                  style={styles.successButtonPrimary}
                  onPress={() => setShowSuccessModal(false)}
                >
                  <Text style={styles.successButtonPrimaryText}>Entendido</Text>
                </TouchableOpacity>
              </>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: COLORS.white },
  content: { flex: 1, paddingHorizontal: 16 },
  
  // Card de cancha
  canchaCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 14,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  canchaCardLeft: { flex: 1 },
  canchaCardRight: { alignItems: 'flex-end' },
  canchaNombre: { fontSize: 18, fontWeight: '700', color: COLORS.black },
  canchaDeporte: { fontSize: 13, color: COLORS.gray, marginTop: 2 },
  canchaPrecio: { fontSize: 24, fontWeight: '700', color: COLORS.primary },
  canchaPrecioLabel: { fontSize: 12, color: COLORS.gray },
  
  // Secciones
  section: { marginTop: 20 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: COLORS.black, marginBottom: 12 },
  
  // Selector de fecha
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  dateButtonContent: { flex: 1 },
  dateDay: { fontSize: 14, color: COLORS.gray, textTransform: 'capitalize' },
  dateNumber: { fontSize: 18, fontWeight: '700', color: COLORS.black, marginTop: 2, textTransform: 'capitalize' },
  dateButtonIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Turnos
  turnosContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  turnoCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    paddingVertical: 18,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.primary + '30',
  },
  turnoCardSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  turnoLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.black,
    marginTop: 6,
  },
  turnoLabelSelected: {
    color: COLORS.white,
  },
  
  // Horarios
  horariosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  horarioChip: {
    width: '30%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  horarioChipOcupado: {
    backgroundColor: '#f5f5f5',
    borderColor: '#E0E0E0',
  },
  horarioChipSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  horarioText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.black,
  },
  horarioTextOcupado: {
    color: COLORS.lightGray,
  },
  horarioTextSelected: {
    color: COLORS.white,
  },
  horarioOcupadoLabel: {
    fontSize: 10,
    color: COLORS.lightGray,
    marginTop: 2,
  },
  
  // Forma de pago
  paymentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  paymentCardIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: COLORS.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  paymentCardInfo: { flex: 1 },
  paymentCardTitle: { fontSize: 15, fontWeight: '600', color: COLORS.black },
  paymentCardHint: { fontSize: 12, color: COLORS.gray, marginTop: 2 },
  
  // Resumen
  resumenCard: {
    backgroundColor: COLORS.primary + '08',
    padding: 16,
    borderRadius: 14,
    marginTop: 20,
    borderWidth: 1,
    borderColor: COLORS.primary + '20',
  },
  resumenTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 14,
  },
  resumenRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  resumenLabel: { fontSize: 14, color: COLORS.gray },
  resumenValue: { fontSize: 14, fontWeight: '600', color: COLORS.black },
  resumenRowTotal: {
    borderTopWidth: 1,
    borderTopColor: COLORS.primary + '20',
    marginTop: 8,
    paddingTop: 12,
  },
  resumenTotalLabel: { fontSize: 16, fontWeight: '700', color: COLORS.black },
  resumenTotalValue: { fontSize: 20, fontWeight: '700', color: COLORS.primary },
  
  // Bottom bar
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 12,
  },
  confirmButtonDisabled: { opacity: 0.5 },
  confirmButtonText: { fontSize: 16, fontWeight: '700', color: COLORS.white },
  errorText: { fontSize: 16, color: COLORS.gray, textAlign: 'center' },
  
  // Selector de mes
  monthSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  monthArrow: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary + '10',
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthText: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.black,
  },
  
  // Días horizontales
  daysScrollContent: {
    paddingVertical: 4,
  },
  dayCard: {
    width: 56,
    height: 76,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  dayCardSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  dayCardToday: {
    borderColor: COLORS.primary,
    borderWidth: 2,
  },
  dayWeekday: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.gray,
    marginBottom: 4,
  },
  dayNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.black,
  },
  dayTextSelected: {
    color: COLORS.white,
  },
  todayDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primary,
    marginTop: 4,
  },
  todayDotSelected: {
    backgroundColor: COLORS.white,
  },
  
  // Modal de éxito
  successModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  successModalContent: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 28,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
  },
  successIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  errorIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FF6B6B15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.black,
    marginBottom: 8,
    textAlign: 'center',
  },
  successMessage: {
    fontSize: 15,
    color: COLORS.gray,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 8,
  },
  successHint: {
    fontSize: 13,
    color: COLORS.primary,
    textAlign: 'center',
    marginBottom: 24,
    fontWeight: '500',
  },
  successButtonPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    width: '100%',
    marginBottom: 12,
  },
  successButtonPrimaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
  successButtonSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.primary + '10',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    width: '100%',
  },
  successButtonSecondaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
  },
  successButtonSkip: {
    paddingVertical: 12,
    marginTop: 4,
  },
  successButtonSkipText: {
    fontSize: 14,
    color: COLORS.gray,
    textDecorationLine: 'underline',
  },
  successDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginVertical: 16,
  },
  successDividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E8E8E8',
  },
  successDividerText: {
    fontSize: 13,
    color: COLORS.gray,
    marginHorizontal: 12,
  },
  successInviteQuestion: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.black,
    textAlign: 'center',
    marginBottom: 6,
  },
  successInviteHint: {
    fontSize: 12,
    color: COLORS.gray,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 18,
  },
});