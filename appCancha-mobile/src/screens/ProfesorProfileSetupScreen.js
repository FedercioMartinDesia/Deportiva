import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, ACTIVIDADES_BASE } from '../constants';
import { useAuth } from '../contexts/AuthContext';
import { profesorService } from '../services/profesorService';

const NIVELES = [
  { value: 'PRINCIPIANTE', label: 'Principiante', icon: 'leaf-outline' },
  { value: 'INTERMEDIO', label: 'Intermedio', icon: 'trending-up-outline' },
  { value: 'AVANZADO', label: 'Avanzado', icon: 'rocket-outline' },
  { value: 'TODOS', label: 'Todos los niveles', icon: 'people-outline' },
];

const ACCENT_COLOR = '#6C3CE1';

export default function ProfesorProfileSetupScreen() {
  const insets = useSafeAreaInsets();
  const { completeWelcome } = useAuth();

  const [deportes, setDeportes] = useState([]);
  const [niveles, setNiveles] = useState([]);
  const [descripcion, setDescripcion] = useState('');
  const [anosExperiencia, setAnosExperiencia] = useState('');
  const [certificaciones, setCertificaciones] = useState([]);
  const [nuevaCertificacion, setNuevaCertificacion] = useState('');
  const [loading, setLoading] = useState(false);

  const toggleDeporte = (value) => {
    setDeportes(prev =>
      prev.includes(value)
        ? prev.filter(d => d !== value)
        : [...prev, value]
    );
  };

  const toggleNivel = (value) => {
    setNiveles(prev =>
      prev.includes(value)
        ? prev.filter(n => n !== value)
        : [...prev, value]
    );
  };

  const agregarCertificacion = () => {
    const texto = nuevaCertificacion.trim();
    if (!texto) return;
    if (certificaciones.includes(texto)) {
      Alert.alert('Duplicada', 'Ya agregaste esta certificación');
      return;
    }
    setCertificaciones(prev => [...prev, texto]);
    setNuevaCertificacion('');
  };

  const quitarCertificacion = (index) => {
    setCertificaciones(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (deportes.length === 0) {
      Alert.alert('Deportes requeridos', 'Seleccioná al menos un deporte que enseñes');
      return;
    }
    if (niveles.length === 0) {
      Alert.alert('Niveles requeridos', 'Seleccioná al menos un nivel que dictes');
      return;
    }

    setLoading(true);
    try {
      const body = {
        deportes,
        niveles,
        descripcion: descripcion.trim() || undefined,
        anosExperiencia: anosExperiencia ? parseInt(anosExperiencia) : undefined,
        certificaciones: certificaciones.length > 0 ? certificaciones : undefined,
      };

      await profesorService.registroProfesor(body);

      // Limpiar flag de setup pendiente
      await AsyncStorage.removeItem('pendingProfesorSetup');

      // Completar bienvenida y entrar a la app
      await completeWelcome();
    } catch (error) {
      const msg = error.message || 'No se pudo completar el registro de profesor';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    Alert.alert(
      'Omitir perfil',
      'Podrás completar tu perfil de profesor más adelante desde tu cuenta. ¿Continuar sin completar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Omitir',
          onPress: async () => {
            await AsyncStorage.removeItem('pendingProfesorSetup');
            await completeWelcome();
          },
        },
      ]
    );
  };

  const canSubmit = deportes.length > 0 && niveles.length > 0;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { paddingTop: insets.top }]}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerIconContainer}>
          <Ionicons name="school" size={24} color={ACCENT_COLOR} />
        </View>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Perfil de Profesor</Text>
          <Text style={styles.headerSubtitle}>Completá tu información profesional</Text>
        </View>
        <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
          <Text style={styles.skipText}>Omitir</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Deportes */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="fitness-outline" size={20} color={ACCENT_COLOR} />
            <Text style={styles.sectionTitle}>Deportes que enseñás *</Text>
          </View>
          <Text style={styles.sectionHint}>Seleccioná al menos uno</Text>
          <View style={styles.chipsContainer}>
            {ACTIVIDADES_BASE.filter(a => a.value !== 'otro').map((actividad) => {
              const selected = deportes.includes(actividad.value);
              return (
                <TouchableOpacity
                  key={actividad.value}
                  style={[styles.chip, selected && styles.chipSelected]}
                  onPress={() => toggleDeporte(actividad.value)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={actividad.icon}
                    size={16}
                    color={selected ? COLORS.white : ACCENT_COLOR}
                  />
                  <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                    {actividad.label}
                  </Text>
                  {selected && (
                    <Ionicons name="checkmark-circle" size={16} color={COLORS.white} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Niveles */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="bar-chart-outline" size={20} color={ACCENT_COLOR} />
            <Text style={styles.sectionTitle}>Niveles que dictás *</Text>
          </View>
          <Text style={styles.sectionHint}>Seleccioná los niveles de tus clases</Text>
          <View style={styles.nivelesContainer}>
            {NIVELES.map((nivel) => {
              const selected = niveles.includes(nivel.value);
              return (
                <TouchableOpacity
                  key={nivel.value}
                  style={[styles.nivelCard, selected && styles.nivelCardSelected]}
                  onPress={() => toggleNivel(nivel.value)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={nivel.icon}
                    size={22}
                    color={selected ? COLORS.white : ACCENT_COLOR}
                  />
                  <Text style={[styles.nivelText, selected && styles.nivelTextSelected]}>
                    {nivel.label}
                  </Text>
                  {selected && (
                    <Ionicons name="checkmark" size={18} color={COLORS.white} style={styles.nivelCheck} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Descripción */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="document-text-outline" size={20} color={ACCENT_COLOR} />
            <Text style={styles.sectionTitle}>Descripción / Bio</Text>
            <Text style={styles.optionalBadge}>Opcional</Text>
          </View>
          <View style={styles.textAreaContainer}>
            <TextInput
              style={styles.textArea}
              placeholder="Contá sobre tu experiencia, metodología, logros..."
              placeholderTextColor={COLORS.gray}
              value={descripcion}
              onChangeText={setDescripcion}
              multiline
              maxLength={500}
              textAlignVertical="top"
            />
            <Text style={styles.charCount}>{descripcion.length}/500</Text>
          </View>
        </View>

        {/* Años de experiencia */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="time-outline" size={20} color={ACCENT_COLOR} />
            <Text style={styles.sectionTitle}>Años de experiencia</Text>
            <Text style={styles.optionalBadge}>Opcional</Text>
          </View>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Ej: 5"
              placeholderTextColor={COLORS.gray}
              value={anosExperiencia}
              onChangeText={(text) => setAnosExperiencia(text.replace(/[^0-9]/g, ''))}
              keyboardType="number-pad"
              maxLength={2}
            />
            <Text style={styles.inputSuffix}>años</Text>
          </View>
        </View>

        {/* Certificaciones */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="ribbon-outline" size={20} color={ACCENT_COLOR} />
            <Text style={styles.sectionTitle}>Certificaciones</Text>
            <Text style={styles.optionalBadge}>Opcional</Text>
          </View>
          <View style={styles.certInputRow}>
            <View style={styles.certInputContainer}>
              <TextInput
                style={styles.certInput}
                placeholder="Ej: Certificado Nacional de Tenis"
                placeholderTextColor={COLORS.gray}
                value={nuevaCertificacion}
                onChangeText={setNuevaCertificacion}
                onSubmitEditing={agregarCertificacion}
                returnKeyType="done"
              />
            </View>
            <TouchableOpacity
              style={[styles.addButton, !nuevaCertificacion.trim() && styles.addButtonDisabled]}
              onPress={agregarCertificacion}
              disabled={!nuevaCertificacion.trim()}
              activeOpacity={0.7}
            >
              <Ionicons name="add" size={22} color={COLORS.white} />
            </TouchableOpacity>
          </View>
          {certificaciones.length > 0 && (
            <View style={styles.certList}>
              {certificaciones.map((cert, index) => (
                <View key={index} style={styles.certItem}>
                  <Ionicons name="ribbon" size={16} color={ACCENT_COLOR} />
                  <Text style={styles.certItemText} numberOfLines={1}>{cert}</Text>
                  <TouchableOpacity
                    onPress={() => quitarCertificacion(index)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons name="close-circle" size={20} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Nota informativa */}
        <View style={styles.infoNote}>
          <Ionicons name="information-circle" size={20} color={ACCENT_COLOR} />
          <Text style={styles.infoNoteText}>
            Tu perfil será revisado por un administrador antes de publicar clases. Mientras tanto, podrás crear clases en borrador.
          </Text>
        </View>

        {/* Botón de enviar */}
        <TouchableOpacity
          style={[styles.submitButton, (!canSubmit || loading) && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={!canSubmit || loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <>
              <Text style={styles.submitButtonText}>Completar registro</Text>
              <Ionicons name="checkmark-circle" size={22} color={COLORS.white} />
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
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
    paddingVertical: 16,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    gap: 12,
  },
  headerIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: ACCENT_COLOR + '15',
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
  skipButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
  },
  skipText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.gray,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 28,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.dark,
    flex: 1,
  },
  sectionHint: {
    fontSize: 13,
    color: COLORS.gray,
    marginBottom: 12,
    paddingLeft: 28,
  },
  optionalBadge: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.gray,
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: ACCENT_COLOR + '30',
  },
  chipSelected: {
    backgroundColor: ACCENT_COLOR,
    borderColor: ACCENT_COLOR,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
    color: ACCENT_COLOR,
  },
  chipTextSelected: {
    color: COLORS.white,
  },
  nivelesContainer: {
    gap: 8,
  },
  nivelCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: ACCENT_COLOR + '30',
  },
  nivelCardSelected: {
    backgroundColor: ACCENT_COLOR,
    borderColor: ACCENT_COLOR,
  },
  nivelText: {
    fontSize: 15,
    fontWeight: '600',
    color: ACCENT_COLOR,
    flex: 1,
  },
  nivelTextSelected: {
    color: COLORS.white,
  },
  nivelCheck: {
    marginLeft: 'auto',
  },
  textAreaContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#F0F0F0',
    padding: 14,
    marginTop: 6,
  },
  textArea: {
    fontSize: 15,
    color: COLORS.dark,
    minHeight: 100,
    lineHeight: 22,
  },
  charCount: {
    fontSize: 12,
    color: COLORS.gray,
    textAlign: 'right',
    marginTop: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#F0F0F0',
    paddingHorizontal: 16,
    height: 54,
    marginTop: 6,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: COLORS.dark,
  },
  inputSuffix: {
    fontSize: 14,
    color: COLORS.gray,
    fontWeight: '500',
  },
  certInputRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  certInputContainer: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#F0F0F0',
    paddingHorizontal: 16,
    height: 54,
    justifyContent: 'center',
  },
  certInput: {
    fontSize: 15,
    color: COLORS.dark,
  },
  addButton: {
    width: 54,
    height: 54,
    borderRadius: 14,
    backgroundColor: ACCENT_COLOR,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonDisabled: {
    opacity: 0.4,
  },
  certList: {
    marginTop: 12,
    gap: 8,
  },
  certItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: COLORS.white,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  certItemText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.dark,
    fontWeight: '500',
  },
  infoNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: ACCENT_COLOR + '10',
    padding: 14,
    borderRadius: 12,
    marginBottom: 24,
    gap: 10,
  },
  infoNoteText: {
    flex: 1,
    fontSize: 13,
    color: ACCENT_COLOR,
    lineHeight: 18,
    fontWeight: '500',
  },
  submitButton: {
    flexDirection: 'row',
    backgroundColor: ACCENT_COLOR,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: ACCENT_COLOR,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
  },
});
