import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Dimensions,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../constants';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import Toast from '../components/Toast';

const { width } = Dimensions.get('window');

export default function FriendsScreen({ navigation }) {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState('agregar');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [amigos, setAmigos] = useState([]);
  const [bloqueados, setBloqueados] = useState([]);
  const [loading, setLoading] = useState(false);
  const [followedUsers, setFollowedUsers] = useState(new Set());
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });

  const tabIndicatorPos = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadAmigos();
    loadBloqueados();
  }, []);

  useEffect(() => {
    const tabPositions = { agregar: 0, mis: width / 3, bloqueados: (width / 3) * 2 };
    Animated.timing(tabIndicatorPos, {
      toValue: tabPositions[activeTab] || 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [activeTab]);

  const loadAmigos = async () => {
    try {
      const response = await api.get('/usuarios/amigos');
      if (response.data.success && response.data.amigos) {
        setAmigos(response.data.amigos);
        const followedIds = new Set(response.data.amigos.map(a => a.id));
        setFollowedUsers(followedIds);
      }
    } catch (error) {
      console.log('Error loading amigos', error);
    }
  };

  const loadBloqueados = async () => {
    try {
      const response = await api.get('/usuarios/bloqueados');
      if (response.data.success && response.data.bloqueados) {
        setBloqueados(response.data.bloqueados);
      }
    } catch (error) {
      console.log('Error loading bloqueados', error);
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
        const filtered = response.data.usuarios.filter(u => u.id !== user?.id);
        setSearchResults(filtered);
      }
    } catch (error) {
      console.log('Error searching users', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFollowUser = async (userData) => {
    try {
      const response = await api.post(`/usuarios/seguir/${userData.id}`);
      if (response.data.success) {
        setFollowedUsers(prev => new Set([...prev, userData.id]));
        setAmigos(prev => [...prev, userData]);
        showToast(`Ahora sigues a ${userData.nombre}`, 'success');
      }
    } catch (error) {
      console.log('Error following user', error);
      if (error.response?.data?.message) {
        showToast(error.response.data.message, 'warning');
      } else {
        showToast('No se pudo seguir al usuario', 'error');
      }
    }
  };

  const handleUnfollowUser = async (userData) => {
    try {
      const response = await api.post(`/usuarios/dejar-de-seguir/${userData.id}`);
      if (response.data.success) {
        const newFollowed = new Set(followedUsers);
        newFollowed.delete(userData.id);
        setFollowedUsers(newFollowed);
        setAmigos(prev => prev.filter(a => a.id !== userData.id));
        showToast(`Dejaste de seguir a ${userData.nombre}`, 'info');
      }
    } catch (error) {
      console.log('Error unfollowing user', error);
      showToast('No se pudo dejar de seguir', 'error');
    }
  };

  const handleBlockUser = async (userData) => {
    const nombreMostrar = userData.alias || `${userData.nombre} ${userData.apellido}`;
    
    Alert.alert(
      'Bloquear usuario',
      `¿Estás seguro que deseas bloquear a "${nombreMostrar}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Bloquear',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await api.post(`/usuarios/bloquear/${userData.id}`);
              if (response.data.success) {
                // Remover de amigos si estaba
                const newFollowed = new Set(followedUsers);
                newFollowed.delete(userData.id);
                setFollowedUsers(newFollowed);
                setAmigos(prev => prev.filter(a => a.id !== userData.id));
                
                // Agregar a bloqueados
                setBloqueados(prev => [{ ...userData, bloqueadoEn: new Date() }, ...prev]);
                
                // Mostrar mensaje informativo
                Alert.alert(
                  `Has bloqueado a "${nombreMostrar}"`,
                  `Las reservas que tú crees no aparecerán para este usuario, ni tampoco si necesitas un participante más le aparecerá a "${nombreMostrar}".\n\nY a ti no te llegarán invitaciones a actividades en las que "${nombreMostrar}" esté incluido.`,
                  [{ text: 'Entendido' }]
                );
              }
            } catch (error) {
              console.log('Error blocking user', error);
              if (error.response?.data?.message) {
                showToast(error.response.data.message, 'error');
              } else {
                showToast('No se pudo bloquear al usuario', 'error');
              }
            }
          }
        }
      ]
    );
  };

  const handleUnblockUser = async (userData) => {
    try {
      const response = await api.post(`/usuarios/desbloquear/${userData.id}`);
      if (response.data.success) {
        setBloqueados(prev => prev.filter(b => b.id !== userData.id));
        const nombreMostrar = userData.alias || `${userData.nombre} ${userData.apellido}`;
        showToast(`Has desbloqueado a "${nombreMostrar}"`, 'success');
      }
    } catch (error) {
      console.log('Error unblocking user', error);
      showToast('No se pudo desbloquear al usuario', 'error');
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({ visible: true, message, type });
    setTimeout(() => {
      setToast({ visible: false, message: '', type: 'success' });
    }, 2500);
  };

  const UserCard = ({ user: userData, onFollow, onUnfollow, showBlockOption = false, onBlock }) => {
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
        <View style={styles.cardActions}>
          <TouchableOpacity
            style={[
              styles.followButton,
              isFollowed && styles.followButtonActive,
            ]}
            onPress={() => isFollowed ? onUnfollow(userData) : onFollow(userData)}
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
          {showBlockOption && (
            <TouchableOpacity
              style={styles.blockButton}
              onPress={() => onBlock(userData)}
            >
              <Ionicons name="ban-outline" size={18} color={COLORS.error} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const BlockedUserCard = ({ user: userData, onUnblock }) => {
    return (
      <View style={styles.userCard}>
        <View style={styles.userInfo}>
          <View style={[styles.avatar, styles.avatarBlocked]}>
            <Text style={[styles.avatarText, styles.avatarTextBlocked]}>
              {userData.nombre?.charAt(0).toUpperCase() || 'U'}
            </Text>
          </View>
          <View style={styles.userDetails}>
            <Text style={styles.userName}>{userData.nombre} {userData.apellido}</Text>
            <Text style={styles.userAlias}>@{userData.alias || 'sin alias'}</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.unblockButton}
          onPress={() => onUnblock(userData)}
        >
          <Ionicons name="lock-open-outline" size={18} color={COLORS.white} />
          <Text style={styles.unblockButtonText}>Desbloquear</Text>
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
        <Text style={styles.headerTitle}>Amigos</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={styles.tab}
          onPress={() => setActiveTab('agregar')}
        >
          <Text style={[
            styles.tabLabel,
            activeTab === 'agregar' && styles.tabLabelActive
          ]}>
            Agregar
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.tab}
          onPress={() => setActiveTab('mis')}
        >
          <Text style={[
            styles.tabLabel,
            activeTab === 'mis' && styles.tabLabelActive
          ]}>
            Amigos ({amigos.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.tab}
          onPress={() => setActiveTab('bloqueados')}
        >
          <Text style={[
            styles.tabLabel,
            activeTab === 'bloqueados' && styles.tabLabelActive
          ]}>
            Bloqueados
          </Text>
        </TouchableOpacity>
        <Animated.View
          style={[
            styles.tabIndicator,
            styles.tabIndicatorThird,
            {
              transform: [{ translateX: tabIndicatorPos }],
            },
          ]}
        />
      </View>

      {/* Content */}
      {activeTab === 'agregar' ? (
        <>
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
              renderItem={({ item }) => (
                <UserCard
                  user={item}
                  onFollow={handleFollowUser}
                  onUnfollow={handleUnfollowUser}
                />
              )}
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
              <Text style={styles.emptyText}>Busca otros participantes</Text>
              <Text style={styles.emptySubtext}>Escribe un alias para empezar a seguir a otros</Text>
            </View>
          )}
        </>
      ) : activeTab === 'mis' ? (
        <>
          {amigos.length > 0 ? (
            <FlatList
              data={amigos}
              renderItem={({ item }) => (
                <UserCard
                  user={item}
                  onFollow={handleFollowUser}
                  onUnfollow={handleUnfollowUser}
                  showBlockOption={true}
                  onBlock={handleBlockUser}
                />
              )}
              keyExtractor={(item) => item.id.toString()}
              contentContainerStyle={styles.listContent}
              scrollEnabled={true}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={48} color={COLORS.gray} />
              <Text style={styles.emptyText}>No tienes amigos aún</Text>
              <Text style={styles.emptySubtext}>¡Ve a la pestaña Agregar y comienza a seguir!</Text>
            </View>
          )}
        </>
      ) : (
        <>
          {bloqueados.length > 0 ? (
            <FlatList
              data={bloqueados}
              renderItem={({ item }) => (
                <BlockedUserCard
                  user={item}
                  onUnblock={handleUnblockUser}
                />
              )}
              keyExtractor={(item) => item.id.toString()}
              contentContainerStyle={styles.listContent}
              scrollEnabled={true}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="ban-outline" size={48} color={COLORS.gray} />
              <Text style={styles.emptyText}>No tienes usuarios bloqueados</Text>
              <Text style={styles.emptySubtext}>Los usuarios que bloquees aparecerán aquí</Text>
            </View>
          )}
        </>
      )}

      {/* Toast Notification */}
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={() => setToast({ visible: false, message: '', type: 'success' })}
      />
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
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderBottomWidth: 2,
    borderBottomColor: '#F0F0F0',
    height: 50,
  },
  tab: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.gray,
  },
  tabLabelActive: {
    color: COLORS.primary,
  },
  tabIndicator: {
    position: 'absolute',
    bottom: -2,
    height: 2,
    width: width / 3,
    backgroundColor: COLORS.primary,
  },
  tabIndicatorThird: {
    width: width / 3,
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
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  blockButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.error + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  unblockButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
  },
  unblockButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.white,
  },
  avatarBlocked: {
    backgroundColor: COLORS.error + '20',
  },
  avatarTextBlocked: {
    color: COLORS.error,
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
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});
