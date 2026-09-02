import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
  Switch,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants';
import {
  getUsuarioDetalle,
  toggleUsuarioActivo,
  eliminarUsuario,
} from '../../services/adminService';

export default function AdminUsuarioDetalleScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { id } = route.params;
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [usuario, setUsuario] = useState(null);

  const loadUsuario = async () => {
    try {
      setLoading(true);
      const response = await getUsuarioDetalle(id);
      if (response.success) {
        setUsuario(response.data);
      }
    } catch (error) {
      console.error('Error cargando usuario:', error);
      Alert.alert('Error', 'No se pudo cargar el usuario');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsuario();
  }, [id]);

  const handleToggleActivo = async () => {
    const nuevoEstado = !usuario.activo;
    const isProp = usuario?.rol === 'PROPIETARIO';
    
    Alert.alert(
      nuevoEstado ? 'Activar Usuario' : 'Desactivar Usuario',
      nuevoEstado 
        ? isProp 
          ? '¿Deseas activar este usuario? Se reactivarán los espacios que fueron pausados.' 
          : '¿Deseas activar este usuario?'
        : isProp
          ? '¿Deseas desactivar este usuario? No podrá acceder a la app y sus espacios serán pausados.'
          : '¿Deseas desactivar este usuario? No podrá acceder a la app.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: nuevoEstado ? 'Activar' : 'Desactivar',
          style: nuevoEstado ? 'default' : 'destructive',
          onPress: async () => {
            try {
              setSaving(true);
              // El backend manejará las canchas automáticamente
              await toggleUsuarioActivo(id, nuevoEstado);
              setUsuario(prev => ({ ...prev, activo: nuevoEstado }));
              loadUsuario(); // Recargar para ver estado actualizado de canchas
              Alert.alert(
                'Éxito', 
                nuevoEstado 
                  ? isProp ? 'Usuario activado y espacios reactivados' : 'Usuario activado'
                  : isProp ? 'Usuario desactivado y espacios pausados' : 'Usuario desactivado'
              );
            } catch (error) {
              Alert.alert('Error', 'No se pudo actualizar el usuario');
            } finally {
              setSaving(false);
            }
          }
        }
      ]
    );
  };

  const handleEliminar = () => {
    Alert.alert(
      'Eliminar Usuario',
      '¿Qué tipo de eliminación deseas realizar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Desactivar',
          onPress: () => confirmarEliminar(false),
        },
        {
          text: 'Eliminar Permanente',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              '¿Estás seguro?',
              'Esta acción no se puede deshacer. Se eliminarán todos los datos del usuario.',
              [
                { text: 'Cancelar', style: 'cancel' },
                {
                  text: 'Eliminar',
                  style: 'destructive',
                  onPress: () => confirmarEliminar(true),
                }
              ]
            );
          }
        }
      ]
    );
  };

  const confirmarEliminar = async (hardDelete) => {
    try {
      setSaving(true);
      await eliminarUsuario(id, hardDelete);
      Alert.alert('Éxito', hardDelete ? 'Usuario eliminado permanentemente' : 'Usuario desactivado');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'No se pudo eliminar el usuario');
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No definida';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const isPropietario = usuario?.rol === 'PROPIETARIO';
  const suscripcionVencida = isPropietario && usuario?.suscripcionFechaFin && 
    new Date(usuario.suscripcionFechaFin) < new Date();

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.dark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detalle Usuario</Text>
        <TouchableOpacity onPress={handleEliminar} style={styles.deleteBtn}>
          <Ionicons name="trash-outline" size={24} color={COLORS.danger} />
        </TouchableOpacity>
      </View>

      {saving && (
        <View style={styles.savingOverlay}>
          <ActivityIndicator color={COLORS.white} />
        </View>
      )}

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Perfil */}
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            {usuario.foto ? (
              <Image source={{ uri: usuario.foto }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons 
                  name={isPropietario ? 'business' : 'person'} 
                  size={48} 
                  color={COLORS.gray} 
                />
              </View>
            )}
            <View style={[
              styles.statusDot, 
              usuario.activo ? styles.statusActive : styles.statusInactive
            ]} />
          </View>
          
          <Text style={styles.userName}>{usuario.nombre} {usuario.apellido}</Text>
          <Text style={styles.userEmail}>{usuario.email}</Text>
          
          <View style={[styles.rolBadge, isPropietario ? styles.rolPropietario : styles.rolJugador]}>
            <Ionicons 
              name={isPropietario ? 'business' : 'person'} 
              size={16} 
              color={isPropietario ? '#FF9500' : COLORS.primary} 
            />
            <Text style={[styles.rolText, { color: isPropietario ? '#FF9500' : COLORS.primary }]}>
              {isPropietario ? 'Propietario' : 'Participante'}
            </Text>
          </View>
        </View>

        {/* Estado del Usuario */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Estado del Usuario</Text>
          
          <View style={styles.optionRow}>
            <View style={styles.optionInfo}>
              <Text style={styles.optionLabel}>Usuario Activo</Text>
              <Text style={styles.optionDescription}>
                {usuario.activo ? 'Puede acceder a la app' : 'No puede acceder a la app'}
              </Text>
            </View>
            <Switch
              value={usuario.activo}
              onValueChange={handleToggleActivo}
              trackColor={{ false: '#E5E5E5', true: COLORS.primary + '60' }}
              thumbColor={usuario.activo ? COLORS.primary : '#F4F4F4'}
            />
          </View>
        </View>

        {/* Información */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Información</Text>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Teléfono</Text>
            <Text style={styles.infoValue}>{usuario.telefono || 'No registrado'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Ciudad</Text>
            <Text style={styles.infoValue}>{usuario.ciudad || 'No registrada'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Registrado</Text>
            <Text style={styles.infoValue}>{formatDate(usuario.createdAt)}</Text>
          </View>
          {!isPropietario && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Total Reservas</Text>
              <Text style={styles.infoValue}>{usuario._count?.reservas}</Text>
            </View>
          )}
        </View>

        {/* Canchas (solo propietarios) */}
        {isPropietario && usuario.canchasPropiedad?.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Espacios ({usuario.canchasPropiedad.length})
            </Text>
            
            {usuario.canchasPropiedad.map(cancha => (
              <View key={cancha.id} style={styles.canchaItem}>
                <View style={styles.canchaInfo}>
                  <Text style={styles.canchaName}>{cancha.nombre}</Text>
                  <Text style={styles.canchaCiudad}>{cancha.ciudad}</Text>
                </View>
                <View style={[
                  styles.canchaStatus,
                  cancha.activa ? styles.canchaActiva : styles.canchaInactiva
                ]}>
                  <Text style={styles.canchaStatusText}>
                    {cancha.activa ? 'Activa' : 'Pausada'}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F7',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
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
  deleteBtn: {
    padding: 8,
  },
  savingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  content: {
    flex: 1,
  },
  profileSection: {
    backgroundColor: COLORS.white,
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 20,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F5F5F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusDot: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 3,
    borderColor: COLORS.white,
  },
  statusActive: {
    backgroundColor: '#34C759',
  },
  statusInactive: {
    backgroundColor: COLORS.danger,
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.dark,
  },
  userEmail: {
    fontSize: 15,
    color: COLORS.gray,
    marginTop: 4,
  },
  rolBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 12,
  },
  rolJugador: {
    backgroundColor: COLORS.primary + '20',
  },
  rolPropietario: {
    backgroundColor: '#FF950020',
  },
  rolText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  section: {
    backgroundColor: COLORS.white,
    marginTop: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.dark,
    marginBottom: 16,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F7',
  },
  optionInfo: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.dark,
  },
  optionDescription: {
    fontSize: 13,
    color: COLORS.gray,
    marginTop: 2,
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    padding: 12,
    borderRadius: 8,
    marginVertical: 12,
  },
  warningText: {
    color: '#FF9500',
    fontWeight: '500',
    marginLeft: 8,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F7',
  },
  dateInfo: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 14,
    color: COLORS.gray,
  },
  dateValue: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.dark,
    marginTop: 2,
  },
  dateExpired: {
    color: COLORS.danger,
  },
  notasRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  notasInfo: {
    flex: 1,
  },
  notasLabel: {
    fontSize: 14,
    color: COLORS.gray,
  },
  notasValue: {
    fontSize: 15,
    color: COLORS.dark,
    marginTop: 4,
  },
  canchaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F7',
  },
  canchaInfo: {
    flex: 1,
  },
  canchaName: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.dark,
  },
  canchaCiudad: {
    fontSize: 13,
    color: COLORS.gray,
    marginTop: 2,
  },
  canchaStatus: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  canchaActiva: {
    backgroundColor: '#E8F5E9',
  },
  canchaInactiva: {
    backgroundColor: '#FFEBEE',
  },
  canchaStatusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  canchasActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    gap: 12,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  actionBtnDanger: {
    borderColor: COLORS.danger,
    backgroundColor: '#FFEBEE',
  },
  actionBtnSuccess: {
    borderColor: '#34C759',
    backgroundColor: '#E8F5E9',
  },
  actionBtnText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F7',
  },
  infoLabel: {
    fontSize: 15,
    color: COLORS.gray,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.dark,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.dark,
  },
  notasInput: {
    backgroundColor: '#F5F5F7',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    minHeight: 150,
  },
  saveBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  saveBtnText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  whatsappButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#25D366',
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 16,
    gap: 10,
  },
  whatsappButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
});
