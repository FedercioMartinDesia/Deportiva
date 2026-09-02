import api from './api';

export const sancionService = {
  // Obtener sanciones aplicadas por el propietario
  getMisSanciones: async () => {
    try {
      const response = await api.get('/sanciones/mis-sanciones');
      return response.data;
    } catch (error) {
      console.error('Error obteniendo sanciones:', error);
      throw error;
    }
  },

  // Obtener jugadores que han reservado en mis canchas
  getJugadoresMisCanchas: async (search = '') => {
    try {
      const response = await api.get('/sanciones/jugadores-mis-canchas', {
        params: { search }
      });
      return response.data;
    } catch (error) {
      console.error('Error obteniendo jugadores:', error);
      throw error;
    }
  },

  // Buscar jugadores por nombre/email
  buscarJugadores: async (search) => {
    try {
      const response = await api.get('/sanciones/buscar-jugadores', {
        params: { search }
      });
      return response.data;
    } catch (error) {
      console.error('Error buscando jugadores:', error);
      throw error;
    }
  },

  // Crear una nueva sanción
  crearSancion: async (data) => {
    try {
      const response = await api.post('/sanciones', data);
      return response.data;
    } catch (error) {
      console.error('Error creando sanción:', error);
      throw error;
    }
  },

  // Eliminar una sanción
  eliminarSancion: async (id) => {
    try {
      const response = await api.delete(`/sanciones/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error eliminando sanción:', error);
      throw error;
    }
  },

  // Verificar si un jugador está sancionado para una cancha
  verificarSancion: async (jugadorId, canchaId) => {
    try {
      const response = await api.get(`/sanciones/verificar/${jugadorId}/${canchaId}`);
      return response.data;
    } catch (error) {
      console.error('Error verificando sanción:', error);
      throw error;
    }
  }
};
