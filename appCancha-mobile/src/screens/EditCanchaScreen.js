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
  Image,
  Switch,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { COLORS, JUGADORES_POR_DEPORTE } from '../constants';
import api from '../services/api';
import { uploadMultipleImages } from '../services/uploadService';
import { Calendar } from 'react-native-calendars';

const DEPORTES = [
  { key: 'FUTBOL_4', label: 'Fútbol 4' },
  { key: 'FUTBOL_5', label: 'Fútbol 5' },
  { key: 'FUTBOL_6', label: 'Fútbol 6' },
  { key: 'FUTBOL_7', label: 'Fútbol 7' },
  { key: 'FUTBOL_8', label: 'Fútbol 8' },
  { key: 'FUTBOL_9', label: 'Fútbol 9' },
  { key: 'FUTBOL_11', label: 'Fútbol 11' },
  { key: 'FUTSAL', label: 'Futsal' },
  { key: 'PADEL', label: 'Pádel' },
  { key: 'VOLEY', label: 'Vóley' },
  { key: 'VOLEY_PLAYA', label: 'Vóley Playa' },
  { key: 'NEWCOM', label: 'Newcom' },
  { key: 'TENIS_SINGLES', label: 'Tenis Singles' },
  { key: 'TENIS_DOBLES', label: 'Tenis Dobles' },
  { key: 'BASQUET', label: 'Básquet' },
  { key: 'NATACION', label: 'Natación' },
  { key: 'GIMNASIO', label: 'Gimnasio' },
  { key: 'YOGA', label: 'Yoga' },
  { key: 'PILATES', label: 'Pilates' },
  { key: 'OTRO', label: 'Otro' },
];

const AMENITIES = [
  { key: 'techada', label: 'Techada', icon: 'umbrella-outline' },
  { key: 'vestuarios', label: 'Vestuarios', icon: 'shirt-outline' },
  { key: 'estacionamiento', label: 'Estacionamiento', icon: 'car-outline' },
  { key: 'iluminacion', label: 'Iluminación', icon: 'bulb-outline' },
  { key: 'parrilla', label: 'Parrilla', icon: 'flame-outline' },
  { key: 'buffet', label: 'Buffet', icon: 'restaurant-outline' },
  { key: 'duchas', label: 'Duchas', icon: 'water-outline' },
  { key: 'wifi', label: 'WiFi', icon: 'wifi-outline' },
  { key: 'gimnasio', label: 'Gimnasio', icon: 'barbell-outline' },
  { key: 'camaras', label: 'Cámaras', icon: 'videocam-outline' },
  { key: 'tribuna', label: 'Tribuna', icon: 'people-circle-outline' },
  { key: 'gradas', label: 'Gradas', icon: 'albums-outline' },
  { key: 'torneos', label: 'Torneos', icon: 'trophy-outline' },
  { key: 'escuelita', label: 'Escuelita', icon: 'school-outline' },
  { key: 'ayudaMedica', label: 'Ayuda Médica', icon: 'medkit-outline' },
  { key: 'cumpleanos', label: 'Cumpleaños', icon: 'balloon-outline' },
  { key: 'colegios', label: 'Colegios', icon: 'people-outline' },
];

const TIEMPO_CANCELACION = [
  { id: '1', label: '1 hora' },
  { id: '2', label: '2 horas' },
  { id: '3', label: '3 horas' },
  { id: '6', label: '6 horas' },
  { id: '12', label: '12 horas' },
  { id: '24', label: '1 día' },
  { id: '48', label: '2 días' },
  { id: '72', label: '3 días' },
];

const DIAS_SEMANA = [
  { id: 0, label: 'Dom', nombre: 'Domingo' },
  { id: 1, label: 'Lun', nombre: 'Lunes' },
  { id: 2, label: 'Mar', nombre: 'Martes' },
  { id: 3, label: 'Mié', nombre: 'Miércoles' },
  { id: 4, label: 'Jue', nombre: 'Jueves' },
  { id: 5, label: 'Vie', nombre: 'Viernes' },
  { id: 6, label: 'Sáb', nombre: 'Sábado' },
];

const HORAS = [
  '06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00',
  '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00',
  '20:00', '21:00', '22:00', '23:00', '00:00', '01:00', '02:00',
];

const TIPOS_EXCEPCION = [
  { id: 'cerrado', label: 'Cerrado' },
  { id: 'horario_especial', label: 'Horario especial' },
];

