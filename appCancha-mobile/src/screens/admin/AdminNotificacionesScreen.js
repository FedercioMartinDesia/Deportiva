import React, { useState } from 'react';
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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants';
import { enviarNotificacionMasiva } from '../../services/adminService';

const DESTINATARIOS_OPTIONS = [
  { id: 'TODOS', label: 'Todos los usuarios', icon: 'people', color: COLORS.primary },
  { id: 'JUGADORES', label: 'Solo Participantes', icon: 'person', color: '#3B82F6' },
  { id: 'PROPIETARIOS', label: 'Solo Propietarios', icon: 'business', color: '#FF9500' },
];

const TIPOS_NOTIFICACION = [
  { id: 'GENERAL', label: 'General', icon: 'megaphone-outline' },
  { id: 'ACTUALIZACION', label: 'Actualización', icon: 'refresh-outline' },
  { id: 'PROMOCION', label: 'Promoción', icon: 'gift-outline' },
  { id: 'MANTENIMIENTO', label: 'Mantenimiento', icon: 'construct-outline' },
];

export default function AdminNotificacionesScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  
  const [titulo, setTitulo] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [destinatarios, setDestinatarios] = useState('TODOS');
  const [tipo, setTipo] = useState('GENERAL');
  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [resultData, setResultData] = useState(null);

  const handleEnviar = async () => {
    if (!titulo.trim()) {
      Alert.alert('Error', 'El título es obligatorio');
      return;
    }
    if (!mensaje.trim()) {
      Alert.alert('Error', 'El mensaje es obligatorio');
      return;
    }

    Alert.alert(
      'Confirmar envío',
      `¿Enviar notificación a ${DESTINATARIOS_OPTIONS.find(d => d.id === destinatarios)?.label}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Enviar',
          onPress: async () => {
            try {
              setLoading(true);
              const response = await enviarNotificacionMasiva({
                titulo: titulo.trim(),
                mensaje: mensaje.trim(),
                destinatarios,
                tipo
              });
              
              setResultData(response.data);
              setShowSuccessModal(true);
              
              // Limpiar formulario
              setTitulo('');
              setMensaje('');
              setDestinatarios('TODOS');
              setTipo('GENERAL');
            } catch (error) {
              Alert.alert('Error', 'No se pudo enviar la notificación');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const selectedDestinatario = DESTINATARIOS_OPTIONS.find(d => d.id === destinatarios);

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
        {/* Destinatarios */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Destinatarios</Text>
          <View style={styles.destinatariosGrid}>
            {DESTINATARIOS_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.destinatarioCard,
                  destinatarios === option.id && { borderColor: option.color, borderWidth: 2 }
                ]}
                onPress={() => setDestinatarios(option.id)}
              >
                <View style={[styles.destinatarioIcon, { backgroundColor: option.color + '15' }]}>
                  <Ionicons name={option.icon} size={24} color={option.color} />
                </View>
                <Text style={[
                  styles.destinatarioLabel,
                  destinatarios === option.id && { color: option.color, fontWeight: '700' }
                ]}>
                  {option.label}
                </Text>
                {destinatarios === option.id && (
                  <View style={[styles.checkIcon, { backgroundColor: option.color }]}>
                    <Ionicons name="checkmark" size={14} color={COLORS.white} />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Tipo de notificación */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tipo de Notificación</Text>
          <View style={styles.tiposRow}>
            {TIPOS_NOTIFICACION.map((t) => (
              <TouchableOpacity
                key={t.id}
                style={[
                  styles.tipoChip,
                  tipo === t.id && styles.tipoChipActive
                ]}
                onPress={() => setTipo(t.id)}
              >
                <Ionicons 
                  name={t.icon} 
                  size={16} 
                  color={tipo === t.id ? COLORS.white : COLORS.gray} 
                />
                <Text style={[
                  styles.tipoChipText,
                  tipo === t.id && styles.tipoChipTextActive
                ]}>
                  {t.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Título */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Título *</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej: Nueva actualización disponible"
            placeholderTextColor={COLORS.gray}
            value={titulo}
            onChangeText={setTitulo}
            maxLength={100}
          />
          <Text style={styles.charCount}>{titulo.length}/100</Text>
        </View>

        {/* Mensaje */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mensaje *</Text>
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
              <View style={styles.previewIconContainer}>
                <Ionicons name="notifications" size={20} color={COLORS.primary} />
              </View>
              <View style={styles.previewContent}>
                <Text style={styles.previewTitle} numberOfLines={1}>
                  {titulo || 'Título de la notificación'}
                </Text>
                <Text style={styles.previewMessage} numberOfLines={2}>
                  {mensaje || 'El mensaje aparecerá aquí...'}
                </Text>
              </View>
            </View>
            <View style={styles.previewFooter}>
              <View style={[styles.previewBadge, { backgroundColor: selectedDestinatario?.color + '15' }]}>
                <Ionicons name={selectedDestinatario?.icon} size={12} color={selectedDestinatario?.color} />
                <Text style={[styles.previewBadgeText, { color: selectedDestinatario?.color }]}>
                  {selectedDestinatario?.label}
                </Text>
              </View>
              <Text style={styles.previewTime}>Ahora</Text>
            </View>
          </View>
        </View>

        {/* Botón Enviar */}
        <TouchableOpacity
          style={[styles.sendButton, (!titulo.trim() || !mensaje.trim()) && styles.sendButtonDisabled]}
          onPress={handleEnviar}
          disabled={loading || !titulo.trim() || !mensaje.trim()}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <>
              <Ionicons name="send" size={20} color={COLORS.white} />
              <Text style={styles.sendButtonText}>Enviar Notificación</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Modal de éxito */}
      <Modal
        visible={showSuccessModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSuccessModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.successIcon}>
              <Ionicons name="checkmark-circle" size={60} color={COLORS.primary} />
            </View>
            <Text style={styles.modalTitle}>¡Notificación Enviada!</Text>
            <Text style={styles.modalMessage}>
              Se envió la notificación a {resultData?.cantidadEnviada || 0} usuarios
            </Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setShowSuccessModal(false)}
            >
              <Text style={styles.modalButtonText}>Aceptar</Text>
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
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.dark,
    marginBottom: 12,
  },
  destinatariosGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  destinatarioCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E5E5E5',
    position: 'relative',
  },
  destinatarioIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  destinatarioLabel: {
    fontSize: 11,
    color: COLORS.gray,
    textAlign: 'center',
  },
  checkIcon: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tiposRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tipoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.white,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  tipoChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  tipoChipText: {
    fontSize: 13,
    color: COLORS.gray,
    fontWeight: '500',
  },
  tipoChipTextActive: {
    color: COLORS.white,
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
    backgroundColor: COLORS.primary + '15',
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  previewBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  previewBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  previewTime: {
    fontSize: 12,
    color: COLORS.gray,
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
    maxWidth: 320,
  },
  successIcon: {
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
    backgroundColor: COLORS.primary,
    paddingHorizontal: 40,
    paddingVertical: 14,
    borderRadius: 12,
  },
  modalButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
});
