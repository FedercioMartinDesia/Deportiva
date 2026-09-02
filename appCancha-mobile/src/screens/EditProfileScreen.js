import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  ScrollView,
  Image,
  Animated,
  Modal,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../constants';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { uploadImage } from '../services/uploadService';

export default function EditProfileScreen({ navigation }) {
  const { user, updateUser, logout } = useAuth();
  const insets = useSafeAreaInsets();
  const isPropietario = user?.rol === 'PROPIETARIO';

  const [formData, setFormData] = useState({
    nombre: user?.nombre || '',
    apellido: user?.apellido || '',
    alias: user?.alias || '',
    email: user?.email || '',
    ciudad: user?.ciudad || '',
    provincia: user?.provincia || '',
    pais: user?.pais || '',
    foto: user?.foto || null,
  });
  const [loading, setLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [scrollOffset, setScrollOffset] = useState(0);
  const [contentHeight, setContentHeight] = useState(0);
  const [scrollHeight, setScrollHeight] = useState(0);
  const [successModalVisible, setSuccessModalVisible] = useState(false);

  // Teléfonos extras del propietario (formato: { numero: '', alias: '' })
  const parseExtrasFromUser = () => {
    if (!user?.telefonosExtras) return [];
    try {
      return JSON.parse(user.telefonosExtras);
    } catch {
      return [];
    }
  };
  const [telefonosExtras, setTelefonosExtras] = useState(parseExtrasFromUser());

  const addTelefonoExtra = () => {
    if (telefonosExtras.length >= 3) {
      Alert.alert('Límite', 'Máximo 3 teléfonos extras');
      return;
    }
    setTelefonosExtras([...telefonosExtras, { numero: '', alias: '' }]);
    setHasChanges(true);
  };

  const updateTelefonoExtra = (index, field, value) => {
    const nuevos = [...telefonosExtras];
    nuevos[index][field] = value;
    setTelefonosExtras(nuevos);
    setHasChanges(true);
  };

  const removeTelefonoExtra = (index) => {
    setTelefonosExtras(telefonosExtras.filter((_, i) => i !== index));
    setHasChanges(true);
  };

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso requerido', 'Necesitamos acceso a tus fotos para cambiar la imagen de perfil');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets?.length > 0) {
      const uri = result.assets[0].uri;
      setFormData((prev) => ({ ...prev, foto: uri }));
      setHasChanges(true);
    }
  };

  const handleSave = async () => {
    const { nombre, apellido, email } = formData;
    if (!nombre || !apellido || !email) {
      Alert.alert('Error', 'Nombre, apellido y email son obligatorios');
      return;
    }
    setLoading(true);
    
    try {
      let dataToSave = { ...formData };
      
      // Si la foto es una URI local, subirla a Cloudinary
      if (formData.foto && !formData.foto.startsWith('http')) {
        console.log('📷 Subiendo foto de perfil...');
        const uploadedUrl = await uploadImage(formData.foto, 'usuarios');
        dataToSave.foto = uploadedUrl;
        console.log('✅ Foto subida:', uploadedUrl);
      }

      // Guardar teléfonos extras (solo propietario)
      if (isPropietario) {
        const extrasValidos = telefonosExtras.filter(t => t.numero.trim() !== '');
        dataToSave.telefonosExtras = JSON.stringify(extrasValidos);
      }
      
      const result = await updateUser(dataToSave);
      setLoading(false);
      
      if (result.success) {
        setHasChanges(false);
        setSuccessModalVisible(true);
      } else {
        Alert.alert('Error', result.message || 'No se pudo actualizar el perfil');
      }
    } catch (error) {
      setLoading(false);
      console.error('Error guardando perfil:', error);
      Alert.alert('Error', 'No se pudo guardar el perfil. Intenta nuevamente.');
    }
  };

  const updateField = (field, value) => {
    setFormData({ ...formData, [field]: value });
    setHasChanges(true);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      '¿Eliminar cuenta?',
      'Esta acción no se puede deshacer. Perderás acceso a tu cuenta y todos tus datos.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await api.delete('/auth/account');
              if (response.data.success) {
                Alert.alert(
                  'Cuenta eliminada',
                  'Tu cuenta ha sido eliminada correctamente.',
                  [{ text: 'OK', onPress: () => logout() }]
                );
              }
            } catch (error) {
              Alert.alert('Error', 'No se pudo eliminar la cuenta. Intenta nuevamente.');
            }
          }
        }
      ]
    );
  };

  // Renderizar indicador de scroll personalizado
  const renderScrollIndicator = () => {
    if (contentHeight <= scrollHeight) return null;
    const thumbHeight = Math.max((scrollHeight / contentHeight) * scrollHeight, 40);
    const maxTranslate = scrollHeight - thumbHeight;
    const scrollPercent = scrollOffset / (contentHeight - scrollHeight);
    const translateY = Math.min(scrollPercent * maxTranslate, maxTranslate);
    
    return (
      <View style={styles.scrollIndicatorTrack}>
        <Animated.View 
          style={[
            styles.scrollIndicatorThumb,
            {
              height: thumbHeight,
              transform: [{ translateY: Math.max(0, translateY) }],
            }
          ]}
        />
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.dark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Editar Perfil</Text>
        {isPropietario && hasChanges ? (
          <TouchableOpacity
            style={styles.headerSaveButton}
            onPress={handleSave}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.white} size="small" />
            ) : (
              <Text style={styles.headerSaveButtonText}>Guardar</Text>
            )}
          </TouchableOpacity>
        ) : (
          <View style={{ width: 40 }} />
        )}
      </View>

      <View style={styles.scrollWrapper}>
        <ScrollView 
          showsVerticalScrollIndicator={false} 
          style={styles.scrollView}
          contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
          scrollEventThrottle={16}
          onScroll={(e) => setScrollOffset(e.nativeEvent.contentOffset.y)}
          onContentSizeChange={(w, h) => setContentHeight(h)}
          onLayout={(e) => setScrollHeight(e.nativeEvent.layout.height)}
        >
          <View style={styles.formContainer}>
            <View style={styles.avatarContainer}>
              {formData.foto ? (
                <Image source={{ uri: formData.foto }} style={styles.avatarImage} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarInitials}>
                    {user?.nombre?.charAt(0).toUpperCase() || 'U'}
                  </Text>
                </View>
              )}
              <TouchableOpacity style={styles.changePhotoButton} onPress={handlePickImage}>
                <Ionicons name="camera-outline" size={18} color={COLORS.primary} />
                <Text style={styles.changePhotoText}>Cambiar foto de perfil</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.sectionTitle}>Información Personal</Text>

            <View style={styles.inputContainer}>
              <Ionicons name="person-outline" size={20} color={COLORS.gray} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Nombre *"
                placeholderTextColor={COLORS.gray}
                value={formData.nombre}
                onChangeText={(value) => updateField('nombre', value)}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="person-outline" size={20} color={COLORS.gray} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Apellido *"
                placeholderTextColor={COLORS.gray}
                value={formData.apellido}
                onChangeText={(value) => updateField('apellido', value)}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="at-outline" size={20} color={COLORS.gray} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Alias (opcional)"
                placeholderTextColor={COLORS.gray}
                value={formData.alias}
                onChangeText={(value) => updateField('alias', value)}
                autoCapitalize="none"
              />
            </View>

            <Text style={styles.sectionTitle}>Contacto</Text>

            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={20} color={COLORS.gray} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Email *"
                placeholderTextColor={COLORS.gray}
                value={formData.email}
                onChangeText={(value) => updateField('email', value)}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            {/* Teléfonos del propietario */}
            {isPropietario ? (
              <View style={styles.telefonosSection}>
                {/* Teléfono Principal (verificado con SMS) */}
                <TouchableOpacity 
                  style={styles.phoneChangeContainer}
                  onPress={() => navigation.navigate('ChangePhone')}
                >
                  <View style={styles.phoneChangeLeft}>
                    <View style={styles.flagContainer}>
                      <Text style={styles.flagEmoji}>🇦🇷</Text>
                    </View>
                    <View style={styles.phoneChangeInfo}>
                      <Text style={styles.phoneChangeLabel}>Teléfono</Text>
                      <View style={styles.phoneNumberRow}>
                        <Text style={styles.phoneChangeNumber}>
                          {user?.telefono ? `+54 ${user.telefono.replace(/^\+54/, '')}` : 'No registrado'}
                        </Text>
                        <View style={styles.principalBadge}>
                          <Ionicons name="shield-checkmark" size={10} color={COLORS.primary} />
                          <Text style={styles.principalBadgeText}>Verificado</Text>
                        </View>
                      </View>
                    </View>
                  </View>
                  <View style={styles.phoneChangeButton}>
                    <Text style={styles.phoneChangeButtonText}>Cambiar</Text>
                    <Ionicons name="chevron-forward" size={16} color={COLORS.primary} />
                  </View>
                </TouchableOpacity>

                {/* Teléfonos Extras */}
                {telefonosExtras.map((tel, index) => (
                  <View key={index} style={styles.telefonoExtraContainer}>
                    <View style={styles.telefonoExtraHeader}>
                      <Text style={styles.telefonoExtraTitle}>Teléfono Extra {index + 1}</Text>
                      <TouchableOpacity onPress={() => removeTelefonoExtra(index)}>
                        <Ionicons name="close-circle" size={24} color={COLORS.error} />
                      </TouchableOpacity>
                    </View>
                    <View style={styles.telefonoExtraInputRow}>
                      <View style={styles.flagContainerSmall}>
                        <Text style={styles.flagEmoji}>🇦🇷</Text>
                      </View>
                      <TextInput
                        style={styles.telefonoExtraInput}
                        placeholder="Número de teléfono"
                        placeholderTextColor={COLORS.gray}
                        value={tel.numero}
                        onChangeText={(v) => updateTelefonoExtra(index, 'numero', v)}
                        keyboardType="phone-pad"
                      />
                    </View>
                    <View style={styles.aliasInputContainer}>
                      <Ionicons name="pricetag-outline" size={18} color={COLORS.gray} />
                      <TextInput
                        style={styles.aliasInput}
                        placeholder="Nombre"
                        placeholderTextColor={COLORS.gray}
                        value={tel.alias}
                        onChangeText={(v) => updateTelefonoExtra(index, 'alias', v)}
                      />
                    </View>
                  </View>
                ))}

                {/* Botón agregar teléfono extra */}
                {telefonosExtras.length < 3 && (
                  <TouchableOpacity style={styles.addPhoneButton} onPress={addTelefonoExtra}>
                    <Ionicons name="add-circle-outline" size={22} color={COLORS.primary} />
                    <Text style={styles.addPhoneButtonText}>Agregar teléfono extra</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              <TouchableOpacity 
                style={styles.phoneChangeContainer}
                onPress={() => navigation.navigate('ChangePhone')}
              >
                <View style={styles.phoneChangeLeft}>
                  <View style={styles.flagContainer}>
                    <Text style={styles.flagEmoji}>🇦🇷</Text>
                  </View>
                  <View style={styles.phoneChangeInfo}>
                    <Text style={styles.phoneChangeLabel}>Teléfono</Text>
                    <Text style={styles.phoneChangeNumber}>
                      {user?.telefono ? `+54 ${user.telefono}` : 'No registrado'}
                    </Text>
                  </View>
                </View>
                <View style={styles.phoneChangeButton}>
                  <Text style={styles.phoneChangeButtonText}>Cambiar</Text>
                  <Ionicons name="chevron-forward" size={16} color={COLORS.primary} />
                </View>
              </TouchableOpacity>
            )}

            <Text style={styles.sectionTitle}>Ubicación</Text>

            <View style={styles.inputContainer}>
              <Ionicons name="location-outline" size={20} color={COLORS.gray} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Ciudad (opcional)"
                placeholderTextColor={COLORS.gray}
                value={formData.ciudad}
                onChangeText={(value) => updateField('ciudad', value)}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="map-outline" size={20} color={COLORS.gray} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Provincia (opcional)"
                placeholderTextColor={COLORS.gray}
                value={formData.provincia}
                onChangeText={(value) => updateField('provincia', value)}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="flag-outline" size={20} color={COLORS.gray} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="País (opcional)"
                placeholderTextColor={COLORS.gray}
                value={formData.pais}
                onChangeText={(value) => updateField('pais', value)}
                autoCapitalize="words"
              />
            </View>

            {!isPropietario && (
              <TouchableOpacity
                style={[styles.saveButton, loading && styles.saveButtonDisabled]}
                onPress={handleSave}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <Text style={styles.saveButtonText}>Guardar Cambios</Text>
                )}
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.deleteAccountButton}
              onPress={handleDeleteAccount}
            >
              <View style={styles.deleteAccountIconContainer}>
                <Ionicons name="person-remove-outline" size={20} color="#EF4444" />
              </View>
              <View style={styles.deleteAccountContent}>
                <Text style={styles.deleteAccountText}>Eliminar mi cuenta</Text>
                <Text style={styles.deleteAccountHint}>Esta acción es permanente</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
            </TouchableOpacity>
          </View>
        </ScrollView>
        {renderScrollIndicator()}
      </View>

      {/* Modal de Éxito */}
      <Modal
        visible={successModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          setSuccessModalVisible(false);
          navigation.goBack();
        }}
      >
        <View style={styles.successModalOverlay}>
          <View style={styles.successModalContent}>
            <View style={styles.successModalIcon}>
              <Ionicons name="checkmark-circle" size={60} color={COLORS.success} />
            </View>
            <Text style={styles.successModalTitle}>¡Perfil actualizado!</Text>
            <Text style={styles.successModalText}>
              Tus cambios se guardaron correctamente
            </Text>
            
            <TouchableOpacity
              style={styles.successModalBtn}
              onPress={() => {
                setSuccessModalVisible(false);
                navigation.goBack();
              }}
            >
              <Text style={styles.successModalBtnText}>Continuar</Text>
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
    backgroundColor: COLORS.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 10,
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
  },
  headerSaveButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
  },
  headerSaveButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
  },
  scrollWrapper: {
    flex: 1,
    position: 'relative',
  },
  scrollView: {
    flex: 1,
  },
  scrollIndicatorTrack: {
    position: 'absolute',
    right: 2,
    top: 10,
    bottom: 10,
    width: 4,
    backgroundColor: '#E5E5E5',
    borderRadius: 2,
  },
  scrollIndicatorThumb: {
    width: 4,
    backgroundColor: COLORS.primary,
    borderRadius: 2,
  },
  formContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 10,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  avatarInitials: {
    fontSize: 36,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  changePhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: COLORS.background,
  },
  changePhotoText: {
    marginLeft: 6,
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.dark,
    marginTop: 8,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 10,
    paddingHorizontal: 12,
    marginBottom: 8,
    height: 46,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: COLORS.dark,
  },
  phoneChangeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.background,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 8,
  },
  phoneChangeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  flagContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  flagEmoji: {
    fontSize: 18,
  },
  phoneChangeInfo: {
    gap: 2,
  },
  phoneChangeLabel: {
    fontSize: 12,
    color: COLORS.gray,
  },
  phoneChangeNumber: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.dark,
  },
  phoneChangeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.primary + '15',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  phoneChangeButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
  },
  telefonosSection: {
    marginBottom: 8,
  },
  phoneNumberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  principalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: COLORS.primary + '15',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  principalBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.primary,
  },
  secundarioBadge: {
    backgroundColor: COLORS.gray + '20',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  secundarioBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.gray,
  },
  phoneDisplayContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.background,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginTop: 8,
  },
  telefonoExtraContainer: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
  },
  telefonoExtraHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  telefonoExtraTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.gray,
  },
  telefonoExtraInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 46,
    marginBottom: 8,
  },
  flagContainerSmall: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  telefonoExtraInput: {
    flex: 1,
    fontSize: 15,
    color: COLORS.dark,
  },
  aliasInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 42,
    gap: 8,
  },
  aliasInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.dark,
  },
  addPhoneButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    backgroundColor: COLORS.background,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.primary + '30',
    borderStyle: 'dashed',
    marginTop: 12,
    gap: 8,
  },
  addPhoneButtonText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  deleteAccountButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 14,
    marginTop: 24,
    marginBottom: 20,
  },
  deleteAccountIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteAccountContent: {
    flex: 1,
    marginLeft: 12,
  },
  deleteAccountText: {
    color: COLORS.dark,
    fontSize: 15,
    fontWeight: '500',
  },
  deleteAccountHint: {
    color: COLORS.gray,
    fontSize: 12,
    marginTop: 2,
  },
  // Estilos del Modal de Éxito
  successModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  successModalContent: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 30,
    width: '100%',
    maxWidth: 300,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  successModalIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  successModalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginBottom: 8,
  },
  successModalText: {
    fontSize: 15,
    color: COLORS.gray,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  successModalBtn: {
    backgroundColor: COLORS.success,
    paddingVertical: 14,
    paddingHorizontal: 50,
    borderRadius: 12,
    alignItems: 'center',
  },
  successModalBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
});
