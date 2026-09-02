import React, { useState, useRef, useEffect } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../constants';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

// Función para subir imagen de perfil durante registro (endpoint público)
const uploadProfileImage = async (imageUri) => {
  try {
    if (!imageUri || imageUri.startsWith('http')) {
      return imageUri;
    }
    
    // Convertir URI a base64
    const response = await fetch(imageUri);
    const blob = await response.blob();
    
    const base64 = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Data = reader.result.split(',')[1];
        resolve(base64Data);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
    
    // Usar endpoint público
    const uploadResponse = await api.post('/upload/profile-image', { image: base64 });
    
    if (uploadResponse.data.success) {
      return uploadResponse.data.data.url;
    }
    return null;
  } catch (error) {
    console.error('Error subiendo imagen de perfil:', error);
    return null;
  }
};

export default function VerifyRegisterPhoneScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { registerWithVerification } = useAuth();
  const { telefono, formData, profileImage, rol, isProfesor } = route.params;
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef([]);

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [resendTimer]);

  const handleCodeChange = (value, index) => {
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Auto-focus al siguiente input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Si se completó el código, verificar automáticamente
    if (index === 5 && value) {
      const fullCode = newCode.join('');
      if (fullCode.length === 6) {
        handleVerifyCode(fullCode);
      }
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyCode = async (fullCode) => {
    const codeToVerify = fullCode || code.join('');
    
    if (codeToVerify.length !== 6) {
      Alert.alert('Error', 'Por favor ingresa el código completo de 6 dígitos');
      return;
    }

    setLoading(true);
    try {
      // Verificar el código
      const verifyResponse = await api.post('/auth/register/verify-code', { 
        telefono, 
        code: codeToVerify 
      });
      
      if (verifyResponse.data.success) {
        const { verificationToken } = verifyResponse.data.data;
        
        // Subir imagen de perfil si existe
        let fotoUrl = null;
        if (profileImage) {
          fotoUrl = await uploadProfileImage(profileImage);
        }
        
        // Si es profesor, guardar flag para mostrar el formulario de perfil después de la bienvenida
        if (isProfesor) {
          await AsyncStorage.setItem('pendingProfesorSetup', 'true');
        }

        // Registrar con el token de verificación y hacer login automático
        const result = await registerWithVerification({
          ...formData,
          telefono,
          rol: rol || 'JUGADOR',
          foto: fotoUrl,
          verificationToken
        });

        if (result.success) {
          // El AuthContext ya setea isNewUser=true, lo que mostrará la pantalla de bienvenida
          // Si isProfesor, WelcomeScreen navegará a ProfesorProfileSetup antes de completar
          console.log('✅ Registro exitoso, mostrando bienvenida...');
        } else {
          Alert.alert('Error', result.message || 'No se pudo completar el registro');
        }
      }
    } catch (error) {
      Alert.alert(
        'Error',
        error.response?.data?.message || error.message || 'Código inválido o expirado'
      );
      // Limpiar el código
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!canResend) return;

    setLoading(true);
    try {
      await api.post('/auth/register/request-code', { 
        telefono, 
        nombre: formData.nombre,
        email: formData.email 
      });
      Alert.alert('Código reenviado', 'Te hemos enviado un nuevo código por WhatsApp.');
      setResendTimer(60);
      setCanResend(false);
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'No se pudo reenviar el código');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { paddingTop: insets.top }]}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.dark} />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {/* Icon */}
        <View style={styles.iconContainer}>
          <Ionicons name="phone-portrait-outline" size={50} color={COLORS.primary} />
        </View>

        {/* Title */}
        <Text style={styles.title}>Verificar tu número</Text>
        <Text style={styles.subtitle}>
          Te enviamos un código de 6 dígitos por WhatsApp a:
        </Text>
        <Text style={styles.phoneNumber}>{telefono}</Text>

        {/* Code Input */}
        <View style={styles.codeContainer}>
          {code.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => (inputRefs.current[index] = ref)}
              style={[
                styles.codeInput,
                digit && styles.codeInputFilled,
              ]}
              value={digit}
              onChangeText={(value) => handleCodeChange(value.replace(/[^0-9]/g, ''), index)}
              onKeyPress={(e) => handleKeyPress(e, index)}
              keyboardType="number-pad"
              maxLength={1}
              selectTextOnFocus
            />
          ))}
        </View>

        {/* Verify Button */}
        <TouchableOpacity
          style={[styles.verifyButton, loading && styles.verifyButtonDisabled]}
          onPress={() => handleVerifyCode()}
          disabled={loading || code.join('').length !== 6}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <>
              <Text style={styles.verifyButtonText}>Verificar y Crear Cuenta</Text>
              <Ionicons name="checkmark-circle" size={20} color={COLORS.white} />
            </>
          )}
        </TouchableOpacity>

        {/* Resend */}
        <View style={styles.resendContainer}>
          <Text style={styles.resendText}>¿No recibiste el código?</Text>
          {canResend ? (
            <TouchableOpacity onPress={handleResendCode} disabled={loading}>
              <Text style={styles.resendButton}>Reenviar código</Text>
            </TouchableOpacity>
          ) : (
            <Text style={styles.resendTimer}>Reenviar en {resendTimer}s</Text>
          )}
        </View>

        {/* WhatsApp Note */}
        <View style={styles.noteContainer}>
          <Ionicons name="logo-whatsapp" size={18} color="#25D366" />
          <Text style={styles.noteText}>
            El código se envía por WhatsApp. Asegúrate de tener WhatsApp instalado en el número indicado.
          </Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 10,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.dark,
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.gray,
    textAlign: 'center',
    lineHeight: 22,
  },
  phoneNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
    textAlign: 'center',
    marginBottom: 32,
  },
  codeContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 32,
  },
  codeInput: {
    width: 48,
    height: 56,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    color: COLORS.dark,
  },
  codeInputFilled: {
    backgroundColor: COLORS.primary + '15',
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  verifyButton: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  verifyButtonDisabled: {
    opacity: 0.7,
  },
  verifyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
  resendContainer: {
    alignItems: 'center',
    marginTop: 24,
  },
  resendText: {
    fontSize: 14,
    color: COLORS.gray,
    marginBottom: 8,
  },
  resendButton: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  resendTimer: {
    fontSize: 14,
    color: COLORS.gray,
  },
  noteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    padding: 12,
    borderRadius: 10,
    marginTop: 32,
    gap: 10,
  },
  noteText: {
    flex: 1,
    fontSize: 12,
    color: '#166534',
    lineHeight: 18,
  },
});
