import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants';
import { getUsuarios } from '../../services/adminService';

export default function AdminUsuariosScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const initialRol = route.params?.rol || null;
  const showSearch = route.params?.search || false;
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [usuarios, setUsuarios] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [filters, setFilters] = useState({
    rol: initialRol,
    activo: null,
    suscripcionActiva: null,
    search: '',
  });
  const [searchText, setSearchText] = useState('');

  const loadUsuarios = async (page = 1, append = false) => {
    try {
      if (page === 1) setLoading(true);
      else setLoadingMore(true);

      const params = { page, limit: 20 };
      if (filters.rol) params.rol = filters.rol;
      if (filters.activo !== null) params.activo = filters.activo;
      if (filters.suscripcionActiva !== null) params.suscripcionActiva = filters.suscripcionActiva;
      if (filters.search) params.search = filters.search;

      const response = await getUsuarios(params);
      
      if (response.success) {
        if (append) {
          setUsuarios(prev => [...prev, ...response.data.usuarios]);
        } else {
          setUsuarios(response.data.usuarios);
        }
        setPagination(response.data.pagination);
      }
    } catch (error) {
      console.error('Error cargando usuarios:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    loadUsuarios();
  }, [filters]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadUsuarios(1);
  }, [filters]);

  const loadMore = () => {
    if (!loadingMore && pagination.page < pagination.totalPages) {
      loadUsuarios(pagination.page + 1, true);
    }
  };

  const handleSearch = () => {
    setFilters(prev => ({ ...prev, search: searchText }));
  };

  const FilterChip = ({ label, active, onPress }) => (
    <TouchableOpacity
      style={[styles.filterChip, active && styles.filterChipActive]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const UserCard = ({ usuario }) => {
    const isPropietario = usuario.rol === 'PROPIETARIO';
    const suscripcionVencida = isPropietario && usuario.suscripcionFechaFin && 
      new Date(usuario.suscripcionFechaFin) < new Date();

    return (
      <TouchableOpacity
        style={styles.userCard}
        onPress={() => navigation.navigate('AdminUsuarioDetalle', { id: usuario.id })}
        activeOpacity={0.7}
      >
        <View style={styles.userAvatar}>
          {usuario.foto ? (
            <Image source={{ uri: usuario.foto }} style={styles.avatarImage} />
          ) : (
            <Ionicons 
              name={isPropietario ? 'business' : 'person'} 
              size={28} 
              color={COLORS.gray} 
            />
          )}
        </View>
        
        <View style={styles.userInfo}>
          <View style={styles.userHeader}>
            <Text style={styles.userName} numberOfLines={1}>
              {usuario.nombre} {usuario.apellido}
            </Text>
            <View style={styles.badges}>
              {!usuario.activo && (
                <View style={[styles.badge, styles.badgeInactive]}>
                  <Text style={styles.badgeText}>Inactivo</Text>
                </View>
              )}
              {isPropietario && !usuario.suscripcionActiva && (
                <View style={[styles.badge, styles.badgeNoSub]}>
                  <Text style={styles.badgeText}>Sin Sub</Text>
                </View>
              )}
              {suscripcionVencida && (
                <View style={[styles.badge, styles.badgeExpired]}>
                  <Text style={styles.badgeText}>Vencida</Text>
                </View>
              )}
            </View>
          </View>
          
          <Text style={styles.userEmail} numberOfLines={1}>{usuario.email}</Text>
          
          <View style={styles.userMeta}>
            <View style={[styles.rolBadge, isPropietario ? styles.rolPropietario : styles.rolJugador]}>
              <Text style={styles.rolText}>
                {isPropietario ? 'Propietario' : 'Participante'}
              </Text>
            </View>
            <Text style={styles.userStats}>
              {isPropietario 
                ? `${usuario._count?.canchasPropiedad || 0} espacios`
                : `${usuario._count?.reservas || 0} reservas`
              }
            </Text>
          </View>
        </View>
        
        <Ionicons name="chevron-forward" size={20} color={COLORS.gray} />
      </TouchableOpacity>
    );
  };

  const getTitle = () => {
    if (filters.rol === 'JUGADOR') return 'Participantes';
    if (filters.rol === 'PROPIETARIO') return 'Propietarios';
    return 'Todos los Usuarios';
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.dark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{getTitle()}</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputWrapper}>
          <Ionicons name="search" size={20} color={COLORS.gray} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por nombre, email..."
            value={searchText}
            onChangeText={setSearchText}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => { setSearchText(''); setFilters(prev => ({ ...prev, search: '' })); }}>
              <Ionicons name="close-circle" size={20} color={COLORS.gray} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        <ScrollViewHorizontal>
          <FilterChip
            label="Todos"
            active={!filters.rol}
            onPress={() => setFilters(prev => ({ ...prev, rol: null }))}
          />
          <FilterChip
            label="Participantes"
            active={filters.rol === 'JUGADOR'}
            onPress={() => setFilters(prev => ({ ...prev, rol: 'JUGADOR' }))}
          />
          <FilterChip
            label="Propietarios"
            active={filters.rol === 'PROPIETARIO'}
            onPress={() => setFilters(prev => ({ ...prev, rol: 'PROPIETARIO' }))}
          />
          <FilterChip
            label="Activos"
            active={filters.activo === true}
            onPress={() => setFilters(prev => ({ 
              ...prev, 
              activo: prev.activo === true ? null : true 
            }))}
          />
          <FilterChip
            label="Inactivos"
            active={filters.activo === false}
            onPress={() => setFilters(prev => ({ 
              ...prev, 
              activo: prev.activo === false ? null : false 
            }))}
          />
          <FilterChip
            label="Sin Suscripción"
            active={filters.suscripcionActiva === false}
            onPress={() => setFilters(prev => ({ 
              ...prev, 
              suscripcionActiva: prev.suscripcionActiva === false ? null : false 
            }))}
          />
        </ScrollViewHorizontal>
      </View>

      {/* Lista */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={usuarios}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <UserCard usuario={item} />}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={loadingMore && (
            <ActivityIndicator style={{ marginVertical: 20 }} color={COLORS.primary} />
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={64} color={COLORS.gray} />
              <Text style={styles.emptyText}>No se encontraron usuarios</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

// Componente simple para scroll horizontal
const ScrollViewHorizontal = ({ children }) => (
  <FlatList
    horizontal
    showsHorizontalScrollIndicator={false}
    data={React.Children.toArray(children)}
    keyExtractor={(_, index) => index.toString()}
    renderItem={({ item }) => item}
    contentContainerStyle={{ paddingHorizontal: 16 }}
  />
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F7',
  },
  centered: {
    flex: 1,
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
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F7',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: COLORS.dark,
  },
  filtersContainer: {
    backgroundColor: COLORS.white,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F5F5F7',
    borderRadius: 20,
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.gray,
  },
  filterChipTextActive: {
    color: COLORS.white,
  },
  listContent: {
    padding: 16,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  userAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F5F5F7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  userInfo: {
    flex: 1,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.dark,
    flex: 1,
  },
  badges: {
    flexDirection: 'row',
    gap: 4,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeInactive: {
    backgroundColor: '#FFE5E5',
  },
  badgeNoSub: {
    backgroundColor: '#FFF3E0',
  },
  badgeExpired: {
    backgroundColor: '#FFEBEE',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.danger,
  },
  userEmail: {
    fontSize: 13,
    color: COLORS.gray,
    marginTop: 2,
  },
  userMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  rolBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 8,
  },
  rolJugador: {
    backgroundColor: COLORS.primary + '20',
  },
  rolPropietario: {
    backgroundColor: '#FF950020',
  },
  rolText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.dark,
  },
  userStats: {
    fontSize: 12,
    color: COLORS.gray,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.gray,
    marginTop: 12,
  },
});
