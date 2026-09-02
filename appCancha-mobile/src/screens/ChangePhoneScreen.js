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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../constants';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import CountryCodePicker from '../components/CountryCodePicker';

export default function ChangePhoneScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [codigoPais, setCodigoPais] = useState('+54');
  const [telefono, setTelefono] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendCode = async () => {
    if (!telefono.trim()) {
      Alert.alert('Error', 'Por favor ingresa tu nuevo número de teléfono');
      return;
    }

    if (telefono.length < 8) {
      Alert.alert('Error', 'Por favor ingresa un número de teléfono válido');
      return;
    }

    const telefonoCompleto = `${codigoPais}${telefono.trim()}`;

    setLoading(true);
    try {
      const response = await api.post('/auth/request-phone-change', { 
        nuevoTelefono: telefonoCompleto 
      });
      
      if (response.data.success) {
        Alert.alert(
          'Código enviado',
          'Recibirás un código de 6 dígitos en tu nuevo número por WhatsApp.',
          [
            {
              text: 'Continuar',
              onPress: () => navigation.navigate('VerifyPhoneChange', { nuevoTelefono: telefonoCompleto })
            }
          ]
        );
      }
    } catch (error) {
      Alert.alert(
        'Error',
        error.response?.data?.message || 'No se pudo enviar el código. Intenta nuevamente.'
      );
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
        <Text style={styles.title}>Cambiar número de teléfono</Text>
        <Text style={styles.subtitle}>
          Ingresa tu nuevo número de teléfono. Te enviaremos un código de verificación por WhatsApp para confirmar el cambio.
        </Text>

        {/* Current Phone */}
        <View style={styles.currentPhoneContainer}>
          <Text style={styles.currentPhoneLabel}>Número actual</Text>
          <Text style={styles.currentPhone}>{user?.telefono || 'No registrado'}</Text>
        </View>

        {/* New Phone Input */}
        <Text style={styles.newPhoneLabel}>Nuevo número</Text>
        <View style={styles.phoneContainer}>
          <View style={styles.countryCodeContainer}>
            <CountryCodePicker
              selectedCode={codigoPais}
              onSelect={setCodigoPais}
              accentColor={COLORS.primary}
            />
          </View>
          <View style={styles.phoneInputContainer}>
            <TextInput
              style={styles.phoneInput}
              placeholder="Número de teléfono"
              placeholderTextColor={COLORS.gray}
              value={telefono}
              onChangeText={setTelefono}
              keyboardType="phone-pad"
            />
          </View>
        </View>

        {/* Send Button */}
        <TouchableOpacity
          style={[styles.sendButton, loading && styles.sendButtonDisabled]}
          onPress={handleSendCode}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <>
              <Text style={styles.sendButtonText}>Enviar código</Text>
              <Ionicons name="arrow-forward" size={20} color={COLORS.white} />
            </>
          )}
        </TouchableOpacity>

        {/* Info */}
        <View style={styles.infoContainer}>
          <Ionicons name="information-circle-outline" size={18} color={COLORS.gray} />
          <Text style={styles.infoText}>
            El código se enviará al nuevo número para verificar que tienes acceso.
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
    marginBottom: 24,
  },
  currentPhoneContainer: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  currentPhoneLabel: {
    fontSize: 12,
    color: COLORS.gray,
    marginBottom: 4,
  },
  currentPhone: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.dark,
  },
  newPhoneLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.dark,
    marginBottom: 10,
  },
  phoneContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  countryCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 14,
    height: 54,
  },
  phoneInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 54,
  },
  phoneInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.dark,
  },
  sendButton: {
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
  sendButtonDisabled: {
    opacity: 0.7,
  },
  sendButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 20,
    paddingHorizontal: 10,
    gap: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.gray,
    lineHeight: 18,
  },
});
