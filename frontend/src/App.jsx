import React, { useEffect, useState } from 'react';
import './App.css';
import { socket } from './socket';
import MapView from './MapView';
import SpeedChart from './SpeedChart';

function App() {
  const [vehicleData, setVehicleData] = useState({});
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    function onConnect() { setIsConnected(true); }
    function onDisconnect() { setIsConnected(false); }
    
    function onVehicleUpdate(data) {
      setVehicleData(data);
    }

    function onAlert(alert) {
      setAlerts((prev) => [alert, ...prev].slice(0, 5));
      setTimeout(() => {
        setAlerts((curr) => curr.filter(a => a.id !== alert.id));
      }, 5000);
    }

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('vehicle-update', onVehicleUpdate);
    socket.on('vehicle-alert', onAlert);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('vehicle-update', onVehicleUpdate);
      socket.off('vehicle-alert', onAlert);
    };
  }, []);

  const vehiclesArray = Object.values(vehicleData).map(v => ({
    ...v.current,
    averageSpeed: v.averageSpeed
  }));

  // --- CALCUL DES KPI ---
  const activeCount = vehiclesArray.length;
  const fleetAvgSpeed = activeCount > 0 
    ? (vehiclesArray.reduce((acc, v) => acc + v.speed, 0) / activeCount).toFixed(0) 
    : 0;
  const highSpeedCount = vehiclesArray.filter(v => v.speed > 70).length;

  return (
    <div className="App">
      
      {/* --- NOTIFICATIONS FLOTTANTES --- */}
      <div className="toast-container">
        {alerts.map((alert) => (
          <div key={alert.id} className="toast">
            <div>
              <div style={{ fontWeight: '700', color: '#1e293b' }}>Alerte : {alert.vehicle_id}</div>
              <div style={{ color: '#64748b', fontSize: '0.9rem' }}>{alert.message}</div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '4px' }}>{alert.time}</div>
            </div>
          </div>
        ))}
      </div>

      {/* --- HEADER --- */ }
      <header className="app-header">
        <div className="brand">
          Track<span>Stream</span>
        </div>
        <div className={`status-badge ${isConnected ? 'online' : 'offline'}`}>
          <span className="status-dot"></span>
          {isConnected ? 'Système Connecté' : 'Déconnecté'}
        </div>
      </header>

      <div className="content">
        
        {/* --- KPI CARDS --- */}
        <div className="kpi-grid">
          <div className="kpi-card">
            <div className="kpi-info">
              <h4>Véhicules Actifs</h4>
              <p>{activeCount}</p>
            </div>
          </div>
          <div className="kpi-card">
            <div className="kpi-info">
              <h4>Vitesse Moyenne Flotte</h4>
              <p>{fleetAvgSpeed} <span style={{fontSize:'1rem'}}>km/h</span></p>
            </div>
          </div>
          <div className="kpi-card" style={highSpeedCount > 0 ? {borderColor: '#ef4444'} : {}}>
            <div className="kpi-info">
              <h4>Excès Vitesse (Actuel)</h4>
              <p style={highSpeedCount > 0 ? {color: '#ef4444'} : {}}>{highSpeedCount}</p>
            </div>
          </div>
        </div>

        {/* --- DASHBOARD GRID (MAP + TABLE) --- */}
        <div className="dashboard-grid">
          <div className="panel">
            <div className="panel-header">
              <h3 className="panel-title">Géolocalisation Temps Réel</h3>
            </div>
            <MapView vehicles={vehiclesArray} />
          </div>

          <div className="panel">
            <div className="panel-header">
              <h3 className="panel-title">État de la flotte</h3>
            </div>
            <div style={{overflowX: 'auto'}}>
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Vitesse</th>
                    <th>Moyenne</th>
                  </tr>
                </thead>
                <tbody>
                  {vehiclesArray.length === 0 ? (
                    <tr><td colSpan="3">Chargement...</td></tr>
                  ) : (
                    vehiclesArray.map((v) => (
                      <tr key={v.vehicle_id}>
                        <td><strong>{v.vehicle_id}</strong></td>
                        <td>
                          {v.speed > 70 
                            ? <span className="tag tag-danger">{v.speed} km/h</span>
                            : <span>{v.speed} km/h</span>
                          }
                        </td>
                        <td style={{color: '#3b82f6', fontWeight: 'bold'}}>{v.averageSpeed}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* --- CHART SECTION --- */}
        <div className="panel">
           <div className="panel-header">
              <h3 className="panel-title">Analyse des Tendances</h3>
            </div>
          <SpeedChart vehiclesData={vehicleData} />
        </div>

        {/* --- DETAILED HISTORY --- */}
        <div>
          <h3 style={{color: '#0f172a', marginBottom: '1rem'}}>Historique Détaillé</h3>
          <div className="history-grid">
            {Object.keys(vehicleData).sort().map((vehicleId) => {
              const vehicle = vehicleData[vehicleId];
              const last10History = [...vehicle.history].reverse().slice(0, 10);
              
              // Déterminer la classe de couleur
              let colorClass = 'bg-default';
              if (vehicleId === 'V001') colorClass = 'bg-V001';
              if (vehicleId === 'V002') colorClass = 'bg-V002';
              if (vehicleId === 'V003') colorClass = 'bg-V003';

              return (
                <div key={vehicleId} className="vehicle-card">
                  <div className={`card-header ${colorClass}`}>
                    <span>🚗 {vehicleId}</span>
                    <span style={{fontSize: '0.8rem', opacity: 0.9}}>
                      {new Date(vehicle.current.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  
                  <div className="card-body">
                    <div className="stat-row">
                      <div>
                        <div style={{fontSize: '0.75rem', color: '#64748b'}}>Position Actuelle</div>
                        <div style={{fontFamily: 'monospace', fontSize: '0.9rem'}}>
                          {vehicle.current.latitude.toFixed(4)}, {vehicle.current.longitude.toFixed(4)}
                        </div>
                      </div>
                      <div style={{textAlign: 'right'}}>
                        <div style={{fontSize: '0.75rem', color: '#64748b'}}>Moyenne</div>
                        <div style={{fontWeight: '700', color: '#0f172a'}}>{vehicle.averageSpeed} km/h</div>
                      </div>
                    </div>

                    <table style={{fontSize: '0.8rem'}}>
                      <thead>
                        <tr>
                          <th>Heure</th>
                          <th>Pos</th>
                          <th>Vit.</th>
                        </tr>
                      </thead>
                      <tbody>
                        {last10History.map((h, idx) => (
                          <tr key={idx}>
                            <td style={{color:'#64748b'}}>{new Date(h.timestamp).toLocaleTimeString()}</td>
                            <td style={{fontFamily: 'monospace', fontSize: '0.75rem'}}>
                              {h.latitude?.toFixed(3)}, {h.longitude?.toFixed(3)}
                            </td>
                            <td style={h.speed > 70 ? {color: '#ef4444', fontWeight:'700'} : {}}>
                              {h.speed}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}

export default App;