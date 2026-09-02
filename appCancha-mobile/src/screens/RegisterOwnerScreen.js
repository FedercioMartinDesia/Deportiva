import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView,
  Platform, Alert, ActivityIndicator, ScrollView, Image, Modal,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CountryCodePicker from '../components/CountryCodePicker';
import api from '../services/api';

export default function RegisterOwnerScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [formData, setFormData] = useState({
    nombre: '', apellido: '', email: '', password: '', confirmPassword: '',
    codigoPaisPrincipal: '+54', telefonoPrincipal: '',
  });
  // Teléfonos extras con alias (no verificados)
  const [telefonosExtras, setTelefonosExtras] = useState([]);
  const [profileImage, setProfileImage] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showCodeSentModal, setShowCodeSentModal] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState(null);
  const [showImageOptionsModal, setShowImageOptionsModal] = useState(false);

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validatePhone = (phone) => /^[0-9+\-\s()]{7,}$/.test(phone);

  const handleRegister = async () => {
    const { email, password, confirmPassword, nombre, apellido, codigoPaisPrincipal, telefonoPrincipal } = formData;
    const newErrors = {};
    if (!nombre.trim()) newErrors.nombre = 'El nombre es obligatorio';
    if (!apellido.trim()) newErrors.apellido = 'El apellido es obligatorio';
    if (!email.trim()) newErrors.email = 'El email es obligatorio';
    else if (!validateEmail(email)) newErrors.email = 'Ingresa un email válido';
    if (!password) newErrors.password = 'La contraseña es obligatoria';
    else if (password.length < 6) newErrors.password = 'Mínimo 6 caracteres';
    if (!confirmPassword) newErrors.confirmPassword = 'Confirma tu contraseña';
    else if (password !== confirmPassword) newErrors.confirmPassword = 'Las contraseñas no coinciden';
    if (!telefonoPrincipal.trim()) newErrors.telefonoPrincipal = 'El teléfono principal es obligatorio';

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      Alert.alert('Error', Object.values(newErrors)[0]);
      return;
    }

    // Preparar teléfonos extras válidos
    const extrasValidos = telefonosExtras
      .filter(t => t.numero.trim() !== '')
      .map(t => ({ numero: `+54${t.numero.trim()}`, alias: t.alias.trim() }));

    const telefonoCompleto = `${codigoPaisPrincipal}${telefonoPrincipal.trim()}`;

    setLoading(true);
    try {
      // Solicitar código de verificación
      await api.post('/auth/register/request-code', {
        telefono: telefonoCompleto,
        nombre: nombre.trim(),
        email: email.trim().toLowerCase()
      });

      // Guardar datos para navegación y mostrar modal
      setPendingNavigation({
        telefono: telefonoCompleto,
        formData: {
          email: email.trim().toLowerCase(),
          password,
          nombre: nombre.trim(),
          apellido: apellido.trim(),
          telefonosExtras: extrasValidos.length > 0 ? JSON.stringify(extrasValidos) : undefined,
        },
        profileImage,
        rol: 'PROPIETARIO'
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
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permiso denegado'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1, 1], quality: 0.8,
    });
    if (!result.canceled) setProfileImage(result.assets[0].uri);
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permiso denegado'); return; }
    const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.8 });
    if (!result.canceled) setProfileImage(result.assets[0].uri);
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
    if (errors[field]) setErrors({ ...errors, [field]: null });
  };

  const addTelefonoExtra = () => {
    if (telefonosExtras.length >= 3) { Alert.alert('Límite', 'Máximo 3 teléfonos extras'); return; }
    setTelefonosExtras([...telefonosExtras, { numero: '', alias: '' }]);
  };

  const updateTelefonoExtra = (index, field, value) => {
    const nuevos = [...telefonosExtras];
    nuevos[index][field] = value;
    setTelefonosExtras(nuevos);
  };

  const removeTelefonoExtra = (index) => {
    setTelefonosExtras(telefonosExtras.filter((_, i) => i !== index));
  };

  const getPasswordStrength = () => {
    const { password } = formData;
    if (password.length === 0) return null;
    if (password.length < 6) return { label: 'Muy débil', color: '#EF4444', width: '20%' };
    if (password.length < 8) return { label: 'Débil', color: '#F59E0B', width: '40%' };
    if (password.length < 10) return { label: 'Media', color: '#EAB308', width: '60%' };
    if (/[A-Z]/.test(password) && /[0-9]/.test(password)) return { label: 'Fuerte', color: '#22C55E', width: '100%' };
    return { label: 'Buena', color: '#84CC16', width: '80%' };
  };

  const strength = getPasswordStrength();

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.dark} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Cuenta de Propietario</Text>
          <Text style={styles.headerSubtitle}>Gestiona tus canchas deportivas</Text>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.photoSection}>
          <TouchableOpacity style={styles.photoContainer} onPress={showImageOptions}>
            {profileImage ? (
              <Image source={{ uri: profileImage }} style={styles.profileImage} />
            ) : (
              <View style={styles.photoPlaceholder}>
                <Ionicons name="business" size={48} color="#4ECDC4" />
              </View>
            )}
            <View style={styles.cameraButton}>
              <Ionicons name="camera" size={18} color={COLORS.white} />
            </View>
          </TouchableOpacity>
          <Text style={styles.photoLabel}>Foto de perfil</Text>
          <Text style={styles.photoHint}>Opcional</Text>
        </View>

        <View style={styles.formContainer}>
          <View style={styles.inputGroup}>
            <Text style={styles.groupLabel}>Información Personal</Text>
            <View style={[styles.inputContainer, errors.nombre && styles.inputError]}>
              <Ionicons name="person-outline" size={20} color={errors.nombre ? COLORS.error : '#4ECDC4'} style={styles.inputIcon} />
              <TextInput style={styles.input} placeholder="Nombre *" placeholderTextColor={COLORS.gray} value={formData.nombre} onChangeText={(v) => updateField('nombre', v)} autoCapitalize="words" />
            </View>
            {errors.nombre && <Text style={styles.errorText}>{errors.nombre}</Text>}

            <View style={[styles.inputContainer, errors.apellido && styles.inputError]}>
              <Ionicons name="person-outline" size={20} color={errors.apellido ? COLORS.error : '#4ECDC4'} style={styles.inputIcon} />
              <TextInput style={styles.input} placeholder="Apellido *" placeholderTextColor={COLORS.gray} value={formData.apellido} onChangeText={(v) => updateField('apellido', v)} autoCapitalize="words" />
            </View>
            {errors.apellido && <Text style={styles.errorText}>{errors.apellido}</Text>}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.groupLabel}>Contacto</Text>
            <View style={[styles.inputContainer, errors.email && styles.inputError]}>
              <Ionicons name="mail-outline" size={20} color={errors.email ? COLORS.error : '#4ECDC4'} style={styles.inputIcon} />
              <TextInput style={styles.input} placeholder="Email *" placeholderTextColor={COLORS.gray} value={formData.email} onChangeText={(v) => updateField('email', v)} keyboardType="email-address" autoCapitalize="none" />
            </View>
            {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}

            <View style={styles.telefonosSection}>
              {/* Teléfono Principal */}
              <View style={styles.telefonoPrincipalBadge}>
                <Ionicons name="shield-checkmark" size={14} color="#4ECDC4"/>
                <Text style={styles.telefonoPrincipalText}>Teléfono Principal</Text>
              </View>
              <View style={styles.telefonoRow}>
                <View style={[styles.countryCodeContainer, errors.telefonoPrincipal && styles.inputError]}>
                  <CountryCodePicker selectedCode={formData.codigoPaisPrincipal} onSelect={(code) => updateField('codigoPaisPrincipal', code)} accentColor="#4ECDC4" />
                </View>
                <View style={[styles.phoneInputContainer, errors.telefonoPrincipal && styles.inputError]}>
                  <TextInput style={styles.phoneInput} placeholder="Teléfono *" placeholderTextColor={COLORS.gray} value={formData.telefonoPrincipal} onChangeText={(v) => updateField('telefonoPrincipal', v)} keyboardType="phone-pad" />
                </View>
              </View>
              {errors.telefonoPrincipal && <Text style={styles.errorText}>{errors.telefonoPrincipal}</Text>}
              
              {/* Nota informativa debajo del teléfono */}
              <View style={styles.infoNote}>
                <Ionicons name="logo-whatsapp" size={18} color="#25D366" />
                <Text style={styles.infoNoteText}>
                  Te enviaremos un código de verificación por WhatsApp a este número
                </Text>
              </View>

              {/* Teléfonos Extras con alias */}
              {telefonosExtras.map((tel, index) => (
                <View key={index} style={styles.telefonoExtraContainer}>
                  <View style={styles.telefonoExtraHeader}>
                    <Text style={styles.telefonoSecundarioText}>Teléfono Extra {index + 1}</Text>
                    <TouchableOpacity onPress={() => removeTelefonoExtra(index)}>
                      <Ionicons name="close-circle" size={24} color={COLORS.error} />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.telefonoRow}>
                    <View style={styles.flagContainerSmall}>
                      <Text style={{ fontSize: 16 }}>🇦🇷</Text>
                    </View>
                    <View style={styles.phoneInputContainer}>
                      <TextInput style={styles.phoneInput} placeholder="Número de teléfono" placeholderTextColor={COLORS.gray} value={tel.numero} onChangeText={(v) => updateTelefonoExtra(index, 'numero', v)} keyboardType="phone-pad" />
                    </View>
                  </View>
                  <View style={styles.aliasInputContainer}>
                    <Ionicons name="pricetag-outline" size={18} color={COLORS.gray} />
                    <TextInput style={styles.aliasInput} placeholder="Nombre" placeholderTextColor={COLORS.gray} value={tel.alias} onChangeText={(v) => updateTelefonoExtra(index, 'alias', v)} />
                  </View>
                </View>
              ))}

              {telefonosExtras.length < 3 && (
                <TouchableOpacity style={styles.addButton} onPress={addTelefonoExtra}>
                  <Ionicons name="add-circle-outline" size={22} color="#4ECDC4" />
                  <Text style={styles.addButtonText}>Agregar teléfono extra</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.groupLabel}>Seguridad</Text>
            <View style={[styles.inputContainer, errors.password && styles.inputError]}>
              <Ionicons name="lock-closed-outline" size={20} color={errors.password ? COLORS.error : '#4ECDC4'} style={styles.inputIcon} />
              <TextInput style={styles.input} placeholder="Contraseña *" placeholderTextColor={COLORS.gray} value={formData.password} onChangeText={(v) => updateField('password', v)} secureTextEntry={!showPassword} autoCapitalize="none" />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                <Ionicons name={showPassword ? 'eye-outline' : 'eye-off-outline'} size={20} color={COLORS.gray} />
              </TouchableOpacity>
            </View>
            {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}

            {strength && !errors.password && (
              <View style={styles.strengthContainer}>
                <View style={styles.strengthBar}>
                  <View style={[styles.strengthFill, { width: strength.width, backgroundColor: strength.color }]} />
                </View>
                <Text style={[styles.strengthLabel, { color: strength.color }]}>{strength.label}</Text>
              </View>
            )}

            <View style={[styles.inputContainer, errors.confirmPassword && styles.inputError]}>
              <Ionicons name="lock-closed-outline" size={20} color={errors.confirmPassword ? COLORS.error : '#4ECDC4'} style={styles.inputIcon} />
              <TextInput style={styles.input} placeholder="Confirmar Contraseña *" placeholderTextColor={COLORS.gray} value={formData.confirmPassword} onChangeText={(v) => updateField('confirmPassword', v)} secureTextEntry={!showConfirmPassword} autoCapitalize="none" />
              <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeIcon}>
                <Ionicons name={showConfirmPassword ? 'eye-outline' : 'eye-off-outline'} size={20} color={COLORS.gray} />
              </TouchableOpacity>
            </View>
            {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}

            {formData.confirmPassword.length > 0 && !errors.confirmPassword && (
              <View style={styles.matchContainer}>
                <Ionicons name={formData.password === formData.confirmPassword ? 'checkmark-circle' : 'close-circle'} size={18} color={formData.password === formData.confirmPassword ? '#22C55E' : '#EF4444'} />
                <Text style={[styles.matchText, { color: formData.password === formData.confirmPassword ? '#22C55E' : '#EF4444' }]}>
                  {formData.password === formData.confirmPassword ? 'Las contraseñas coinciden' : 'Las contraseñas no coinciden'}
                </Text>
              </View>
            )}

            <View style={styles.requirementsContainer}>
              <Text style={styles.requirementsTitle}>La contraseña debe tener:</Text>
              <View style={styles.requirement}>
                <Ionicons name={formData.password.length >= 6 ? 'checkmark-circle' : 'ellipse-outline'} size={16} color={formData.password.length >= 6 ? '#22C55E' : COLORS.gray} />
                <Text style={[styles.requirementText, formData.password.length >= 6 && styles.requirementMet]}>Al menos 6 caracteres</Text>
              </View>
              <View style={styles.requirement}>
                <Ionicons name={/[A-Z]/.test(formData.password) ? 'checkmark-circle' : 'ellipse-outline'} size={16} color={/[A-Z]/.test(formData.password) ? '#22C55E' : COLORS.gray} />
                <Text style={[styles.requirementText, /[A-Z]/.test(formData.password) && styles.requirementMet]}>Una mayúscula (recomendado)</Text>
              </View>
              <View style={styles.requirement}>
                <Ionicons name={/[0-9]/.test(formData.password) ? 'checkmark-circle' : 'ellipse-outline'} size={16} color={/[0-9]/.test(formData.password) ? '#22C55E' : COLORS.gray} />
                <Text style={[styles.requirementText, /[0-9]/.test(formData.password) && styles.requirementMet]}>Un número (recomendado)</Text>
              </View>
            </View>
          </View>

          <TouchableOpacity style={[styles.registerButton, loading && styles.registerButtonDisabled]} onPress={handleRegister} disabled={loading}>
            {loading ? <ActivityIndicator color={COLORS.white} /> : (
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
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: '#F0F0F0', gap: 12 },
  backButton: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#F5F5F5', justifyContent: 'center', alignItems: 'center' },
  headerContent: { flex: 1 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: COLORS.dark, marginBottom: 2 },
  headerSubtitle: { fontSize: 13, color: COLORS.gray },
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: 40 },
  photoSection: { alignItems: 'center', paddingVertical: 32, backgroundColor: COLORS.white, marginBottom: 2 },
  photoContainer: { position: 'relative', marginBottom: 12 },
  photoPlaceholder: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#F5F5F5', justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#4ECDC430' },
  profileImage: { width: 120, height: 120, borderRadius: 60, borderWidth: 3, borderColor: '#4ECDC4' },
  cameraButton: { position: 'absolute', bottom: 0, right: 0, width: 40, height: 40, borderRadius: 20, backgroundColor: '#4ECDC4', justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: COLORS.white },
  photoLabel: { fontSize: 15, fontWeight: '700', color: COLORS.dark, marginBottom: 2 },
  photoHint: { fontSize: 12, color: COLORS.gray },
  formContainer: { paddingHorizontal: 20, paddingTop: 20 },
  inputGroup: { marginBottom: 24 },
  groupLabel: { fontSize: 14, fontWeight: '700', color: COLORS.dark, marginBottom: 12, paddingLeft: 4 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, borderRadius: 14, paddingHorizontal: 16, marginBottom: 10, height: 54, borderWidth: 1.5, borderColor: '#F0F0F0' },
  inputError: { borderColor: '#EF444450', backgroundColor: '#EF444405' },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, fontSize: 15, color: COLORS.dark },
  eyeIcon: { padding: 6 },
  errorText: { fontSize: 12, color: COLORS.error, paddingLeft: 4, marginTop: -8, marginBottom: 8 },
  telefonosSection: { marginTop: 4 },
  telefonoPrincipalBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8, paddingLeft: 4 },
  telefonoPrincipalText: { fontSize: 13, fontWeight: '700', color: '#4ECDC4' },
  telefonoVerificadoText: { fontSize: 11, color: COLORS.gray, fontStyle: 'italic' },
  telefonoSecundarioBadge: { marginBottom: 8, paddingLeft: 4 },
  telefonoSecundarioText: { fontSize: 13, fontWeight: '600', color: COLORS.gray },
  telefonoRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  countryCodeContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, borderRadius: 14, height: 54, borderWidth: 1.5, borderColor: '#F0F0F0' },
  phoneInputContainer: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, borderRadius: 14, paddingHorizontal: 16, height: 54, borderWidth: 1.5, borderColor: '#F0F0F0' },
  phoneInput: { flex: 1, fontSize: 15, color: COLORS.dark },
  removeButton: { padding: 4 },
  addButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, backgroundColor: COLORS.white, borderRadius: 12, borderWidth: 1.5, borderColor: '#4ECDC430', borderStyle: 'dashed', marginTop: 6 },
  addButtonText: { color: '#4ECDC4', fontSize: 14, fontWeight: '600', marginLeft: 8 },
  telefonoExtraContainer: { backgroundColor: '#F5F5F5', borderRadius: 12, padding: 12, marginTop: 12 },
  telefonoExtraHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  flagContainerSmall: { width: 40, height: 40, borderRadius: 12, backgroundColor: COLORS.white, justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: '#F0F0F0' },
  aliasInputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, borderRadius: 12, paddingHorizontal: 12, height: 46, gap: 8, borderWidth: 1.5, borderColor: '#F0F0F0' },
  aliasInput: { flex: 1, fontSize: 14, color: COLORS.dark },
  strengthContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, marginTop: -4, gap: 10, paddingHorizontal: 4 },
  strengthBar: { flex: 1, height: 4, backgroundColor: '#E5E5E5', borderRadius: 2, overflow: 'hidden' },
  strengthFill: { height: '100%', borderRadius: 2 },
  strengthLabel: { fontSize: 12, fontWeight: '600', width: 70 },
  matchContainer: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12, marginTop: -4, paddingLeft: 4 },
  matchText: { fontSize: 13, fontWeight: '500' },
  requirementsContainer: { backgroundColor: '#F9FAFB', borderRadius: 12, padding: 14, marginTop: 4 },
  requirementsTitle: { fontSize: 13, fontWeight: '600', color: COLORS.dark, marginBottom: 10 },
  requirement: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  requirementText: { fontSize: 12, color: COLORS.gray },
  requirementMet: { color: '#22C55E' },
  registerButton: { flexDirection: 'row', backgroundColor: '#4ECDC4', borderRadius: 14, paddingVertical: 16, alignItems: 'center', justifyContent: 'center', marginTop: 8, marginBottom: 20, gap: 8, elevation: 6 },
  registerButtonDisabled: { opacity: 0.6 },
  registerButtonText: { color: COLORS.white, fontSize: 16, fontWeight: '700' },
  infoNote: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0FDF4', padding: 12, borderRadius: 10, marginBottom: 12, gap: 10 },
  infoNoteText: { flex: 1, fontSize: 13, color: '#166534', lineHeight: 18 },
  // Modal styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContainer: { backgroundColor: COLORS.white, borderRadius: 24, padding: 28, width: '100%', maxWidth: 340, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.25, shadowRadius: 20, elevation: 10 },
  modalIconContainer: { width: 90, height: 90, borderRadius: 45, backgroundColor: '#E8FDF5', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 24, fontWeight: '800', color: COLORS.dark, marginBottom: 12, textAlign: 'center' },
  modalMessage: { fontSize: 15, color: COLORS.gray, textAlign: 'center', lineHeight: 22, marginBottom: 12 },
  phoneNumberContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0FDF4', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 12, marginBottom: 16, gap: 10 },
  phoneNumberText: { fontSize: 18, fontWeight: '700', color: COLORS.primary },
  modalInfoBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0FDFA', padding: 14, borderRadius: 12, marginBottom: 24, gap: 10 },
  modalInfoText: { flex: 1, fontSize: 13, color: '#115E59', lineHeight: 18 },
  modalButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#4ECDC4', paddingVertical: 16, paddingHorizontal: 32, borderRadius: 14, width: '100%', gap: 10, shadowColor: '#4ECDC4', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
  modalButtonText: { fontSize: 17, fontWeight: '700', color: COLORS.white },
  // Image options modal styles
  imageModalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.5)', padding: 20 },
  imageModalContainer: { backgroundColor: COLORS.white, borderRadius: 24, paddingHorizontal: 28, paddingTop: 28, paddingBottom: 20, width: '100%', maxWidth: 340 },
  imageModalTitle: { fontSize: 22, fontWeight: '800', color: COLORS.dark, textAlign: 'center', marginBottom: 6 },
  imageModalSubtitle: { fontSize: 14, color: COLORS.gray, textAlign: 'center', marginBottom: 24 },
  imageModalOptions: { flexDirection: 'row', justifyContent: 'center', gap: 20, marginBottom: 24 },
  imageModalOption: { alignItems: 'center', backgroundColor: '#F9FAFB', borderRadius: 16, padding: 20, width: 140 },
  imageModalIconBox: { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  imageModalOptionText: { fontSize: 15, fontWeight: '700', color: COLORS.dark, marginBottom: 4 },
  imageModalOptionHint: { fontSize: 12, color: COLORS.gray },
  imageModalCancelButton: { paddingVertical: 14, alignItems: 'center' },
  imageModalCancelText: { fontSize: 16, fontWeight: '600', color: COLORS.gray },
});
