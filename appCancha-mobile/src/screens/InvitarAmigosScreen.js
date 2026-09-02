// src/screens/InvitarAmigosScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, formatearDeporte } from '../constants';
import api from '../services/api';
import { invitacionService } from '../services/invitacionService';

const GENEROS = [
  { id: 'INDISTINTO', label: 'Indistinto', icon: 'people-outline' },
  { id: 'MASCULINO', label: 'Masculino', icon: 'male-outline' },
  { id: 'FEMENINO', label: 'Femenino', icon: 'female-outline' },
];

const TIEMPO_CANCELACION = [
  { id: '1', label: '1 hora antes', description: 'Mínimo 1 hora de anticipación' },
  { id: '2', label: '2 horas antes', description: 'Mínimo 2 horas de anticipación' },
  { id: '3', label: '3 horas antes', description: 'Mínimo 3 horas de anticipación' },
  { id: '6', label: '6 horas antes', description: 'Mínimo 6 horas de anticipación' },
  { id: '12', label: '12 horas antes', description: 'Mínimo 12 horas de anticipación' },
  { id: '24', label: '1 día antes', description: 'Mínimo 24 horas de anticipación' },
  { id: '48', label: '2 días antes', description: 'Mínimo 48 horas de anticipación' },
  { id: '72', label: '3 días antes', description: 'Mínimo 72 horas de anticipación' },
];

// Usar formatearDeporte importado de constants