export default function EditEspacioScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { espacioId } = route.params;
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedbackModal, setFeedbackModal] = useState({ visible: false, type: '', message: '' });
  
  const [nombre, setNombre] = useState('');
  const [actividad, setActividad] = useState('futbol');
  const [modalidad, setModalidad] = useState('cinco');
  const [direccion, setDireccion] = useState('');
  const [ciudad, setCiudad] = useState('');
  const [provincia, setProvincia] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [precioPorHora, setPrecioPorHora] = useState('');
  const [capacidadParticipantes, setCapacidadParticipantes] = useState('');
  const [superficieTipo, setSuperficieTipo] = useState('');
  const [imagenes, setImagenes] = useState([]);
  const [amenities, setAmenities] = useState({});
  const [activa, setActiva] = useState(true);
  const [customAmenities, setCustomAmenities] = useState([]);
  const [showAddAmenity, setShowAddAmenity] = useState(false);
  const [newAmenityName, setNewAmenityName] = useState('');

  const [horasLimiteCancelacion, setHorasLimiteCancelacion] = useState('24');
  const [diasAbiertos, setDiasAbiertos] = useState([1, 2, 3, 4, 5, 6]);
  const [horaApertura, setHoraApertura] = useState('08:00');
  const [horaCierre, setHoraCierre] = useState('23:00');
  const [serviciosPersonalizados, setServiciosPersonalizados] = useState([]);
  const [nuevoServicio, setNuevoServicio] = useState('');
  const [showAddServicio, setShowAddServicio] = useState(false);

  // Teléfonos de contacto
  const [telefonos, setTelefonos] = useState([]);
  const [showAddTelefono, setShowAddTelefono] = useState(false);
  const [nuevoTelefonoNombre, setNuevoTelefonoNombre] = useState('');
  const [nuevoTelefonoNumero, setNuevoTelefonoNumero] = useState('');
  const [nuevoTelefonoCodigo, setNuevoTelefonoCodigo] = useState('+54');

  // Excepciones de horario (días especiales)
  const [excepciones, setExcepciones] = useState([]);
  const [showAddExcepcion, setShowAddExcepcion] = useState(false);
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [seleccionandoFechaFin, setSeleccionandoFechaFin] = useState(false);
  const [nuevaExcepcionMotivo, setNuevaExcepcionMotivo] = useState('');
  const [nuevaExcepcionTipo, setNuevaExcepcionTipo] = useState('cerrado');
  const [nuevaExcepcionApertura, setNuevaExcepcionApertura] = useState('08:00');
  const [nuevaExcepcionCierre, setNuevaExcepcionCierre] = useState('23:00');

  useEffect(() => {
    loadCancha();
  }, []);

  const loadCancha = async () => {
    try {
      const response = await api.get(`/canchas/${canchaId}`);
      if (response.data.success) {
        const data = response.data.data;
        setNombre(data.nombre || '');
        setDeporte(data.deporte || 'FUTBOL_5');
        setDireccion(data.direccion || '');
        setCiudad(data.ciudad || '');
        setProvincia(data.provincia || '');
        setDescripcion(data.descripcion || '');
        setPrecioPorHora(data.precioPorHora?.toString() || '');
        setCapacidadJugadores(data.capacidadJugadores?.toString() || '');
        setSuperficieTipo(data.superficieTipo || '');
        setImagenes(data.imagenes || []);
        setActiva(data.activa !== false);
        
        const amenitiesObj = {};
        AMENITIES.forEach(a => {
          amenitiesObj[a.key] = data[a.key] || false;
        });
        setAmenities(amenitiesObj);
        
        // Cargar nuevos campos
        setHorasLimiteCancelacion(data.horasLimiteCancelacion?.toString() || '24');
        setServiciosPersonalizados(data.serviciosPersonalizados || []);
        
        // Cargar teléfonos
        if (data.telefonos && Array.isArray(data.telefonos) && data.telefonos.length > 0) {
          setTelefonos(data.telefonos);
        } else if (data.propietario?.telefono) {
          // Si no hay teléfonos guardados, usar el del propietario como principal
          setTelefonos([{ nombre: 'Principal', numero: data.propietario.telefono, codigoPais: '+54', esPrincipal: true }]);
        }
        
        // Cargar horarios
        if (data.horarios && data.horarios.length > 0) {
          const dias = data.horarios.map(h => h.diaSemana);
          setDiasAbiertos(dias);
          setHoraApertura(data.horarios[0]?.horaInicio || '08:00');
          setHoraCierre(data.horarios[0]?.horaFin || '23:00');
        }
        
        // Cargar días especiales
        if (data.diasEspeciales && data.diasEspeciales.length > 0) {
          const excepcionesFormateadas = data.diasEspeciales.map(d => ({
            id: d.id,
            fechaInicio: d.fecha.split('T')[0],
            fechaFin: d.fecha.split('T')[0],
            tipo: d.tipo,
            motivo: d.motivo || '',
            horaApertura: d.horaApertura || '08:00',
            horaCierre: d.horaCierre || '23:00',
          }));
          setExcepciones(excepcionesFormateadas);
        }
      }
    } catch (error) {
      console.error('Error loading espacio:', error);
      Alert.alert('Error', 'No se pudo cargar la información del espacio');
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0].uri) {
      setImagenes([...imagenes, result.assets[0].uri]);
    }
  };

  const removeImage = (index) => {
    setImagenes(imagenes.filter((_, i) => i !== index));
  };

  const toggleAmenity = (key) => {
    setAmenities(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const addCustomAmenity = () => {
    if (newAmenityName.trim()) {
      const customKey = `custom_${Date.now()}`;
      setCustomAmenities([...customAmenities, { 
        key: customKey, 
        label: newAmenityName.trim(),
        icon: 'star-outline'
      }]);
      setAmenities(prev => ({
        ...prev,
        [customKey]: true
      }));
      setNewAmenityName('');
      setShowAddAmenity(false);
    }
  };

  const removeCustomAmenity = (key) => {
    setCustomAmenities(customAmenities.filter(a => a.key !== key));
    const newAmenities = { ...amenities };
    delete newAmenities[key];
    setAmenities(newAmenities);
  };

  // Funciones para excepciones de horario
  const formatearFechaDisplay = (dateString) => {
    const [anio, mes, dia] = dateString.split('-');
    return `${dia}/${mes}/${anio}`;
  };

  const getTodayString = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  // Manejar selección de fecha del calendario (rango)
  const onSelectDate = (day) => {
    if (!fechaInicio || (fechaInicio && fechaFin)) {
      setFechaInicio(day.dateString);
      setFechaFin('');
      setSeleccionandoFechaFin(true);
    } else {
      if (day.dateString < fechaInicio) {
        setFechaFin(fechaInicio);
        setFechaInicio(day.dateString);
      } else {
        setFechaFin(day.dateString);
      }
      setSeleccionandoFechaFin(false);
      setShowDatePicker(false);
    }
  };

  // Generar marcas para el calendario (rango)
  const getMarkedDates = () => {
    const marks = {};
    if (fechaInicio) {
      marks[fechaInicio] = { selected: true, startingDay: true, color: COLORS.primary, textColor: COLORS.white };
    }
    if (fechaFin) {
      marks[fechaFin] = { selected: true, endingDay: true, color: COLORS.primary, textColor: COLORS.white };
      if (fechaInicio && fechaFin) {
        let current = new Date(fechaInicio);
        const end = new Date(fechaFin);
        current.setDate(current.getDate() + 1);
        while (current < end) {
          const dateStr = current.toISOString().split('T')[0];
          marks[dateStr] = { selected: true, color: COLORS.primary + '40', textColor: COLORS.dark };
          current.setDate(current.getDate() + 1);
        }
      }
    }
    return marks;
  };

  // Formatear rango de fechas para mostrar
  const formatearRangoFechas = () => {
    if (!fechaInicio) return 'Seleccionar fechas';
    if (!fechaFin || fechaInicio === fechaFin) return formatearFechaDisplay(fechaInicio);
    return `${formatearFechaDisplay(fechaInicio)} - ${formatearFechaDisplay(fechaFin)}`;
  };

  const agregarExcepcion = () => {
    if (!fechaInicio) {
      Alert.alert('Error', 'Selecciona al menos una fecha para el día especial');
      return;
    }
    if (!nuevaExcepcionMotivo.trim()) {
      Alert.alert('Error', 'Ingresa un motivo para la excepción');
      return;
    }
    
    const nuevaExcepcion = {
      fechaInicio: formatearFechaDisplay(fechaInicio),
      fechaFin: fechaFin ? formatearFechaDisplay(fechaFin) : formatearFechaDisplay(fechaInicio),
      motivo: nuevaExcepcionMotivo.trim(),
      tipo: nuevaExcepcionTipo,
      horaApertura: nuevaExcepcionTipo === 'horario_especial' ? nuevaExcepcionApertura : null,
      horaCierre: nuevaExcepcionTipo === 'horario_especial' ? nuevaExcepcionCierre : null,
    };
    
    setExcepciones((prev) => [...prev, nuevaExcepcion]);
    setFechaInicio('');
    setFechaFin('');
    setSeleccionandoFechaFin(false);
    setNuevaExcepcionMotivo('');
    setNuevaExcepcionTipo('cerrado');
    setNuevaExcepcionApertura('08:00');
    setNuevaExcepcionCierre('23:00');
    setShowAddExcepcion(false);
  };

  const eliminarExcepcion = (index) => {
    setExcepciones((prev) => prev.filter((_, i) => i !== index));
  };

  // Funciones para teléfonos
  const actualizarTelefono = (index, campo, valor) => {
    setTelefonos((prev) => {
      const nuevos = [...prev];
      nuevos[index] = { ...nuevos[index], [campo]: valor };
      return nuevos;
    });
  };

  const agregarTelefono = () => {
    if (nuevoTelefonoNombre.trim() && nuevoTelefonoNumero.trim()) {
      setTelefonos((prev) => [
        ...prev,
        { nombre: nuevoTelefonoNombre.trim(), numero: nuevoTelefonoNumero.trim(), codigoPais: nuevoTelefonoCodigo, esPrincipal: prev.length === 0 }
      ]);
      setNuevoTelefonoNombre('');
      setNuevoTelefonoNumero('');
      setNuevoTelefonoCodigo('+54');
      setShowAddTelefono(false);
    }
  };

  const eliminarTelefono = (index) => {
    if (telefonos.length <= 1) {
      Alert.alert('Atención', 'Debes tener al menos un teléfono de contacto');
      return;
    }
    const telefonoEliminado = telefonos[index];
    const nuevosTelefonos = telefonos.filter((_, i) => i !== index);
    
    if (telefonoEliminado.esPrincipal && nuevosTelefonos.length > 0) {
      nuevosTelefonos[0].esPrincipal = true;
    }
    
    setTelefonos(nuevosTelefonos);
  };

  const guardarCambios = async () => {
    if (!nombre || !direccion || !ciudad || !precioPorHora || !capacidadParticipantes) {
      Alert.alert('Error', 'Completa todos los campos requeridos');
      return;
    }

    setSaving(true);
    try {
      // Subir imágenes nuevas a Cloudinary (las que no son http)
      const imagenesUrls = await uploadMultipleImages(imagenes, 'espacios');
      
      // Formatear días especiales para el backend
      const diasEspecialesPayload = excepciones.map(exc => ({
        id: exc.id || undefined,
        fecha: exc.fechaInicio.includes('/') 
          ? exc.fechaInicio.split('/').reverse().join('-') 
          : exc.fechaInicio,
        tipo: exc.tipo,
        motivo: exc.motivo,
        horaApertura: exc.tipo === 'horario_especial' ? exc.horaApertura : null,
        horaCierre: exc.tipo === 'horario_especial' ? exc.horaCierre : null,
      }));

      const payload = {
        nombre,
        actividad,
        direccion,
        ciudad,
        provincia,
        descripcion,
        precioPorHora: parseFloat(precioPorHora),
        capacidadParticipantes: parseInt(capacidadParticipantes),
        superficieTipo,
        imagenes: imagenesUrls,
        activa,
        horasLimiteCancelacion: parseInt(horasLimiteCancelacion),
        diasEspeciales: diasEspecialesPayload,
        serviciosPersonalizados,
        telefonos,
        ...amenities,
      };

      const response = await api.put(`/espacios/${espacioId}`, payload);
      
      if (response.data.success) {
        setFeedbackModal({ visible: true, type: 'success', message: '¡Espacio actualizado correctamente!' });
      } else {
        setFeedbackModal({ visible: true, type: 'error', message: response.data.message || 'No se pudieron guardar los cambios' });
      }
    } catch (error) {
      console.error('Error saving espacio:', error);
      const errorMessage = error.response?.data?.message || 'No se pudieron guardar los cambios';
      setFeedbackModal({ visible: true, type: 'error', message: errorMessage });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Cargando información...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.dark} />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Editar Espacio</Text>
            <Text style={styles.headerSubtitle}>{nombre}</Text>
          </View>
        </View>

        <ScrollView 
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Estado del espacio */}
          <View style={styles.statusBanner}>
            <View style={styles.statusInfo}>
              <Ionicons 
                name={activa ? 'checkmark-circle' : 'close-circle'} 
                size={24} 
                color={activa ? '#4CAF50' : '#FF6B6B'} 
              />
              <Text style={styles.statusText}>
                Espacio {activa ? 'Activo' : 'Inactivo'}
              </Text>
            </View>
            <Switch
              value={activa}
              onValueChange={setActiva}
              thumbColor={activa ? COLORS.white : '#f4f3f4'}
              trackColor={{ false: '#ccc', true: COLORS.primary }}
            />
          </View>

          {/* Fotos */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="images" size={20} color={COLORS.primary} />
              <Text style={styles.sectionTitle}>Fotos del Espacio</Text>
            </View>
            
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.imagesScroll}
            >
              {imagenes.map((uri, index) => (
                <View key={index} style={styles.imageCard}>
                  <Image source={{ uri }} style={styles.imagePreview} />
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={() => removeImage(index)}
                  >
                    <Ionicons name="close-circle" size={28} color={COLORS.white} />
                  </TouchableOpacity>
                </View>
              ))}
              
              {imagenes.length < 5 && (
                <TouchableOpacity
                  style={styles.addImageCard}
                  onPress={pickImage}
                  activeOpacity={0.7}
                >
                  <Ionicons name="camera" size={32} color={COLORS.primary} />
                  <Text style={styles.addImageText}>{imagenes.length}/5</Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          </View>

          {/* Información básica */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="information-circle" size={20} color={COLORS.primary} />
              <Text style={styles.sectionTitle}>Información Básica</Text>
            </View>
            
            <View style={styles.inputContainer}>
              <Ionicons name="business-outline" size={20} color={COLORS.primary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Nombre del espacio *"
                value={nombre}
                onChangeText={setNombre}
                placeholderTextColor={COLORS.gray}
              />
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="document-text-outline" size={20} color={COLORS.primary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Descripción"
                value={descripcion}
                onChangeText={setDescripcion}
                multiline
                numberOfLines={3}
                placeholderTextColor={COLORS.gray}
              />
            </View>
          </View>

          {/* Deporte */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="football" size={20} color={COLORS.primary} />
              <Text style={styles.sectionTitle}>Actividad</Text>
            </View>
            
            <View style={styles.deportesGrid}>
              {DEPORTES.map(d => (
                <TouchableOpacity
                  key={d.key}
                  style={[
                    styles.deporteChip,
                    deporte === d.key && styles.deporteChipActive,
                  ]}
                  onPress={() => {
                    setDeporte(d.key);
                    // Auto-completar capacidad al cambiar deporte
                    if (JUGADORES_POR_DEPORTE[d.key]) {
                      setCapacidadJugadores(JUGADORES_POR_DEPORTE[d.key].toString());
                    }
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.deporteChipText,
                    deporte === d.key && styles.deporteChipTextActive,
                  ]}>
                    {d.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Ubicación */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="location" size={20} color={COLORS.primary} />
              <Text style={styles.sectionTitle}>Ubicación</Text>
            </View>
            
            <View style={styles.inputContainer}>
              <Ionicons name="home-outline" size={20} color={COLORS.primary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Dirección *"
                value={direccion}
                onChangeText={setDireccion}
                placeholderTextColor={COLORS.gray}
              />
            </View>

            <View style={styles.rowInputs}>
              <View style={[styles.inputContainer, styles.halfInput]}>
                <Ionicons name="business-outline" size={20} color={COLORS.primary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Ciudad *"
                  value={ciudad}
                  onChangeText={setCiudad}
                  placeholderTextColor={COLORS.gray}
                />
              </View>

              <View style={[styles.inputContainer, styles.halfInput]}>
                <Ionicons name="map-outline" size={20} color={COLORS.primary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Provincia"
                  value={provincia}
                  onChangeText={setProvincia}
                  placeholderTextColor={COLORS.gray}
                />
              </View>
            </View>
          </View>

          {/* Teléfonos de Contacto */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="call" size={20} color={COLORS.primary} />
              <Text style={styles.sectionTitle}>Teléfonos de Contacto</Text>
            </View>
            
            {telefonos.map((tel, index) => (
              <View key={index} style={styles.telefonoCard}>
                <View style={styles.telefonoHeader}>
                  <View style={styles.telefonoInfo}>
                    {tel.esPrincipal ? (
                      <View style={styles.principalBadge}>
                        <Ionicons name="star" size={12} color={COLORS.white} />
                        <Text style={styles.principalBadgeText}>{tel.nombre}</Text>
                      </View>
                    ) : (
                      <Text style={styles.telefonoNombre}>{tel.nombre}</Text>
                    )}
                  </View>
                  <TouchableOpacity onPress={() => eliminarTelefono(index)}>
                    <Ionicons name="close-circle" size={22} color="#FF4444" />
                  </TouchableOpacity>
                </View>
                <View style={styles.telefonoInputRow}>
                  <Text style={styles.telefonoCodigoLabel}>{tel.codigoPais || '+54'}</Text>
                  <TextInput
                    style={styles.telefonoInput}
                    placeholder="Número de teléfono"
                    value={tel.numero}
                    onChangeText={(v) => actualizarTelefono(index, 'numero', v)}
                    keyboardType="phone-pad"
                    placeholderTextColor={COLORS.gray}
                  />
                </View>
              </View>
            ))}

            {showAddTelefono ? (
              <View style={styles.addTelefonoForm}>
                <TextInput
                  style={styles.addTelefonoInput}
                  placeholder="Nombre (ej: WhatsApp, Emergencias)"
                  placeholderTextColor={COLORS.gray}
                  value={nuevoTelefonoNombre}
                  onChangeText={setNuevoTelefonoNombre}
                />
                <View style={styles.telefonoInputRow}>
                  <Text style={styles.telefonoCodigoLabel}>{nuevoTelefonoCodigo}</Text>
                  <TextInput
                    style={styles.telefonoInput}
                    placeholder="Número de teléfono"
                    placeholderTextColor={COLORS.gray}
                    value={nuevoTelefonoNumero}
                    onChangeText={setNuevoTelefonoNumero}
                    keyboardType="phone-pad"
                  />
                </View>
                <View style={styles.addTelefonoButtons}>
                  <TouchableOpacity 
                    style={styles.addTelefonoCancelBtn} 
                    onPress={() => {
                      setShowAddTelefono(false);
                      setNuevoTelefonoNombre('');
                      setNuevoTelefonoNumero('');
                    }}
                  >
                    <Text style={styles.addTelefonoCancelText}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.addTelefonoConfirmBtn} 
                    onPress={agregarTelefono}
                  >
                    <Text style={styles.addTelefonoConfirmText}>Agregar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity 
                style={styles.addTelefonoButton} 
                onPress={() => setShowAddTelefono(true)}
              >
                <Ionicons name="add-circle-outline" size={20} color={COLORS.primary} />
                <Text style={styles.addTelefonoText}>Agregar teléfono</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Detalles */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="settings" size={20} color={COLORS.primary} />
              <Text style={styles.sectionTitle}>Detalles</Text>
            </View>
            
            <View style={styles.rowInputs}>
              <View style={[styles.inputContainer, styles.halfInput]}>
                <Ionicons name="people-outline" size={20} color={COLORS.primary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Capacidad *"
                  value={capacidadJugadores}
                  onChangeText={setCapacidadJugadores}
                  keyboardType="numeric"
                  placeholderTextColor={COLORS.gray}
                />
              </View>

              <View style={[styles.inputContainer, styles.halfInput]}>
                <Ionicons name="cash-outline" size={20} color={COLORS.primary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="$ / Hora *"
                  value={precioPorHora}
                  onChangeText={setPrecioPorHora}
                  keyboardType="numeric"
                  placeholderTextColor={COLORS.gray}
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="layers-outline" size={20} color={COLORS.primary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Tipo de superficie"
                value={superficieTipo}
                onChangeText={setSuperficieTipo}
                placeholderTextColor={COLORS.gray}
              />
            </View>
          </View>

          {/* Servicios */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />
              <Text style={styles.sectionTitle}>Servicios</Text>
            </View>
            
            <View style={styles.amenitiesGrid}>
              {AMENITIES.map(a => (
                <View key={a.key} style={styles.amenityCard}>
                  <View style={styles.amenityContent}>
                    <Ionicons name={a.icon} size={20} color={amenities[a.key] ? COLORS.primary : COLORS.gray} />
                    <Text style={[
                      styles.amenityLabel,
                      amenities[a.key] && styles.amenityLabelActive
                    ]}>
                      {a.label}
                    </Text>
                  </View>
                  <Switch
                    value={amenities[a.key]}
                    onValueChange={() => toggleAmenity(a.key)}
                    thumbColor={amenities[a.key] ? COLORS.white : '#f4f3f4'}
                    trackColor={{ false: '#ccc', true: COLORS.primary }}
                  />
                </View>
              ))}

              {/* Servicios personalizados */}
              {customAmenities.map(a => (
                <View key={a.key} style={styles.amenityCard}>
                  <View style={styles.amenityContent}>
                    <Ionicons name={a.icon} size={20} color={amenities[a.key] ? COLORS.primary : COLORS.gray} />
                    <Text style={[
                      styles.amenityLabel,
                      amenities[a.key] && styles.amenityLabelActive
                    ]}>
                      {a.label}
                    </Text>
                  </View>
                  <View style={styles.customAmenityActions}>
                    <Switch
                      value={amenities[a.key]}
                      onValueChange={() => toggleAmenity(a.key)}
                      thumbColor={amenities[a.key] ? COLORS.white : '#f4f3f4'}
                      trackColor={{ false: '#ccc', true: COLORS.primary }}
                    />
                    <TouchableOpacity 
                      onPress={() => removeCustomAmenity(a.key)}
                      style={styles.removeAmenityButton}
                    >
                      <Ionicons name="trash-outline" size={18} color="#FF6B6B" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>

            {/* Botón agregar servicio */}
            {!showAddAmenity ? (
              <TouchableOpacity 
                style={styles.addAmenityButton}
                onPress={() => setShowAddAmenity(true)}
                activeOpacity={0.7}
              >
                <Ionicons name="add-circle-outline" size={20} color={COLORS.primary} />
                <Text style={styles.addAmenityText}>Agregar servicio personalizado</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.addAmenityForm}>
                <View style={styles.addAmenityInputContainer}>
                  <Ionicons name="star-outline" size={20} color={COLORS.primary} style={styles.inputIcon} />
                  <TextInput
                    style={styles.addAmenityInput}
                    placeholder="Nombre del servicio"
                    value={newAmenityName}
                    onChangeText={setNewAmenityName}
                    placeholderTextColor={COLORS.gray}
                    autoFocus
                  />
                </View>
                <View style={styles.addAmenityButtons}>
                  <TouchableOpacity 
                    style={styles.addAmenityCancelButton}
                    onPress={() => {
                      setShowAddAmenity(false);
                      setNewAmenityName('');
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.addAmenityCancelText}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[
                      styles.addAmenityConfirmButton,
                      !newAmenityName.trim() && styles.addAmenityConfirmButtonDisabled
                    ]}
                    onPress={addCustomAmenity}
                    disabled={!newAmenityName.trim()}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="checkmark" size={18} color={COLORS.white} />
                    <Text style={styles.addAmenityConfirmText}>Agregar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>

          {/* Horarios */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="time" size={20} color={COLORS.primary} />
              <Text style={styles.sectionTitle}>Horarios de Apertura</Text>
            </View>

            <Text style={styles.subsectionLabel}>Días abiertos</Text>
            <View style={styles.diasGrid}>
              {DIAS_SEMANA.map(dia => {
                const isSelected = diasAbiertos.includes(dia.id);
                return (
                  <TouchableOpacity
                    key={dia.id}
                    style={[styles.diaChip, isSelected && styles.diaChipActive]}
                    onPress={() => {
                      if (isSelected) {
                        setDiasAbiertos(diasAbiertos.filter(d => d !== dia.id));
                      } else {
                        setDiasAbiertos([...diasAbiertos, dia.id].sort());
                      }
                    }}
                  >
                    <Text style={[styles.diaChipText, isSelected && styles.diaChipTextActive]}>
                      {dia.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.horariosRow}>
              <View style={styles.horarioColumn}>
                <Text style={styles.subsectionLabel}>Apertura</Text>
                <View style={styles.scrollWithIndicator}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={styles.horasGrid}>
                      {HORAS.slice(0, 12).map(hora => (
                        <TouchableOpacity
                          key={hora}
                          style={[styles.horaChip, horaApertura === hora && styles.horaChipActive]}
                          onPress={() => setHoraApertura(hora)}
                        >
                          <Text style={[styles.horaChipText, horaApertura === hora && styles.horaChipTextActive]}>
                            {hora}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>
                  <View style={styles.scrollIndicator}>
                    <Ionicons name="chevron-forward" size={16} color={COLORS.primary} />
                  </View>
                </View>
              </View>

              <View style={styles.horarioColumn}>
                <Text style={styles.subsectionLabel}>Cierre</Text>
                <View style={styles.scrollWithIndicator}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={styles.horasGrid}>
                      {HORAS.slice(6).map(hora => (
                        <TouchableOpacity
                          key={hora}
                          style={[styles.horaChip, horaCierre === hora && styles.horaChipActive]}
                          onPress={() => setHoraCierre(hora)}
                        >
                          <Text style={[styles.horaChipText, horaCierre === hora && styles.horaChipTextActive]}>
                            {hora}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>
                  <View style={styles.scrollIndicator}>
                    <Ionicons name="chevron-forward" size={16} color={COLORS.primary} />
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* Días especiales / Excepciones */}
          <View style={styles.section}>
            <View style={styles.excepcionesHeader}>
              <View style={styles.excepcionesHeaderLeft}>
                <Ionicons name="calendar-outline" size={18} color={COLORS.primary} />
                <Text style={styles.sectionTitle}>Días Especiales</Text>
              </View>
              <TouchableOpacity 
                style={styles.addExcepcionButton}
                onPress={() => setShowAddExcepcion(!showAddExcepcion)}
              >
                <Ionicons name={showAddExcepcion ? "close" : "add"} size={18} color={COLORS.primary} />
              </TouchableOpacity>
            </View>
            <Text style={styles.excepcionesSubtitle}>
              Vacaciones, feriados o eventos especiales
            </Text>

            {showAddExcepcion && (
              <View style={styles.addExcepcionForm}>
                <View>
                  <Text style={styles.rangoFechasLabel}>
                    {seleccionandoFechaFin ? 'Selecciona la fecha de fin' : 'Selecciona fecha o rango de fechas'}
                  </Text>
                  <TouchableOpacity 
                    style={[styles.datePickerButton, fechaInicio && styles.datePickerButtonSelected]}
                    onPress={() => setShowDatePicker(!showDatePicker)}
                  >
                    <Ionicons name="calendar" size={20} color={COLORS.primary} />
                    <Text style={[styles.datePickerText, fechaInicio && styles.datePickerTextSelected]}>
                      {formatearRangoFechas()}
                    </Text>
                    <Ionicons name={showDatePicker ? "chevron-up" : "chevron-down"} size={18} color={COLORS.primary} />
                  </TouchableOpacity>
                </View>

                {showDatePicker && (
                  <View style={styles.calendarContainer}>
                    <Calendar
                      onDayPress={onSelectDate}
                      markedDates={getMarkedDates()}
                      markingType={'period'}
                      minDate={getTodayString()}
                      theme={{
                        backgroundColor: COLORS.white,
                        calendarBackground: COLORS.white,
                        textSectionTitleColor: COLORS.gray,
                        selectedDayBackgroundColor: COLORS.primary,
                        selectedDayTextColor: COLORS.white,
                        todayTextColor: COLORS.primary,
                        dayTextColor: COLORS.dark,
                        textDisabledColor: '#D9D9D9',
                        arrowColor: COLORS.primary,
                        monthTextColor: COLORS.dark,
                        textDayFontWeight: '500',
                        textMonthFontWeight: '700',
                        textDayHeaderFontWeight: '600',
                        textDayFontSize: 15,
                        textMonthFontSize: 16,
                        textDayHeaderFontSize: 13,
                      }}
                      style={styles.calendar}
                    />
                    {seleccionandoFechaFin && (
                      <TouchableOpacity 
                        style={styles.usarUnDiaBtn}
                        onPress={() => {
                          setFechaFin(fechaInicio);
                          setSeleccionandoFechaFin(false);
                          setShowDatePicker(false);
                        }}
                      >
                        <Text style={styles.usarUnDiaText}>Usar solo este día</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}

                <View style={styles.inputContainer}>
                  <Ionicons name="text-outline" size={18} color={COLORS.primary} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Motivo (ej: Navidad, Vacaciones)"
                    placeholderTextColor={COLORS.gray}
                    value={nuevaExcepcionMotivo}
                    onChangeText={setNuevaExcepcionMotivo}
                  />
                </View>

                <View style={styles.excepcionTipoContainer}>
                  {TIPOS_EXCEPCION.map((tipo) => (
                    <TouchableOpacity
                      key={tipo.id}
                      style={[styles.excepcionTipoChip, nuevaExcepcionTipo === tipo.id && styles.excepcionTipoChipSelected]}
                      onPress={() => setNuevaExcepcionTipo(tipo.id)}
                    >
                      <Ionicons 
                        name={tipo.id === 'cerrado' ? 'close-circle-outline' : 'time-outline'} 
                        size={16} 
                        color={nuevaExcepcionTipo === tipo.id ? COLORS.white : COLORS.primary} 
                      />
                      <Text style={[styles.excepcionTipoText, nuevaExcepcionTipo === tipo.id && styles.excepcionTipoTextSelected]}>
                        {tipo.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {nuevaExcepcionTipo === 'horario_especial' && (
                  <View style={styles.excepcionHorariosRow}>
                    <View style={styles.excepcionHorarioField}>
                      <Text style={styles.subsectionLabel}>Apertura</Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        <View style={styles.horasGrid}>
                          {HORAS.slice(0, 12).map((hora) => (
                            <TouchableOpacity
                              key={hora}
                              style={[styles.horaChip, nuevaExcepcionApertura === hora && styles.horaChipActive]}
                              onPress={() => setNuevaExcepcionApertura(hora)}
                            >
                              <Text style={[styles.horaChipText, nuevaExcepcionApertura === hora && styles.horaChipTextActive]}>
                                {hora}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </ScrollView>
                    </View>
                    <View style={styles.excepcionHorarioField}>
                      <Text style={styles.subsectionLabel}>Cierre</Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        <View style={styles.horasGrid}>
                          {HORAS.slice(6).map((hora) => (
                            <TouchableOpacity
                              key={hora}
                              style={[styles.horaChip, nuevaExcepcionCierre === hora && styles.horaChipActive]}
                              onPress={() => setNuevaExcepcionCierre(hora)}
                            >
                              <Text style={[styles.horaChipText, nuevaExcepcionCierre === hora && styles.horaChipTextActive]}>
                                {hora}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </ScrollView>
                    </View>
                  </View>
                )}

                <TouchableOpacity style={styles.addExcepcionConfirmBtn} onPress={agregarExcepcion}>
                  <Ionicons name="checkmark" size={18} color={COLORS.white} />
                  <Text style={styles.addExcepcionConfirmText}>Agregar</Text>
                </TouchableOpacity>
              </View>
            )}

            {excepciones.length > 0 && (
              <View style={styles.excepcionesList}>
                {excepciones.map((exc, index) => (
                  <View key={index} style={styles.excepcionItem}>
                    <View style={styles.excepcionItemLeft}>
                      <View style={[styles.excepcionBadge, exc.tipo === 'cerrado' ? styles.excepcionBadgeCerrado : styles.excepcionBadgeEspecial]}>
                        <Ionicons name={exc.tipo === 'cerrado' ? 'close-circle' : 'time'} size={14} color={COLORS.white} />
                      </View>
                      <View>
                        <View style={styles.excepcionFechaRow}>
                          <Text style={styles.excepcionFecha}>
                          {exc.fechaInicio === exc.fechaFin ? exc.fechaInicio : `${exc.fechaInicio} - ${exc.fechaFin}`}
                        </Text>
                          <View style={[styles.excepcionTipoBadge, exc.tipo === 'cerrado' ? styles.excepcionTipoBadgeCerrado : styles.excepcionTipoBadgeEspecial]}>
                            <Text style={styles.excepcionTipoBadgeText}>
                              {exc.tipo === 'cerrado' ? 'Cerrado' : 'Horario especial'}
                            </Text>
                          </View>
                        </View>
                        <Text style={styles.excepcionMotivo}>{exc.motivo}</Text>
                        {exc.tipo === 'horario_especial' && (
                          <Text style={styles.excepcionHorario}>{exc.horaApertura} - {exc.horaCierre}</Text>
                        )}
                      </View>
                    </View>
                    <TouchableOpacity onPress={() => eliminarExcepcion(index)}>
                      <Ionicons name="trash-outline" size={20} color="#FF6B6B" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Tiempo de Cancelación */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="calendar" size={20} color={COLORS.primary} />
              <Text style={styles.sectionTitle}>Tiempo de Cancelación</Text>
            </View>
            <Text style={styles.helperText}>
              Tiempo mínimo antes del partido para cancelar sin penalidad
            </Text>
            <View style={styles.scrollWithIndicator}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.cancelacionGrid}>
                  {TIEMPO_CANCELACION.map(tiempo => (
                    <TouchableOpacity
                      key={tiempo.id}
                      style={[
                        styles.cancelacionChip,
                        horasLimiteCancelacion === tiempo.id && styles.cancelacionChipActive
                      ]}
                      onPress={() => setHorasLimiteCancelacion(tiempo.id)}
                    >
                      <Text style={[
                        styles.cancelacionChipText,
                        horasLimiteCancelacion === tiempo.id && styles.cancelacionChipTextActive
                      ]}>
                        {tiempo.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
              <View style={styles.scrollIndicator}>
                <Ionicons name="chevron-forward" size={16} color={COLORS.primary} />
              </View>
            </View>
          </View>

        </ScrollView>

        {/* Botones fijos en la parte inferior */}
        <View style={[styles.fixedButtonsContainer, { paddingBottom: insets.bottom + 16 }]}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={guardarCambios}
            disabled={saving}
            activeOpacity={0.8}
          >
            {saving ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={20} color={COLORS.white} />
                <Text style={styles.saveButtonText}>Guardar</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Modal de Feedback */}
      <Modal
        visible={feedbackModal.visible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setFeedbackModal({ ...feedbackModal, visible: false });
          if (feedbackModal.type === 'success') navigation.goBack();
        }}
      >
        <View style={styles.feedbackModalOverlay}>
          <View style={styles.feedbackModalContainer}>
            <View style={[
              styles.feedbackIconCircle,
              { backgroundColor: feedbackModal.type === 'success' ? COLORS.primary + '20' : '#FFE5E5' }
            ]}>
              <Ionicons 
                name={feedbackModal.type === 'success' ? 'checkmark-circle' : 'close-circle'} 
                size={50} 
                color={feedbackModal.type === 'success' ? COLORS.primary : '#FF4444'} 
              />
            </View>
            <Text style={styles.feedbackTitle}>
              {feedbackModal.type === 'success' ? '¡Listo!' : 'Error'}
            </Text>
            <Text style={styles.feedbackMessage}>{feedbackModal.message}</Text>
            <TouchableOpacity
              style={[
                styles.feedbackButton,
                { backgroundColor: feedbackModal.type === 'success' ? COLORS.primary : '#FF4444' }
              ]}
              onPress={() => {
                setFeedbackModal({ ...feedbackModal, visible: false });
                if (feedbackModal.type === 'success') navigation.goBack();
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.feedbackButtonText}>
                {feedbackModal.type === 'success' ? 'Continuar' : 'Entendido'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 15,
    color: COLORS.gray,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    gap: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.dark,
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 13,
    color: COLORS.gray,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    padding: 16,
    marginBottom: 2,
  },
  statusInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statusText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.dark,
  },
  section: {
    backgroundColor: COLORS.white,
    padding: 20,
    marginBottom: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.dark,
  },
  imagesScroll: {
    gap: 12,
    paddingRight: 20,
  },
  imageCard: {
    position: 'relative',
    width: 200,
    height: 140,
    borderRadius: 16,
    overflow: 'hidden',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  addImageCard: {
    width: 200,
    height: 140,
    borderRadius: 16,
    backgroundColor: '#F5F5F5',
    borderWidth: 2,
    borderColor: COLORS.primary + '30',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  addImageText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 14,
    marginBottom: 10,
    minHeight: 52,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: COLORS.dark,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
    paddingTop: 4,
  },
  rowInputs: {
    flexDirection: 'row',
    gap: 10,
  },
  halfInput: {
    flex: 1,
  },
  deportesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  deporteChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  deporteChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  deporteChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.gray,
  },
  deporteChipTextActive: {
    color: COLORS.white,
  },
  amenitiesGrid: {
    gap: 10,
  },
  amenityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F5F5F5',
    padding: 14,
    borderRadius: 12,
  },
  amenityContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  amenityLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.gray,
  },
  amenityLabelActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  customAmenityActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  removeAmenityButton: {
    padding: 4,
  },
  addAmenityButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary + '15',
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 12,
    gap: 6,
  },
  addAmenityText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
  },
  addAmenityForm: {
    marginTop: 12,
    gap: 10,
  },
  addAmenityInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 14,
    minHeight: 52,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  addAmenityInput: {
    flex: 1,
    fontSize: 15,
    color: COLORS.dark,
  },
  addAmenityButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  addAmenityCancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    alignItems: 'center',
    backgroundColor: COLORS.white,
  },
  addAmenityCancelText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.gray,
  },
  addAmenityConfirmButton: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  addAmenityConfirmButtonDisabled: {
    opacity: 0.5,
  },
  addAmenityConfirmText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.white,
  },
  fixedButtonsContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 16,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 8,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    alignItems: 'center',
    backgroundColor: COLORS.white,
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.gray,
  },
  saveButton: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.white,
  },
  // Estilos para Horarios
  subsectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.gray,
    marginBottom: 10,
    marginTop: 4,
  },
  diasGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  diaChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#F5F5F5',
    minWidth: 44,
    alignItems: 'center',
  },
  diaChipActive: {
    backgroundColor: COLORS.primary,
  },
  diaChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.gray,
  },
  diaChipTextActive: {
    color: COLORS.white,
  },
  horariosRow: {
    gap: 16,
  },
  horarioColumn: {
    marginBottom: 8,
  },
  scrollWithIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scrollIndicator: {
    paddingLeft: 8,
  },
  horasGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  horaChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#F5F5F5',
  },
  horaChipActive: {
    backgroundColor: COLORS.primary,
  },
  horaChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.gray,
  },
  horaChipTextActive: {
    color: COLORS.white,
  },
  // Estilos para Cancelación
  helperText: {
    fontSize: 13,
    color: COLORS.gray,
    marginBottom: 12,
    lineHeight: 18,
  },
  cancelacionGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  cancelacionChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
  },
  cancelacionChipActive: {
    backgroundColor: COLORS.primary,
  },
  cancelacionChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.gray,
  },
  cancelacionChipTextActive: {
    color: COLORS.white,
  },
  // Estilos para Servicios Personalizados
  serviciosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  servicioChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary + '15',
    paddingVertical: 8,
    paddingLeft: 14,
    paddingRight: 8,
    borderRadius: 20,
    gap: 8,
  },
  servicioText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.dark,
  },
  // Estilos para Días Especiales / Excepciones
  excepcionesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  excepcionesHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  excepcionesSubtitle: {
    fontSize: 13,
    color: COLORS.gray,
    marginBottom: 16,
  },
  addExcepcionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addExcepcionForm: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    gap: 12,
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 10,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    gap: 10,
  },
  datePickerButtonSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '08',
  },
  datePickerText: {
    flex: 1,
    fontSize: 15,
    color: COLORS.gray,
  },
  datePickerTextSelected: {
    color: COLORS.dark,
    fontWeight: '600',
  },
  calendarContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  calendar: {
    borderRadius: 12,
  },
  excepcionTipoContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  excepcionTipoChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: COLORS.primary + '40',
    gap: 6,
  },
  excepcionTipoChipSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  excepcionTipoText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  excepcionTipoTextSelected: {
    color: COLORS.white,
  },
  excepcionHorariosRow: {
    gap: 12,
  },
  excepcionHorarioField: {
    marginBottom: 8,
  },
  addExcepcionConfirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 10,
    gap: 6,
  },
  addExcepcionConfirmText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.white,
  },
  excepcionesList: {
    gap: 10,
  },
  excepcionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8F9FA',
    padding: 14,
    borderRadius: 12,
  },
  excepcionItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  excepcionBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  excepcionBadgeCerrado: {
    backgroundColor: '#FF6B6B',
  },
  excepcionBadgeEspecial: {
    backgroundColor: '#FFA726',
  },
  excepcionFechaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  excepcionFecha: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.dark,
  },
  excepcionTipoBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  excepcionTipoBadgeCerrado: {
    backgroundColor: '#FF6B6B20',
  },
  excepcionTipoBadgeEspecial: {
    backgroundColor: '#FFA72620',
  },
  excepcionTipoBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.gray,
  },
  excepcionMotivo: {
    fontSize: 13,
    color: COLORS.gray,
  },
  excepcionHorario: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '600',
    marginTop: 2,
  },
  rangoFechasLabel: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '600',
    marginBottom: 8,
  },
  usarUnDiaBtn: {
    backgroundColor: COLORS.primary + '15',
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  usarUnDiaText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  feedbackModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  feedbackModalContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 30,
    alignItems: 'center',
    width: '100%',
    maxWidth: 320,
  },
  feedbackIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  feedbackTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.dark,
    marginBottom: 8,
  },
  feedbackMessage: {
    fontSize: 15,
    color: COLORS.gray,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  feedbackButton: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  feedbackButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
  },
  telefonoCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  telefonoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  telefonoInfo: {
    flex: 1,
  },
  principalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    gap: 4,
  },
  principalBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.white,
  },
  telefonoNombre: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.dark,
  },
  telefonoInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  telefonoCodigoLabel: {
    paddingHorizontal: 12,
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.dark,
    borderRightWidth: 1,
    borderRightColor: '#E0E0E0',
    paddingVertical: 12,
  },
  telefonoInput: {
    flex: 1,
    fontSize: 15,
    color: COLORS.dark,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  addTelefonoForm: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 14,
    gap: 10,
  },
  addTelefonoInput: {
    backgroundColor: COLORS.white,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: COLORS.dark,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  addTelefonoButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  addTelefonoCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: '#E0E0E0',
  },
  addTelefonoCancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.gray,
  },
  addTelefonoConfirmBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: COLORS.primary,
  },
  addTelefonoConfirmText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.white,
  },
  addTelefonoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    borderStyle: 'dashed',
    gap: 8,
  },
  addTelefonoText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
});