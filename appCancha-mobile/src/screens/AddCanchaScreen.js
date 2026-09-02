import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  Switch,
  Image,
  Modal,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Video } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { COLORS, JUGADORES_POR_DEPORTE } from '../constants';

// Configurar español para el calendario
LocaleConfig.locales['es'] = {
  monthNames: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'],
  monthNamesShort: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
  dayNames: ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
  dayNamesShort: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'],
  today: 'Hoy'
};
LocaleConfig.defaultLocale = 'es';

import api from '../services/api';
import { uploadMultipleImages } from '../services/uploadService';
import { useAuth } from '../contexts/AuthContext';
import CountryCodePicker from '../components/CountryCodePicker';

const DEPORTES = [
  { label: 'Fútbol 4', value: 'FUTBOL_4' },
  { label: 'Fútbol 5', value: 'FUTBOL_5' },
  { label: 'Fútbol 6', value: 'FUTBOL_6' },
  { label: 'Fútbol 7', value: 'FUTBOL_7' },
  { label: 'Fútbol 8', value: 'FUTBOL_8' },
  { label: 'Fútbol 9', value: 'FUTBOL_9' },
  { label: 'Fútbol 11', value: 'FUTBOL_11' },
  { label: 'Futsal', value: 'FUTSAL' },
  { label: 'Pádel', value: 'PADEL' },
  { label: 'Vóley', value: 'VOLEY' },
  { label: 'Vóley Playa', value: 'VOLEY_PLAYA' },
  { label: 'Newcom', value: 'NEWCOM' },
  { label: 'Tenis Singles', value: 'TENIS_SINGLES' },
  { label: 'Tenis Dobles', value: 'TENIS_DOBLES' },
  { label: 'Básquet', value: 'BASQUET' },
  { label: 'Otro', value: 'OTRO' },
];

const TIEMPO_CANCELACION = [
  { id: '1', label: '1 hora antes' },
  { id: '2', label: '2 horas antes' },
  { id: '3', label: '3 horas antes' },
  { id: '6', label: '6 horas antes' },
  { id: '12', label: '12 horas antes' },
  { id: '24', label: '1 día antes' },
  { id: '48', label: '2 días antes' },
  { id: '72', label: '3 días antes' },
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
  { id: '06:00', label: '06:00' },
  { id: '07:00', label: '07:00' },
  { id: '08:00', label: '08:00' },
  { id: '09:00', label: '09:00' },
  { id: '10:00', label: '10:00' },
  { id: '11:00', label: '11:00' },
  { id: '12:00', label: '12:00' },
  { id: '13:00', label: '13:00' },
  { id: '14:00', label: '14:00' },
  { id: '15:00', label: '15:00' },
  { id: '16:00', label: '16:00' },
  { id: '17:00', label: '17:00' },
  { id: '18:00', label: '18:00' },
  { id: '19:00', label: '19:00' },
  { id: '20:00', label: '20:00' },
  { id: '21:00', label: '21:00' },
  { id: '22:00', label: '22:00' },
  { id: '23:00', label: '23:00' },
  { id: '00:00', label: '00:00' },
  { id: '01:00', label: '01:00' },
  { id: '02:00', label: '02:00' },
];

const TIPOS_EXCEPCION = [
  { id: 'cerrado', label: 'Cerrado' },
  { id: 'horario_especial', label: 'Horario especial' },
];

