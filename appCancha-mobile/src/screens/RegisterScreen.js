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
  Modal,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants';
import CountryCodePicker from '../components/CountryCodePicker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '../services/api';

export default function RegisterJugadorScreen({ navigation, route }) {
  const isProfesor = route.params?.isProfesor || false;
  const insets = useSafeAreaInsets();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    nombre: '',
    apellido: '',
    alias: '',
    codigoPais: '+54',
    telefono: '',
  });
  const [profileImage, setProfileImage] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showCodeSentModal, setShowCodeSentModal] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState(null);
  const [showImageOptionsModal, setShowImageOptionsModal] = useState(false);

  const handleRegister = async () => {
    const { email, password, confirmPassword, nombre, apellido, alias, telefono } = formData;

    if (!email || !password || !nombre || !apellido || !telefono) {
      Alert.alert('Error', 'Por favor completa todos los campos obligatorios');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Las contraseñas no coinciden');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres');
      return;
    }

    const telefonoCompleto = `${formData.codigoPais}${telefono}`;

    setLoading(true);
    try {
      // Solicitar código de verificación
      await api.post('/auth/register/request-code', {
        telefono: telefonoCompleto,
        nombre,
        email
      });

      // Guardar datos para navegación y mostrar modal
      setPendingNavigation({
        telefono: telefonoCompleto,
        formData: {
          email,
          password,
          nombre,
          apellido,
          alias,
        },
        profileImage,
        rol: 'JUGADOR',
        isProfesor
      });
      setShowCodeSentModal(true);
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'No se pudo enviar el código de verificación');
    } finally {
      setLoading(false);
    }
  };

  const handleContinueToVerification = () => {
    setShowCodeSentModal(false);
    if (pendingNavigation) {
      navigation.navigate('VerifyRegisterPhone', pendingNavigation);
    }
  };

  const pickImage = async () => {
    // Pedir permisos
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permiso denegado', 'Necesitamos acceso a tu galería para seleccionar una foto.');
      return;
    }

    // Abrir selector de imagen
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setProfileImage(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permiso denegado', 'Necesitamos acceso a tu cámara para tomar una foto.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setProfileImage(result.assets[0].uri);
    }
  };

  const showImageOptions = () => {
    setShowImageOptionsModal(true);
  };

  const handleImageOption = (option) => {
    setShowImageOptionsModal(false);
    setTimeout(() => {
      if (option === 'camera') takePhoto();
      else if (option === 'gallery') pickImage();
    }, 300);
  };

  const updateField = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const getPasswordStrength = () => {
    const { password } = formData;
    if (password.length === 0) return null;
    if (password.length < 6) return { label: 'Muy débil', color: '#EF4444', width: '20%' };
    if (password.length < 8) return { label: 'Débil', color: '#F59E0B', width: '40%' };
    if (password.length < 10) return { label: 'Media', color: '#EAB308', width: '60%' };
    if (/[A-Z]/.test(password) && /[0-9]/.test(password)) {
      return { label: 'Fuerte', color: '#22C55E', width: '100%' };
    }
    return { label: 'Buena', color: '#84CC16', width: '80%' };
  };

  const strength = getPasswordStrength();

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { paddingTop: insets.top }]}
    >
      {/* Header fijo */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.dark} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>{isProfesor ? 'Cuenta de Profesor' : 'Cuenta de Participante'}</Text>
          <Text style={styles.headerSubtitle}>{isProfesor ? 'Crea tu perfil para dar clases' : 'Crea tu perfil para reservar'}</Text>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Foto de perfil */}
        <View style={styles.photoSection}>
          <TouchableOpacity 
            style={styles.photoContainer}
            onPress={showImageOptions}
            activeOpacity={0.8}
          >
            {profileImage ? (
              <Image source={{ uri: profileImage }} style={styles.profileImage} />
            ) : (
              <View style={styles.photoPlaceholder}>
                <Ionicons name="person" size={48} color={COLORS.gray} />
              </View>
            )}
            <View style={styles.cameraButton}>
              <Ionicons name="camera" size={18} color={COLORS.white} />
            </View>
          </TouchableOpacity>
          <Text style={styles.photoLabel}>Foto de perfil</Text>
          <Text style={styles.photoHint}>Opcional</Text>
        </View>

        {/* Formulario */}
        <View style={styles.formContainer}>
          <View style={styles.inputGroup}>
            <Text style={styles.groupLabel}>Información Personal</Text>
            
            <View style={styles.inputContainer}>
              <Ionicons
                name="person-outline"
                size={20}
                color={COLORS.primary}
                style={styles.inputIcon}
              />
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
              <Ionicons
                name="person-outline"
                size={20}
                color={COLORS.primary}
                style={styles.inputIcon}
              />
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
              <Ionicons
                name="at-outline"
                size={20}
                color={COLORS.primary}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Alias (opcional)"
                placeholderTextColor={COLORS.gray}
                value={formData.alias}
                onChangeText={(value) => updateField('alias', value)}
                autoCapitalize="none"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.groupLabel}>Contacto</Text>
            
            <View style={styles.inputContainer}>
              <Ionicons 
                name="mail-outline" 
                size={20} 
                color={COLORS.primary} 
                style={styles.inputIcon} 
              />
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

            <View style={styles.phoneContainer}>
              <View style={styles.countryCodeContainer}>
                <CountryCodePicker
                  selectedCode={formData.codigoPais}
                  onSelect={(code) => updateField('codigoPais', code)}
                  accentColor={COLORS.primary}
                />
              </View>
              <View style={styles.phoneInputContainer}>
                <TextInput
                  style={styles.phoneInput}
                  placeholder="Teléfono *"
                  placeholderTextColor={COLORS.gray}
                  value={formData.telefono}
                  onChangeText={(value) => updateField('telefono', value)}
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            {/* Nota informativa debajo del teléfono */}
            <View style={styles.infoNote}>
              <Ionicons name="logo-whatsapp" size={18} color="#25D366" />
              <Text style={styles.infoNoteText}>
                Te enviaremos un código de verificación por WhatsApp a este número
              </Text>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.groupLabel}>Seguridad</Text>
            
            <View style={styles.inputContainer}>
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color={COLORS.primary}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Contraseña *"
                placeholderTextColor={COLORS.gray}
                value={formData.password}
                onChangeText={(value) => updateField('password', value)}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeIcon}
              >
                <Ionicons
                  name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                  size={20}
                  color={COLORS.gray}
                />
              </TouchableOpacity>
            </View>

            {/* Password Strength */}
            {strength && (
              <View style={styles.strengthContainer}>
                <View style={styles.strengthBar}>
                  <View style={[styles.strengthFill, { width: strength.width, backgroundColor: strength.color }]} />
                </View>
                <Text style={[styles.strengthLabel, { color: strength.color }]}>{strength.label}</Text>
              </View>
            )}

            <View style={styles.inputContainer}>
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color={COLORS.primary}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Confirmar Contraseña *"
                placeholderTextColor={COLORS.gray}
                value={formData.confirmPassword}
                onChangeText={(value) => updateField('confirmPassword', value)}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                style={styles.eyeIcon}
              >
                <Ionicons
                  name={showConfirmPassword ? 'eye-outline' : 'eye-off-outline'}
                  size={20}
                  color={COLORS.gray}
                />
              </TouchableOpacity>
            </View>

            {/* Match indicator */}
            {formData.confirmPassword.length > 0 && (
              <View style={styles.matchContainer}>
                <Ionicons
                  name={formData.password === formData.confirmPassword ? 'checkmark-circle' : 'close-circle'}
                  size={18}
                  color={formData.password === formData.confirmPassword ? '#22C55E' : '#EF4444'}
                />
                <Text style={[
                  styles.matchText,
                  { color: formData.password === formData.confirmPassword ? '#22C55E' : '#EF4444' }
                ]}>
                  {formData.password === formData.confirmPassword ? 'Las contraseñas coinciden' : 'Las contraseñas no coinciden'}
                </Text>
              </View>
            )}

            {/* Requirements */}
            <View style={styles.requirementsContainer}>
              <Text style={styles.requirementsTitle}>La contraseña debe tener:</Text>
              <View style={styles.requirement}>
                <Ionicons
                  name={formData.password.length >= 6 ? 'checkmark-circle' : 'ellipse-outline'}
                  size={16}
                  color={formData.password.length >= 6 ? '#22C55E' : COLORS.gray}
                />
                <Text style={[styles.requirementText, formData.password.length >= 6 && styles.requirementMet]}>
                  Al menos 6 caracteres
                </Text>
              </View>
              <View style={styles.requirement}>
                <Ionicons
                  name={/[A-Z]/.test(formData.password) ? 'checkmark-circle' : 'ellipse-outline'}
                  size={16}
                  color={/[A-Z]/.test(formData.password) ? '#22C55E' : COLORS.gray}
                />
                <Text style={[styles.requirementText, /[A-Z]/.test(formData.password) && styles.requirementMet]}>
                  Una letra mayúscula (recomendado)
                </Text>
              </View>
              <View style={styles.requirement}>
                <Ionicons
                  name={/[0-9]/.test(formData.password) ? 'checkmark-circle' : 'ellipse-outline'}
                  size={16}
                  color={/[0-9]/.test(formData.password) ? '#22C55E' : COLORS.gray}
                />
                <Text style={[styles.requirementText, /[0-9]/.test(formData.password) && styles.requirementMet]}>
                  Un número (recomendado)
                </Text>
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.registerButton, loading && styles.registerButtonDisabled]}
            onPress={handleRegister}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <>
                <Text style={styles.registerButtonText}>Continuar</Text>
                <Ionicons name="arrow-forward" size={20} color={COLORS.white} />
              </>
            )}
          </TouchableOpacity>

        </View>
      </ScrollView>

      {/* Modal de opciones de imagen */}
      <Modal
        visible={showImageOptionsModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowImageOptionsModal(false)}
      >
        <TouchableOpacity 
          style={styles.imageModalOverlay}
          activeOpacity={1}
          onPress={() => setShowImageOptionsModal(false)}
        >
          <View style={styles.imageModalContainer}>
            <Text style={styles.imageModalTitle}>Foto de perfil</Text>
            <Text style={styles.imageModalSubtitle}>Elige cómo quieres agregar tu foto</Text>
            
            <View style={styles.imageModalOptions}>
              <TouchableOpacity 
                style={styles.imageModalOption}
                onPress={() => handleImageOption('camera')}
                activeOpacity={0.7}
              >
                <View style={[styles.imageModalIconBox, { backgroundColor: '#E8FDF5' }]}>
                  <Ionicons name="camera" size={28} color="#4ECDC4" />
                </View>
                <Text style={styles.imageModalOptionText}>Tomar foto</Text>
                <Text style={styles.imageModalOptionHint}>Usa tu cámara</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.imageModalOption}
                onPress={() => handleImageOption('gallery')}
                activeOpacity={0.7}
              >
                <View style={[styles.imageModalIconBox, { backgroundColor: '#EEF2FF' }]}>
                  <Ionicons name="images" size={28} color="#6366F1" />
                </View>
                <Text style={styles.imageModalOptionText}>Galería</Text>
                <Text style={styles.imageModalOptionHint}>Elige una existente</Text>
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity 
              style={styles.imageModalCancelButton}
              onPress={() => setShowImageOptionsModal(false)}
            >
              <Text style={styles.imageModalCancelText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Modal de código enviado */}
      <Modal
        visible={showCodeSentModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {}}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {/* Icono de WhatsApp con círculo */}
            <View style={styles.modalIconContainer}>
              <Ionicons name="logo-whatsapp" size={50} color="#25D366" />
            </View>
            
            <Text style={styles.modalTitle}>¡Código Enviado!</Text>
            
            <Text style={styles.modalMessage}>
              Te enviamos un código de 6 dígitos por WhatsApp al número:
            </Text>
            
            <View style={styles.phoneNumberContainer}>
              <Ionicons name="call" size={18} color={COLORS.primary} />
              <Text style={styles.phoneNumberText}>
                {pendingNavigation?.telefono}
              </Text>
            </View>
            
            <View style={styles.modalInfoBox}>
              <Ionicons name="information-circle" size={20} color="#4ECDC4" />
              <Text style={styles.modalInfoText}>
                Si no lo recibes, verifica que el número tenga WhatsApp activo
              </Text>
            </View>
            
            <TouchableOpacity
              style={styles.modalButton}
              onPress={handleContinueToVerification}
              activeOpacity={0.8}
            >
              <Text style={styles.modalButtonText}>Ingresar Código</Text>
              <Ionicons name="arrow-forward" size={20} color={COLORS.white} />
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  photoSection: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: COLORS.white,
    marginBottom: 2,
  },
  photoContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  photoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: COLORS.primary + '30',
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: COLORS.primary,
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: COLORS.white,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  photoLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.dark,
    marginBottom: 2,
  },
  photoHint: {
    fontSize: 12,
    color: COLORS.gray,
  },
  formContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  inputGroup: {
    marginBottom: 24,
  },
  groupLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.dark,
    marginBottom: 12,
    paddingLeft: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 14,
    paddingHorizontal: 16,
    marginBottom: 10,
    height: 54,
    borderWidth: 1.5,
    borderColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: COLORS.dark,
  },
  phoneContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  countryCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 14,
    height: 54,
    borderWidth: 1.5,
    borderColor: '#F0F0F0',
  },
  phoneInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 54,
    borderWidth: 1.5,
    borderColor: '#F0F0F0',
  },
  phoneInput: {
    flex: 1,
    fontSize: 15,
    color: COLORS.dark,
  },
  eyeIcon: {
    padding: 6,
  },
  strengthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: -4,
    gap: 10,
    paddingHorizontal: 4,
  },
  strengthBar: {
    flex: 1,
    height: 4,
    backgroundColor: '#E5E5E5',
    borderRadius: 2,
    overflow: 'hidden',
  },
  strengthFill: {
    height: '100%',
    borderRadius: 2,
  },
  strengthLabel: {
    fontSize: 12,
    fontWeight: '600',
    width: 70,
  },
  matchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
    marginTop: -4,
    paddingLeft: 4,
  },
  matchText: {
    fontSize: 13,
    fontWeight: '500',
  },
  requirementsContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 14,
    marginTop: 4,
  },
  requirementsTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.dark,
    marginBottom: 10,
  },
  requirement: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  requirementText: {
    fontSize: 12,
    color: COLORS.gray,
  },
  requirementMet: {
    color: '#22C55E',
  },
  registerButton: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 20,
    gap: 8,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  registerButtonDisabled: {
    opacity: 0.6,
  },
  registerButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
  },
  infoNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
    gap: 10,
  },
  infoNoteText: {
    flex: 1,
    fontSize: 13,
    color: '#166534',
    lineHeight: 18,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
  },
  loginText: {
    fontSize: 14,
    color: COLORS.gray,
  },
  loginLink: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '700',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 28,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  modalIconContainer: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#E8FDF5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.dark,
    marginBottom: 12,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 15,
    color: COLORS.gray,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 12,
  },
  phoneNumberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 16,
    gap: 10,
  },
  phoneNumberText: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.primary,
  },
  modalInfoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDFA',
    padding: 14,
    borderRadius: 12,
    marginBottom: 24,
    gap: 10,
  },
  modalInfoText: {
    flex: 1,
    fontSize: 13,
    color: '#115E59',
    lineHeight: 18,
  },
  modalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4ECDC4',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 14,
    width: '100%',
    gap: 10,
    shadowColor: '#4ECDC4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  modalButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.white,
  },
  // Image options modal styles
  imageModalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 20,
  },
  imageModalContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    paddingHorizontal: 28,
    paddingTop: 28,
    paddingBottom: 20,
    width: '100%',
    maxWidth: 340,
  },
  imageModalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.dark,
    textAlign: 'center',
    marginBottom: 6,
  },
  imageModalSubtitle: {
    fontSize: 14,
    color: COLORS.gray,
    textAlign: 'center',
    marginBottom: 24,
  },
  imageModalOptions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginBottom: 24,
  },
  imageModalOption: {
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 20,
    width: 140,
  },
  imageModalIconBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  imageModalOptionText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.dark,
    marginBottom: 4,
  },
  imageModalOptionHint: {
    fontSize: 12,
    color: COLORS.gray,
  },
  imageModalCancelButton: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  imageModalCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray,
  },
});