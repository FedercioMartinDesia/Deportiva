export { COLORS } from './colors';

export const API_URL = 'http://192.168.0.159:5000/api';

// Actividades base y modalidades
export const ACTIVIDADES_BASE = [
  { value: 'futbol', label: 'Fútbol', icon: 'football' },
  { value: 'tenis', label: 'Tenis', icon: 'tennisball' },
  { value: 'padel', label: 'Pádel', icon: 'tennisball' },
  { value: 'voley', label: 'Vóley', icon: 'ball' },
  { value: 'basquet', label: 'Básquet', icon: 'basketball' },
  { value: 'natacion', label: 'Natación', icon: 'water' },
  { value: 'gimnasio', label: 'Gimnasio', icon: 'fitness' },
  { value: 'yoga', label: 'Yoga', icon: 'meditate' },
  { value: 'pilates', label: 'Pilates', icon: 'body' },
  { value: 'newcom', label: 'Newcom', icon: 'ball' },
  { value: 'otro', label: 'Otro', icon: 'ellipse' },
];

export const MODALIDADES = {
  futbol: [
    { value: 'cuatro', label: 'Fútbol 4', participantes: 8 },
    { value: 'cinco', label: 'Fútbol 5', participantes: 10 },
    { value: 'seis', label: 'Fútbol 6', participantes: 12 },
    { value: 'siete', label: 'Fútbol 7', participantes: 14 },
    { value: 'ocho', label: 'Fútbol 8', participantes: 16 },
    { value: 'nueve', label: 'Fútbol 9', participantes: 18 },
    { value: 'once', label: 'Fútbol 11', participantes: 22 },
    { value: 'futsal', label: 'Futsal', participantes: 10 },
  ],
  tenis: [
    { value: 'singles', label: 'Tenis Singles', participantes: 2 },
    { value: 'dobles', label: 'Tenis Dobles', participantes: 4 },
  ],
  voley: [
    { value: 'indoor', label: 'Vóley Indoor', participantes: 12 },
    { value: 'playa', label: 'Vóley Playa', participantes: 4 },
  ],
  // Las siguientes actividades no tienen modalidades (usan null)
  padel: [],
  basquet: [],
  natacion: [],
  gimnasio: [],
  yoga: [],
  pilates: [],
  newcom: [],
  otro: [],
};

// Capacidades por defecto para actividades sin modalidad
export const CAPACIDADES_POR_DEFECTO = {
  padel: 4,
  basquet: 10,
  natacion: 20,
  gimnasio: 15,
  yoga: 12,
  pilates: 10,
  newcom: 12,
  otro: 10,
};

// Función para obtener el label completo de una actividad + modalidad
export function getActividadLabel(actividad, modalidad) {
  const actividadObj = ACTIVIDADES_BASE.find(a => a.value === actividad);
  if (!actividadObj) return 'Otro';
  
  if (!modalidad) return actividadObj.label;
  
  const modalidades = MODALIDADES[actividad] || [];
  const modalidadObj = modalidades.find(m => m.value === modalidad);
  
  return modalidadObj ? modalidadObj.label : actividadObj.label;
}

// Función para obtener la capacidad de participantes
export function getCapacidadParticipantes(actividad, modalidad) {
  if (modalidad) {
    const modalidades = MODALIDADES[actividad] || [];
    const modalidadObj = modalidades.find(m => m.value === modalidad);
    if (modalidadObj) return modalidadObj.participantes;
  }
  
  return CAPACIDADES_POR_DEFECTO[actividad] || 10;
}

// Función para obtener el icono de una actividad
export function getActividadIcon(actividad) {
  const actividadObj = ACTIVIDADES_BASE.find(a => a.value === actividad);
  return actividadObj ? actividadObj.icon : 'ellipse';
}

// Función legacy para compatibilidad - convierte formato antiguo a nuevo
export function convertirDeporteAntiguo(deporteAntiguo) {
  const conversiones = {
    'FUTBOL_4': { actividad: 'futbol', modalidad: 'cuatro' },
    'FUTBOL_5': { actividad: 'futbol', modalidad: 'cinco' },
    'FUTBOL_6': { actividad: 'futbol', modalidad: 'seis' },
    'FUTBOL_7': { actividad: 'futbol', modalidad: 'siete' },
    'FUTBOL_8': { actividad: 'futbol', modalidad: 'ocho' },
    'FUTBOL_9': { actividad: 'futbol', modalidad: 'nueve' },
    'FUTBOL_11': { actividad: 'futbol', modalidad: 'once' },
    'FUTSAL': { actividad: 'futbol', modalidad: 'futsal' },
    'PADEL': { actividad: 'padel', modalidad: null },
    'VOLEY': { actividad: 'voley', modalidad: 'indoor' },
    'VOLEY_PLAYA': { actividad: 'voley', modalidad: 'playa' },
    'NEWCOM': { actividad: 'newcom', modalidad: null },
    'TENIS_SINGLES': { actividad: 'tenis', modalidad: 'singles' },
    'TENIS_DOBLES': { actividad: 'tenis', modalidad: 'dobles' },
    'BASQUET': { actividad: 'basquet', modalidad: null },
    'NATACION': { actividad: 'natacion', modalidad: null },
    'GIMNASIO': { actividad: 'gimnasio', modalidad: null },
    'YOGA': { actividad: 'yoga', modalidad: null },
    'PILATES': { actividad: 'pilates', modalidad: null },
    'OTRO': { actividad: 'otro', modalidad: null },
  };
  
  return conversiones[deporteAntiguo] || { actividad: 'otro', modalidad: null };
}

export const ROLES = {
  JUGADOR: 'JUGADOR',
  PROPIETARIO: 'PROPIETARIO',
  ADMIN: 'ADMIN',
};

export const ESTADOS_RESERVA = {
  PENDIENTE: 'PENDIENTE',
  CONFIRMADA: 'CONFIRMADA',
  CANCELADA: 'CANCELADA',
  COMPLETADA: 'COMPLETADA',
};
