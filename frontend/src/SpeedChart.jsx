import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const SpeedChart = ({ vehiclesData }) => {
  const firstVehicleKey = Object.keys(vehiclesData)[0];
  const labels = firstVehicleKey 
    ? vehiclesData[firstVehicleKey].history.map(h => new Date(h.timestamp).toLocaleTimeString())
    : [];

  const datasets = Object.keys(vehiclesData).map((vId, index) => {
    const vehicle = vehiclesData[vId];
    const colors = ['#FF6384', '#36A2EB', '#FFCE56']; 
    
    return {
      label: `${vId} (km/h)`,
      data: vehicle.history.map(h => h.speed),
      borderColor: colors[index % colors.length],
      backgroundColor: colors[index % colors.length],
      tension: 0.4,
    };
  });

  const data = {
    labels,
    datasets,
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' },
      title: { display: true, text: 'Historique des Vitesses (Temps Réel)' },
    },
    scales: {
      y: { min: 0, max: 100 }
    },
    animation: { duration: 0 }
  };

  return (
    <div style={{ background: 'white', padding: '10px', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)', height: '300px' }}>
      <Line data={data} options={options} />
    </div>
  );
};

export default SpeedChart;