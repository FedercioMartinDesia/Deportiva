import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Animated,
} from 'react-native';
import ShimmerPlaceholder from '../components/ShimmerPlaceholder';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants';
import { canchaService } from '../services/canchaService';

function CanchaCard({ item, navigation, index }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, { toValue: 1, duration: 400, delay: index * 60, useNativeDriver: true }).start();
  }, []);

  return (
    <Animated.View style={{ opacity: anim, transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }] }}>
      <TouchableOpacity
        style={styles.canchaCard}
        onPress={() => navigation.navigate('CanchaDetail', { canchaId: item.id })}
      >
        <View style={styles.canchaIconContainer}>
          <Ionicons name="football" size={28} color={COLORS.primary} />
        </View>
        <View style={styles.canchaInfo}>
          <Text style={styles.canchaName} numberOfLines={1}>{item.nombre}</Text>
          <View style={styles.canchaRow}>
              <Ionicons name="location-outline" size={13} color={COLORS.gray} />
              <Text style={styles.canchaLocation} numberOfLines={1}>{[item.direccion, item.ciudad, item.provincia].filter(Boolean).join(', ')}</Text>
            </View>
          <View style={styles.canchaRow}>
            <Ionicons name="star" size={13} color="#FFC107" />
            <Text style={styles.canchaRating}>{item.calificacionPromedio?.toFixed(1) || 'N/A'}</Text>
            <Text style={styles.canchaPrice}>${item.precioPorHora}/h</Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={18} color={COLORS.lightGray} />
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function CanchasListScreen({ navigation }) {
  const [canchas, setCanchas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [filteredCanchas, setFilteredCanchas] = useState([]);

  useEffect(() => {
    loadCanchas();
  }, []);

  useEffect(() => {
    const q = (searchText || '').trim();
    if (q) {
      const ql = q.toLowerCase();
      const filtered = canchas.filter(
        (cancha) =>
          cancha.nombre.toLowerCase().includes(ql) ||
          cancha.ciudad?.toLowerCase().includes(ql) ||
          cancha.direccion?.toLowerCase().includes(ql) ||
          cancha.provincia?.toLowerCase().includes(ql)
      );
      setFilteredCanchas(filtered);
    } else {
      setFilteredCanchas(canchas);
    }
  }, [searchText, canchas]);

  const loadCanchas = async () => {
    setLoading(true);
    try {
      const response = await canchaService.getCanchas();
      if (response && response.success) {
        // La API devuelve { success: true, data: [...] , pagination: {...} }
        // `response.data` es el arreglo de canchas
        const canchasArray = Array.isArray(response.data) ? response.data : (response.data?.canchas || []);
        setCanchas(canchasArray);
        setFilteredCanchas(canchasArray);
      }
    } catch (error) {
      console.error('Error loading canchas:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderCanchaCard = ({ item, index }) => (
    <CanchaCard item={item} navigation={navigation} index={index} />
  );

  return (
    <View style={styles.container}>
      <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Todos los Espacios</Text>

        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={COLORS.gray} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por nombre o ciudad..."
            placeholderTextColor={COLORS.gray}
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>
      </LinearGradient>

      {loading ? (
        <View style={styles.loadingContainer}>
          {/* Shimmer skeleton: 6 items */}
          {Array.from({ length: 6 }).map((_, i) => (
            <View key={i} style={styles.shimmerRow}>
              <ShimmerPlaceholder style={styles.shimmerIcon} width={54} height={54} borderRadius={10} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <ShimmerPlaceholder width={200} height={18} borderRadius={6} style={{ marginBottom: 8 }} />
                <ShimmerPlaceholder width={140} height={14} borderRadius={6} />
              </View>
            </View>
          ))}
        </View>
      ) : (
        <FlatList
          data={filteredCanchas}
          renderItem={renderCanchaCard}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          initialNumToRender={10}
          maxToRenderPerBatch={5}
          windowSize={10}
          removeClippedSubviews={true}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No se encontraron espacios</Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: 15,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 15,
    paddingHorizontal: 15,
    height: 50,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.dark,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    padding: 20,
  },
  canchaCard: {
    flexDirection: 'row',
    backgroundColor: '#0F1724',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#00E7C7',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
  },
  canchaIconContainer: {
    width: 54,
    height: 54,
    borderRadius: 10,
    backgroundColor: '#0B1220',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  canchaInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  canchaName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#E6FDF6',
    marginBottom: 4,
  },
  canchaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  canchaLocation: {
    fontSize: 12,
    color: '#9FBFB5',
    marginLeft: 4,
    flex: 1,
  },
  canchaRating: {
    fontSize: 12,
    color: '#E6FDF6',
    marginLeft: 4,
    fontWeight: '600',
  },
  canchaPrice: {
    fontSize: 13,
    fontWeight: '800',
    color: '#00FFD1',
    marginLeft: 'auto',
  },
  emptyText: {
    textAlign: 'center',
    color: COLORS.gray,
    marginTop: 40,
    fontSize: 16,
  },
});
