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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../constants';
import api from '../services/api';

export default function ResetPasswordScreen({ navigation, route }) {
  const { telefono, code } = route.params;
  const insets = useSafeAreaInsets();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const validatePassword = () => {
    if (password.length < 6) {
      return 'La contraseña debe tener al menos 6 caracteres';
    }
    if (password !== confirmPassword) {
      return 'Las contraseñas no coinciden';
    }
    return null;
  };

  const handleResetPassword = async () => {
    const error = validatePassword();
    if (error) {
      Alert.alert('Error', error);
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/auth/reset-password', {
        telefono,
        code,
        newPassword: password
      });

      if (response.data.success) {
        Alert.alert(
          '¡Contraseña actualizada!',
          'Tu contraseña ha sido cambiada exitosamente. Ya puedes iniciar sesión.',
          [
            {
              text: 'Iniciar sesión',
              onPress: () => navigation.navigate('Login')
            }
          ]
        );
      }
    } catch (error) {
      Alert.alert(
        'Error',
        error.response?.data?.message || 'No se pudo actualizar la contraseña. Intenta nuevamente.'
      );
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrength = () => {
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
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.dark} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Icon */}
        <View style={styles.iconContainer}>
          <Ionicons name="key-outline" size={60} color={COLORS.primary} />
        </View>

        {/* Title */}
        <Text style={styles.title}>Nueva contraseña</Text>
        <Text style={styles.subtitle}>
          Crea una contraseña segura para tu cuenta
        </Text>

        {/* Password Input */}
        <View style={styles.inputContainer}>
          <Ionicons name="lock-closed-outline" size={20} color={COLORS.gray} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Nueva contraseña"
            placeholderTextColor={COLORS.gray}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
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

        {/* Confirm Password Input */}
        <View style={styles.inputContainer}>
          <Ionicons name="lock-closed-outline" size={20} color={COLORS.gray} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Confirmar contraseña"
            placeholderTextColor={COLORS.gray}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!showConfirmPassword}
            autoCapitalize="none"
          />
          <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
            <Ionicons
              name={showConfirmPassword ? 'eye-outline' : 'eye-off-outline'}
              size={20}
              color={COLORS.gray}
            />
          </TouchableOpacity>
        </View>

        {/* Match indicator */}
        {confirmPassword.length > 0 && (
          <View style={styles.matchContainer}>
            <Ionicons
              name={password === confirmPassword ? 'checkmark-circle' : 'close-circle'}
              size={18}
              color={password === confirmPassword ? '#22C55E' : '#EF4444'}
            />
            <Text style={[
              styles.matchText,
              { color: password === confirmPassword ? '#22C55E' : '#EF4444' }
            ]}>
              {password === confirmPassword ? 'Las contraseñas coinciden' : 'Las contraseñas no coinciden'}
            </Text>
          </View>
        )}

        {/* Requirements */}
        <View style={styles.requirementsContainer}>
          <Text style={styles.requirementsTitle}>La contraseña debe tener:</Text>
          <View style={styles.requirement}>
            <Ionicons
              name={password.length >= 6 ? 'checkmark-circle' : 'ellipse-outline'}
              size={16}
              color={password.length >= 6 ? '#22C55E' : COLORS.gray}
            />
            <Text style={[styles.requirementText, password.length >= 6 && styles.requirementMet]}>
              Al menos 6 caracteres
            </Text>
          </View>
          <View style={styles.requirement}>
            <Ionicons
              name={/[A-Z]/.test(password) ? 'checkmark-circle' : 'ellipse-outline'}
              size={16}
              color={/[A-Z]/.test(password) ? '#22C55E' : COLORS.gray}
            />
            <Text style={[styles.requirementText, /[A-Z]/.test(password) && styles.requirementMet]}>
              Una letra mayúscula (recomendado)
            </Text>
          </View>
          <View style={styles.requirement}>
            <Ionicons
              name={/[0-9]/.test(password) ? 'checkmark-circle' : 'ellipse-outline'}
              size={16}
              color={/[0-9]/.test(password) ? '#22C55E' : COLORS.gray}
            />
            <Text style={[styles.requirementText, /[0-9]/.test(password) && styles.requirementMet]}>
              Un número (recomendado)
            </Text>
          </View>
        </View>

        {/* Reset Button */}
        <TouchableOpacity
          style={[styles.resetButton, loading && styles.resetButtonDisabled]}
          onPress={handleResetPassword}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <>
              <Text style={styles.resetButtonText}>Cambiar contraseña</Text>
              <Ionicons name="checkmark" size={20} color={COLORS.white} />
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
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
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
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
    marginBottom: 32,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 54,
    marginBottom: 12,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: COLORS.dark,
  },
  strengthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
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
    marginBottom: 16,
    paddingLeft: 4,
  },
  matchText: {
    fontSize: 13,
    fontWeight: '500',
  },
  requirementsContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  requirementsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.dark,
    marginBottom: 12,
  },
  requirement: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  requirementText: {
    fontSize: 13,
    color: COLORS.gray,
  },
  requirementMet: {
    color: '#22C55E',
  },
  resetButton: {
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
  resetButtonDisabled: {
    opacity: 0.7,
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
});
