import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  TextInput,
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../constants';
import { reservaService } from '../services/reservaService';
import { useAuth } from '../contexts/AuthContext';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';

export default function ReservasOwnerScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState('calendar'); // 'calendar' o 'list'
  const [reservas, setReservas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [markedDates, setMarkedDates] = useState({});
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [selectedDay, setSelectedDay] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all', 'pending', 'confirmed', 'cancelled', 'completed'
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [selectedReserva, setSelectedReserva] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [dateRange, setDateRange] = useState({ from: null, to: null });
  const [showDatePicker, setShowDatePicker] = useState({ from: false, to: false });
  const [canchaSeleccionada, setCanchaSeleccionada] = useState('ALL');
  const [misCanchas, setMisCanchas] = useState([]);

  const statusMap = {
    PENDIENTE: 'Pendiente',
    CONFIRMADA: 'Confirmada',
    CANCELADA: 'Cancelada',
    COMPLETADA: 'Completada',
  };

  // Colores de estado personalizados
  const statusColors = {
    CANCELADA: '#E53935', // Rojo
    PENDIENTE: '#FFD600', // Amarillo
    CONFIRMADA: '#43A047', // Verde
    COMPLETADA: '#999999', // Gris
  };

  useEffect(() => {
    loadReservas();
  }, []);

  useEffect(() => {
    if (reservas.length > 0) {
      generateMarkedDates();
    }
  }, [reservas, selectedMonth]);

  useEffect(() => {
    // Obtener canchas del propietario
    const fetchCanchas = async () => {
      try {
        const response = await reservaService.getReservasOwner();
        if (response.success) {
          // Extraer canchas únicas
          const canchas = Array.from(new Set((response.data || []).map(r => r.cancha?.id && r.cancha)));
          setMisCanchas(canchas.filter(Boolean));
        }
      } catch (e) {}
    };
    fetchCanchas();
  }, []);

  const loadReservas = async () => {
    try {
      setLoading(true);
      // Obtener reservas de las canchas del propietario
      const response = await reservaService.getReservasOwner();
      if (response.success) {
        setReservas(response.data || []);
      } else {
        console.error('Error response:', response);
        Alert.alert('Error', response.message || 'Error cargando reservas');
      }
    } catch (error) {
      console.error('Error loading reservas:', error);
      Alert.alert('Error', 'No se pudieron cargar las reservas');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Prioridad: CANCELADA > PENDIENTE > CONFIRMADA > COMPLETADA
  const estadoPrioridad = ['CANCELADA', 'PENDIENTE', 'CONFIRMADA', 'COMPLETADA'];
  const generateMarkedDates = () => {
    const marked = {};
    const today = new Date().toISOString().split('T')[0];

    // Filtrar reservas del mes seleccionado
    const reservasMes = reservas.filter((reserva) => {
      const reservaMonth = new Date(reserva.fecha).toISOString().slice(0, 7);
      return reservaMonth === selectedMonth;
    });

    // Agrupar reservas por día
    const reservasPorDia = {};
    reservasMes.forEach((reserva) => {
      const date = reserva.fecha.split('T')[0];
      if (!reservasPorDia[date]) reservasPorDia[date] = [];
      reservasPorDia[date].push(reserva);
    });

    Object.entries(reservasPorDia).forEach(([date, reservasDia]) => {
      // Obtener los estados presentes en el día
      const estadosPresentes = estadoPrioridad.filter(e => reservasDia.some(r => r.estado === e));
      // Tomar hasta 3 colores
      const dots = estadosPresentes.slice(0, 3).map(e => ({ key: e, color: statusColors[e] }));
      marked[date] = {
        dots,
        selected: date === today,
        selectedColor: date === today ? '#1976D2' : undefined, // Azul para hoy
      };
    });

    // Marcar el día actual aunque no tenga reservas
    if (!marked[today]) {
      marked[today] = {
        selected: true,
        selectedColor: '#1976D2',
      };
    }

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

    // Filtrar por cancha seleccionada
    if (canchaSeleccionada !== 'ALL') {
      filtered = filtered.filter(r => r.cancha?.id === canchaSeleccionada);
    }

    // Filtrar por rango de fechas si está definido
    if (dateRange.from && dateRange.to) {
      const fromDate = new Date(dateRange.from);
      const toDate = new Date(dateRange.to);
      filtered = filtered.filter((reserva) => {
        const reservaDate = new Date(reserva.fecha);
        return reservaDate >= fromDate && reservaDate <= toDate;
      });
    } else {
      // Filtrar por mes si estamos en vista calendario
      if (viewMode === 'calendar' && selectedMonth) {
        filtered = filtered.filter((reserva) => {
          const reservaMonth = new Date(reserva.fecha).toISOString().slice(0, 7);
          return reservaMonth === selectedMonth;
        });
      }
    }

    // Filtrar por día si hay uno seleccionado
    if (selectedDay) {
      filtered = filtered.filter((reserva) => {
        const reservaDate = new Date(reserva.fecha).toISOString().split('T')[0];
        return reservaDate === selectedDay;
      });
    }

    // Aplicar filtros por estado
    if (filter !== 'all') {
      filtered = filtered.filter((reserva) => {
        if (filter === 'pending') return reserva.estado === 'PENDIENTE';
        if (filter === 'confirmed') return reserva.estado === 'CONFIRMADA';
        if (filter === 'cancelled') return reserva.estado === 'CANCELADA';
        if (filter === 'completed') return reserva.estado === 'COMPLETADA';
        return true;
      });
    }

    // Ordenar por fecha
    filtered.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));

    return filtered;
  };

  const handleMonthChange = (month) => {
    const monthStr = `${month.year}-${month.month.toString().padStart(2, '0')}`;
    setSelectedMonth(monthStr);
    setSelectedDay(null);
    // Al cambiar de mes, se actualizan los puntos del calendario automáticamente por el useEffect
  };

  const handleDayPress = (day) => {
    setSelectedDay(day.dateString);
    setViewMode('list');
  };

  const handleChangeStatus = (reserva) => {
    setSelectedReserva(reserva);
    setNewStatus(reserva.estado);
    setStatusModalVisible(true);
  };

  const confirmStatusChange = async () => {
    if (newStatus === selectedReserva.estado) {
      Alert.alert('Info', 'El estado no ha cambiado');
      return;
    }

    try {
      const response = await reservaService.updateReservaStatus(selectedReserva.id, newStatus);
      if (response.success) {
        setStatusModalVisible(false);
        Alert.alert('Éxito', 'Estado de la reserva actualizado');
        loadReservas();
      } else {
        Alert.alert('Error', response.message || 'No se pudo actualizar el estado');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      Alert.alert('Error', 'Error al actualizar el estado');
    }
  };

  const handleRejectReserva = (reserva) => {
    Alert.alert(
      'Cancelar Reserva',
      `¿Deseas cancelar esta reserva de ${reserva.usuario?.nombre || 'Usuario desconocido'}?`,
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Sí, Cancelar',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await reservaService.updateReservaStatus(reserva.id, 'CANCELADA');
              if (response.success) {
                Alert.alert('Éxito', 'Reserva cancelada');
                loadReservas();
              } else {
                Alert.alert('Error', response.message || 'No se pudo cancelar');
              }
            } catch (error) {
              console.error('Error:', error);
              Alert.alert('Error', 'Error al cancelar la reserva');
            }
          },
        },
      ]
    );
  };

  const formatFecha = (fecha) => {
    const date = new Date(fecha);
    return date.toLocaleDateString('es-AR', { 
      weekday: 'short', 
      day: '2-digit', 
      month: '2-digit' 
    });
  };

  const renderReservaItem = (reserva) => {
    const statusBg = statusColors[reserva.estado] || '#999';
    const nombreUsuario = reserva.usuario?.nombre || 'Usuario desconocido';
    const nombreCancha = reserva.cancha?.nombre || 'Espacio desconocido';

    return (
      <TouchableOpacity key={reserva.id} onPress={() => handleChangeStatus(reserva)}>
        <View style={[styles.reservaCard, { borderLeftColor: statusBg }]}>
          {/* Header: Nombre usuario y estado */}
          <View style={styles.cardHeader}>
            <View style={styles.userInfo}>
              <Ionicons name="person-circle" size={40} color={COLORS.primary} />
              <View style={styles.userDetails}>
                <Text style={styles.userName}>{nombreUsuario}</Text>
                <Text style={styles.userPhone}>{reserva.usuario?.telefono || '-'}</Text>
              </View>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
              <Text style={styles.statusText}>{statusMap[reserva.estado]}</Text>
            </View>
          </View>

          {/* Fecha, hora, cancha */}
          <View style={styles.cardDetails}>
            <View style={styles.detailRow}>
              <Ionicons name="calendar" size={16} color={COLORS.primary} />
              <Text style={styles.detailText}>
                {formatFecha(reserva.fecha)} • {reserva.horaInicio} - {reserva.horaFin}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Ionicons name="location" size={16} color={COLORS.primary} />
              <Text style={styles.detailText}>{nombreCancha}</Text>
            </View>
            {reserva.cantidadJugadores && (
              <View style={styles.detailRow}>
                <Ionicons name="people" size={16} color={COLORS.primary} />
                <Text style={styles.detailText}>{reserva.cantidadJugadores} participantes</Text>
              </View>
            )}
          </View>

          {/* Botones de acción */}
          {reserva.estado !== 'CANCELADA' && reserva.estado !== 'COMPLETADA' && (
            <View style={styles.cardActions}>
              {reserva.estado === 'PENDIENTE' && (
                <TouchableOpacity 
                  style={[styles.actionButton, styles.acceptButton]}
                  onPress={() => confirmStatusChange()}
                >
                  <Ionicons name="checkmark-circle" size={18} color="white" />
                  <Text style={styles.actionButtonText}>Confirmar</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity 
                style={[styles.actionButton, styles.rejectButton]}
                onPress={() => handleRejectReserva(reserva)}
              >
                <Ionicons name="close-circle" size={18} color="white" />
                <Text style={styles.actionButtonText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const filteredReservas = getFilteredReservas();
  // Calcular estadísticas sobre el mismo filtro que la lista
  const pendientesCount = filteredReservas.filter(r => r.estado === 'PENDIENTE').length;
  const confirmadasCount = filteredReservas.filter(r => r.estado === 'CONFIRMADA').length;
  const canceladasCount = filteredReservas.filter(r => r.estado === 'CANCELADA').length;
  const completadasCount = filteredReservas.filter(r => r.estado === 'COMPLETADA').length;

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  // RESUMEN DINÁMICO DEL MES SELECCIONADO
  // Filtrar reservas del mes seleccionado
  const reservasMes = reservas.filter((reserva) => {
    const reservaMonth = new Date(reserva.fecha).toISOString().slice(0, 7);
    return reservaMonth === selectedMonth;
  });
  const pendientesMes = reservasMes.filter(r => r.estado === 'PENDIENTE').length;
  const confirmadasMes = reservasMes.filter(r => r.estado === 'CONFIRMADA').length;
  const canceladasMes = reservasMes.filter(r => r.estado === 'CANCELADA').length;
  const completadasMes = reservasMes.filter(r => r.estado === 'COMPLETADA').length;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header con flecha volver */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={28} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Gestionar Reservas</Text>
        <TouchableOpacity onPress={() => setShowFilterModal(true)}>
          <Ionicons name="funnel" size={24} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {/* View Mode Selector */}
      <View style={styles.viewSelector}>
        <TouchableOpacity
          style={[styles.viewButton, viewMode === 'calendar' && styles.activeViewButton]}
          onPress={() => {
            setViewMode('calendar');
            setSelectedDay(null);
          }}
        >
          <Ionicons 
            name="calendar" 
            size={20} 
            color={viewMode === 'calendar' ? COLORS.primary : COLORS.text}
          />
          <Text style={[styles.viewButtonText, viewMode === 'calendar' && styles.activeViewButtonText]}>
            Calendario
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.viewButton, viewMode === 'list' && styles.activeViewButton]}
          onPress={() => setViewMode('list')}
        >
          <Ionicons 
            name="list" 
            size={20} 
            color={viewMode === 'list' ? COLORS.primary : COLORS.text}
          />
          <Text style={[styles.viewButtonText, viewMode === 'list' && styles.activeViewButtonText]}>
            Lista
          </Text>
        </TouchableOpacity>
      </View>

      {/* Selector de cancha */}
      <View style={{ paddingHorizontal: 16, marginBottom: 8 }}>
        <Text style={{ fontWeight: '600', fontSize: 15, marginBottom: 4 }}>Espacio</Text>
        <View style={{ backgroundColor: '#fff', borderRadius: 8, borderWidth: 1, borderColor: '#e0e0e0', marginBottom: 8, width: '100%' }}>
          <Picker
            selectedValue={canchaSeleccionada}
            onValueChange={setCanchaSeleccionada}
            style={{ height: 50, color: '#222', paddingHorizontal: 16, width: '100%' }}
            itemStyle={{ color: '#222', fontSize: 16 }}
            mode="dropdown"
          >
            <Picker.Item label="Todos los espacios" value="ALL" />
            {misCanchas.map((cancha) => (
              <Picker.Item key={cancha.id} label={cancha.nombre || `Espacio ${cancha.id}` } value={cancha.id} />
            ))}
          </Picker>
        </View>
      </View>

      {/* Calendar View */}
      {viewMode === 'calendar' && (
        <ScrollView 
          style={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          <View style={styles.calendarContainer}>
            <Calendar
              markedDates={markedDates}
              markingType="multi-dot"
              onMonthChange={handleMonthChange}
              onDayPress={handleDayPress}
              theme={{
                todayTextColor: '#1976D2',
                textDayFontSize: 14,
                textMonthFontSize: 16,
                textDayHeaderFontSize: 13,
                backgroundColor: '#fff',
                calendarBackground: '#fff',
                textSectionTitleColor: COLORS.text,
                selectedDayBackgroundColor: '#1976D2',
                selectedDayTextColor: '#fff',
                todayBackgroundColor: 'transparent',
                dotColor: COLORS.primary,
                selectedDotColor: '#fff',
                monthTextColor: COLORS.primary,
                textDisabledColor: '#ccc',
              }}
            />
          </View>

          {/* Resumen de reservas por mes - visual mejorada */}
          <View style={styles.summarySectionBetter}>
            <View style={styles.summaryRowBetter}>
              <View style={[styles.summaryBoxBetter, { backgroundColor: '#FFF8E1' }]}> {/* Amarillo */}
                <Ionicons name="alert-circle" size={22} color={statusColors.PENDIENTE} />
                <Text style={[styles.summaryLabelBetter, { color: statusColors.PENDIENTE }]}>Pendientes</Text>
                <Text style={styles.summaryValueBetter}>{pendientesCount}</Text>
              </View>
              <View style={[styles.summaryBoxBetter, { backgroundColor: '#E8F5E9' }]}> {/* Verde */}
                <Ionicons name="checkmark-circle" size={22} color={statusColors.CONFIRMADA} />
                <Text style={[styles.summaryLabelBetter, { color: statusColors.CONFIRMADA }]}>Confirmadas</Text>
                <Text style={styles.summaryValueBetter}>{confirmadasCount}</Text>
              </View>
            </View>
            <View style={styles.summaryRowBetter}>
              <View style={[styles.summaryBoxBetter, { backgroundColor: '#FFEBEE' }]}> {/* Rojo */}
                <Ionicons name="close-circle" size={22} color={statusColors.CANCELADA} />
                <Text style={[styles.summaryLabelBetter, { color: statusColors.CANCELADA }]}>Canceladas</Text>
                <Text style={styles.summaryValueBetter}>{canceladasCount}</Text>
              </View>
              <View style={[styles.summaryBoxBetter, { backgroundColor: '#F5F5F5' }]}> {/* Gris */}
                <Ionicons name="time" size={22} color={statusColors.COMPLETADA} />
                <Text style={[styles.summaryLabelBetter, { color: statusColors.COMPLETADA }]}>Completadas</Text>
                <Text style={styles.summaryValueBetter}>{completadasCount}</Text>
              </View>
            </View>
          </View>
        </ScrollView>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <FlatList
          data={filteredReservas}
          renderItem={({ item }) => renderReservaItem(item)}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="calendar-clear" size={64} color={COLORS.primary} />
              <Text style={styles.emptyText}>
                {selectedDay ? 'Sin reservas en esta fecha' : 'Sin reservas'}
              </Text>
              {selectedDay && (
                <TouchableOpacity
                  onPress={() => setSelectedDay(null)}
                  style={styles.clearButton}
                >
                  <Text style={styles.clearButtonText}>Ver todas</Text>
                </TouchableOpacity>
              )}
            </View>
          }
        />
      )}

      {/* Filter Modal */}
      <Modal
        visible={showFilterModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filtrar por Estado y Fecha</Text>
              <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>
            <View style={styles.filterOptions}>
              {/* Filtro por estado */}
              {[
                { key: 'all', label: 'Todos' },
                { key: 'pending', label: 'Pendientes', status: 'PENDIENTE' },
                { key: 'confirmed', label: 'Confirmadas', status: 'CONFIRMADA' },
                { key: 'completed', label: 'Completadas', status: 'COMPLETADA' },
                { key: 'cancelled', label: 'Canceladas', status: 'CANCELADA' },
              ].map((option) => (
                <TouchableOpacity
                  key={option.key}
                  style={[
                    styles.filterOption,
                    filter === option.key && styles.filterOptionActive,
                  ]}
                  onPress={() => setFilter(option.key)}
                >
                  {filter === option.key && (
                    <Ionicons name="checkmark" size={20} color={COLORS.primary} />
                  )}
                  <Text
                    style={[
                      styles.filterOptionText,
                      filter === option.key && styles.filterOptionTextActive,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {/* Selector de cancha */}
            <View style={{ marginTop: 18 }}>
              <Text style={{ fontWeight: '600', fontSize: 15, marginBottom: 4 }}>Espacio</Text>
              <View style={{ backgroundColor: '#fff', borderRadius: 8, borderWidth: 1, borderColor: '#e0e0e0', marginBottom: 8, width: '100%' }}>
                <Picker
                  selectedValue={canchaSeleccionada}
                  onValueChange={setCanchaSeleccionada}
                  style={{ height: 50, color: '#222', paddingHorizontal: 16, width: '100%' }}
                  itemStyle={{ color: '#222', fontSize: 16 }}
                  mode="dropdown"
                >
                  <Picker.Item label="Todos los espacios" value="ALL" />
                  {misCanchas.map((cancha) => (
                    <Picker.Item key={cancha.id} label={cancha.nombre || `Espacio ${cancha.id}` } value={cancha.id} />
                  ))}
                </Picker>
              </View>
            </View>
            {/* Selector de rango de fechas */}
            <View style={{ marginTop: 18 }}>
              <Text style={{ fontWeight: '600', fontSize: 15, marginBottom: 8 }}>Rango de fechas</Text>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <TouchableOpacity
                  style={{ flex: 1, borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 8, padding: 10, alignItems: 'center' }}
                  onPress={() => setShowDatePicker({ ...showDatePicker, from: true })}
                >
                  <Text style={{ color: dateRange.from ? COLORS.primary : '#999' }}>
                    {dateRange.from ? new Date(dateRange.from).toLocaleDateString('es-AR') : 'Desde'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{ flex: 1, borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 8, padding: 10, alignItems: 'center' }}
                  onPress={() => setShowDatePicker({ ...showDatePicker, to: true })}
                >
                  <Text style={{ color: dateRange.to ? COLORS.primary : '#999' }}>
                    {dateRange.to ? new Date(dateRange.to).toLocaleDateString('es-AR') : 'Hasta'}
                  </Text>
                </TouchableOpacity>
              </View>
              {/* DatePickers */}
              {showDatePicker.from && (
                <DateTimePicker
                  value={dateRange.from ? new Date(dateRange.from) : new Date()}
                  mode="date"
                  display="default"
                  onChange={(event, selectedDate) => {
                    setShowDatePicker({ ...showDatePicker, from: false });
                    if (selectedDate) setDateRange({ ...dateRange, from: selectedDate });
                  }}
                />
              )}
              {showDatePicker.to && (
                <DateTimePicker
                  value={dateRange.to ? new Date(dateRange.to) : new Date()}
                  mode="date"
                  display="default"
                  onChange={(event, selectedDate) => {
                    setShowDatePicker({ ...showDatePicker, to: false });
                    if (selectedDate) setDateRange({ ...dateRange, to: selectedDate });
                  }}
                />
              )}
              {/* Botón para limpiar rango */}
              {(dateRange.from || dateRange.to) && (
                <TouchableOpacity style={{ marginTop: 8, alignSelf: 'flex-end' }} onPress={() => setDateRange({ from: null, to: null })}>
                  <Text style={{ color: COLORS.error, fontSize: 13 }}>Limpiar rango</Text>
                </TouchableOpacity>
              )}
            </View>
            {/* Botón aplicar filtro */}
            <View style={{ marginTop: 18 }}>
              <TouchableOpacity
                style={{ backgroundColor: COLORS.primary, borderRadius: 8, padding: 12, alignItems: 'center' }}
                onPress={() => setShowFilterModal(false)}
              >
                <Text style={{ color: '#fff', fontWeight: '600', fontSize: 16 }}>Aplicar filtro</Text>
              </TouchableOpacity>
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
    backgroundColor: '#F9F9F9',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    backgroundColor: '#fff',
    elevation: 4,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.primary,
  },
  viewSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 8,
  },
  viewButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
  },
  activeViewButton: {
    borderBottomWidth: 2,
    borderColor: COLORS.primary,
  },
  viewButtonText: {
    fontSize: 14,
    color: COLORS.text,
  },
  activeViewButtonText: {
    fontWeight: '600',
    color: COLORS.primary,
  },
  content: {
    flex: 1,
  },
  calendarContainer: {
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 16,
  },
  summarySectionBetter: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginTop: 8,
    elevation: 2,
  },
  summaryRowBetter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryBoxBetter: {
    flex: 1,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    elevation: 1,
  },
  summaryLabelBetter: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 4,
  },
  summaryValueBetter: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.primary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.text,
    marginTop: 8,
  },
  clearButton: {
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
  },
  clearButtonText: {
    color: '#fff',
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    elevation: 4,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.primary,
  },
  filterOptions: {
    marginTop: 16,
  },
  filterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  filterOptionActive: {
    backgroundColor: '#E3F2FD',
  },
  filterOptionText: {
    marginLeft: 8,
    fontSize: 14,
    color: COLORS.text,
  },
  filterOptionTextActive: {
    fontWeight: '500',
    color: COLORS.primary,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginTop: 8,
  },
  acceptButton: {
    backgroundColor: '#43A047',
  },
  rejectButton: {
    backgroundColor: '#E53935',
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: '500',
    marginLeft: 4,
  },
  reservaCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userDetails: {
    marginLeft: 12,
  },
  userName: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.primary,
  },
  userPhone: {
    fontSize: 14,
    color: COLORS.text,
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 16,
  },
  statusText: {
    color: '#fff',
    fontWeight: '500',
    fontSize: 12,
  },
  cardDetails: {
    marginTop: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    marginLeft: 8,
    fontSize: 14,
    color: COLORS.text,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
  },
  modalCloseButton: {
    padding: 8,
  },
});
