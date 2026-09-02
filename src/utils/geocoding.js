// Función para geocodificar una dirección usando Nominatim (OpenStreetMap)
export const geocodificarDireccion = async (direccion, ciudad, provincia) => {
  try {
    const fullAddress = `${direccion}, ${ciudad}, ${provincia}, Argentina`;
    const encodedAddress = encodeURIComponent(fullAddress);
    
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodedAddress}&format=json&limit=1`,
      {
        headers: {
          'User-Agent': 'Deportiva-App/1.0'
        }
      }
    );

    if (!response.ok) {
      console.error('Error en respuesta de Nominatim:', response.statusText);
      return null;
    }

    const data = await response.json();
    
    if (data && data.length > 0) {
      const result = data[0];
      return {
        latitud: parseFloat(result.lat),
        longitud: parseFloat(result.lon)
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error geocodificando dirección:', error);
    return null;
  }
};
