import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fonction pour créer une icône personnalisée selon la couleur
const createIcon = (color) => {
  return new L.Icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });
};

// Pré-chargement des icônes pour éviter de les recréer à chaque render
const icons = {
  red: createIcon('red'),
  green: createIcon('green'),
  gold: createIcon('gold'),
  blue: createIcon('blue'),
  violet: createIcon('violet'),
  black: createIcon('black'),
};

const MapView = ({ vehicles }) => {
  // Centre par défaut (Casablanca)
  const defaultPosition = [33.5731, -7.5898];

  // Logique d'attribution des couleurs
  const getVehicleIcon = (vehicleId) => {
    switch (vehicleId) {
      case 'V001': return icons.red;   // V001 en Rouge
      case 'V002': return icons.green; // V002 en Vert
      case 'V003': return icons.gold;  // V003 en Jaune/Or
      default: return icons.blue;      // Les autres en Bleu
    }
  };

  return (
    <MapContainer 
      center={defaultPosition} 
      zoom={13} 
      style={{ height: "400px", width: "100%", borderRadius: "10px", border: "2px solid #ddd" }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; OpenStreetMap contributors'
      />
      
      {vehicles.map((v) => (
        <Marker 
          key={v.vehicle_id} 
          position={[v.latitude, v.longitude]}
          icon={getVehicleIcon(v.vehicle_id)} // <--- C'est ici que la magie opère
        >
          <Popup>
            <div style={{ textAlign: 'center' }}>
              <strong style={{ fontSize: '1.2em' }}>{v.vehicle_id}</strong><br />
              <hr style={{ margin: '5px 0' }}/>
              Vitesse: <b>{v.speed} km/h</b><br />
              Moyenne: {v.averageSpeed} km/h
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
};

export default MapView;