import api from './api';

// Obtener estadísticas del admin
export const getEstadisticasAdmin = async () => {
  try {
    const response = await api.get('/admin/estadisticas');
    return response.data;
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    throw error;
  }
};

// Obtener todos los usuarios
export const getUsuarios = async (params = {}) => {
  try {
    const response = await api.get('/admin/usuarios', { params });
    return response.data;
  } catch (error) {
    console.error('Error obteniendo usuarios:', error);
    throw error;
  }
};

// Obtener detalle de un usuario
export const getUsuarioDetalle = async (id) => {
  try {
    const response = await api.get(`/admin/usuarios/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error obteniendo detalle usuario:', error);
    throw error;
  }
};

// Activar/Desactivar usuario
export const toggleUsuarioActivo = async (id, activo) => {
  try {
    const response = await api.patch(`/admin/usuarios/${id}/toggle-activo`, { activo });
    return response.data;
  } catch (error) {
    console.error('Error toggling usuario:', error);
    throw error;
  }
};

// Gestionar suscripción de propietario
export const gestionarSuscripcion = async (id, data) => {
  try {
    const response = await api.patch(`/admin/usuarios/${id}/suscripcion`, data);
    return response.data;
  } catch (error) {
    console.error('Error gestionando suscripción:', error);
    throw error;
  }
};

// Eliminar usuario
export const eliminarUsuario = async (id, hardDelete = false) => {
  try {
    const response = await api.delete(`/admin/usuarios/${id}`, { data: { hardDelete } });
    return response.data;
  } catch (error) {
    console.error('Error eliminando usuario:', error);
    throw error;
  }
};

// Pausar/Reactivar canchas de un propietario
export const toggleCanchasPropietario = async (id, activa) => {
  try {
    const response = await api.patch(`/admin/usuarios/${id}/canchas/toggle`, { activa });
    return response.data;
  } catch (error) {
    console.error('Error toggling canchas:', error);
    throw error;
  }
};

// Enviar notificación masiva
export const enviarNotificacionMasiva = async ({ titulo, mensaje, destinatarios, tipo }) => {
  try {
    const response = await api.post('/admin/notificaciones/enviar', {
      titulo,
      mensaje,
      destinatarios,
      tipo
    });
    return response.data;
  } catch (error) {
    console.error('Error enviando notificación:', error);
    throw error;
  }
};