export default function AddCanchaScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [imagenesSeleccionadas, setImagenesSeleccionadas] = useState([]);
  const [videosSeleccionados, setVideosSeleccionados] = useState([]);
  const [formData, setFormData] = useState({
    nombreLugar: '',
    descripcion: '',
    deporte: 'FUTBOL_5',
    direccion: '',
    ciudad: '',
    provincia: '',
    capacidadJugadores: JUGADORES_POR_DEPORTE['FUTBOL_5'].toString(), // 10 jugadores por defecto
    precioPorHora: '',
    superficieTipo: '',
    tipoSuelo: '',
    techada: false,
    vestuarios: false,
    estacionamiento: false,
    iluminacion: false,
    parrilla: false,
    buffet: false,
    duchas: false,
    torneos: false,
    escuelita: false,
    ayudaMedica: false,
    cumpleanos: false,
    colegios: false,
    camaras: false,
    gimnasio: false,
    wifi: false,
    tribuna: false,
    gradas: false,
  });
  const [loading, setLoading] = useState(false);

  // Modal de feedback
  const [feedbackModal, setFeedbackModal] = useState({ visible: false, type: '', message: '' });

  // Tiempo límite de cancelación
  const [horasLimiteCancelacion, setHorasLimiteCancelacion] = useState('24');

  // Horarios de apertura
  const [diasAbiertos, setDiasAbiertos] = useState([1, 2, 3, 4, 5, 6]); // Lunes a Sábado por defecto
  const [horaApertura, setHoraApertura] = useState('08:00');
  const [horaCierre, setHoraCierre] = useState('23:00');

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

  // Servicios personalizados
  const [serviciosPersonalizados, setServiciosPersonalizados] = useState([]);
  const [nuevoServicio, setNuevoServicio] = useState('');
  const [showAddServicio, setShowAddServicio] = useState(false);

  // Teléfonos
  const [telefonos, setTelefonos] = useState([]);
  const [showAddTelefono, setShowAddTelefono] = useState(false);
  const [nuevoTelefonoNombre, setNuevoTelefonoNombre] = useState('');
  const [nuevoTelefonoNumero, setNuevoTelefonoNumero] = useState('');
  const [nuevoTelefonoCodigo, setNuevoTelefonoCodigo] = useState('+54');

  // Función para extraer código de país del teléfono
  const extraerCodigoPais = (telefono) => {
    if (!telefono) return { codigo: '+54', numero: '' };
    const codigos = ['+54', '+55', '+56', '+57', '+58', '+51', '+52', '+53', '+591', '+593', '+595', '+598', '+1', '+34', '+39', '+49', '+33', '+44'];
    for (const codigo of codigos) {
      if (telefono.startsWith(codigo)) {
        return { codigo, numero: telefono.slice(codigo.length) };
      }
    }
    return { codigo: '+54', numero: telefono };
  };

  // Cargar teléfono del propietario al iniciar
  useEffect(() => {
    if (user?.telefono) {
      const { codigo, numero } = extraerCodigoPais(user.telefono);
      setTelefonos([
        { nombre: 'Principal', numero, codigoPais: codigo, esPrincipal: true }
      ]);
    } else {
      setTelefonos([
        { nombre: 'Principal', numero: '', codigoPais: '+54', esPrincipal: true }
      ]);
    }
  }, [user]);

  const updateField = (field, value) => {
    setFormData((prev) => {
      const newData = { ...prev, [field]: value };
      // Auto-completar capacidad cuando se selecciona un deporte
      if (field === 'deporte' && JUGADORES_POR_DEPORTE[value]) {
        newData.capacidadJugadores = JUGADORES_POR_DEPORTE[value].toString();
      }
      return newData;
    });
  };

  const pickImageFromGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.7,
    });

    if (!result.canceled) {
      const uris = result.assets.map((a) => a.uri);
      setImagenesSeleccionadas((prev) => [...prev, ...uris]);
    }
  };

  const takePhotoWithCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso requerido', 'Necesitamos acceso a la cámara');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      quality: 0.7,
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri;
      setImagenesSeleccionadas((prev) => [...prev, uri]);
    }
  };

  const pickVideo = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsMultipleSelection: true,
      quality: 0.7,
    });

    if (!result.canceled) {
      const uris = result.assets.map((a) => a.uri);
      setVideosSeleccionados((prev) => [...prev, ...uris]);
    }
  };

  const removeImage = (index) => {
    setImagenesSeleccionadas((prev) => prev.filter((_, i) => i !== index));
  };

  const removeVideo = (index) => {
    setVideosSeleccionados((prev) => prev.filter((_, i) => i !== index));
  };

  const toggleDia = (diaId) => {
    setDiasAbiertos((prev) => {
      if (prev.includes(diaId)) {
        return prev.filter((d) => d !== diaId);
      } else {
        return [...prev, diaId].sort((a, b) => a - b);
      }
    });
  };

  // Funciones para servicios personalizados
  const agregarServicio = () => {
    if (nuevoServicio.trim()) {
      setServiciosPersonalizados((prev) => [...prev, nuevoServicio.trim()]);
      setNuevoServicio('');
      setShowAddServicio(false);
    }
  };

  const eliminarServicio = (index) => {
    setServiciosPersonalizados((prev) => prev.filter((_, i) => i !== index));
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
        { nombre: nuevoTelefonoNombre.trim(), numero: nuevoTelefonoNumero.trim(), codigoPais: nuevoTelefonoCodigo, esPrincipal: false }
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
    
    // Si se elimina el principal, marcar el primero restante como principal
    if (telefonoEliminado.esPrincipal && nuevosTelefonos.length > 0) {
      nuevosTelefonos[0].esPrincipal = true;
    }
    
    setTelefonos(nuevosTelefonos);
  };

  // Funciones para excepciones de horario
  // Convertir fecha ISO (YYYY-MM-DD) a formato display (DD/MM/YYYY)
  const formatearFechaDisplay = (dateString) => {
    const [anio, mes, dia] = dateString.split('-');
    return `${dia}/${mes}/${anio}`;
  };

  // Obtener fecha de hoy en formato YYYY-MM-DD
  const getTodayString = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  // Manejar selección de fecha del calendario (rango)
  const onSelectDate = (day) => {
    if (!fechaInicio || (fechaInicio && fechaFin)) {
      // Primera selección o reiniciar selección
      setFechaInicio(day.dateString);
      setFechaFin('');
      setSeleccionandoFechaFin(true);
    } else {
      // Segunda selección (fecha fin)
      if (day.dateString < fechaInicio) {
        // Si selecciona una fecha anterior, intercambiar
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
      marks[fechaInicio] = { 
        selected: true, 
        startingDay: true, 
        color: COLORS.primary,
        textColor: COLORS.white
      };
    }
    if (fechaFin) {
      marks[fechaFin] = { 
        selected: true, 
        endingDay: true, 
        color: COLORS.primary,
        textColor: COLORS.white
      };
      // Marcar días intermedios
      if (fechaInicio && fechaFin) {
        let current = new Date(fechaInicio);
        const end = new Date(fechaFin);
        current.setDate(current.getDate() + 1);
        while (current < end) {
          const dateStr = current.toISOString().split('T')[0];
          marks[dateStr] = { 
            selected: true, 
            color: COLORS.primary + '40',
            textColor: COLORS.dark
          };
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

  const handleSave = async () => {
    const {
      nombreLugar,
      descripcion,
      deporte,
      direccion,
      ciudad,
      provincia,
      capacidadJugadores,
      precioPorHora,
      superficieTipo,
      techada,
      vestuarios,
      estacionamiento,
      iluminacion,
      parrilla,
      buffet,
      duchas,
    } = formData;

    if (
      !nombreLugar ||
      !descripcion ||
      !deporte ||
      !direccion ||
      !ciudad ||
      !provincia ||
      !capacidadJugadores ||
      !precioPorHora
    ) {
      Alert.alert('Error', 'Por favor completa todos los campos obligatorios');
      return;
    }

    const cap = Number(capacidadJugadores);
    const precio = Number(precioPorHora);
    if (Number.isNaN(cap) || cap <= 0) {
      Alert.alert('Error', 'Capacidad de participantes debe ser un número válido');
      return;
    }
    if (Number.isNaN(precio) || precio <= 0) {
      Alert.alert('Error', 'Precio por hora debe ser un número válido');
      return;
    }

    try {
      setLoading(true);
      
      // Subir imágenes a Cloudinary
      let imagenesUrls = [];
      if (imagenesSeleccionadas.length > 0) {
        try {
          imagenesUrls = await uploadMultipleImages(imagenesSeleccionadas, 'canchas');
        } catch (uploadError) {
          console.error('Error subiendo imágenes:', uploadError);
          Alert.alert(
            'Advertencia',
            'No se pudieron subir las imágenes. ¿Deseas crear el espacio sin imágenes?',
            [
              { text: 'Cancelar', style: 'cancel', onPress: () => { setLoading(false); return; } },
              { text: 'Continuar sin imágenes', onPress: () => {} }
            ]
          );
          // Si el usuario cancela, la función retorna arriba
          // Si continúa, imagenesUrls queda como array vacío
        }
      }
      
      const payload = {
        nombre: nombreLugar,
        descripcion,
        deporte,
        direccion,
        ciudad,
        provincia,
        capacidadJugadores: cap,
        precioPorHora: precio,
        superficieTipo,
        tipoSuelo: formData.tipoSuelo,
        techada,
        vestuarios,
        estacionamiento,
        iluminacion,
        parrilla,
        buffet,
        duchas,
        serviciosPersonalizados,
        torneos: formData.torneos,
        escuelita: formData.escuelita,
        ayudaMedica: formData.ayudaMedica,
        cumpleanos: formData.cumpleanos,
        colegios: formData.colegios,
        camaras: formData.camaras,
        gimnasio: formData.gimnasio,
        wifi: formData.wifi,
        tribuna: formData.tribuna,
        gradas: formData.gradas,
        imagenes: imagenesUrls,
        horasLimiteCancelacion: parseInt(horasLimiteCancelacion),
        horarios: diasAbiertos.map((dia) => ({
          diaSemana: dia,
          horaInicio: horaApertura,
          horaFin: horaCierre,
        })),
        diasEspeciales: excepciones.map((exc) => {
          // Convertir DD/MM/YYYY a YYYY-MM-DD
          const [dia, mes, anio] = exc.fechaInicio.split('/');
          const fechaISO = `${anio}-${mes}-${dia}`;
          return {
            fecha: fechaISO,
            tipo: exc.tipo,
            motivo: exc.motivo,
            horaApertura: exc.horaApertura || null,
            horaCierre: exc.horaCierre || null,
          };
        }),
        telefonos: telefonos,
      };

      const response = await api.post('/canchas', payload);
      if (response.data?.success) {
        setFeedbackModal({ visible: true, type: 'success', message: '¡Espacio creado correctamente!' });
      } else {
        setFeedbackModal({ visible: true, type: 'error', message: 'No se pudo crear el espacio' });
      }
    } catch (error) {
      console.error(error);
      const msg = error.response?.data?.message || 'Error al crear el espacio';
      setFeedbackModal({ visible: true, type: 'error', message: msg });
    } finally {
      setLoading(false);
    }
  };

// ...
  const DeporteSelector = () => (
    <View style={styles.deporteContainer}>
      {DEPORTES.map((item) => {
        const selected = formData.deporte === item.value;
        return (
          <TouchableOpacity
            key={item.value}
            style={[
              styles.deporteChip,
              selected && styles.deporteChipSelected,
            ]}
            onPress={() => updateField('deporte', item.value)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.deporteChipText,
                selected && styles.deporteChipTextSelected,
              ]}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.dark} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Nuevo Espacio</Text>
          <Text style={styles.headerSubtitle}>Completa la información</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Información básica */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="information-circle" size={20} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>Información Básica</Text>
          </View>

          <View style={styles.inputContainer}>
            <Ionicons
              name="business-outline"
              size={20}
              color={COLORS.primary}
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="Nombre del lugar *"
              placeholderTextColor={COLORS.gray}
              value={formData.nombreLugar}
              onChangeText={(v) => updateField('nombreLugar', v)}
            />
          </View>

          <View style={[styles.inputContainer, styles.textAreaContainer]}>
            <Ionicons
              name="document-text-outline"
              size={20}
              color={COLORS.primary}
              style={[styles.inputIcon, styles.textAreaIcon]}
            />
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Descripción *"
              placeholderTextColor={COLORS.gray}
              value={formData.descripcion}
              onChangeText={(v) => updateField('descripcion', v)}
              multiline
              numberOfLines={3}
            />
          </View>
        </View>

        {/* Ubicación */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="location" size={20} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>Ubicación</Text>
          </View>

          <View style={styles.inputContainer}>
            <Ionicons
              name="home-outline"
              size={20}
              color={COLORS.primary}
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="Dirección *"
              placeholderTextColor={COLORS.gray}
              value={formData.direccion}
              onChangeText={(v) => updateField('direccion', v)}
            />
          </View>

          <View style={styles.rowInputs}>
            <View style={[styles.inputContainer, styles.halfInput]}>
              <Ionicons
                name="business-outline"
                size={20}
                color={COLORS.primary}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Ciudad *"
                placeholderTextColor={COLORS.gray}
                value={formData.ciudad}
                onChangeText={(v) => updateField('ciudad', v)}
              />
            </View>

            <View style={[styles.inputContainer, styles.halfInput]}>
              <Ionicons
                name="map-outline"
                size={20}
                color={COLORS.primary}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Provincia *"
                placeholderTextColor={COLORS.gray}
                value={formData.provincia}
                onChangeText={(v) => updateField('provincia', v)}
              />
            </View>
          </View>
        </View>

        {/* Teléfonos de contacto */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="call" size={20} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>Teléfonos de Contacto</Text>
          </View>

          {telefonos.map((tel, index) => (
            <View key={index} style={styles.telefonoCard}>
              <View style={styles.telefonoHeader}>
                <View style={styles.telefonoNombreContainer}>
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
                  <Ionicons name="close-circle" size={22} color={COLORS.error || '#FF4444'} />
                </TouchableOpacity>
              </View>
              <View style={styles.telefonoRow}>
                <View style={styles.countryCodeContainer}>
                  <CountryCodePicker
                    selectedCode={tel.codigoPais || '+54'}
                    onSelect={(code) => actualizarTelefono(index, 'codigoPais', code)}
                    accentColor={COLORS.primary}
                  />
                </View>
                <View style={styles.phoneInputContainer}>
                  <TextInput
                    style={styles.phoneInput}
                    placeholder="Número de teléfono *"
                    placeholderTextColor={COLORS.gray}
                    value={tel.numero}
                    onChangeText={(v) => actualizarTelefono(index, 'numero', v)}
                    keyboardType="phone-pad"
                  />
                </View>
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
              <View style={styles.telefonoRow}>
                <View style={styles.countryCodeContainer}>
                  <CountryCodePicker
                    selectedCode={nuevoTelefonoCodigo}
                    onSelect={setNuevoTelefonoCodigo}
                    accentColor={COLORS.primary}
                  />
                </View>
                <View style={styles.phoneInputContainer}>
                  <TextInput
                    style={styles.phoneInput}
                    placeholder="Número de teléfono"
                    placeholderTextColor={COLORS.gray}
                    value={nuevoTelefonoNumero}
                    onChangeText={setNuevoTelefonoNumero}
                    keyboardType="phone-pad"
                  />
                </View>
              </View>
              <View style={styles.addTelefonoButtons}>
                <TouchableOpacity 
                  style={styles.addTelefonoCancelBtn} 
                  onPress={() => {
                    setShowAddTelefono(false);
                    setNuevoTelefonoNombre('');
                    setNuevoTelefonoNumero('');
                    setNuevoTelefonoCodigo('+54');
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

        {/* Horarios de Apertura */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="time" size={20} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>Horarios de Apertura</Text>
          </View>

          <Text style={styles.fieldLabel}>Días abiertos</Text>
          <View style={styles.diasContainer}>
            {DIAS_SEMANA.map((dia) => {
              const selected = diasAbiertos.includes(dia.id);
              return (
                <TouchableOpacity
                  key={dia.id}
                  style={[styles.diaChip, selected && styles.diaChipSelected]}
                  onPress={() => toggleDia(dia.id)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.diaChipText, selected && styles.diaChipTextSelected]}>
                    {dia.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.horariosRow}>
            <View style={styles.horarioField}>
              <Text style={styles.fieldLabel}>Apertura</Text>
              <View style={styles.scrollWithIndicator}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horasScroll}>
                  {HORAS.map((hora) => {
                    const selected = horaApertura === hora.id;
                    return (
                      <TouchableOpacity
                        key={hora.id}
                        style={[styles.horaChip, selected && styles.horaChipSelected]}
                        onPress={() => setHoraApertura(hora.id)}
                      >
                        <Text style={[styles.horaChipText, selected && styles.horaChipTextSelected]}>
                          {hora.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
                <View style={styles.scrollIndicator}>
                  <Ionicons name="chevron-forward" size={16} color={COLORS.primary} />
                </View>
              </View>
            </View>

            <View style={styles.horarioField}>
              <Text style={styles.fieldLabel}>Cierre</Text>
              <View style={styles.scrollWithIndicator}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horasScroll}>
                  {HORAS.map((hora) => {
                    const selected = horaCierre === hora.id;
                    return (
                      <TouchableOpacity
                        key={hora.id}
                        style={[styles.horaChip, selected && styles.horaChipSelected]}
                        onPress={() => setHoraCierre(hora.id)}
                      >
                        <Text style={[styles.horaChipText, selected && styles.horaChipTextSelected]}>
                          {hora.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
                <View style={styles.scrollIndicator}>
                  <Ionicons name="chevron-forward" size={16} color={COLORS.primary} />
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Días especiales / Excepciones */}
        <View style={styles.excepcionesSection}>
          <View style={styles.excepcionesHeader}>
            <View style={styles.excepcionesHeaderLeft}>
              <Ionicons name="calendar-outline" size={18} color={COLORS.primary} />
              <Text style={styles.excepcionesTitle}>Días Especiales</Text>
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
              {/* Selector de fecha con calendario (rango) */}
              <View>
                <Text style={styles.rangoFechasLabel}>
                  {seleccionandoFechaFin ? 'Selecciona la fecha de fin' : 'Selecciona fecha o rango de fechas'}
                </Text>
                <TouchableOpacity 
                  style={[
                    styles.datePickerButton,
                    fechaInicio && styles.datePickerButtonSelected
                  ]}
                  onPress={() => setShowDatePicker(!showDatePicker)}
                >
                  <Ionicons name="calendar" size={20} color={COLORS.primary} />
                  <Text style={[
                    styles.datePickerText,
                    fechaInicio && styles.datePickerTextSelected
                  ]}>
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
                      dotColor: COLORS.primary,
                      selectedDotColor: COLORS.white,
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
                    style={[
                      styles.excepcionTipoChip,
                      nuevaExcepcionTipo === tipo.id && styles.excepcionTipoChipSelected
                    ]}
                    onPress={() => setNuevaExcepcionTipo(tipo.id)}
                  >
                    <Ionicons 
                      name={tipo.id === 'cerrado' ? 'close-circle-outline' : 'time-outline'} 
                      size={16} 
                      color={nuevaExcepcionTipo === tipo.id ? COLORS.white : COLORS.primary} 
                    />
                    <Text style={[
                      styles.excepcionTipoText,
                      nuevaExcepcionTipo === tipo.id && styles.excepcionTipoTextSelected
                    ]}>
                      {tipo.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              {nuevaExcepcionTipo === 'horario_especial' && (
                <View style={styles.excepcionHorariosRow}>
                  <View style={styles.excepcionHorarioField}>
                    <Text style={styles.excepcionHorarioLabel}>Apertura</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      {HORAS.slice(0, 12).map((hora) => (
                        <TouchableOpacity
                          key={hora.id}
                          style={[
                            styles.excepcionHoraChip,
                            nuevaExcepcionApertura === hora.id && styles.excepcionHoraChipSelected
                          ]}
                          onPress={() => setNuevaExcepcionApertura(hora.id)}
                        >
                          <Text style={[
                            styles.excepcionHoraText,
                            nuevaExcepcionApertura === hora.id && styles.excepcionHoraTextSelected
                          ]}>
                            {hora.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                  <View style={styles.excepcionHorarioField}>
                    <Text style={styles.excepcionHorarioLabel}>Cierre</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      {HORAS.slice(6).map((hora) => (
                        <TouchableOpacity
                          key={hora.id}
                          style={[
                            styles.excepcionHoraChip,
                            nuevaExcepcionCierre === hora.id && styles.excepcionHoraChipSelected
                          ]}
                          onPress={() => setNuevaExcepcionCierre(hora.id)}
                        >
                          <Text style={[
                            styles.excepcionHoraText,
                            nuevaExcepcionCierre === hora.id && styles.excepcionHoraTextSelected
                          ]}>
                            {hora.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
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
                    <View style={[
                      styles.excepcionBadge,
                      exc.tipo === 'cerrado' ? styles.excepcionBadgeCerrado : styles.excepcionBadgeEspecial
                    ]}>
                      <Ionicons 
                        name={exc.tipo === 'cerrado' ? 'close-circle' : 'time'} 
                        size={14} 
                        color={COLORS.white} 
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={styles.excepcionFechaRow}>
                        <Text style={styles.excepcionFecha}>
                          {exc.fechaInicio === exc.fechaFin ? exc.fechaInicio : `${exc.fechaInicio} - ${exc.fechaFin}`}
                        </Text>
                        <View style={[
                          styles.excepcionTipoBadge,
                          exc.tipo === 'cerrado' ? styles.excepcionTipoBadgeCerrado : styles.excepcionTipoBadgeEspecial
                        ]}>
                          <Text style={styles.excepcionTipoBadgeText}>
                            {exc.tipo === 'cerrado' ? 'Cerrado' : 'Horario especial'}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.excepcionMotivo}>{exc.motivo}</Text>
                      {exc.tipo === 'horario_especial' && (
                        <Text style={styles.excepcionHorario}>
                          {exc.horaApertura} - {exc.horaCierre}
                        </Text>
                      )}
                    </View>
                  </View>
                  <TouchableOpacity onPress={() => eliminarExcepcion(index)}>
                    <Ionicons name="trash-outline" size={20} color={COLORS.error || '#FF4444'} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Política de Cancelación */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="close-circle" size={20} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>Política de Cancelación</Text>
          </View>
          <Text style={styles.policyDescription}>
            ¿Hasta cuándo pueden cancelar o editar reservas?
          </Text>
          <View style={styles.scrollWithIndicator}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.cancelacionScroll}>
              {TIEMPO_CANCELACION.map((tiempo) => {
                const selected = horasLimiteCancelacion === tiempo.id;
                return (
                  <TouchableOpacity
                    key={tiempo.id}
                    style={[styles.cancelacionChip, selected && styles.cancelacionChipSelected]}
                    onPress={() => setHorasLimiteCancelacion(tiempo.id)}
                  >
                    <Text style={[styles.cancelacionChipText, selected && styles.cancelacionChipTextSelected]}>
                      {tiempo.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <View style={styles.scrollIndicator}>
              <Ionicons name="chevron-forward" size={16} color={COLORS.primary} />
            </View>
          </View>
        </View>

        {/* Precio */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="cash" size={20} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>Precio</Text>
          </View>

          <View style={styles.rowInputs}>
            <View style={[styles.inputContainer, styles.halfInput]}>
              <Ionicons
                name="people-outline"
                size={20}
                color={COLORS.primary}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Capacidad *"
                placeholderTextColor={COLORS.gray}
                value={formData.capacidadJugadores}
                onChangeText={(v) => updateField('capacidadJugadores', v)}
                keyboardType="numeric"
              />
            </View>

            <View style={[styles.inputContainer, styles.halfInput]}>
              <Ionicons
                name="cash-outline"
                size={20}
                color={COLORS.primary}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="$ / Hora *"
                placeholderTextColor={COLORS.gray}
                value={formData.precioPorHora}
                onChangeText={(v) => updateField('precioPorHora', v)}
                keyboardType="numeric"
              />
            </View>
          </View>
        </View>

        {/* Deporte */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="football" size={20} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>Deporte</Text>
          </View>
          <DeporteSelector />
        </View>

        {/* Multimedia */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="images" size={20} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>Fotos y Videos</Text>
          </View>

          <View style={styles.mediaButtons}>
            <TouchableOpacity 
              style={styles.mediaButton} 
              onPress={pickImageFromGallery}
              activeOpacity={0.7}
            >
              <Ionicons name="image-outline" size={22} color={COLORS.primary} />
              <Text style={styles.mediaButtonText}>Galería</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.mediaButton} 
              onPress={takePhotoWithCamera}
              activeOpacity={0.7}
            >
              <Ionicons name="camera-outline" size={22} color={COLORS.primary} />
              <Text style={styles.mediaButtonText}>Cámara</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.mediaButton} 
              onPress={pickVideo}
              activeOpacity={0.7}
            >
              <Ionicons name="videocam-outline" size={22} color={COLORS.primary} />
              <Text style={styles.mediaButtonText}>Video</Text>
            </TouchableOpacity>
          </View>

          {/* Preview de imágenes */}
          {imagenesSeleccionadas.length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.mediaPreviewScroll}
              contentContainerStyle={styles.mediaPreviewContent}
            >
              {imagenesSeleccionadas.map((uri, index) => (
                <View key={`img-${index}`} style={styles.mediaPreviewItem}>
                  <Image source={{ uri }} style={styles.mediaPreviewImage} />
                  <TouchableOpacity
                    style={styles.removeMediaButton}
                    onPress={() => removeImage(index)}
                  >
                    <Ionicons name="close-circle" size={24} color={COLORS.white} />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          )}

          {/* Preview de videos */}
          {videosSeleccionados.length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.mediaPreviewScroll}
              contentContainerStyle={styles.mediaPreviewContent}
            >
              {videosSeleccionados.map((uri, index) => (
                <View key={`vid-${index}`} style={styles.mediaPreviewItem}>
                  <Video
                    source={{ uri }}
                    style={styles.mediaPreviewVideo}
                    resizeMode="cover"
                    useNativeControls
                  />
                  <TouchableOpacity
                    style={styles.removeMediaButton}
                    onPress={() => removeVideo(index)}
                  >
                    <Ionicons name="close-circle" size={24} color={COLORS.white} />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          )}
        </View>

        {/* Amenidades */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderWithAction}>
            <View style={styles.sectionHeader}>
              <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />
              <Text style={styles.sectionTitle}>Servicios</Text>
            </View>
            <TouchableOpacity 
              style={styles.addServiceButton}
              onPress={() => setShowAddServicio(!showAddServicio)}
            >
              <Ionicons name={showAddServicio ? "close" : "add"} size={20} color={COLORS.primary} />
            </TouchableOpacity>
          </View>

          {showAddServicio && (
            <View style={styles.addServiceForm}>
              <TextInput
                style={styles.addServiceInput}
                placeholder="Nombre del servicio (ej: WiFi, Alquiler de pelotas)"
                placeholderTextColor={COLORS.gray}
                value={nuevoServicio}
                onChangeText={setNuevoServicio}
              />
              <TouchableOpacity style={styles.addServiceConfirmBtn} onPress={agregarServicio}>
                <Ionicons name="checkmark" size={20} color={COLORS.white} />
              </TouchableOpacity>
            </View>
          )}

          {serviciosPersonalizados.length > 0 && (
            <View style={styles.customServicesContainer}>
              {serviciosPersonalizados.map((servicio, index) => (
                <View key={index} style={styles.customServiceChip}>
                  <Text style={styles.customServiceText}>{servicio}</Text>
                  <TouchableOpacity onPress={() => eliminarServicio(index)}>
                    <Ionicons name="close-circle" size={18} color={COLORS.gray} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          <View style={styles.amenitiesGrid}>
            <View style={styles.switchCard}>
              <View style={styles.switchCardContent}>
                <Ionicons name="umbrella-outline" size={20} color={COLORS.primary} />
                <Text style={styles.switchLabel}>Techada</Text>
              </View>
              <Switch
                value={formData.techada}
                onValueChange={(v) => updateField('techada', v)}
                thumbColor={formData.techada ? COLORS.white : '#f4f3f4'}
                trackColor={{ false: '#ccc', true: COLORS.primary }}
              />
            </View>

            <View style={styles.switchCard}>
              <View style={styles.switchCardContent}>
                <Ionicons name="bulb-outline" size={20} color={COLORS.primary} />
                <Text style={styles.switchLabel}>Iluminación</Text>
              </View>
              <Switch
                value={formData.iluminacion}
                onValueChange={(v) => updateField('iluminacion', v)}
                thumbColor={formData.iluminacion ? COLORS.white : '#f4f3f4'}
                trackColor={{ false: '#ccc', true: COLORS.primary }}
              />
            </View>

            <View style={styles.switchCard}>
              <View style={styles.switchCardContent}>
                <Ionicons name="wifi-outline" size={20} color={COLORS.primary} />
                <Text style={styles.switchLabel}>WiFi</Text>
              </View>
              <Switch
                value={formData.wifi}
                onValueChange={(v) => updateField('wifi', v)}
                thumbColor={formData.wifi ? COLORS.white : '#f4f3f4'}
                trackColor={{ false: '#ccc', true: COLORS.primary }}
              />
            </View>

            <View style={styles.switchCard}>
              <View style={styles.switchCardContent}>
                <Ionicons name="videocam-outline" size={20} color={COLORS.primary} />
                <Text style={styles.switchLabel}>Cámaras de Seguridad</Text>
              </View>
              <Switch
                value={formData.camaras}
                onValueChange={(v) => updateField('camaras', v)}
                thumbColor={formData.camaras ? COLORS.white : '#f4f3f4'}
                trackColor={{ false: '#ccc', true: COLORS.primary }}
              />
            </View>

            <View style={styles.switchCard}>
              <View style={styles.switchCardContent}>
                <Ionicons name="shirt-outline" size={20} color={COLORS.primary} />
                <Text style={styles.switchLabel}>Vestuarios</Text>
              </View>
              <Switch
                value={formData.vestuarios}
                onValueChange={(v) => updateField('vestuarios', v)}
                thumbColor={formData.vestuarios ? COLORS.white : '#f4f3f4'}
                trackColor={{ false: '#ccc', true: COLORS.primary }}
              />
            </View>

            <View style={styles.switchCard}>
              <View style={styles.switchCardContent}>
                <Ionicons name="water-outline" size={20} color={COLORS.primary} />
                <Text style={styles.switchLabel}>Duchas</Text>
              </View>
              <Switch
                value={formData.duchas}
                onValueChange={(v) => updateField('duchas', v)}
                thumbColor={formData.duchas ? COLORS.white : '#f4f3f4'}
                trackColor={{ false: '#ccc', true: COLORS.primary }}
              />
            </View>

            <View style={styles.switchCard}>
              <View style={styles.switchCardContent}>
                <Ionicons name="car-outline" size={20} color={COLORS.primary} />
                <Text style={styles.switchLabel}>Estacionamiento</Text>
              </View>
              <Switch
                value={formData.estacionamiento}
                onValueChange={(v) => updateField('estacionamiento', v)}
                thumbColor={formData.estacionamiento ? COLORS.white : '#f4f3f4'}
                trackColor={{ false: '#ccc', true: COLORS.primary }}
              />
            </View>

            <View style={styles.switchCard}>
              <View style={styles.switchCardContent}>
                <Ionicons name="barbell-outline" size={20} color={COLORS.primary} />
                <Text style={styles.switchLabel}>Gimnasio</Text>
              </View>
              <Switch
                value={formData.gimnasio}
                onValueChange={(v) => updateField('gimnasio', v)}
                thumbColor={formData.gimnasio ? COLORS.white : '#f4f3f4'}
                trackColor={{ false: '#ccc', true: COLORS.primary }}
              />
            </View>

            <View style={styles.switchCard}>
              <View style={styles.switchCardContent}>
                <Ionicons name="browsers-outline" size={20} color={COLORS.primary} />
                <Text style={styles.switchLabel}>Tribuna</Text>
              </View>
              <Switch
                value={formData.tribuna}
                onValueChange={(v) => updateField('tribuna', v)}
                thumbColor={formData.tribuna ? COLORS.white : '#f4f3f4'}
                trackColor={{ false: '#ccc', true: COLORS.primary }}
              />
            </View>

            <View style={styles.switchCard}>
              <View style={styles.switchCardContent}>
                <Ionicons name="trending-up-outline" size={20} color={COLORS.primary} />
                <Text style={styles.switchLabel}>Gradas</Text>
              </View>
              <Switch
                value={formData.gradas}
                onValueChange={(v) => updateField('gradas', v)}
                thumbColor={formData.gradas ? COLORS.white : '#f4f3f4'}
                trackColor={{ false: '#ccc', true: COLORS.primary }}
              />
            </View>

            <View style={styles.switchCard}>
              <View style={styles.switchCardContent}>
                <Ionicons name="flame-outline" size={20} color={COLORS.primary} />
                <Text style={styles.switchLabel}>Parrilla</Text>
              </View>
              <Switch
                value={formData.parrilla}
                onValueChange={(v) => updateField('parrilla', v)}
                thumbColor={formData.parrilla ? COLORS.white : '#f4f3f4'}
                trackColor={{ false: '#ccc', true: COLORS.primary }}
              />
            </View>

            <View style={styles.switchCard}>
              <View style={styles.switchCardContent}>
                <Ionicons name="restaurant-outline" size={20} color={COLORS.primary} />
                <Text style={styles.switchLabel}>Buffet</Text>
              </View>
              <Switch
                value={formData.buffet}
                onValueChange={(v) => updateField('buffet', v)}
                thumbColor={formData.buffet ? COLORS.white : '#f4f3f4'}
                trackColor={{ false: '#ccc', true: COLORS.primary }}
              />
            </View>

            <View style={styles.switchCard}>
              <View style={styles.switchCardContent}>
                <Ionicons name="trophy-outline" size={20} color={COLORS.primary} />
                <Text style={styles.switchLabel}>Torneos</Text>
              </View>
              <Switch
                value={formData.torneos}
                onValueChange={(v) => updateField('torneos', v)}
                thumbColor={formData.torneos ? COLORS.white : '#f4f3f4'}
                trackColor={{ false: '#ccc', true: COLORS.primary }}
              />
            </View>

            <View style={styles.switchCard}>
              <View style={styles.switchCardContent}>
                <Ionicons name="school-outline" size={20} color={COLORS.primary} />
                <Text style={styles.switchLabel}>Escuelita de Fútbol</Text>
              </View>
              <Switch
                value={formData.escuelita}
                onValueChange={(v) => updateField('escuelita', v)}
                thumbColor={formData.escuelita ? COLORS.white : '#f4f3f4'}
                trackColor={{ false: '#ccc', true: COLORS.primary }}
              />
            </View>

            <View style={styles.switchCard}>
              <View style={styles.switchCardContent}>
                <Ionicons name="balloon-outline" size={20} color={COLORS.primary} />
                <Text style={styles.switchLabel}>Cumpleaños</Text>
              </View>
              <Switch
                value={formData.cumpleanos}
                onValueChange={(v) => updateField('cumpleanos', v)}
                thumbColor={formData.cumpleanos ? COLORS.white : '#f4f3f4'}
                trackColor={{ false: '#ccc', true: COLORS.primary }}
              />
            </View>

            <View style={styles.switchCard}>
              <View style={styles.switchCardContent}>
                <Ionicons name="business-outline" size={20} color={COLORS.primary} />
                <Text style={styles.switchLabel}>Colegios</Text>
              </View>
              <Switch
                value={formData.colegios}
                onValueChange={(v) => updateField('colegios', v)}
                thumbColor={formData.colegios ? COLORS.white : '#f4f3f4'}
                trackColor={{ false: '#ccc', true: COLORS.primary }}
              />
            </View>

            <View style={styles.switchCard}>
              <View style={styles.switchCardContent}>
                <Ionicons name="medkit-outline" size={20} color={COLORS.primary} />
                <Text style={styles.switchLabel}>Ayuda Médica</Text>
              </View>
              <Switch
                value={formData.ayudaMedica}
                onValueChange={(v) => updateField('ayudaMedica', v)}
                thumbColor={formData.ayudaMedica ? COLORS.white : '#f4f3f4'}
                trackColor={{ false: '#ccc', true: COLORS.primary }}
              />
            </View>
          </View>
        </View>

        {/* Botón guardar */}
        <TouchableOpacity
          style={[styles.saveButton, loading && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <Text style={styles.saveButtonText}>Guardando...</Text>
          ) : (
            <Text style={styles.saveButtonText}>Crear Espacio</Text>
          )}
        </TouchableOpacity>
      </ScrollView>

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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
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
    paddingBottom: 40,
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
  textAreaContainer: {
    alignItems: 'flex-start',
    paddingVertical: 12,
    minHeight: 100,
  },
  textAreaIcon: {
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  rowInputs: {
    flexDirection: 'row',
    gap: 10,
  },
  halfInput: {
    flex: 1,
  },
  deporteContainer: {
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
  deporteChipSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  deporteChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.gray,
  },
  deporteChipTextSelected: {
    color: COLORS.white,
  },
  mediaButtons: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  mediaButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary + '15',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
  },
  mediaButtonText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  mediaPreviewScroll: {
    marginTop: 8,
  },
  mediaPreviewContent: {
    gap: 10,
  },
  mediaPreviewItem: {
    position: 'relative',
  },
  mediaPreviewImage: {
    width: 100,
    height: 100,
    borderRadius: 12,
  },
  mediaPreviewVideo: {
    width: 140,
    height: 100,
    borderRadius: 12,
  },
  removeMediaButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  amenitiesGrid: {
    gap: 10,
  },
  switchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F5F5F5',
    padding: 14,
    borderRadius: 12,
  },
  switchCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  switchLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.dark,
  },
  saveButton: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    marginHorizontal: 20,
    marginTop: 20,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
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
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.dark,
    marginBottom: 10,
  },
  diasContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  diaChip: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  diaChipSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  diaChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.gray,
  },
  diaChipTextSelected: {
    color: COLORS.white,
  },
  horariosRow: {
    gap: 16,
  },
  horarioField: {
    marginBottom: 8,
  },
  horasScroll: {
    flexGrow: 0,
  },
  horaChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#F5F5F5',
    marginRight: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  horaChipSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  horaChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.gray,
  },
  horaChipTextSelected: {
    color: COLORS.white,
  },
  policyDescription: {
    fontSize: 14,
    color: COLORS.gray,
    marginBottom: 12,
    lineHeight: 20,
  },
  cancelacionScroll: {
    flexGrow: 0,
  },
  cancelacionChip: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    marginRight: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  cancelacionChipSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  cancelacionChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.gray,
  },
  cancelacionChipTextSelected: {
    color: COLORS.white,
  },
  // Indicador de scroll
  scrollWithIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scrollIndicator: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  // Sección de servicios con botón
  sectionHeaderWithAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  addServiceButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addServiceForm: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  addServiceInput: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: COLORS.dark,
  },
  addServiceConfirmBtn: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customServicesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  customServiceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary + '15',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  customServiceText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
  },
  // Teléfonos
  telefonoCard: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  telefonoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  telefonoNombreContainer: {
    flex: 1,
  },
  principalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
    alignSelf: 'flex-start',
  },
  principalBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.white,
  },
  telefonoNombre: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.dark,
  },
  telefonoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  countryCodeContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 10,
    height: 48,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  phoneInputContainer: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 10,
    paddingHorizontal: 14,
    height: 48,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  phoneInput: {
    fontSize: 15,
    color: COLORS.dark,
  },
  phoneInputDisabled: {
    color: COLORS.gray,
  },
  telefonoInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  telefonoInput: {
    flex: 1,
    fontSize: 15,
    color: COLORS.dark,
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
    fontSize: 14,
    color: COLORS.dark,
  },
  addTelefonoButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  addTelefonoCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#E0E0E0',
    alignItems: 'center',
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
    backgroundColor: COLORS.primary,
    alignItems: 'center',
  },
  addTelefonoConfirmText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.white,
  },
  telefonoHint: {
    fontSize: 11,
    color: COLORS.gray,
    fontStyle: 'italic',
    marginTop: 6,
    paddingLeft: 4,
  },
  // Estilos para excepciones de horario
  excepcionesSection: {
    backgroundColor: COLORS.white,
    padding: 20,
    marginBottom: 2,
  },
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
  excepcionesTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.dark,
  },
  excepcionesSubtitle: {
    fontSize: 12,
    color: COLORS.gray,
    marginBottom: 12,
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
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 14,
    marginTop: 8,
    gap: 10,
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
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: COLORS.primary + '30',
    gap: 6,
  },
  excepcionTipoChipSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  excepcionTipoText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
  },
  excepcionTipoTextSelected: {
    color: COLORS.white,
  },
  excepcionHorariosRow: {
    gap: 8,
  },
  excepcionHorarioField: {
    gap: 6,
  },
  excepcionHorarioLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.gray,
  },
  excepcionHoraChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: COLORS.white,
    marginRight: 6,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  excepcionHoraChipSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  excepcionHoraText: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.dark,
  },
  excepcionHoraTextSelected: {
    color: COLORS.white,
  },
  addExcepcionConfirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: 10,
    gap: 6,
  },
  addExcepcionConfirmText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.white,
  },
  excepcionesList: {
    marginTop: 12,
    gap: 8,
  },
  excepcionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 10,
  },
  excepcionItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  excepcionBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  excepcionBadgeCerrado: {
    backgroundColor: '#FF6B6B',
  },
  excepcionBadgeEspecial: {
    backgroundColor: '#4ECDC4',
  },
  excepcionFechaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  excepcionFecha: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.dark,
  },
  excepcionTipoBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  excepcionTipoBadgeCerrado: {
    backgroundColor: '#FF6B6B',
  },
  excepcionTipoBadgeEspecial: {
    backgroundColor: '#4ECDC4',
  },
  excepcionTipoBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.white,
  },
  excepcionMotivo: {
    fontSize: 12,
    color: COLORS.gray,
  },
  excepcionHorario: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: '500',
    marginTop: 2,
  },
  // Calendar/DatePicker styles
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.primary + '30',
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
    borderColor: COLORS.primary + '20',
  },
  calendar: {
    borderRadius: 12,
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
});