export default function InvitarAmigosScreen({ route, navigation }) {
  const { reservaId, cancha } = route.params || {};
  const insets = useSafeAreaInsets();

  const [activeTab, setActiveTab] = useState('amigos'); // 'amigos' | 'publica'
  const [amigos, setAmigos] = useState([]);
  const [selectedAmigos, setSelectedAmigos] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  // Para invitación pública
  const [showGeneroModal, setShowGeneroModal] = useState(false);
  const [generoSeleccionado, setGeneroSeleccionado] = useState('INDISTINTO');
  const [cuposDisponibles, setCuposDisponibles] = useState(1);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState({ title: '', subtitle: '' });
  
  // Tiempo límite de cancelación (en horas)
  const [tiempoCancelacion, setTiempoCancelacion] = useState('24');
  const [showTiempoCancelacionModal, setShowTiempoCancelacionModal] = useState(false);

  useEffect(() => {
    loadAmigos();
  }, []);

  const loadAmigos = async () => {
    try {
      const response = await api.get('/usuarios/amigos');
      if (response.data.success && response.data.amigos) {
        setAmigos(response.data.amigos);
      }
    } catch (error) {
      console.log('Error loading amigos', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleAmigoSelection = (amigoId) => {
    const newSelected = new Set(selectedAmigos);
    if (newSelected.has(amigoId)) {
      newSelected.delete(amigoId);
    } else {
      newSelected.add(amigoId);
    }
    setSelectedAmigos(newSelected);
  };

  const selectAll = () => {
    if (selectedAmigos.size === amigos.length) {
      setSelectedAmigos(new Set());
    } else {
      setSelectedAmigos(new Set(amigos.map(a => a.id)));
    }
  };

  const handleInvitarAmigos = async () => {
    if (selectedAmigos.size === 0) {
      Alert.alert('Atención', 'Selecciona al menos un amigo para invitar');
      return;
    }

    setSending(true);
    try {
      const result = await invitacionService.invitarAmigos(
        reservaId,
        Array.from(selectedAmigos),
        { horasLimiteCancelacion: parseInt(tiempoCancelacion) }
      );
      
      setSuccessMessage({
        title: '¡Invitaciones enviadas!',
        subtitle: `Se enviaron ${selectedAmigos.size} invitaciones.\nLos primeros en aceptar se unirán a la actividad.`
      });
      setShowSuccessModal(true);
    } catch (error) {
      console.error('Error invitando amigos:', error);
      Alert.alert('Error', error.response?.data?.message || 'No se pudieron enviar las invitaciones');
    } finally {
      setSending(false);
    }
  };

  const handleCrearInvitacionPublica = async () => {
    setSending(true);
    try {
      const response = await invitacionService.crearInvitacionPublica(reservaId, {
        generoRequerido: generoSeleccionado,
        cuposDisponibles,
        horasLimiteCancelacion: parseInt(tiempoCancelacion),
      });
      
      setShowGeneroModal(false);
      Alert.alert(
        '¡Invitación creada!',
        'Tu invitación está visible para otros participantes. Te notificaremos cuando alguien quiera unirse.',
        [
          { 
            text: 'Ver mis reservas', 
            onPress: () => {
              navigation.reset({
                index: 0,
                routes: [{ name: 'Main', params: { screen: 'Reservas' } }],
              });
            }
          },
          { text: 'OK', onPress: () => navigation.goBack() }
        ]
      );
    } catch (error) {
      console.error('Error creando invitación pública:', error);
      Alert.alert('Error', error.response?.data?.message || 'No se pudo crear la invitación');
    } finally {
      setSending(false);
    }
  };

  const AmigoCard = ({ amigo }) => {
    const isSelected = selectedAmigos.has(amigo.id);
    
    return (
      <TouchableOpacity
        style={[styles.amigoCard, isSelected && styles.amigoCardSelected]}
        onPress={() => toggleAmigoSelection(amigo.id)}
        activeOpacity={0.7}
      >
        <View style={[styles.avatar, isSelected && styles.avatarSelected]}>
          <Text style={[styles.avatarText, isSelected && styles.avatarTextSelected]}>
            {amigo.nombre?.charAt(0).toUpperCase() || 'U'}
          </Text>
        </View>
        <View style={styles.amigoInfo}>
          <Text style={styles.amigoNombre}>{amigo.nombre} {amigo.apellido}</Text>
          <Text style={styles.amigoAlias}>@{amigo.alias || 'sin alias'}</Text>
        </View>
        <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
          {isSelected && <Ionicons name="checkmark" size={16} color={COLORS.white} />}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Invitar participantes</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Info de la reserva */}
      {cancha && (
        <View style={styles.reservaInfo}>
          <Ionicons name="football-outline" size={20} color={COLORS.primary} />
          <Text style={styles.reservaText}>{cancha.nombre} - {formatearDeporte(cancha.deporte)}</Text>
        </View>
      )}

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'amigos' && styles.tabActive]}
          onPress={() => setActiveTab('amigos')}
        >
          <Ionicons 
            name="people" 
            size={20} 
            color={activeTab === 'amigos' ? COLORS.primary : COLORS.gray} 
          />
          <Text style={[styles.tabText, activeTab === 'amigos' && styles.tabTextActive]}>
            Mis amigos
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'publica' && styles.tabActive]}
          onPress={() => setActiveTab('publica')}
        >
          <Ionicons 
            name="globe" 
            size={20} 
            color={activeTab === 'publica' ? COLORS.primary : COLORS.gray} 
          />
          <Text style={[styles.tabText, activeTab === 'publica' && styles.tabTextActive]}>
            Invitación pública
          </Text>
        </TouchableOpacity>
      </View>

      {/* Contenido */}
      {activeTab === 'amigos' ? (
        <>
          {/* Seleccionar todos */}
          {amigos.length > 0 && (
            <TouchableOpacity style={styles.selectAllButton} onPress={selectAll}>
              <Ionicons 
                name={selectedAmigos.size === amigos.length ? 'checkbox' : 'square-outline'} 
                size={22} 
                color={COLORS.primary} 
              />
              <Text style={styles.selectAllText}>
                {selectedAmigos.size === amigos.length ? 'Deseleccionar todos' : 'Seleccionar todos'}
              </Text>
              <Text style={styles.selectedCount}>
                {selectedAmigos.size} seleccionados
              </Text>
            </TouchableOpacity>
          )}

          {/* Lista de amigos */}
          {loading ? (
            <View style={styles.centered}>
              <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
          ) : amigos.length > 0 ? (
            <FlatList
              data={amigos}
              renderItem={({ item }) => <AmigoCard amigo={item} />}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={64} color={COLORS.lightGray} />
              <Text style={styles.emptyTitle}>No tienes amigos aún</Text>
              <Text style={styles.emptyText}>
                Agrega amigos desde tu perfil para poder invitarlos a tus actividades
              </Text>
              <TouchableOpacity 
                style={styles.addFriendsButton}
                onPress={() => navigation.navigate('Friends')}
              >
                <Ionicons name="person-add" size={18} color={COLORS.white} />
                <Text style={styles.addFriendsButtonText}>Agregar amigos</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Botón invitar */}
          {amigos.length > 0 && (
            <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 12 }]}>
              {/* Selector de tiempo de cancelación compacto */}
              <TouchableOpacity 
                style={styles.cancelacionSelectorCompact}
                onPress={() => setShowTiempoCancelacionModal(true)}
              >
                <Ionicons name="time-outline" size={18} color={COLORS.primary} />
                <Text style={styles.cancelacionCompactText}>
                  Cancelar hasta: {TIEMPO_CANCELACION.find(t => t.id === tiempoCancelacion)?.label}
                </Text>
                <Ionicons name="chevron-down" size={16} color={COLORS.gray} />
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.invitarButton,
                  (selectedAmigos.size === 0 || sending) && styles.invitarButtonDisabled
                ]}
                onPress={handleInvitarAmigos}
                disabled={selectedAmigos.size === 0 || sending}
              >
                {sending ? (
                  <ActivityIndicator size="small" color={COLORS.white} />
                ) : (
                  <>
                    <Ionicons name="send" size={20} color={COLORS.white} />
                    <Text style={styles.invitarButtonText}>
                      Enviar {selectedAmigos.size > 0 ? `${selectedAmigos.size} ` : ''}invitaciones
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}
        </>
      ) : (
        /* Tab Invitación Pública */
        <ScrollView style={styles.publicaContent} showsVerticalScrollIndicator={false}>
          <View style={styles.publicaCard}>
            <View style={styles.publicaIconContainer}>
              <Ionicons name="megaphone-outline" size={48} color={COLORS.primary} />
            </View>
            <Text style={styles.publicaTitle}>¿Necesitas más participantes?</Text>
            <Text style={styles.publicaDescription}>
              Crea una invitación pública para que otros participantes de la app puedan solicitar unirse a tu actividad.
              Vos decidís a quién aceptar revisando su perfil.
            </Text>

            {/* Selector de cupos */}
            <View style={styles.cuposSection}>
              <Text style={styles.cuposLabel}>¿Cuántos participantes necesitas?</Text>
              <View style={styles.cuposSelector}>
                <TouchableOpacity
                  style={styles.cuposButton}
                  onPress={() => setCuposDisponibles(Math.max(1, cuposDisponibles - 1))}
                >
                  <Ionicons name="remove" size={24} color={COLORS.primary} />
                </TouchableOpacity>
                <Text style={styles.cuposNumber}>{cuposDisponibles}</Text>
                <TouchableOpacity
                  style={styles.cuposButton}
                  onPress={() => setCuposDisponibles(cuposDisponibles + 1)}
                >
                  <Ionicons name="add" size={24} color={COLORS.primary} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Selector de género */}
            <View style={styles.generoSection}>
              <Text style={styles.generoLabel}>Género requerido</Text>
              <View style={styles.generosContainer}>
                {GENEROS.map((genero) => (
                  <TouchableOpacity
                    key={genero.id}
                    style={[
                      styles.generoOption,
                      generoSeleccionado === genero.id && styles.generoOptionSelected
                    ]}
                    onPress={() => setGeneroSeleccionado(genero.id)}
                  >
                    <Ionicons 
                      name={genero.icon} 
                      size={24} 
                      color={generoSeleccionado === genero.id ? COLORS.white : COLORS.primary} 
                    />
                    <Text style={[
                      styles.generoText,
                      generoSeleccionado === genero.id && styles.generoTextSelected
                    ]}>
                      {genero.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Selector de tiempo límite de cancelación */}
            <View style={styles.cancelacionSection}>
              <Text style={styles.cancelacionLabel}>
                <Ionicons name="time-outline" size={16} color={COLORS.dark} /> Tiempo límite para cancelar
              </Text>
              <Text style={styles.cancelacionHint}>
                ¿Hasta cuándo pueden los invitados cancelar su participación?
              </Text>
              <TouchableOpacity 
                style={styles.cancelacionSelector}
                onPress={() => setShowTiempoCancelacionModal(true)}
              >
                <View style={styles.cancelacionSelectorLeft}>
                  <Ionicons name="hourglass-outline" size={22} color={COLORS.primary} />
                  <View>
                    <Text style={styles.cancelacionSelectorText}>
                      {TIEMPO_CANCELACION.find(t => t.id === tiempoCancelacion)?.label}
                    </Text>
                    <Text style={styles.cancelacionSelectorDesc}>
                      {TIEMPO_CANCELACION.find(t => t.id === tiempoCancelacion)?.description}
                    </Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color={COLORS.gray} />
              </TouchableOpacity>
            </View>

            {/* Botón crear invitación */}
            <TouchableOpacity
              style={[styles.crearInvitacionButton, sending && styles.crearInvitacionButtonDisabled]}
              onPress={handleCrearInvitacionPublica}
              disabled={sending}
            >
              {sending ? (
                <ActivityIndicator size="small" color={COLORS.white} />
              ) : (
                <>
                  <Ionicons name="globe" size={20} color={COLORS.white} />
                  <Text style={styles.crearInvitacionButtonText}>Crear invitación pública</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      )}

      {/* Modal de éxito */}
      <Modal
        visible={showSuccessModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {}}
      >
        <View style={styles.successModalOverlay}>
          <View style={styles.successModalContent}>
            <View style={styles.successIconContainer}>
              <Ionicons name="checkmark-circle" size={64} color={COLORS.primary} />
            </View>
            <Text style={styles.successTitle}>{successMessage.title}</Text>
            <Text style={styles.successSubtitle}>{successMessage.subtitle}</Text>
            <TouchableOpacity
              style={styles.successButton}
              onPress={() => {
                setShowSuccessModal(false);
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'Main', params: { screen: 'Reservas' } }],
                });
              }}
            >
              <Ionicons name="calendar" size={20} color={COLORS.white} />
              <Text style={styles.successButtonText}>Ver mis reservas</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal de selección de tiempo de cancelación */}
      <Modal
        visible={showTiempoCancelacionModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowTiempoCancelacionModal(false)}
      >
        <View style={styles.tiempoModalOverlay}>
          <View style={styles.tiempoModalContent}>
            <View style={styles.tiempoModalHeader}>
              <Text style={styles.tiempoModalTitle}>Tiempo límite de cancelación</Text>
              <TouchableOpacity onPress={() => setShowTiempoCancelacionModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.gray} />
              </TouchableOpacity>
            </View>
            <Text style={styles.tiempoModalSubtitle}>
              Los invitados podrán cancelar su participación hasta este tiempo antes de la actividad
            </Text>
            <ScrollView style={styles.tiempoModalList} showsVerticalScrollIndicator={true}>
              {TIEMPO_CANCELACION.map((tiempo) => (
                <TouchableOpacity
                  key={tiempo.id}
                  style={[
                    styles.tiempoOption,
                    tiempoCancelacion === tiempo.id && styles.tiempoOptionSelected
                  ]}
                  onPress={() => {
                    setTiempoCancelacion(tiempo.id);
                    setShowTiempoCancelacionModal(false);
                  }}
                >
                  <View style={styles.tiempoOptionLeft}>
                    <View style={[
                      styles.tiempoRadio,
                      tiempoCancelacion === tiempo.id && styles.tiempoRadioSelected
                    ]}>
                      {tiempoCancelacion === tiempo.id && (
                        <View style={styles.tiempoRadioInner} />
                      )}
                    </View>
                    <View>
                      <Text style={[
                        styles.tiempoOptionLabel,
                        tiempoCancelacion === tiempo.id && styles.tiempoOptionLabelSelected
                      ]}>
                        {tiempo.label}
                      </Text>
                      <Text style={styles.tiempoOptionDesc}>{tiempo.description}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
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
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 12,
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
  reservaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  reservaText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.black,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.gray,
  },
  tabTextActive: {
    color: COLORS.primary,
  },
  selectAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  selectAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
    flex: 1,
  },
  selectedCount: {
    fontSize: 13,
    color: COLORS.gray,
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  amigoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  amigoCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '08',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.lightGray,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarSelected: {
    backgroundColor: COLORS.primary,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.gray,
  },
  avatarTextSelected: {
    color: COLORS.white,
  },
  amigoInfo: {
    flex: 1,
    marginLeft: 12,
  },
  amigoNombre: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.black,
  },
  amigoAlias: {
    fontSize: 13,
    color: COLORS.gray,
    marginTop: 2,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.lightGray,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.black,
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.gray,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  addFriendsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginTop: 20,
    gap: 8,
  },
  addFriendsButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.white,
  },
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
  invitarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  invitarButtonDisabled: {
    opacity: 0.5,
  },
  invitarButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
  },
  // Invitación pública
  publicaContent: {
    flex: 1,
    padding: 16,
  },
  publicaCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  publicaIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  publicaTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.black,
    textAlign: 'center',
  },
  publicaDescription: {
    fontSize: 14,
    color: COLORS.gray,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  cuposSection: {
    width: '100%',
    marginTop: 24,
    alignItems: 'center',
  },
  cuposLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.black,
    marginBottom: 12,
  },
  cuposSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  cuposButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cuposNumber: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.primary,
    minWidth: 50,
    textAlign: 'center',
  },
  generoSection: {
    width: '100%',
    marginTop: 24,
  },
  generoLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.black,
    marginBottom: 12,
    textAlign: 'center',
  },
  generosContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  generoOption: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: COLORS.primary + '10',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  generoOptionSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  generoText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
    marginTop: 6,
  },
  generoTextSelected: {
    color: COLORS.white,
  },
  crearInvitacionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginTop: 24,
    width: '100%',
    gap: 8,
  },
  crearInvitacionButtonDisabled: {
    opacity: 0.5,
  },
  crearInvitacionButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
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
  successTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.black,
    marginBottom: 8,
    textAlign: 'center',
  },
  successSubtitle: {
    fontSize: 15,
    color: COLORS.gray,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  successButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    width: '100%',
  },
  successButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
  // Estilos del selector de tiempo de cancelación
  cancelacionSection: {
    width: '100%',
    marginTop: 24,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#E8E8E8',
  },
  cancelacionLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.dark,
    marginBottom: 4,
  },
  cancelacionHint: {
    fontSize: 13,
    color: COLORS.gray,
    marginBottom: 12,
  },
  cancelacionSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.background,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  cancelacionSelectorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cancelacionSelectorText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.dark,
  },
  cancelacionSelectorDesc: {
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 2,
  },
  // Estilos del modal de tiempo de cancelación
  tiempoModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  tiempoModalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 30,
    maxHeight: '70%',
  },
  tiempoModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  tiempoModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.dark,
  },
  tiempoModalSubtitle: {
    fontSize: 13,
    color: COLORS.gray,
    marginBottom: 16,
    lineHeight: 18,
  },
  tiempoModalList: {
    maxHeight: 320,
    marginBottom: 10,
  },
  tiempoOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: COLORS.background,
  },
  tiempoOptionSelected: {
    backgroundColor: COLORS.primary + '15',
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  tiempoOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  tiempoRadio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: COLORS.gray,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tiempoRadioSelected: {
    borderColor: COLORS.primary,
  },
  tiempoRadioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.primary,
  },
  tiempoOptionLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.dark,
  },
  tiempoOptionLabelSelected: {
    color: COLORS.primary,
  },
  tiempoOptionDesc: {
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 2,
  },
  // Selector compacto para tab amigos
  cancelacionSelectorCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.primary + '10',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginBottom: 12,
  },
  cancelacionCompactText: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.dark,
  },
});
