const { Kafka } = require('kafkajs');

const kafka = new Kafka({
  clientId: 'vehicle-consumer',
  brokers: [process.env.KAFKA_BROKER || 'kafka:9092']
});

const consumer = kafka.consumer({ groupId: 'vehicle-group' });

const runConsumer = async (io, vehicleStore) => {
  try {
    // 1. Connexion au Cluster Kafka
    await consumer.connect();

    // 2. Abonnement au topic
    await consumer.subscribe({ topic: 'vehicle-tracking', fromBeginning: false });

    // 3. Traitement des messages en temps réel
    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        const payload = message.value.toString();
        const data = JSON.parse(payload);
        
        // Extraction des données (y compris latitude/longitude pour l'historique)
        const { vehicle_id, speed, timestamp, latitude, longitude } = data;

        // --- A. INITIALISATION ---
        // Si le véhicule n'est pas encore dans la mémoire, on le crée
        if (!vehicleStore[vehicle_id]) {
          vehicleStore[vehicle_id] = {
            current: data,       // Dernière position connue
            history: [],         // Historique pour le graphique et le tableau
            averageSpeed: 0      // Vitesse moyenne
          };
        }

        // --- B. MISE À JOUR LIVE ---
        vehicleStore[vehicle_id].current = data;

        // --- C. GESTION DE L'HISTORIQUE ---
        // On ajoute la vitesse ET la position dans l'historique
        vehicleStore[vehicle_id].history.push({ 
          speed, 
          timestamp, 
          latitude, 
          longitude 
        });

        // On garde seulement les 20 derniers points pour ne pas saturer la mémoire
        if (vehicleStore[vehicle_id].history.length > 20) {
          vehicleStore[vehicle_id].history.shift(); // Supprime le plus ancien
        }

        // --- D. CALCUL DE LA MOYENNE ---
        const totalSpeed = vehicleStore[vehicle_id].history.reduce((sum, point) => sum + point.speed, 0);
        const avg = totalSpeed / vehicleStore[vehicle_id].history.length;
        vehicleStore[vehicle_id].averageSpeed = parseFloat(avg.toFixed(1));

        // --- E. SYSTÈME D'ALERTE (> 70 km/h) ---
        if (speed > 70) {
          const alertData = {
            id: Date.now() + Math.random(), // ID unique pour React
            vehicle_id: vehicle_id,
            speed: speed,
            time: new Date().toLocaleTimeString(),
            message: `EXCÈS DE VITESSE : ${speed} km/h`
          };
          
          // Emission de l'événement d'alerte spécifique
          io.emit('vehicle-alert', alertData);
        }

        // --- F. DIFFUSION SOCKET.IO ---
        // On envoie l'état complet de la flotte au Frontend
        io.emit('vehicle-update', vehicleStore);
      },
    });
  } catch (error) {
    console.error('Erreur Consumer Kafka, retry dans 5s...', error);
    // En cas d'erreur (ex: Kafka pas encore prêt), on réessaie dans 5 secondes
    setTimeout(() => runConsumer(io, vehicleStore), 5000);
  }
};

module.exports = runConsumer;