import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../constants';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

export default function AddFriendsScreen({ navigation }) {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [followedUsers, setFollowedUsers] = useState(new Set());

  useEffect(() => {
    // Cargar usuarios que el usuario ya sigue
    loadFollowedUsers();
  }, []);

  const loadFollowedUsers = async () => {
    try {
      const response = await api.get('/usuarios/amigos');
      if (response.data.success && response.data.amigos) {
        const followedIds = new Set(response.data.amigos.map(a => a.id));
        setFollowedUsers(followedIds);
      }
    } catch (error) {
      console.log('Error loading followed users', error);
    }
  };

  const searchUsers = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    try {
      const response = await api.get(`/usuarios/buscar?alias=${encodeURIComponent(query)}`);
      if (response.data.success) {
        // Filtrar al usuario actual de los resultados
        const filtered = response.data.usuarios.filter(u => u.id !== user?.id);
        setSearchResults(filtered);
      }
    } catch (error) {
      console.log('Error searching users', error);
      if (error.response?.status !== 404) {
        Alert.alert('Error', 'No se pudieron cargar los usuarios');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFollowUser = async (userId) => {
    try {
      const response = await api.post(`/usuarios/seguir/${userId}`);
      if (response.data.success) {
        setFollowedUsers(prev => new Set([...prev, userId]));
        Alert.alert('Éxito', '¡Ahora estás siguiendo a este usuario!');
      }
    } catch (error) {
      console.log('Error following user', error);
      Alert.alert('Error', 'No se pudo seguir al usuario');
    }
  };

  const handleUnfollowUser = async (userId) => {
    try {
      const response = await api.post(`/usuarios/dejar-de-seguir/${userId}`);
      if (response.data.success) {
        const newFollowed = new Set(followedUsers);
        newFollowed.delete(userId);
        setFollowedUsers(newFollowed);
        Alert.alert('Éxito', 'Has dejado de seguir a este usuario');
      }
    } catch (error) {
      console.log('Error unfollowing user', error);
      Alert.alert('Error', 'No se pudo dejar de seguir al usuario');
    }
  };

  const UserCard = ({ user: userData }) => {
    const isFollowed = followedUsers.has(userData.id);

    return (
      <View style={styles.userCard}>
        <View style={styles.userInfo}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {userData.nombre?.charAt(0).toUpperCase() || 'U'}
            </Text>
          </View>
          <View style={styles.userDetails}>
            <Text style={styles.userName}>{userData.nombre} {userData.apellido}</Text>
            <Text style={styles.userAlias}>@{userData.alias || 'sin alias'}</Text>
          </View>
        </View>
        <TouchableOpacity
          style={[
            styles.followButton,
            isFollowed && styles.followButtonActive,
          ]}
          onPress={() => isFollowed ? handleUnfollowUser(userData.id) : handleFollowUser(userData.id)}
        >
          <Ionicons
            name={isFollowed ? 'checkmark' : 'person-add'}
            size={18}
            color={isFollowed ? COLORS.white : COLORS.primary}
          />
          <Text style={[
            styles.followButtonText,
            isFollowed && styles.followButtonTextActive,
          ]}>
            {isFollowed ? 'Siguiendo' : 'Seguir'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="chevron-back" size={24} color={COLORS.dark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Agregar Amigos</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputWrapper}>
          <Ionicons name="search" size={20} color={COLORS.gray} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por alias..."
            placeholderTextColor={COLORS.gray}
            value={searchQuery}
            onChangeText={(text) => {
              setSearchQuery(text);
              searchUsers(text);
            }}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => {
              setSearchQuery('');
              setSearchResults([]);
            }}>
              <Ionicons name="close-circle" size={20} color={COLORS.gray} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Results List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : searchResults.length > 0 ? (
        <FlatList
          data={searchResults}
          renderItem={({ item }) => <UserCard user={item} />}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          scrollEnabled={true}
        />
      ) : searchQuery.length > 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="search-outline" size={48} color={COLORS.gray} />
          <Text style={styles.emptyText}>No se encontraron usuarios</Text>
          <Text style={styles.emptySubtext}>Intenta con otro alias</Text>
        </View>
      ) : (
        <View style={styles.emptyContainer}>
          <View style={styles.iconAnimation}>
            <View style={styles.playerContainer}>
              <Ionicons name="person" size={60} color={COLORS.primary} />
            </View>
            <View style={styles.ballContainer}>
              <Ionicons name="football" size={24} color="#FF6B35" />
            </View>
          </View>
          <Text style={styles.emptyText}>Busca otros jugadores</Text>
          <Text style={styles.emptySubtext}>Escribe un alias para empezar a seguir a otros</Text>
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
  header: {
    paddingBottom: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.dark,
    flex: 1,
    textAlign: 'center',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    marginRight: 8,
    fontSize: 16,
    color: COLORS.dark,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.primary,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.dark,
    marginBottom: 4,
  },
  userAlias: {
    fontSize: 13,
    color: COLORS.gray,
  },
  followButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: COLORS.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
  },
  followButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  followButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
  },
  followButtonTextActive: {
    color: COLORS.white,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconAnimation: {
    position: 'relative',
    width: 140,
    height: 140,
    marginBottom: 24,
  },
  playerContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
  },
  ballContainer: {
    position: 'absolute',
    bottom: 10,
    right: 0,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FF6B35' + '20',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FF6B35' + '40',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.dark,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.gray,
    marginTop: 8,
  },
});
