import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  ImageBackground,
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, formatearDeporte } from '../constants';
import { reservaService } from '../services/reservaService';
import { comentarioService } from '../services/comentarioService';
import { useAuth } from '../contexts/AuthContext';

// Función para calcular tiempo restante
const calcularTiempoRestante = (fecha, horaInicio) => {
  const [year, month, day] = fecha.split('T')[0].split('-').map(Number);
  const [hora, minuto] = horaInicio.split(':').map(Number);
  const fechaReserva = new Date(year, month - 1, day, hora, minuto);
  const ahora = new Date();
  const diff = fechaReserva - ahora;
  
  if (diff <= 0) return null;
  
  const dias = Math.floor(diff / (1000 * 60 * 60 * 24));
  const horas = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutos = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  if (dias > 0) return `${dias}d ${horas}h`;
  if (horas > 0) return `${horas}h ${minutos}m`;
  return `${minutos}m`;
};

// Iconos de deportes
const DEPORTE_ICONS = {
  'FUTBOL_4': 'football-outline',
  'FUTBOL_5': 'football-outline',
  'FUTBOL_6': 'football-outline',
  'FUTBOL_7': 'football-outline',
  'FUTBOL_8': 'football-outline',
  'FUTBOL_9': 'football-outline',
  'FUTBOL_11': 'football-outline',
  'FUTSAL': 'football-outline',
  'PADEL': 'tennisball-outline',
  'TENIS_SINGLES': 'tennisball-outline',
  'TENIS_DOBLES': 'tennisball-outline',
  'BASQUET': 'basketball-outline',
  'NATACION': 'water-outline',
  'GIMNASIO': 'fitness-outline',
  'YOGA': 'meditate-outline',
  'PILATES': 'body-outline',
  'VOLEY': 'basketball-outline',
  'VOLEY_PLAYA': 'basketball-outline',
  'NEWCOM': 'basketball-outline',
  'OTRO': 'ellipse-outline',
};

