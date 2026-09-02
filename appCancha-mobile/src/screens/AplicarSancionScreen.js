import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Image,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants';
import { sancionService } from '../services/sancionService';
import api from '../services/api';

const TIPOS_SANCION = [
  {
    tipo: 'BANEADO',
    label: '🚫 Baneado',
    description: 'No podrá reservar en tu espacio nunca más',
    icon: 'ban',
    color: '#E53935',
    bgColor: '#FFEBEE',
  },
  {
    tipo: 'ADVERTIDO',
    label: '⚠️ Fuera de Juego',
    description: 'Recibirá una advertencia y será marcado en la app',
    icon: 'warning',
    color: '#FF9800',
    bgColor: '#FFF3E0',
  },
  {
    tipo: 'OBSERVADO',
    label: '👁️ En Observación',
    description: 'Recibirás una alerta cuando este participante reserve',
    icon: 'eye',
    color: '#2196F3',
    bgColor: '#E3F2FD',
  },
];

const MOTIVOS_RAPIDOS = [
  'Faltó sin avisar',
  'Llegó muy tarde',
  'Mala conducta durante la actividad',
  'No pagó la reserva',
  'Dañó instalaciones',
  'Comportamiento agresivo',
  'Otro motivo',
];

export default function AplicarSancionScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { jugador: jugadorParam, sancionExistente } = route.params || {};
  
  const [step, setStep] = useState(jugadorParam ? 2 : 1); // 1: buscar jugador, 2: aplicar sanción
  const [searchQuery, setSearchQuery] = useState('');
  const [jugadores, setJugadores] = useState([]);
  const [jugadoresMisCanchas, setJugadoresMisCanchas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  
  // Datos de la sanción
  const [selectedJugador, setSelectedJugador] = useState(jugadorParam || null);
  const [selectedTipo, setSelectedTipo] = useState(sancionExistente?.tipo || null);
  const [motivo, setMotivo] = useState(sancionExistente?.motivo || '');
  const [selectedCancha, setSelectedCancha] = useState(sancionExistente?.canchaId || null);
  const [misCanchas, setMisCanchas] = useState([]);

  useEffect(() => {
    loadJugadoresMisCanchas();
    loadMisCanchas();
  }, []);

  useEffect(() => {
    if (searchQuery.length >= 3) {
      buscarJugadores();
    } else {
      setJugadores([]);
    }
  }, [searchQuery]);

  const loadJugadoresMisCanchas = async () => {
    try {
      setLoading(true);
      const response = await sancionService.getJugadoresMisCanchas();
      if (response.success) {
        setJugadoresMisCanchas(response.data || []);
      }
    } catch (error) {
      console.error('Error cargando jugadores:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMisCanchas = async () => {
    try {
      const response = await api.get('/canchas/mis-canchas');
      if (response.data.success) {
        setMisCanchas(response.data.data || []);
      }
    } catch (error) {
      console.error('Error cargando canchas:', error);
    }
  };

  const buscarJugadores = async () => {
    try {
      setSearchLoading(true);
      const response = await sancionService.buscarJugadores(searchQuery);
      if (response.success) {
        setJugadores(response.data || []);
      }
    } catch (error) {
      console.error('Error buscando jugadores:', error);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSelectJugador = (jugador) => {
    setSelectedJugador(jugador);
    setSelectedTipo(jugador.sancionActual?.tipo || null);
    setMotivo(jugador.sancionActual?.motivo || '');
    setStep(2);
  };

  const handleMotivoRapido = (motivoRapido) => {
    if (motivoRapido === 'Otro motivo') {
      setMotivo('');
    } else {
      setMotivo(motivoRapido);
    }
  };

  const handleAplicarSancion = async () => {
    if (!selectedTipo) {
      Alert.alert('Error', 'Selecciona un tipo de sanción');
      return;
    }
    if (!motivo.trim()) {
      Alert.alert('Error', 'Escribe el motivo de la sanción');
      return;
    }

    try {
      setSaving(true);
      const response = await sancionService.crearSancion({
        jugadorId: selectedJugador.id,
        tipo: selectedTipo,
        motivo: motivo.trim(),
        canchaId: selectedCancha,
      });

      if (response.success) {
        const mensaje = selectedTipo === 'ADVERTIDO' 
          ? 'Se le ha enviado una notificación de advertencia.' 
          : selectedTipo === 'BANEADO' 
            ? 'No podrá reservar en tus espacios.' 
            : 'Recibirás alertas cuando reserve.';
        setSuccessMessage(mensaje);
        setShowSuccessModal(true);
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo aplicar la sanción');
    } finally {
      setSaving(false);
    }
  };

  const renderJugadorItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.jugadorCard,
        item.sancionActual && { borderLeftWidth: 4, borderLeftColor: 
          item.sancionActual.tipo === 'BANEADO' ? '#E53935' :
          item.sancionActual.tipo === 'ADVERTIDO' ? '#FF9800' : '#2196F3'
        }
      ]}
      onPress={() => handleSelectJugador(item)}
    >
      {item.foto ? (
        <Image source={{ uri: item.foto }} style={styles.jugadorAvatar} />
      ) : (
        <View style={styles.jugadorAvatarPlaceholder}>
          <Ionicons name="person" size={24} color={COLORS.gray} />
        </View>
      )}
      <View style={styles.jugadorInfo}>
        <Text style={styles.jugadorName}>{item.nombre} {item.apellido}</Text>
        <Text style={styles.jugadorEmail}>{item.email}</Text>
        {item.sancionActual && (
          <Text style={[styles.sancionActual, { 
            color: item.sancionActual.tipo === 'BANEADO' ? '#E53935' :
                   item.sancionActual.tipo === 'ADVERTIDO' ? '#FF9800' : '#2196F3'
          }]}>
            Ya tiene sanción: {item.sancionActual.tipo}
          </Text>
        )}
      </View>
      <Ionicons name="chevron-forward" size={20} color={COLORS.gray} />
    </TouchableOpacity>
  );

  // Step 1: Seleccionar jugador
  if (step === 1) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={COLORS.dark} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Aplicar Sanción</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={COLORS.gray} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar participante por nombre o email..."
            placeholderTextColor={COLORS.gray}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
          />
          {searchLoading && <ActivityIndicator size="small" color={COLORS.primary} />}
        </View>

        {searchQuery.length >= 3 && jugadores.length > 0 ? (
          <FlatList
            data={jugadores}
            renderItem={renderJugadorItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            ListHeaderComponent={
              <Text style={styles.sectionLabel}>Resultados de búsqueda</Text>
            }
          />
        ) : (
          <FlatList
            data={jugadoresMisCanchas}
            renderItem={renderJugadorItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            ListHeaderComponent={
              loading ? (
                <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
              ) : (
                <Text style={styles.sectionLabel}>Participantes que han reservado en tus espacios</Text>
              )
            }
            ListEmptyComponent={
              !loading && (
                <View style={styles.emptySearch}>
                  <Ionicons name="people-outline" size={48} color={COLORS.gray} />
                  <Text style={styles.emptySearchText}>
                    Busca un participante por nombre o email para aplicar una sanción
                  </Text>
                </View>
              )
            }
          />
        )}
      </View>
    );
  }

  // Step 2: Configurar sanción
  return (
    <KeyboardAvoidingView 
      style={[styles.container, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => jugadorParam ? navigation.goBack() : setStep(1)} 
          style={styles.backBtn}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.dark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {sancionExistente ? 'Editar Sanción' : 'Aplicar Sanción'}
        </Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Jugador seleccionado */}
        <View style={styles.selectedJugador}>
          {selectedJugador?.foto ? (
            <Image source={{ uri: selectedJugador.foto }} style={styles.selectedAvatar} />
          ) : (
            <View style={styles.selectedAvatarPlaceholder}>
              <Ionicons name="person" size={32} color={COLORS.gray} />
            </View>
          )}
          <View style={styles.selectedInfo}>
            <Text style={styles.selectedName}>
              {selectedJugador?.nombre} {selectedJugador?.apellido}
            </Text>
            <Text style={styles.selectedEmail}>{selectedJugador?.email}</Text>
          </View>
        </View>

        {/* Tipo de sanción */}
        <Text style={styles.sectionTitle}>Tipo de Sanción</Text>
        {TIPOS_SANCION.map((tipo) => (
          <TouchableOpacity
            key={tipo.tipo}
            style={[
              styles.tipoCard,
              { backgroundColor: tipo.bgColor },
              selectedTipo === tipo.tipo && styles.tipoCardSelected,
              selectedTipo === tipo.tipo && { borderColor: tipo.color }
            ]}
            onPress={() => setSelectedTipo(tipo.tipo)}
          >
            <View style={styles.tipoHeader}>
              <Ionicons name={tipo.icon} size={24} color={tipo.color} />
              <Text style={[styles.tipoLabel, { color: tipo.color }]}>{tipo.label}</Text>
              {selectedTipo === tipo.tipo && (
                <Ionicons name="checkmark-circle" size={24} color={tipo.color} />
              )}
            </View>
            <Text style={styles.tipoDescription}>{tipo.description}</Text>
          </TouchableOpacity>
        ))}

        {/* Motivos rápidos */}
        <Text style={styles.sectionTitle}>Motivo</Text>
        <View style={styles.motivosRapidos}>
          {MOTIVOS_RAPIDOS.map((m) => (
            <TouchableOpacity
              key={m}
              style={[
                styles.motivoChip,
                motivo === m && styles.motivoChipSelected
              ]}
              onPress={() => handleMotivoRapido(m)}
            >
              <Text style={[
                styles.motivoChipText,
                motivo === m && styles.motivoChipTextSelected
              ]}>
                {m}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TextInput
          style={styles.motivoInput}
          placeholder="Describe el motivo de la sanción..."
          placeholderTextColor={COLORS.gray}
          value={motivo}
          onChangeText={setMotivo}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />

        {/* Cancha específica (opcional) */}
        {misCanchas.length > 1 && (
          <>
            <Text style={styles.sectionTitle}>Aplicar en (opcional)</Text>
            <View style={styles.canchasContainer}>
              <TouchableOpacity
                style={[
                  styles.canchaChip,
                  !selectedCancha && styles.canchaChipSelected
                ]}
                onPress={() => setSelectedCancha(null)}
              >
                <Text style={[
                  styles.canchaChipText,
                  !selectedCancha && styles.canchaChipTextSelected
                ]}>
                  Todas mis canchas
                </Text>
              </TouchableOpacity>
              {misCanchas.map((cancha) => (
                <TouchableOpacity
                  key={cancha.id}
                  style={[
                    styles.canchaChip,
                    selectedCancha === cancha.id && styles.canchaChipSelected
                  ]}
                  onPress={() => setSelectedCancha(cancha.id)}
                >
                  <Text style={[
                    styles.canchaChipText,
                    selectedCancha === cancha.id && styles.canchaChipTextSelected
                  ]}>
                    {cancha.nombre}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Botón de aplicar */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity
          style={[
            styles.applyButton,
            (!selectedTipo || !motivo.trim()) && styles.applyButtonDisabled
          ]}
          onPress={handleAplicarSancion}
          disabled={!selectedTipo || !motivo.trim() || saving}
        >
          {saving ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <>
              <Ionicons name="shield-checkmark" size={20} color={COLORS.white} />
              <Text style={styles.applyButtonText}>
                {sancionExistente ? 'Actualizar Sanción' : 'Aplicar Sanción'}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Modal de Éxito */}
      <Modal
        visible={showSuccessModal}
        transparent
        animationType="fade"
        onRequestClose={() => {}}
      >
        <View style={styles.successModalOverlay}>
          <View style={styles.successModalContent}>
            <View style={styles.successIconContainer}>
              <Ionicons name="checkmark-circle" size={60} color="#4CAF50" />
            </View>
            <Text style={styles.successTitle}>¡Sanción Aplicada!</Text>
            <Text style={styles.successSubtitle}>
              {selectedJugador?.nombre} ha sido sancionado
            </Text>
            <Text style={styles.successMessage}>{successMessage}</Text>
            <TouchableOpacity
              style={styles.successButton}
              onPress={() => {
                setShowSuccessModal(false);
                navigation.goBack();
              }}
            >
              <Text style={styles.successButtonText}>Aceptar</Text>
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
  placeholder: {
    width: 40,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: COLORS.dark,
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.gray,
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  jugadorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
  },
  jugadorAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  jugadorAvatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F5F5F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  jugadorInfo: {
    flex: 1,
    marginLeft: 12,
  },
  jugadorName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.dark,
  },
  jugadorEmail: {
    fontSize: 13,
    color: COLORS.gray,
    marginTop: 2,
  },
  sancionActual: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  emptySearch: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptySearchText: {
    fontSize: 14,
    color: COLORS.gray,
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  selectedJugador: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 16,
    marginBottom: 24,
  },
  selectedAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  selectedAvatarPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F5F5F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedInfo: {
    marginLeft: 16,
    flex: 1,
  },
  selectedName: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.dark,
  },
  selectedEmail: {
    fontSize: 14,
    color: COLORS.gray,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.dark,
    marginBottom: 12,
    marginTop: 8,
  },
  tipoCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  tipoCardSelected: {
    borderWidth: 2,
  },
  tipoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  tipoLabel: {
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 10,
    flex: 1,
  },
  tipoDescription: {
    fontSize: 13,
    color: COLORS.dark,
    marginLeft: 34,
    opacity: 0.8,
  },
  motivosRapidos: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
    gap: 8,
  },
  motivoChip: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  motivoChipSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  motivoChipText: {
    fontSize: 13,
    color: COLORS.dark,
  },
  motivoChipTextSelected: {
    color: COLORS.white,
    fontWeight: '600',
  },
  motivoInput: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: COLORS.dark,
    minHeight: 100,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  canchasContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  canchaChip: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  canchaChipSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  canchaChipText: {
    fontSize: 13,
    color: COLORS.dark,
  },
  canchaChipTextSelected: {
    color: COLORS.white,
    fontWeight: '600',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  applyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E53935',
    paddingVertical: 16,
    borderRadius: 12,
  },
  applyButtonDisabled: {
    backgroundColor: '#BDBDBD',
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
    marginLeft: 8,
  },
  // Estilos del Modal de Éxito
  successModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  successModalContent: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    width: '100%',
    maxWidth: 320,
  },
  successIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#4CAF50',
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.dark,
    marginBottom: 8,
    textAlign: 'center',
  },
  successMessage: {
    fontSize: 14,
    color: COLORS.gray,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  successButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 14,
    paddingHorizontal: 48,
    borderRadius: 12,
    width: '100%',
  },
  successButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
});
