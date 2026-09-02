import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { COLORS } from '../constants';
import api from '../services/api';

// Configurar calendario en español
LocaleConfig.locales['es'] = {
  monthNames: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'],
  monthNamesShort: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
  dayNames: ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
  dayNamesShort: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'],
  today: 'Hoy'
};
LocaleConfig.defaultLocale = 'es';

const TIPOS_NOTIFICACION = [
  { id: 'PROMOCION', label: '🎁 Promoción', icon: 'gift-outline', color: '#10B981', description: 'Ofertas y descuentos especiales' },
  { id: 'MANTENIMIENTO', label: '🔧 Mantenimiento', icon: 'construct-outline', color: '#F59E0B', description: 'Espacio en reparación o mejoras' },
  { id: 'CIERRE', label: '🚫 Cierre Temporal', icon: 'close-circle-outline', color: '#EF4444', description: 'Espacio no disponible temporalmente' },
  { id: 'EVENTO', label: '🏆 Evento', icon: 'trophy-outline', color: '#8B5CF6', description: 'Torneos o eventos especiales' },
];

export default function PropietarioEnviarNotificacionScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  
  const [titulo, setTitulo] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [tipo, setTipo] = useState('PROMOCION');
  const [selectedCanchas, setSelectedCanchas] = useState([]); // Empty = todas
  const [misCanchas, setMisCanchas] = useState([]);
  const [fechaInicio, setFechaInicio] = useState(null);
  const [fechaFin, setFechaFin] = useState(null);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [selectingDate, setSelectingDate] = useState('inicio'); // 'inicio' o 'fin'
  const [loading, setLoading] = useState(false);
  const [loadingCanchas, setLoadingCanchas] = useState(true);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [resultData, setResultData] = useState(null);
  const [todasLasCanchas, setTodasLasCanchas] = useState(true);

  useEffect(() => {
    loadMisCanchas();
  }, []);

  const loadMisCanchas = async () => {
    try {
      setLoadingCanchas(true);
      const response = await api.get('/canchas/mis-canchas');
      if (response.data.success) {
        setMisCanchas(response.data.data || []);
      }
    } catch (error) {
      console.error('Error cargando canchas:', error);
    } finally {
      setLoadingCanchas(false);
    }
  };

  const toggleCancha = (canchaId) => {
    if (selectedCanchas.includes(canchaId)) {
      setSelectedCanchas(selectedCanchas.filter(id => id !== canchaId));
    } else {
      setSelectedCanchas([...selectedCanchas, canchaId]);
    }
  };

  const formatDate = (date) => {
    if (!date) return '';
    return date.toLocaleDateString('es-AR', { 
      weekday: 'short',
      day: 'numeric', 
      month: 'short',
      year: 'numeric'
    });
  };

  const handleSelectDate = (day) => {
    const selectedDate = new Date(day.dateString);
    if (selectingDate === 'inicio') {
      setFechaInicio(selectedDate);
      if (fechaFin && selectedDate > fechaFin) {
        setFechaFin(null);
      }
    } else {
      setFechaFin(selectedDate);
    }
    setShowCalendarModal(false);
  };

  const openCalendar = (type) => {
    setSelectingDate(type);
    setShowCalendarModal(true);
  };

  const getMinDate = () => {
    if (selectingDate === 'fin' && fechaInicio) {
      return fechaInicio.toISOString().split('T')[0];
    }
    return new Date().toISOString().split('T')[0];
  };

  const generarMensajeAutomatico = () => {
    const tipoInfo = TIPOS_NOTIFICACION.find(t => t.id === tipo);
    const canchasNombre = todasLasCanchas 
      ? 'todos nuestros espacios' 
      : selectedCanchas.length > 0 
        ? misCanchas.filter(c => selectedCanchas.includes(c.id)).map(c => c.nombre).join(', ')
        : 'nuestros espacios';
    
    let fechaTexto = '';
    if (fechaInicio && fechaFin) {
      fechaTexto = `\n📅 Desde el ${formatDate(fechaInicio)} hasta el ${formatDate(fechaFin)}`;
    } else if (fechaInicio) {
      fechaTexto = `\n📅 El día ${formatDate(fechaInicio)}`;
    }

    const templates = {
      PROMOCION: `¡Tenemos una promoción especial para ti en ${canchasNombre}!${fechaTexto}`,
      MANTENIMIENTO: `Te informamos que ${canchasNombre} estará en mantenimiento.${fechaTexto}\n\nDisculpa las molestias.`,
      CIERRE: `${canchasNombre} estará cerrado temporalmente.${fechaTexto}\n\nTe avisaremos cuando volvamos a abrir.`,
      EVENTO: `¡No te pierdas nuestro evento especial en ${canchasNombre}!${fechaTexto}`,
    };

    return templates[tipo] || '';
  };

  const handleGenerarMensaje = () => {
    const mensajeGenerado = generarMensajeAutomatico();
    setMensaje(mensajeGenerado);
  };

  const handleEnviar = () => {
    if (!titulo.trim()) {
      setErrorMessage('El título es obligatorio');
      setShowErrorModal(true);
      return;
    }
    if (!mensaje.trim()) {
      setErrorMessage('El mensaje es obligatorio');
      setShowErrorModal(true);
      return;
    }
    setShowConfirmModal(true);
  };

  const confirmarEnvio = async () => {
    setShowConfirmModal(false);
    try {
      setLoading(true);
      const response = await api.post('/propietario/notificaciones/enviar', {
        titulo: titulo.trim(),
        mensaje: mensaje.trim(),
        tipo,
        canchaIds: todasLasCanchas ? [] : selectedCanchas,
        fechaInicio: fechaInicio?.toISOString(),
        fechaFin: fechaFin?.toISOString()
      });
      
      if (response.data.success) {
        setResultData(response.data.data);
        setShowSuccessModal(true);
        
        // Limpiar formulario
        setTitulo('');
        setMensaje('');
        setTipo('PROMOCION');
        setSelectedCanchas([]);
        setTodasLasCanchas(true);
        setFechaInicio(null);
        setFechaFin(null);
      }
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'No se pudo enviar la notificación');
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  };

  const getCanchasTexto = () => {
    return todasLasCanchas 
      ? 'todas tus canchas' 
      : selectedCanchas.length === 1 
        ? misCanchas.find(c => c.id === selectedCanchas[0])?.nombre
        : `${selectedCanchas.length} canchas seleccionadas`;
  };

  const selectedTipo = TIPOS_NOTIFICACION.find(t => t.id === tipo);
  const canchasSeleccionadasInfo = todasLasCanchas 
    ? 'Todas mis canchas' 
    : selectedCanchas.length > 0 
      ? misCanchas.filter(c => selectedCanchas.includes(c.id)).map(c => c.nombre).join(', ')
      : 'Ninguna seleccionada';

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.dark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Enviar Notificación</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Tipo de notificación */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tipo de Notificación</Text>
          <View style={styles.tiposGrid}>
            {TIPOS_NOTIFICACION.map((t) => (
              <TouchableOpacity
                key={t.id}
                style={[
                  styles.tipoCard,
                  tipo === t.id && { borderColor: t.color, borderWidth: 2, backgroundColor: t.color + '10' }
                ]}
                onPress={() => setTipo(t.id)}
              >
                <View style={[styles.tipoIcon, { backgroundColor: t.color + '20' }]}>
                  <Ionicons name={t.icon} size={24} color={t.color} />
                </View>
                <Text style={[styles.tipoLabel, tipo === t.id && { color: t.color, fontWeight: '700' }]}>
                  {t.label}
                </Text>
                {tipo === t.id && (
                  <View style={[styles.checkIcon, { backgroundColor: t.color }]}>
                    <Ionicons name="checkmark" size={12} color={COLORS.white} />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Seleccionar Canchas */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>¿En qué espacios?</Text>
          
          <TouchableOpacity
            style={[styles.canchaOption, todasLasCanchas && styles.canchaOptionSelected]}
            onPress={() => {
              setTodasLasCanchas(true);
              setSelectedCanchas([]);
            }}
          >
            <View style={[styles.radioOuter, todasLasCanchas && styles.radioOuterSelected]}>
              {todasLasCanchas && <View style={styles.radioInner} />}
            </View>
            <Ionicons name="business" size={20} color={todasLasCanchas ? COLORS.primary : COLORS.gray} />
            <Text style={[styles.canchaOptionText, todasLasCanchas && styles.canchaOptionTextSelected]}>
              Todos mis espacios
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.canchaOption, !todasLasCanchas && styles.canchaOptionSelected]}
            onPress={() => setTodasLasCanchas(false)}
          >
            <View style={[styles.radioOuter, !todasLasCanchas && styles.radioOuterSelected]}>
              {!todasLasCanchas && <View style={styles.radioInner} />}
            </View>
            <Ionicons name="checkbox-outline" size={20} color={!todasLasCanchas ? COLORS.primary : COLORS.gray} />
            <Text style={[styles.canchaOptionText, !todasLasCanchas && styles.canchaOptionTextSelected]}>
              Seleccionar espacios específicos
            </Text>
          </TouchableOpacity>

          {!todasLasCanchas && (
            <View style={styles.canchasListContainer}>
              {loadingCanchas ? (
                <ActivityIndicator size="small" color={COLORS.primary} />
              ) : (
                misCanchas.map((cancha) => (
                  <TouchableOpacity
                    key={cancha.id}
                    style={styles.canchaListItem}
                    onPress={() => toggleCancha(cancha.id)}
                    activeOpacity={0.7}
                  >
                    <View style={[
                      styles.canchaCheckbox,
                      selectedCanchas.includes(cancha.id) && styles.canchaCheckboxSelected
                    ]}>
                      {selectedCanchas.includes(cancha.id) && (
                        <Ionicons name="checkmark" size={14} color={COLORS.white} />
                      )}
                    </View>
                    <Text style={[
                      styles.canchaListText,
                      selectedCanchas.includes(cancha.id) && styles.canchaListTextSelected
                    ]}>
                      {cancha.nombre}
                    </Text>
                  </TouchableOpacity>
                ))
              )}
            </View>
          )}
        </View>

        {/* Calendario - Fechas */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Fechas (opcional)</Text>
            {(fechaInicio || fechaFin) && (
              <TouchableOpacity onPress={() => { setFechaInicio(null); setFechaFin(null); }}>
                <Text style={styles.clearText}>Limpiar</Text>
              </TouchableOpacity>
            )}
          </View>
          <Text style={styles.sectionSubtitle}>Indica las fechas del evento, promoción o cierre</Text>
          
          <View style={styles.dateRow}>
            <TouchableOpacity 
              style={[styles.dateButton, fechaInicio && styles.dateButtonActive]}
              onPress={() => openCalendar('inicio')}
            >
              <Ionicons name="calendar-outline" size={20} color={fechaInicio ? COLORS.primary : COLORS.gray} />
              <Text style={[styles.dateButtonText, fechaInicio && styles.dateButtonTextActive]}>
                {fechaInicio ? formatDate(fechaInicio) : 'Fecha inicio'}
              </Text>
            </TouchableOpacity>

            <Ionicons name="arrow-forward" size={20} color={COLORS.gray} />

            <TouchableOpacity 
              style={[styles.dateButton, fechaFin && styles.dateButtonActive]}
              onPress={() => openCalendar('fin')}
              disabled={!fechaInicio}
            >
              <Ionicons name="calendar-outline" size={20} color={fechaFin ? COLORS.primary : COLORS.gray} />
              <Text style={[styles.dateButtonText, fechaFin && styles.dateButtonTextActive]}>
                {fechaFin ? formatDate(fechaFin) : 'Fecha fin'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Título */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Título *</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej: ¡Promoción de fin de semana!"
            placeholderTextColor={COLORS.gray}
            value={titulo}
            onChangeText={setTitulo}
            maxLength={100}
          />
          <Text style={styles.charCount}>{titulo.length}/100</Text>
        </View>

        {/* Mensaje */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Mensaje *</Text>
            <TouchableOpacity onPress={handleGenerarMensaje} style={styles.generateBtn}>
              <Ionicons name="sparkles" size={16} color={COLORS.primary} />
              <Text style={styles.generateBtnText}>Generar</Text>
            </TouchableOpacity>
          </View>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Escribe el contenido de la notificación..."
            placeholderTextColor={COLORS.gray}
            value={mensaje}
            onChangeText={setMensaje}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
            maxLength={500}
          />
          <Text style={styles.charCount}>{mensaje.length}/500</Text>
        </View>

        {/* Preview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Vista Previa</Text>
          <View style={styles.previewCard}>
            <View style={styles.previewHeader}>
              <View style={[styles.previewIconContainer, { backgroundColor: selectedTipo?.color + '20' }]}>
                <Ionicons name={selectedTipo?.icon} size={20} color={selectedTipo?.color} />
              </View>
              <View style={styles.previewContent}>
                <Text style={styles.previewTitle} numberOfLines={1}>
                  {titulo || 'Título de la notificación'}
                </Text>
                <Text style={styles.previewMessage} numberOfLines={3}>
                  {mensaje || 'El mensaje aparecerá aquí...'}
                </Text>
              </View>
            </View>
            <View style={styles.previewFooter}>
              <View style={[styles.previewBadge, { backgroundColor: selectedTipo?.color + '15' }]}>
                <Ionicons name="business-outline" size={12} color={selectedTipo?.color} />
                <Text style={[styles.previewBadgeText, { color: selectedTipo?.color }]} numberOfLines={1}>
                  {canchasSeleccionadasInfo}
                </Text>
              </View>
              {fechaInicio && (
                <View style={styles.previewDateBadge}>
                  <Ionicons name="calendar-outline" size={12} color={COLORS.primary} />
                  <Text style={styles.previewDateText}>
                    {fechaFin ? `${formatDate(fechaInicio)} - ${formatDate(fechaFin)}` : formatDate(fechaInicio)}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Botón Enviar */}
        <TouchableOpacity
          style={[
            styles.sendButton, 
            (!titulo.trim() || !mensaje.trim() || (!todasLasCanchas && selectedCanchas.length === 0)) && styles.sendButtonDisabled
          ]}
          onPress={handleEnviar}
          disabled={loading || !titulo.trim() || !mensaje.trim() || (!todasLasCanchas && selectedCanchas.length === 0)}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <>
              <Ionicons name="send" size={20} color={COLORS.white} />
              <Text style={styles.sendButtonText}>Enviar a Jugadores</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Calendar Modal */}
      <Modal
        visible={showCalendarModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCalendarModal(false)}
      >
        <View style={styles.calendarModalOverlay}>
          <View style={styles.calendarModalContent}>
            <View style={styles.calendarModalHeader}>
              <Text style={styles.calendarModalTitle}>
                {selectingDate === 'inicio' ? 'Fecha de Inicio' : 'Fecha de Fin'}
              </Text>
              <TouchableOpacity onPress={() => setShowCalendarModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.dark} />
              </TouchableOpacity>
            </View>
            <Calendar
              onDayPress={handleSelectDate}
              minDate={getMinDate()}
              markedDates={{
                ...(fechaInicio && {
                  [fechaInicio.toISOString().split('T')[0]]: {
                    selected: selectingDate === 'inicio',
                    selectedColor: COLORS.primary,
                    marked: selectingDate !== 'inicio',
                    dotColor: COLORS.primary
                  }
                }),
                ...(fechaFin && {
                  [fechaFin.toISOString().split('T')[0]]: {
                    selected: selectingDate === 'fin',
                    selectedColor: COLORS.primary,
                    marked: selectingDate !== 'fin',
                    dotColor: COLORS.primary
                  }
                })
              }}
              theme={{
                backgroundColor: COLORS.white,
                calendarBackground: COLORS.white,
                textSectionTitleColor: COLORS.dark,
                selectedDayBackgroundColor: COLORS.primary,
                selectedDayTextColor: COLORS.white,
                todayTextColor: COLORS.primary,
                dayTextColor: COLORS.dark,
                textDisabledColor: '#D1D5DB',
                dotColor: COLORS.primary,
                selectedDotColor: COLORS.white,
                arrowColor: COLORS.primary,
                monthTextColor: COLORS.dark,
                textMonthFontWeight: 'bold',
                textDayFontSize: 16,
                textMonthFontSize: 18,
                textDayHeaderFontSize: 13,
              }}
            />
          </View>
        </View>
      </Modal>

      {/* Modal de Confirmación */}
      <Modal
        visible={showConfirmModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowConfirmModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={[styles.modalIconContainer, { backgroundColor: COLORS.primary + '15' }]}>
              <Ionicons name="send" size={40} color={COLORS.primary} />
            </View>
            <Text style={styles.modalTitle}>Confirmar Envío</Text>
            <Text style={styles.modalMessage}>
              ¿Enviar notificación a todos los jugadores que han reservado en {getCanchasTexto()}?
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowConfirmModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmButton}
                onPress={confirmarEnvio}
              >
                <Ionicons name="send" size={18} color={COLORS.white} />
                <Text style={styles.modalConfirmText}>Enviar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de éxito */}
      <Modal
        visible={showSuccessModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSuccessModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={[styles.modalIconContainer, { backgroundColor: '#10B981' + '15' }]}>
              <Ionicons name="checkmark-circle" size={50} color="#10B981" />
            </View>
            <Text style={styles.modalTitle}>¡Notificación Enviada!</Text>
            <Text style={styles.modalMessage}>
              Se envió la notificación a {resultData?.cantidadEnviada || 0} jugadores
            </Text>
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: '#10B981' }]}
              onPress={() => {
                setShowSuccessModal(false);
                navigation.goBack();
              }}
            >
              <Ionicons name="checkmark" size={20} color={COLORS.white} />
              <Text style={styles.modalButtonText}>Aceptar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal de Error */}
      <Modal
        visible={showErrorModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowErrorModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={[styles.modalIconContainer, { backgroundColor: '#EF4444' + '15' }]}>
              <Ionicons name="alert-circle" size={50} color="#EF4444" />
            </View>
            <Text style={styles.modalTitle}>Error</Text>
            <Text style={styles.modalMessage}>{errorMessage}</Text>
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: '#EF4444' }]}
              onPress={() => setShowErrorModal(false)}
            >
              <Text style={styles.modalButtonText}>Entendido</Text>
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
    backgroundColor: '#F5F5F7',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  backBtn: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.dark,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.dark,
    marginBottom: 12,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: COLORS.gray,
    marginTop: -8,
    marginBottom: 12,
  },
  clearText: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '600',
  },
  tiposGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  tipoCard: {
    width: '48%',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E5E5E5',
    position: 'relative',
  },
  tipoIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  tipoLabel: {
    fontSize: 12,
    color: COLORS.gray,
    textAlign: 'center',
    fontWeight: '500',
  },
  checkIcon: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  canchaOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
    marginBottom: 8,
    gap: 10,
    borderWidth: 1.5,
    borderColor: '#E5E5E5',
  },
  canchaOptionSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '08',
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.gray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioOuterSelected: {
    borderColor: COLORS.primary,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
  },
  canchaOptionText: {
    fontSize: 14,
    color: COLORS.dark,
    flex: 1,
  },
  canchaOptionTextSelected: {
    fontWeight: '600',
    color: COLORS.primary,
  },
  canchasListContainer: {
    marginTop: 8,
    marginLeft: 30,
    backgroundColor: COLORS.white,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    overflow: 'hidden',
  },
  canchaListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    gap: 12,
  },
  canchaCheckbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.white,
  },
  canchaCheckboxSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  canchaListText: {
    fontSize: 14,
    color: COLORS.dark,
    flex: 1,
  },
  canchaListTextSelected: {
    fontWeight: '600',
    color: COLORS.primary,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dateButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.white,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  dateButtonActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '08',
  },
  dateButtonText: {
    fontSize: 13,
    color: COLORS.gray,
    flex: 1,
  },
  dateButtonTextActive: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  input: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: COLORS.dark,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  textArea: {
    minHeight: 120,
    paddingTop: 14,
  },
  charCount: {
    textAlign: 'right',
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 6,
  },
  generateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: COLORS.primary + '15',
    borderRadius: 8,
  },
  generateBtnText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '600',
  },
  previewCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  previewIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewContent: {
    flex: 1,
  },
  previewTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.dark,
    marginBottom: 4,
  },
  previewMessage: {
    fontSize: 13,
    color: COLORS.gray,
    lineHeight: 18,
  },
  previewFooter: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    gap: 8,
  },
  previewBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  previewBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  previewDateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.primary + '15',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  previewDateText: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: '600',
  },
  sendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 16,
    gap: 10,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
  },
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
    padding: 24,
    alignItems: 'center',
    width: '100%',
    maxWidth: 340,
  },
  modalIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.dark,
    marginBottom: 8,
  },
  modalMessage: {
    fontSize: 15,
    color: COLORS.gray,
    textAlign: 'center',
    marginBottom: 24,
  },
  modalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 40,
    paddingVertical: 14,
    borderRadius: 12,
    width: '100%',
  },
  modalButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#F5F5F7',
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray,
  },
  modalConfirmButton: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  modalConfirmText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
  calendarModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  calendarModalContent: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    width: '100%',
    maxWidth: 360,
    overflow: 'hidden',
  },
  calendarModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  calendarModalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.dark,
  },
});
