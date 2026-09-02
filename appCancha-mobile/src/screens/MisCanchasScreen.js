import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  ImageBackground,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../constants';
import api from '../services/api';

export default function MisCanchasScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [canchas, setCanchas] = useState([]);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedCanchas, setSelectedCanchas] = useState(new Set());
  const [deleting, setDeleting] = useState(false);
  
  // Modal de feedback
  const [feedbackModal, setFeedbackModal] = useState({ visible: false, type: '', message: '', title: '' });
  // Modal de confirmación
  const [confirmModal, setConfirmModal] = useState({ visible: false, title: '', message: '', onConfirm: null });

  useEffect(() => {
    loadCanchas();
  }, []);

  const loadCanchas = async () => {
    try {
      setLoading(true);
      const response = await api.get('/canchas/mis-canchas');
      if (response.data.success) {
        setCanchas(response.data.data);
      }
    } catch (error) {
      console.error('Error loading canchas:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadCanchas();
  };

  const toggleSelection = (canchaId) => {
    const newSelected = new Set(selectedCanchas);
    if (newSelected.has(canchaId)) {
      newSelected.delete(canchaId);
    } else {
      newSelected.add(canchaId);
    }
    setSelectedCanchas(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedCanchas.size === canchas.length) {
      setSelectedCanchas(new Set());
    } else {
      const allIds = new Set(canchas.map(c => c.id));
      setSelectedCanchas(allIds);
    }
  };

  const deleteSelectedCanchas = () => {
    if (selectedCanchas.size === 0) return;

    const count = selectedCanchas.size;
    setConfirmModal({
      visible: true,
      title: 'Eliminar Espacios',
      message: `¿Estás seguro de que quieres eliminar permanentemente ${count} espacio${count > 1 ? 's' : ''}?\n\nEsta acción es irreversible y eliminará toda la información relacionada.`,
      onConfirm: async () => {
        setConfirmModal({ ...confirmModal, visible: false });
        setDeleting(true);
        try {
          let deletedCount = 0;
          for (const canchaId of selectedCanchas) {
            const response = await api.delete(`/canchas/${canchaId}`);
            if (response.data.success) {
              deletedCount++;
            }
          }
          setFeedbackModal({
            visible: true,
            type: 'success',
            title: '¡Listo!',
            message: `${deletedCount} espacio${deletedCount > 1 ? 's' : ''} eliminado${deletedCount > 1 ? 's' : ''} correctamente`
          });
          setSelectionMode(false);
          setSelectedCanchas(new Set());
          loadCanchas();
        } catch (error) {
          console.error('Error deleting canchas:', error);
          setFeedbackModal({
            visible: true,
            type: 'error',
            title: 'Error',
            message: 'No se pudieron eliminar todos los espacios'
          });
        } finally {
          setDeleting(false);
        }
      }
    });
  };

  const exitSelectionMode = () => {
    setSelectionMode(false);
    setSelectedCanchas(new Set());
  };

  const eliminarCancha = (canchaId, nombreCancha) => {
    setConfirmModal({
      visible: true,
      title: 'Eliminar Espacio',
      message: `¿Estás seguro de que quieres eliminar permanentemente "${nombreCancha}"?\n\nEsta acción es irreversible y eliminará toda la información relacionada con este espacio.`,
      onConfirm: async () => {
        setConfirmModal({ ...confirmModal, visible: false });
        setDeleting(true);
        try {
          const response = await api.delete(`/canchas/${canchaId}`);
          if (response.data.success) {
            setFeedbackModal({
              visible: true,
              type: 'success',
              title: '¡Listo!',
              message: 'Espacio eliminado correctamente'
            });
            loadCanchas();
          }
        } catch (error) {
          console.error('Error deleting cancha:', error);
          setFeedbackModal({
            visible: true,
            type: 'error',
            title: 'Error',
            message: 'No se pudo eliminar el espacio'
          });
        } finally {
          setDeleting(false);
        }
      }
    });
  };

  const getDeporteIcon = (deporte) => {
    const icons = {
      FUTBOL_4: 'football',
      FUTBOL_5: 'football',
      FUTBOL_6: 'football',
      FUTBOL_7: 'football',
      FUTBOL_8: 'football',
      FUTBOL_9: 'football',
      FUTBOL_11: 'football',
      PADEL: 'tennisball',
      FUTSAL: 'football',
      VOLEY: 'ball',
      VOLEY_PLAYA: 'ball',
      NEWCOM: 'ball',
      TENIS_SINGLES: 'tennisball',
      TENIS_DOBLES: 'tennisball',
      BASQUET: 'basketball',
      NATACION: 'water',
      GIMNASIO: 'fitness',
      YOGA: 'meditate',
      PILATES: 'body',
      OTRO: 'ellipse',
    };
    return icons[deporte] || 'ellipse';
  };

  const renderCanchaCard = ({ item }) => {
    const isSelected = selectedCanchas.has(item.id);
    const imageUri = item.imagenPrincipal || (item.imagenes && item.imagenes.length > 0 ? item.imagenes[0] : null);

    const CardContent = () => (
      <LinearGradient
        colors={['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.75)']}
        style={styles.cardGradient}
      >
        {selectionMode && (
          <View style={styles.checkboxOverlay}>
            <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
              {isSelected && <Ionicons name="checkmark" size={16} color={COLORS.white} />}
            </View>
          </View>
        )}

        <View style={styles.canchaStatus}>
          <View style={[styles.statusDot, { backgroundColor: item.activa ? '#4CAF50' : '#FF6B6B' }]} />
          <Text style={styles.statusText}>{item.activa ? 'Activa' : 'Inactiva'}</Text>
        </View>

        <View style={styles.canchaContent}>
          <Text style={styles.canchaName}>{item.nombre}</Text>
          
          <View style={styles.canchaDetails}>
            <View style={styles.detailItem}>
              <Ionicons name="location" size={13} color="rgba(255,255,255,0.8)" />
              <Text style={styles.detailText} numberOfLines={1}>
                {[item.ciudad, item.provincia].filter(Boolean).join(', ')}
              </Text>
            </View>
            <View style={styles.detailItem}>
              <Ionicons name="people" size={13} color="rgba(255,255,255,0.8)" />
              <Text style={styles.detailText}>{item.capacidadJugadores} participantes</Text>
            </View>
          </View>

          <View style={styles.canchaFooter}>
            <Text style={styles.canchaPrice}>${item.precioPorHora.toLocaleString()}/hora</Text>
            {!selectionMode && (
              <View style={styles.canchaActions}>
                <TouchableOpacity 
                  style={styles.actionIcon}
                  onPress={() => navigation.navigate('EditCancha', { canchaId: item.id })}
                >
                  <Ionicons name="create-outline" size={18} color={COLORS.white} />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.actionIcon, styles.deleteIcon]}
                  onPress={() => eliminarCancha(item.id, item.nombre)}
                >
                  <Ionicons name="trash-outline" size={18} color={COLORS.white} />
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </LinearGradient>
    );

    return (
      <TouchableOpacity 
        style={[
          styles.canchaCard, 
          selectionMode && styles.canchaCardSelectionMode,
          selectionMode && isSelected && styles.canchaCardSelected
        ]}
        onPress={() => {
          if (selectionMode) {
            toggleSelection(item.id);
          } else {
            navigation.navigate('CanchaDetail', { canchaId: item.id });
          }
        }}
        activeOpacity={0.85}
      >
        {imageUri ? (
          <ImageBackground 
            source={{ uri: imageUri }}
            style={styles.cardBackground}
            imageStyle={styles.cardBackgroundImage}
            resizeMode="cover"
          >
            <CardContent />
          </ImageBackground>
        ) : (
          <View style={[styles.cardBackground, { backgroundColor: COLORS.primary }]}>
            <CardContent />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => selectionMode ? exitSelectionMode() : navigation.goBack()}>
          <Ionicons name={selectionMode ? "close" : "arrow-back"} size={24} color={COLORS.dark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {selectionMode ? `${selectedCanchas.size} seleccionado${selectedCanchas.size !== 1 ? 's' : ''}` : 'Mis Espacios'}
        </Text>
        <View style={styles.headerRightButtons}>
          {!selectionMode && (
            <TouchableOpacity 
              style={styles.deleteHeaderButton}
              onPress={() => {
                setSelectionMode(true);
              }}
            >
              <Ionicons name="trash-outline" size={20} color="#FF6B6B" />
            </TouchableOpacity>
          )}
          {selectionMode && (
            <TouchableOpacity 
              style={styles.selectAllButton}
              onPress={toggleSelectAll}
            >
              <Ionicons 
                name={selectedCanchas.size === canchas.length ? "checkbox" : "checkbox-outline"} 
                size={22} 
                color={selectedCanchas.size === canchas.length ? COLORS.primary : COLORS.dark} 
              />
              <Text style={styles.selectAllText}>Todas</Text>
            </TouchableOpacity>
          )}
          {!selectionMode && (
            <TouchableOpacity 
              style={styles.addButton}
              onPress={() => navigation.navigate('AddCancha')}
            >
              <Ionicons name="add" size={24} color={COLORS.white} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {canchas.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="business-outline" size={80} color={COLORS.gray} />
          <Text style={styles.emptyTitle}>No tienes espacios registrados</Text>
          <Text style={styles.emptyText}>Agrega tu primer espacio para comenzar</Text>
          <TouchableOpacity 
            style={styles.addFirstButton}
            onPress={() => navigation.navigate('AddCancha')}
          >
            <Text style={styles.addFirstButtonText}>Agregar Espacio</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <FlatList
            data={canchas}
            renderItem={renderCanchaCard}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          />
          {selectionMode && selectedCanchas.size > 0 && (
            <View style={[styles.deletionBar, { paddingBottom: insets.bottom + 10 }]}>
              <TouchableOpacity 
                style={[styles.deleteButton, deleting && styles.deleteButtonDisabled]}
                onPress={deleteSelectedCanchas}
                disabled={deleting}
              >
                {deleting ? (
                  <ActivityIndicator size="small" color={COLORS.white} />
                ) : (
                  <Ionicons name="trash" size={20} color={COLORS.white} />
                )}
                <Text style={styles.deleteButtonText}>
                  {deleting ? 'Eliminando...' : 'Borrar seleccionadas'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </>
      )}
      {/* Modal de Confirmación */}
      <Modal
        visible={confirmModal.visible}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmModal({ ...confirmModal, visible: false })}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.confirmModalContent}>
            <View style={styles.confirmIconContainer}>
              <Ionicons name="warning-outline" size={40} color="#FF6B6B" />
            </View>
            <Text style={styles.confirmTitle}>{confirmModal.title}</Text>
            <Text style={styles.confirmMessage}>{confirmModal.message}</Text>
            <View style={styles.confirmButtons}>
              <TouchableOpacity
                style={styles.confirmCancelButton}
                onPress={() => setConfirmModal({ ...confirmModal, visible: false })}
              >
                <Text style={styles.confirmCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmDeleteButton}
                onPress={confirmModal.onConfirm}
              >
                <Text style={styles.confirmDeleteText}>Eliminar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de Feedback */}
      <Modal
        visible={feedbackModal.visible}
        transparent
        animationType="fade"
        onRequestClose={() => setFeedbackModal({ ...feedbackModal, visible: false })}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.feedbackModalContent}>
            <View style={[
              styles.feedbackIconContainer,
              feedbackModal.type === 'success' ? styles.feedbackIconSuccess : styles.feedbackIconError
            ]}>
              <Ionicons 
                name={feedbackModal.type === 'success' ? 'checkmark-circle' : 'close-circle'} 
                size={50} 
                color={COLORS.white} 
              />
            </View>
            <Text style={styles.feedbackTitle}>{feedbackModal.title}</Text>
            <Text style={styles.feedbackMessage}>{feedbackModal.message}</Text>
            <TouchableOpacity
              style={[
                styles.feedbackButton,
                feedbackModal.type === 'success' ? styles.feedbackButtonSuccess : styles.feedbackButtonError
              ]}
              onPress={() => setFeedbackModal({ ...feedbackModal, visible: false })}
            >
              <Text style={styles.feedbackButtonText}>Entendido</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Overlay de carga */}
      {deleting && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.background,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.dark,
    flex: 1,
    textAlign: 'center',
  },
  headerRightButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  deleteHeaderButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    padding: 20,
  },
  canchaCard: {
    backgroundColor: COLORS.white,
    borderRadius: 15,
    marginBottom: 15,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  canchaCardSelectionMode: {
    borderWidth: 2,
    borderColor: COLORS.background,
  },
  canchaCardSelected: {
    borderWidth: 2,
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '08',
  },
  checkboxOverlay: {
    position: 'absolute',
    top: 10,
    left: 10,
    zIndex: 10,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  cardBackground: {
    width: '100%',
    aspectRatio: 16/9,
  },
  cardBackgroundImage: {
    borderRadius: 15,
    resizeMode: 'cover',
  },
  cardGradient: {
    flex: 1,
    padding: 14,
    justifyContent: 'space-between',
    borderRadius: 15,
  },
  canchaStatus: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 5,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.dark,
  },
  canchaContent: {
    marginTop: 'auto',
  },
  canchaName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: 6,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  canchaDetails: {
    marginBottom: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
  },
  detailText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
    marginLeft: 5,
    flex: 1,
  },
  canchaFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  canchaPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.white,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  canchaActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteIcon: {
    backgroundColor: 'rgba(255,107,107,0.7)',
  },
  checkboxSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginTop: 20,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.gray,
    textAlign: 'center',
    marginBottom: 30,
  },
  addFirstButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 12,
  },
  addFirstButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  deletionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.background,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  deleteButton: {
    flexDirection: 'row',
    backgroundColor: '#FF6B6B',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  deleteButtonDisabled: {
    opacity: 0.7,
  },
  deleteButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  selectAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  selectAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.dark,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  confirmModalContent: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
  },
  confirmIconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#FFF0F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  confirmTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginBottom: 12,
    textAlign: 'center',
  },
  confirmMessage: {
    fontSize: 15,
    color: COLORS.gray,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  confirmButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  confirmCancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: COLORS.background,
    alignItems: 'center',
  },
  confirmCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.dark,
  },
  confirmDeleteButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#FF6B6B',
    alignItems: 'center',
  },
  confirmDeleteText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
  feedbackModalContent: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
  },
  feedbackIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  feedbackIconSuccess: {
    backgroundColor: '#4CAF50',
  },
  feedbackIconError: {
    backgroundColor: '#FF6B6B',
  },
  feedbackTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginBottom: 8,
    textAlign: 'center',
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
  feedbackButtonSuccess: {
    backgroundColor: '#4CAF50',
  },
  feedbackButtonError: {
    backgroundColor: '#FF6B6B',
  },
  feedbackButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});