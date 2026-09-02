import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faFootball, faVolleyball } from '@fortawesome/free-solid-svg-icons';

export const DeporteIcon = ({ deporte, size = 24, color = '#000' }) => {
  const iconMap = {
    FUTBOL_4: faFootball,
    FUTBOL_5: faFootball,
    FUTBOL_6: faFootball,
    FUTBOL_7: faFootball,
    FUTBOL_8: faFootball,
    FUTBOL_9: faFootball,
    FUTBOL_11: faFootball,
    FUTSAL: faFootball,
    VOLEY: faVolleyball,
    PADEL: 'tennisball',
    TENIS: 'tennisball',
    BASQUET: 'basketball',
  };

  const icon = iconMap[deporte];

  // Si es un icono de Font Awesome
  if (typeof icon === 'object') {
    return (
      <FontAwesomeIcon
        icon={icon}
        size={size}
        color={color}
      />
    );
  }

  // Si es un icono de Ionicons (para los que no tenemos en FA)
  return null;
};