export default function MisReservasScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState('list'); // 'list' o 'calendar'
  const [reservas, setReservas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [markedDates, setMarkedDates] = useState({});
  const [filter, setFilter] = useState('all'); // 'all', 'future', 'past', 'today'
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [selectedReserva, setSelectedReserva] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [editFecha, setEditFecha] = useState(new Date());
  const [editHoraInicio, setEditHoraInicio] = useState(new Date());
  const [editHoraFin, setEditHoraFin] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePickerInicio, setShowTimePickerInicio] = useState(false);
  const [showTimePickerFin, setShowTimePickerFin] = useState(false);
  const [comentariosModalVisible, setComentariosModalVisible] = useState(false);
  const [comentarios, setComentarios] = useState([]);
  const [nuevoComentario, setNuevoComentario] = useState('');
  const [loadingComentarios, setLoadingComentarios] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [selectedDay, setSelectedDay] = useState(null);
  const [, setTick] = useState(0); // Para forzar re-render del contador
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteResultModal, setDeleteResultModal] = useState({ visible: false, message: '', success: true });
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelResultModal, setCancelResultModal] = useState({ visible: false, message: '', success: true });

  useEffect(() => {
    loadReservas();
  }, []);

  useEffect(() => {
    if (reservas.length > 0) {
      generateMarkedDates();
    }
  }, [reservas]);

  // Actualizar contador cada minuto
  useEffect(() => {
    const interval = setInterval(() => {
      setTick(t => t + 1);
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const loadReservas = async () => {
    try {
      setLoading(true);
      const response = await reservaService.getMisReservas();
      if (response.success) {
        setReservas(response.data || []);
      }
    } catch (error) {
      console.error('Error loading reservas:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const generateMarkedDates = () => {
    const marked = {};
    const today = new Date().toISOString().split('T')[0];

    reservas.forEach((reserva) => {
      const date = reserva.fecha.split('T')[0];
      const reservaDate = new Date(reserva.fecha);
      const todayDate = new Date(today);

      let color = COLORS.success; // Futuras (verde)
      if (date === today) {
        color = COLORS.warning; // Hoy (amarillo)
      } else if (reservaDate < todayDate) {
        color = COLORS.error; // Pasadas (rojo)
      }

      marked[date] = {
        marked: true,
        dotColor: color,
        selected: date === today,
        selectedColor: date === today ? COLORS.warning : undefined,
      };
    });

    setMarkedDates(marked);
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadReservas();
  };

  const getReservaStatus = (fecha) => {
    const today = new Date().toISOString().split('T')[0];
    const reservaDate = fecha.split('T')[0];
    const reservaDateObj = new Date(reservaDate);
    const todayDateObj = new Date(today);

    if (reservaDate === today) return 'today';
    if (reservaDateObj < todayDateObj) return 'past';
    return 'future';
  };

  const getFilteredReservas = () => {
    let filtered = reservas;
    
    // Filtrar por mes si estamos en vista calendario
    if (viewMode === 'calendar' && selectedMonth) {
      filtered = filtered.filter((reserva) => {
        const reservaMonth = new Date(reserva.fecha).toISOString().slice(0, 7);
        return reservaMonth === selectedMonth;
      });
    }
    
    // Filtrar por día si hay uno seleccionado
    if (selectedDay) {
      filtered = filtered.filter((reserva) => {
        const reservaDate = new Date(reserva.fecha).toISOString().split('T')[0];
        return reservaDate === selectedDay;
      });
    }
    
    // Aplicar filtros adicionales
    if (filter !== 'all') {
      filtered = filtered.filter((reserva) => {
        const status = getReservaStatus(reserva.fecha);
        
        if (filter === 'future') return status === 'future';
        if (filter === 'past') return status === 'past';
        if (filter === 'today') return status === 'today';
        
        return true;
      });
    }
    
    return filtered;
  };

  const handleMonthChange = (month) => {
    // month viene como { dateString, month, year }
    const monthStr = `${month.year}-${month.month.toString().padStart(2, '0')}`;
    setSelectedMonth(monthStr);
    setSelectedDay(null); // Resetear día seleccionado al cambiar mes
  };

  const handleDayPress = (day) => {
    // day viene como { dateString, day, month, year }
    setSelectedDay(day.dateString);
    // Cambiar a vista lista para mostrar las reservas del día
    setViewMode('list');
  };

  const deletePastReservas = () => {
    setDeleteModalVisible(true);
  };

  const confirmDeleteReservas = async () => {
    setDeleteLoading(true);
    try {
      const result = await reservaService.deletePastReservas();
      setDeleteModalVisible(false);
      setDeleteLoading(false);
      
      if (result.success) {
        setDeleteResultModal({
          visible: true,
          message: result.message,
          success: true
        });
        loadReservas();
      }
    } catch (error) {
      setDeleteModalVisible(false);
      setDeleteLoading(false);
      setDeleteResultModal({
        visible: true,
        message: error.message || 'No se pudieron eliminar las reservas',
        success: false
      });
    }
  };

  const handleEditReserva = (reserva) => {
    setSelectedReserva(reserva);
    
    // Convertir fecha a Date object
    const fecha = new Date(reserva.fecha);
    setEditFecha(fecha);
    
    // Convertir horas a Date objects (usando la fecha de la reserva)
    const [horaInicioH, horaInicioM] = reserva.horaInicio.split(':');
    const horaInicio = new Date(fecha);
    horaInicio.setHours(parseInt(horaInicioH), parseInt(horaInicioM));
    setEditHoraInicio(horaInicio);
    
    const [horaFinH, horaFinM] = reserva.horaFin.split(':');
    const horaFin = new Date(fecha);
    horaFin.setHours(parseInt(horaFinH), parseInt(horaFinM));
    setEditHoraFin(horaFin);
    
    setEditModalVisible(true);
  };

  const confirmEditReserva = () => {
    if (!editFecha || !editHoraInicio || !editHoraFin) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }

    // Validar que la hora de fin sea mayor que la de inicio
    if (editHoraInicio >= editHoraFin) {
      Alert.alert('Error', 'La hora de fin debe ser posterior a la hora de inicio');
      return;
    }

    // Formatear para mostrar
    const fechaFormateada = editFecha.toLocaleDateString('es-AR');
    const horaInicioStr = `${editHoraInicio.getHours().toString().padStart(2, '0')}:${editHoraInicio.getMinutes().toString().padStart(2, '0')}`;
    const horaFinStr = `${editHoraFin.getHours().toString().padStart(2, '0')}:${editHoraFin.getMinutes().toString().padStart(2, '0')}`;

    Alert.alert(
      'Confirmar Edición',
      `¿Deseas cambiar la reserva a:\nFecha: ${fechaFormateada}\nHora: ${horaInicioStr} - ${horaFinStr}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: () => {
            // Aquí iría la llamada al backend para actualizar
            setEditModalVisible(false);
            Alert.alert('Éxito', 'Reserva actualizada correctamente.\nEl propietario ha sido notificado.');
            loadReservas();
          },
        },
      ]
    );
  };

  const handleCancelReserva = (reserva) => {
    const status = getReservaStatus(reserva.fecha);
    
    if (status === 'past') {
      Alert.alert('Error', 'No puedes cancelar una reserva pasada');
      return;
    }

    setSelectedReserva(reserva);
    setCancelReason('');
    setCancelModalVisible(true);
  };

  const handleOpenComentarios = async (reserva) => {
    setSelectedReserva(reserva);
    setComentariosModalVisible(true);
    loadComentarios(reserva.id);
  };

  const loadComentarios = async (reservaId) => {
    try {
      setLoadingComentarios(true);
      const response = await comentarioService.getComentarios(reservaId);
      if (response.success) {
        setComentarios(response.data || []);
      }
    } catch (error) {
      console.error('Error loading comentarios:', error);
      setComentarios([]);
    } finally {
      setLoadingComentarios(false);
    }
  };

  const handleSendComentario = async () => {
    if (!nuevoComentario.trim()) {
      Alert.alert('Error', 'El comentario no puede estar vacío');
      return;
    }

    try {
      const response = await comentarioService.createComentario(
        selectedReserva.id,
        nuevoComentario.trim()
      );
      
      if (response.success) {
        setNuevoComentario('');
        loadComentarios(selectedReserva.id);
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo enviar el comentario');
    }
  };

  const handleDeleteComentario = (comentarioId) => {
    Alert.alert(
      'Eliminar Comentario',
      '¿Estás seguro que deseas eliminar este comentario?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await comentarioService.deleteComentario(comentarioId);
              loadComentarios(selectedReserva.id);
            } catch (error) {
              Alert.alert('Error', 'No se pudo eliminar el comentario');
            }
          },
        },
      ]
    );
  };

  const confirmCancelReserva = async () => {
    if (!cancelReason.trim()) {
      Alert.alert('Motivo requerido', 'Por favor indica el motivo de la cancelación');
      return;
    }

    setCancelLoading(true);
    try {
      const response = await reservaService.cancelReserva(selectedReserva.id);
      
      setCancelModalVisible(false);
      setCancelLoading(false);
      setCancelReason('');
      
      if (response.success) {
        setCancelResultModal({
          visible: true,
          message: 'Tu reserva ha sido cancelada. El propietario será notificado.',
          success: true
        });
        loadReservas();
      }
    } catch (error) {
      setCancelModalVisible(false);
      setCancelLoading(false);
      setCancelResultModal({
        visible: true,
        message: error.message || 'No se pudo cancelar la reserva. Intenta nuevamente.',
        success: false
      });
    }
  };

  const openDetalleReserva = (reserva) => {
    navigation.navigate('DetalleReserva', { reservaId: reserva.id });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'today':
        return COLORS.warning;
      case 'past':
        return COLORS.error;
      case 'future':
        return COLORS.success;
      default:
        return COLORS.gray;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'today':
        return 'Hoy';
      case 'past':
        return 'Pasada';
      case 'future':
        return 'Próxima';
      default:
        return '';
    }
  };

  const renderReservaCard = (reserva) => {
    const status = getReservaStatus(reserva.fecha);
    const statusColor = getStatusColor(status);
    const statusText = getStatusText(status);
    const tiempoRestante = calcularTiempoRestante(reserva.fecha, reserva.horaInicio);
    const deporteIcon = DEPORTE_ICONS[reserva.cancha?.deporte] || 'football-outline';
    
    // Obtener info de invitaciones
    const invitacionPublica = reserva.invitaciones?.find(inv => inv.esPublica);
    const solicitudesPendientes = invitacionPublica?.solicitudes?.length || 0;
    const participantes = invitacionPublica?.participantes?.length || 0;
    
    // Info de pagos
    const tienePagosDivididos = reserva.tipoPago === 'DIVIDIR_ENTRE_JUGADORES';
    const pagosCompletados = reserva.pagos?.filter(p => p.estado === 'APROBADO')?.length || 0;
    const totalPagos = reserva.pagos?.length || 0;

    // Solo usar imágenes que sean URLs válidas (http/https)
    const imagenCancha = reserva.cancha?.imagenPrincipal || reserva.cancha?.imagenes?.[0];
    const tieneImagen = imagenCancha && imagenCancha.startsWith('http');

    const CardContent = () => (
      <LinearGradient
        colors={tieneImagen ? ['rgba(0,0,0,0.15)', 'rgba(0,0,0,0.8)'] : ['transparent', 'transparent']}
        style={styles.cardGradient}
      >
        {/* Header con deporte y contador */}
        <View style={styles.cardTopRow}>
          <View style={[styles.deporteTag, tieneImagen && styles.deporteTagDark]}>
            <Ionicons name={deporteIcon} size={14} color={tieneImagen ? COLORS.white : COLORS.primary} />
            <Text style={[styles.deporteText, tieneImagen && styles.textWhite]}>
              {formatearDeporte(reserva.cancha?.deporte) || 'Deporte'}
            </Text>
          </View>
          {tiempoRestante && status !== 'past' && (
            <View style={[styles.contadorContainer, tieneImagen && styles.contadorDark]}>
              <Ionicons name="timer-outline" size={14} color={COLORS.warning} />
              <Text style={[styles.contadorText, tieneImagen && { color: COLORS.white }]}>En {tiempoRestante}</Text>
            </View>
          )}
        </View>

        {/* Contenido principal en la parte inferior */}
        <View style={styles.cardMainContent}>
          {/* Info principal */}
          <View style={styles.reservaHeader}>
            <View style={styles.reservaInfo}>
              <Text style={[styles.espacioName, tieneImagen && styles.espacioNameWhite]}>{reserva.espacio?.nombre || 'Espacio'}</Text>
              <View style={styles.reservaRow}>
                <Ionicons name="location-outline" size={14} color={tieneImagen ? 'rgba(255,255,255,0.8)' : COLORS.gray} />
                <Text style={[styles.espacioLocation, tieneImagen && styles.textWhite70]} numberOfLines={1}>
                  {reserva.espacio?.direccion}, {reserva.espacio?.ciudad}
                </Text>
              </View>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
              <Text style={styles.statusText}>{statusText}</Text>
            </View>
          </View>

          {/* Detalles fecha/hora/precio */}
          <View style={styles.reservaDetails}>
            <View style={styles.detailItem}>
              <Ionicons name="calendar-outline" size={16} color={tieneImagen ? 'rgba(255,255,255,0.8)' : COLORS.gray} />
              <Text style={[styles.detailText, tieneImagen && styles.textWhite]}>
                {new Date(reserva.fecha).toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' })}
              </Text>
            </View>
            <View style={styles.detailItem}>
              <Ionicons name="time-outline" size={16} color={tieneImagen ? 'rgba(255,255,255,0.8)' : COLORS.gray} />
              <Text style={[styles.detailText, tieneImagen && styles.textWhite]}>{reserva.horaInicio} - {reserva.horaFin}</Text>
            </View>
            <View style={styles.detailItem}>
              <Ionicons name="cash-outline" size={16} color={tieneImagen ? 'rgba(255,255,255,0.8)' : COLORS.gray} />
              <Text style={[styles.detailText, tieneImagen && styles.textWhiteBold]}>${reserva.precioTotal}</Text>
            </View>
          </View>

          {/* Estado y acciones */}
          <View style={styles.reservaFooter}>
            <View style={[
              styles.estadoBadge,
              {
                backgroundColor:
                  reserva.estado === 'CONFIRMADA'
                    ? COLORS.success
                    : reserva.estado === 'CANCELADA'
                    ? COLORS.error
                    : COLORS.warning,
              },
            ]}>
              <Text style={styles.estadoText}>{reserva.estado}</Text>
            </View>

            {/* Acciones - Solo para organizadores */}
            {status !== 'past' && reserva.estado !== 'CANCELADA' && reserva.usuarioId === user?.id && (
              <View style={styles.cardActionsInline}>
                <TouchableOpacity
                  style={[styles.actionIconBtn, { backgroundColor: 'rgba(255,107,107,0.2)' }]}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleCancelReserva(reserva);
                  }}
                >
                  <Ionicons name="close-circle-outline" size={18} color={COLORS.error} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionIconBtn, { backgroundColor: tieneImagen ? 'rgba(255,255,255,0.2)' : COLORS.background }]}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleEditReserva(reserva);
                  }}
                >
                  <Ionicons name="create-outline" size={18} color={tieneImagen ? COLORS.white : COLORS.primary} />
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </LinearGradient>
    );

    return (
      <TouchableOpacity
        key={reserva.id}
        style={styles.reservaCard}
        onPress={() => openDetalleReserva(reserva)}
        activeOpacity={0.85}
      >
        {tieneImagen ? (
          <ImageBackground
            source={{ uri: imagenCancha }}
            style={styles.cardBackground}
            imageStyle={styles.cardBackgroundImageStyle}
            resizeMode="cover"
          >
            <CardContent />
          </ImageBackground>
        ) : (
          <View style={[styles.cardBackground, { backgroundColor: COLORS.white }]}>
            <CardContent />
          </View>
        )}

        {/* Sección de acciones adicionales (fuera del gradiente) */}
        <View style={[styles.extraActionsContainer, tieneImagen && { borderTopColor: 'rgba(255,255,255,0.1)' }]}>
          {invitacionPublica && (
            <TouchableOpacity
              style={styles.extraActionButton}
              onPress={(e) => {
                e.stopPropagation();
                navigation.navigate('SolicitudesPartido', { invitacionId: invitacionPublica.id });
              }}
            >
              <Ionicons name="megaphone-outline" size={16} color={COLORS.primary} />
              <Text style={styles.extraActionText}>Ver invitación pública</Text>
              {solicitudesPendientes > 0 && (
                <View style={styles.badgeNotification}>
                  <Text style={styles.badgeNotificationText}>{solicitudesPendientes}</Text>
                </View>
              )}
              {participantes > 0 && (
                <Text style={styles.participantesText}>({participantes} unidos)</Text>
              )}
            </TouchableOpacity>
          )}

          {tienePagosDivididos && (
            <TouchableOpacity
              style={styles.extraActionButton}
              onPress={(e) => {
                e.stopPropagation();
                openDetalleReserva(reserva);
              }}
            >
              <Ionicons name="people-outline" size={16} color={COLORS.secondary} />
              <Text style={styles.extraActionText}>Ver pagos divididos</Text>
              <Text style={styles.pagosStatusText}>
                {pagosCompletados}/{totalPagos || '?'} pagados
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.comentariosButton}
            onPress={(e) => {
              e.stopPropagation();
              handleOpenComentarios(reserva);
            }}
          >
            <Ionicons name="chatbubbles-outline" size={14} color={COLORS.gray} />
            <Text style={styles.comentariosButtonText}>Comentarios de la reserva</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <Text style={styles.headerTitle}>Mis Reservas</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity
            onPress={() => setShowFilterModal(true)}
            style={styles.filterButton}
          >
            <Ionicons name="filter-outline" size={24} color={COLORS.primary} />
            {filter !== 'all' && <View style={styles.filterDot} />}
          </TouchableOpacity>
          <TouchableOpacity
            onPress={deletePastReservas}
            style={styles.deleteButton}
          >
            <Ionicons name="trash-outline" size={24} color={COLORS.error} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              const newMode = viewMode === 'list' ? 'calendar' : 'list';
              setViewMode(newMode);
              if (newMode === 'calendar') {
                setSelectedDay(null); // Limpiar día seleccionado al volver a calendario
              }
            }}
            style={styles.viewToggle}
          >
            <Ionicons
              name={viewMode === 'list' ? 'calendar-outline' : 'list-outline'}
              size={24}
              color={COLORS.primary}
            />
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {viewMode === 'calendar' ? (
            <View style={styles.calendarContainer}>
              <Calendar
                markedDates={markedDates}
                onMonthChange={handleMonthChange}
                onDayPress={handleDayPress}
                theme={{
                  backgroundColor: COLORS.white,
                  calendarBackground: COLORS.white,
                  textSectionTitleColor: COLORS.dark,
                  selectedDayBackgroundColor: COLORS.primary,
                  selectedDayTextColor: COLORS.white,
                  todayTextColor: COLORS.primary,
                  dayTextColor: COLORS.dark,
                  textDisabledColor: COLORS.lightGray,
                  dotColor: COLORS.primary,
                  selectedDotColor: COLORS.white,
                  arrowColor: COLORS.primary,
                  monthTextColor: COLORS.dark,
                  textMonthFontWeight: 'bold',
                  textDayFontSize: 16,
                  textMonthFontSize: 18,
                }}
              />
              
              <View style={styles.legend}>
                <Text style={styles.legendTitle}>Leyenda:</Text>
                <View style={styles.legendItems}>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: COLORS.error }]} />
                    <Text style={styles.legendText}>Pasadas</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: COLORS.warning }]} />
                    <Text style={styles.legendText}>Hoy</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: COLORS.success }]} />
                    <Text style={styles.legendText}>Futuras</Text>
                  </View>
                </View>
              </View>
            </View>
          ) : null}

          <View style={styles.reservasList}>
            {selectedDay && (
              <View style={styles.selectedDayBanner}>
                <Ionicons name="calendar" size={20} color={COLORS.primary} />
                <Text style={styles.selectedDayText}>
                  Mostrando reservas del {new Date(selectedDay).toLocaleDateString('es-AR')}
                </Text>
                <TouchableOpacity
                  onPress={() => setSelectedDay(null)}
                  style={styles.clearDayButton}
                >
                  <Ionicons name="close-circle" size={20} color={COLORS.gray} />
                </TouchableOpacity>
              </View>
            )}
            
            {getFilteredReservas().length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="calendar-outline" size={64} color={COLORS.lightGray} />
                <Text style={styles.emptyText}>
                  {reservas.length === 0 
                    ? 'No tienes reservas' 
                    : selectedDay 
                    ? 'No hay reservas en esta fecha'
                    : 'No hay reservas para este filtro'}
                </Text>
                {selectedDay && (
                  <TouchableOpacity
                    style={styles.exploreButton}
                    onPress={() => setSelectedDay(null)}
                  >
                    <Text style={styles.exploreButtonText}>Ver Todas las Reservas</Text>
                  </TouchableOpacity>
                )}
                {!selectedDay && reservas.length === 0 && (
                  <TouchableOpacity
                    style={styles.exploreButton}
                    onPress={() => navigation.navigate('HomeTab')}
                  >
                    <Text style={styles.exploreButtonText}>Explorar Espacios</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              getFilteredReservas().map((reserva) => renderReservaCard(reserva))
            )}
          </View>
        </ScrollView>
      )}

      {/* Modal de Filtros */}
      <Modal
        visible={showFilterModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Filtrar Reservas</Text>
            
            <TouchableOpacity
              style={[styles.filterOption, filter === 'all' && styles.filterOptionActive]}
              onPress={() => {
                setFilter('all');
                setShowFilterModal(false);
              }}
            >
              <Text style={[styles.filterOptionText, filter === 'all' && styles.filterOptionTextActive]}>
                Todas las Reservas
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.filterOption, filter === 'future' && styles.filterOptionActive]}
              onPress={() => {
                setFilter('future');
                setShowFilterModal(false);
              }}
            >
              <Text style={[styles.filterOptionText, filter === 'future' && styles.filterOptionTextActive]}>
                Reservas Futuras
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.filterOption, filter === 'today' && styles.filterOptionActive]}
              onPress={() => {
                setFilter('today');
                setShowFilterModal(false);
              }}
            >
              <Text style={[styles.filterOptionText, filter === 'today' && styles.filterOptionTextActive]}>
                Reservas de Hoy
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.filterOption, filter === 'past' && styles.filterOptionActive]}
              onPress={() => {
                setFilter('past');
                setShowFilterModal(false);
              }}
            >
              <Text style={[styles.filterOptionText, filter === 'past' && styles.filterOptionTextActive]}>
                Reservas Pasadas
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={() => setShowFilterModal(false)}
            >
              <Text style={styles.modalCancelText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal de Editar Reserva */}
      <Modal
        visible={editModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Editar Reserva</Text>
            <Text style={styles.modalSubtitle}>
              {selectedReserva?.cancha?.nombre}
            </Text>
            
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Fecha</Text>
              <TouchableOpacity
                style={styles.datePickerButton}
                onPress={() => setShowDatePicker(true)}
              >
                <Ionicons name="calendar-outline" size={20} color={COLORS.primary} />
                <Text style={styles.datePickerText}>
                  {editFecha.toLocaleDateString('es-AR')}
                </Text>
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker
                  value={editFecha}
                  mode="date"
                  display="default"
                  onChange={(event, selectedDate) => {
                    setShowDatePicker(false);
                    if (selectedDate) {
                      setEditFecha(selectedDate);
                    }
                  }}
                />
              )}
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Hora de Inicio</Text>
              <TouchableOpacity
                style={styles.datePickerButton}
                onPress={() => setShowTimePickerInicio(true)}
              >
                <Ionicons name="time-outline" size={20} color={COLORS.primary} />
                <Text style={styles.datePickerText}>
                  {`${editHoraInicio.getHours().toString().padStart(2, '0')}:${editHoraInicio.getMinutes().toString().padStart(2, '0')}`}
                </Text>
              </TouchableOpacity>
              {showTimePickerInicio && (
                <DateTimePicker
                  value={editHoraInicio}
                  mode="time"
                  is24Hour={true}
                  display="default"
                  onChange={(event, selectedTime) => {
                    setShowTimePickerInicio(false);
                    if (selectedTime) {
                      setEditHoraInicio(selectedTime);
                    }
                  }}
                />
              )}
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Hora de Fin</Text>
              <TouchableOpacity
                style={styles.datePickerButton}
                onPress={() => setShowTimePickerFin(true)}
              >
                <Ionicons name="time-outline" size={20} color={COLORS.primary} />
                <Text style={styles.datePickerText}>
                  {`${editHoraFin.getHours().toString().padStart(2, '0')}:${editHoraFin.getMinutes().toString().padStart(2, '0')}`}
                </Text>
              </TouchableOpacity>
              {showTimePickerFin && (
                <DateTimePicker
                  value={editHoraFin}
                  mode="time"
                  is24Hour={true}
                  display="default"
                  onChange={(event, selectedTime) => {
                    setShowTimePickerFin(false);
                    if (selectedTime) {
                      setEditHoraFin(selectedTime);
                    }
                  }}
                />
              )}
            </View>

            <Text style={styles.modalNote}>
              El propietario será notificado de los cambios
            </Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => setEditModalVisible(false)}
              >
                <Text style={styles.modalButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonPrimary]}
                onPress={confirmEditReserva}
              >
                <Text style={[styles.modalButtonText, styles.modalButtonTextPrimary]}>
                  Guardar Cambios
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de Cancelar Reserva */}
      <Modal
        visible={cancelModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => !cancelLoading && setCancelModalVisible(false)}
      >
        <View style={styles.cancelModalOverlay}>
          <View style={styles.cancelModalContent}>
            <View style={styles.cancelModalIcon}>
              <Ionicons name="close-circle-outline" size={40} color={COLORS.error} />
            </View>
            <Text style={styles.cancelModalTitle}>Cancelar reserva</Text>
            <View style={styles.cancelModalInfo}>
              <Text style={styles.cancelModalCancha}>{selectedReserva?.cancha?.nombre}</Text>
              <Text style={styles.cancelModalFecha}>
                {selectedReserva?.fecha && new Date(selectedReserva.fecha).toLocaleDateString('es-AR', { 
                  weekday: 'long', day: 'numeric', month: 'long' 
                })} • {selectedReserva?.horaInicio}
              </Text>
            </View>
            
            <Text style={styles.cancelModalLabel}>Motivo de cancelación:</Text>
            <TextInput
              style={styles.cancelModalInput}
              placeholder="Escribe el motivo..."
              placeholderTextColor={COLORS.gray}
              multiline
              numberOfLines={3}
              value={cancelReason}
              onChangeText={setCancelReason}
              textAlignVertical="top"
              editable={!cancelLoading}
            />

            <View style={styles.cancelModalButtons}>
              <TouchableOpacity
                style={styles.cancelModalCancelBtn}
                onPress={() => setCancelModalVisible(false)}
                disabled={cancelLoading}
              >
                <Text style={styles.cancelModalCancelText}>Volver</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.cancelModalConfirmBtn}
                onPress={confirmCancelReserva}
                disabled={cancelLoading}
              >
                {cancelLoading ? (
                  <ActivityIndicator color={COLORS.white} size="small" />
                ) : (
                  <>
                    <Ionicons name="close-circle" size={18} color={COLORS.white} />
                    <Text style={styles.cancelModalConfirmText}>Cancelar reserva</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de Resultado de Cancelación */}
      <Modal
        visible={cancelResultModal.visible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setCancelResultModal({ ...cancelResultModal, visible: false })}
      >
        <View style={styles.deleteModalOverlay}>
          <View style={styles.deleteResultContent}>
            <View style={[
              styles.deleteResultIcon,
              { backgroundColor: cancelResultModal.success ? '#E8F5E9' : '#FFEBEE' }
            ]}>
              <Ionicons 
                name={cancelResultModal.success ? "checkmark-circle" : "alert-circle"} 
                size={50} 
                color={cancelResultModal.success ? COLORS.success : COLORS.error} 
              />
            </View>
            <Text style={styles.deleteResultTitle}>
              {cancelResultModal.success ? 'Reserva cancelada' : 'Error'}
            </Text>
            <Text style={styles.deleteResultMessage}>
              {cancelResultModal.message}
            </Text>
            
            <TouchableOpacity
              style={[
                styles.deleteResultBtn,
                { backgroundColor: cancelResultModal.success ? COLORS.success : COLORS.error }
              ]}
              onPress={() => setCancelResultModal({ ...cancelResultModal, visible: false })}
            >
              <Text style={styles.deleteResultBtnText}>Entendido</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal de Comentarios */}
      <Modal
        visible={comentariosModalVisible}
        animationType="slide"
        onRequestClose={() => setComentariosModalVisible(false)}
      >
        <View style={styles.comentariosContainer}>
          {/* Header */}
          <View style={[styles.comentariosHeader, { paddingTop: insets.top + 10 }]}>
            <TouchableOpacity
              onPress={() => setComentariosModalVisible(false)}
              style={styles.closeButton}
            >
              <Ionicons name="arrow-back" size={24} color={COLORS.dark} />
            </TouchableOpacity>
            <View style={styles.comentariosHeaderInfo}>
              <Text style={styles.comentariosTitle}>Comentarios de la Reserva</Text>
              <Text style={styles.comentariosSubtitle}>
                {selectedReserva?.cancha?.nombre}
              </Text>
            </View>
          </View>

          {/* Lista de Comentarios */}
          <ScrollView style={styles.comentariosList}>
            {loadingComentarios ? (
              <View style={styles.loadingComentarios}>
                <ActivityIndicator size="large" color={COLORS.primary} />
              </View>
            ) : comentarios.length === 0 ? (
              <View style={styles.emptyComentarios}>
                <Ionicons name="chatbubbles-outline" size={64} color={COLORS.lightGray} />
                <Text style={styles.emptyComentariosText}>
                  No hay comentarios aún
                </Text>
                <Text style={styles.emptyComentariosSubtext}>
                  Sé el primero en comentar sobre esta reserva
                </Text>
              </View>
            ) : (
              comentarios.map((comentario) => (
                <View key={comentario.id} style={styles.comentarioItem}>
                  <View style={styles.comentarioHeader}>
                    <View style={styles.comentarioAvatar}>
                      <Text style={styles.comentarioAvatarText}>
                        {comentario.usuario.nombre.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.comentarioInfo}>
                      <Text style={styles.comentarioAutor}>
                        {comentario.usuario.nombre} {comentario.usuario.apellido}
                      </Text>
                      <Text style={styles.comentarioFecha}>
                        {new Date(comentario.createdAt).toLocaleString('es-AR')}
                      </Text>
                    </View>
                    {comentario.usuarioId === user?.id && (
                      <TouchableOpacity
                        onPress={() => handleDeleteComentario(comentario.id)}
                        style={styles.deleteComentarioButton}
                      >
                        <Ionicons name="trash-outline" size={18} color={COLORS.error} />
                      </TouchableOpacity>
                    )}
                  </View>
                  <Text style={styles.comentarioMensaje}>{comentario.mensaje}</Text>
                </View>
              ))
            )}
          </ScrollView>

          {/* Input de Nuevo Comentario */}
          <View style={[styles.comentarioInputContainer, { paddingBottom: insets.bottom + 10 }]}>
            <TextInput
              style={styles.comentarioInput}
              placeholder="Escribe un comentario..."
              placeholderTextColor={COLORS.gray}
              value={nuevoComentario}
              onChangeText={setNuevoComentario}
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              style={[
                styles.sendComentarioButton,
                !nuevoComentario.trim() && styles.sendComentarioButtonDisabled
              ]}
              onPress={handleSendComentario}
              disabled={!nuevoComentario.trim()}
            >
              <Ionicons
                name="send"
                size={24}
                color={nuevoComentario.trim() ? COLORS.white : COLORS.gray}
              />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal de Confirmación de Borrado */}
      <Modal
        visible={deleteModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => !deleteLoading && setDeleteModalVisible(false)}
      >
        <View style={styles.deleteModalOverlay}>
          <View style={styles.deleteModalContent}>
            <View style={styles.deleteModalIcon}>
              <Ionicons name="trash-outline" size={40} color={COLORS.error} />
            </View>
            <Text style={styles.deleteModalTitle}>Limpiar historial</Text>
            <Text style={styles.deleteModalText}>
              Se eliminarán todas las reservas pasadas y canceladas de tu historial.
            </Text>
            <Text style={styles.deleteModalSubtext}>
              Esta acción no se puede deshacer.
            </Text>
            
            <View style={styles.deleteModalButtons}>
              <TouchableOpacity
                style={styles.deleteModalCancelBtn}
                onPress={() => setDeleteModalVisible(false)}
                disabled={deleteLoading}
              >
                <Text style={styles.deleteModalCancelText}>Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.deleteModalConfirmBtn}
                onPress={confirmDeleteReservas}
                disabled={deleteLoading}
              >
                {deleteLoading ? (
                  <ActivityIndicator color={COLORS.white} size="small" />
                ) : (
                  <>
                    <Ionicons name="trash" size={18} color={COLORS.white} />
                    <Text style={styles.deleteModalConfirmText}>Eliminar</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de Resultado */}
      <Modal
        visible={deleteResultModal.visible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setDeleteResultModal({ ...deleteResultModal, visible: false })}
      >
        <View style={styles.deleteModalOverlay}>
          <View style={styles.deleteResultContent}>
            <View style={[
              styles.deleteResultIcon,
              { backgroundColor: deleteResultModal.success ? '#E8F5E9' : '#FFEBEE' }
            ]}>
              <Ionicons 
                name={deleteResultModal.success ? "checkmark-circle" : "alert-circle"} 
                size={50} 
                color={deleteResultModal.success ? COLORS.success : COLORS.error} 
              />
            </View>
            <Text style={styles.deleteResultTitle}>
              {deleteResultModal.success ? '¡Listo!' : 'Error'}
            </Text>
            <Text style={styles.deleteResultMessage}>
              {deleteResultModal.message}
            </Text>
            
            <TouchableOpacity
              style={[
                styles.deleteResultBtn,
                { backgroundColor: deleteResultModal.success ? COLORS.success : COLORS.error }
              ]}
              onPress={() => setDeleteResultModal({ ...deleteResultModal, visible: false })}
            >
              <Text style={styles.deleteResultBtnText}>Entendido</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.background,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.dark,
  },
  headerRight: {
    flexDirection: 'row',
    gap: 12,
  },
  viewToggle: {
    padding: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  calendarContainer: {
    backgroundColor: COLORS.white,
    marginBottom: 16,
    padding: 16,
  },
  legend: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.background,
  },
  legendTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginBottom: 12,
  },
  legendItems: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 12,
    color: COLORS.gray,
  },
  reservasList: {
    padding: 16,
  },
  selectedDayBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  selectedDayText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.dark,
    fontWeight: '600',
  },
  clearDayButton: {
    padding: 4,
  },
  reservaCard: {
    borderRadius: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
    overflow: 'hidden',
  },
  cardBackground: {
    width: '100%',
    aspectRatio: 16/9,
  },
  cardBackgroundImageStyle: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  cardGradient: {
    flex: 1,
    padding: 14,
    justifyContent: 'space-between',
  },
  cardMainContent: {
    marginTop: 'auto',
  },
  // Estilos para texto sobre imagen oscura
  textWhite: {
    color: COLORS.white,
  },
  textWhite70: {
    color: 'rgba(255,255,255,0.7)',
  },
  textWhiteBold: {
    color: COLORS.white,
    fontWeight: 'bold',
  },
  canchaNameWhite: {
    color: COLORS.white,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  deporteTagDark: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  contadorDark: {
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  cardActionsInline: {
    flexDirection: 'row',
    gap: 8,
  },
  actionIconBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reservaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  reservaInfo: {
    flex: 1,
  },
  canchaName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginBottom: 4,
  },
  reservaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  reservaLocation: {
    fontSize: 12,
    color: COLORS.gray,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  reservaDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: 13,
    color: COLORS.dark,
  },
  reservaFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  estadoBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  estadoText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.gray,
    marginTop: 16,
    marginBottom: 24,
  },
  exploreButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  exploreButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: 'bold',
  },
  filterButton: {
    padding: 4,
    position: 'relative',
  },
  filterDot: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.error,
  },
  deleteButton: {
    padding: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  editButtonLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  editButtonText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: 'bold',
  },
  cancelButtonSmall: {
    padding: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 16,
    color: COLORS.gray,
    marginBottom: 16,
  },
  modalDescription: {
    fontSize: 14,
    color: COLORS.gray,
    marginBottom: 16,
  },
  formGroup: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginBottom: 8,
  },
  formInput: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: COLORS.dark,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
  },
  cuposRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  pagarButton: {
    marginLeft: 8,
  },
  pagoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  pagoUsuario: {
    flex: 1,
    fontSize: 13,
    color: COLORS.dark,
  },
  pagoMonto: {
    fontSize: 13,
    color: COLORS.dark,
    marginLeft: 8,
  },
  pagoEstado: {
    fontSize: 12,
    color: COLORS.gray,
    marginLeft: 8,
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    gap: 12,
  },
  datePickerText: {
    fontSize: 16,
    color: COLORS.dark,
    fontWeight: '600',
  },
  modalNote: {
    fontSize: 12,
    color: COLORS.gray,
    textAlign: 'center',
    marginBottom: 20,
    fontStyle: 'italic',
  },
  filterOption: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: COLORS.background,
    marginBottom: 12,
  },
  filterOptionActive: {
    backgroundColor: COLORS.primary,
  },
  filterOptionText: {
    fontSize: 16,
    color: COLORS.dark,
    fontWeight: '500',
  },
  filterOptionTextActive: {
    color: COLORS.white,
    fontWeight: 'bold',
  },
  modalCancelButton: {
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  modalCancelText: {
    fontSize: 16,
    color: COLORS.gray,
    fontWeight: '600',
  },
  modalInput: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 16,
    fontSize: 14,
    color: COLORS.dark,
    minHeight: 120,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  modalButtonPrimary: {
    backgroundColor: COLORS.primary,
  },
  modalButtonDanger: {
    backgroundColor: COLORS.error,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.dark,
  },
  modalButtonTextPrimary: {
    color: COLORS.white,
  },
  comentariosButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginTop: 12,
    gap: 6,
    alignSelf: 'flex-start',
  },
  comentariosButtonText: {
    fontSize: 11,
    color: COLORS.gray,
    fontWeight: '500',
  },
  comentariosContainer: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  comentariosHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.background,
    gap: 16,
  },
  closeButton: {
    padding: 4,
  },
  comentariosHeaderInfo: {
    flex: 1,
  },
  comentariosTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.dark,
  },
  comentariosSubtitle: {
    fontSize: 14,
    color: COLORS.gray,
    marginTop: 2,
  },
  comentariosList: {
    flex: 1,
    padding: 16,
  },
  loadingComentarios: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyComentarios: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyComentariosText: {
    fontSize: 16,
    color: COLORS.gray,
    marginTop: 16,
    fontWeight: '600',
  },
  emptyComentariosSubtext: {
    fontSize: 14,
    color: COLORS.lightGray,
    marginTop: 8,
    textAlign: 'center',
  },
  comentarioItem: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  comentarioHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  comentarioAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  comentarioAvatarText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  comentarioInfo: {
    flex: 1,
  },
  comentarioAutor: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.dark,
  },
  comentarioFecha: {
    fontSize: 11,
    color: COLORS.gray,
    marginTop: 2,
  },
  deleteComentarioButton: {
    padding: 4,
  },
  comentarioMensaje: {
    fontSize: 14,
    color: COLORS.dark,
    lineHeight: 20,
  },
  comentarioInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.background,
    gap: 12,
  },
  comentarioInput: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    color: COLORS.dark,
    maxHeight: 100,
  },
  sendComentarioButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendComentarioButtonDisabled: {
    backgroundColor: COLORS.background,
  },
  // Nuevos estilos para cards mejoradas
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  deporteTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary + '15',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  deporteText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
    textTransform: 'capitalize',
  },
  contadorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.warning + '20',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  contadorText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.warning,
  },
  extraActionsContainer: {
    backgroundColor: COLORS.white,
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.background,
    gap: 8,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  extraActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: COLORS.background,
    borderRadius: 8,
    gap: 8,
  },
  extraActionText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.dark,
    fontWeight: '500',
  },
  badgeNotification: {
    backgroundColor: COLORS.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  badgeNotificationText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '700',
  },
  participantesText: {
    fontSize: 12,
    color: COLORS.gray,
  },
  pagosStatusText: {
    fontSize: 12,
    color: COLORS.secondary,
    fontWeight: '600',
  },
  // Estilos del Modal de Borrado
  deleteModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  deleteModalContent: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  deleteModalIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFEBEE',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  deleteModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginBottom: 8,
  },
  deleteModalText: {
    fontSize: 15,
    color: COLORS.gray,
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 22,
  },
  deleteModalSubtext: {
    fontSize: 13,
    color: COLORS.error,
    textAlign: 'center',
    marginBottom: 24,
    fontWeight: '500',
  },
  deleteModalButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  deleteModalCancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: COLORS.background,
    alignItems: 'center',
  },
  deleteModalCancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.gray,
  },
  deleteModalConfirmBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: COLORS.error,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  deleteModalConfirmText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.white,
  },
  // Estilos del Modal de Resultado
  deleteResultContent: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 300,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  deleteResultIcon: {
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  deleteResultTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginBottom: 8,
  },
  deleteResultMessage: {
    fontSize: 15,
    color: COLORS.gray,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  deleteResultBtn: {
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 12,
    alignItems: 'center',
  },
  deleteResultBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.white,
  },
  // Estilos del Modal de Cancelación
  cancelModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  cancelModalContent: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 360,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  cancelModalIcon: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#FFEBEE',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 16,
  },
  cancelModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.dark,
    textAlign: 'center',
    marginBottom: 12,
  },
  cancelModalInfo: {
    backgroundColor: COLORS.background,
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
  },
  cancelModalCancha: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.dark,
    textAlign: 'center',
  },
  cancelModalFecha: {
    fontSize: 13,
    color: COLORS.gray,
    textAlign: 'center',
    marginTop: 4,
    textTransform: 'capitalize',
  },
  cancelModalLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.dark,
    marginBottom: 8,
  },
  cancelModalInput: {
    backgroundColor: COLORS.background,
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: COLORS.dark,
    minHeight: 80,
    marginBottom: 20,
  },
  cancelModalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelModalCancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: COLORS.background,
    alignItems: 'center',
  },
  cancelModalCancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.gray,
  },
  cancelModalConfirmBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: COLORS.error,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  cancelModalConfirmText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.white,
  },
});
