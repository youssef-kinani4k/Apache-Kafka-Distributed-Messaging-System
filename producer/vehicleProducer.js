const { Kafka } = require('kafkajs');

const kafka = new Kafka({
  clientId: 'vehicle-producer',
  brokers: [process.env.KAFKA_BROKER || 'kafka:9092']
});

const producer = kafka.producer();

const vehicles = [
  { id: 'V001', lat: 33.5731, lon: -7.5898 },
  { id: 'V002', lat: 33.5890, lon: -7.6100 },
  { id: 'V003', lat: 33.5500, lon: -7.6200 }
];

const connectProducer = async () => {
  try {
    await producer.connect();
    console.log('Producer connecté à Kafka');
    startProducing();
  } catch (error) {
    console.error('Erreur connexion Producer, nouvel essai dans 5s...', error);
    setTimeout(connectProducer, 5000);
  }
};

const startProducing = () => {
  setInterval(async () => {
    const messages = vehicles.map(vehicle => {
      vehicle.lat += (Math.random() - 0.5) * 0.001;
      vehicle.lon += (Math.random() - 0.5) * 0.001;
      const speed = Math.floor(Math.random() * 60) + 20;

      const data = {
        vehicle_id: vehicle.id,
        latitude: parseFloat(vehicle.lat.toFixed(6)),
        longitude: parseFloat(vehicle.lon.toFixed(6)),
        speed: speed,
        timestamp: new Date().toISOString()
      };

      return { value: JSON.stringify(data) };
    });

    try {
      await producer.send({
        topic: 'vehicle-tracking',
        messages: messages,
      });
      console.log(`Envoyé ${messages.length} positions`);
    } catch (err) {
      console.error('Erreur envoi Kafka', err);
    }
  }, 2000);
};

connectProducer();
