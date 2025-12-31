const { Kafka } = require('kafkajs');

const kafka = new Kafka({
  clientId: 'vehicle-consumer',
  brokers: [process.env.KAFKA_BROKER || 'kafka:9092']
});

const consumer = kafka.consumer({ groupId: 'vehicle-group' });

const runConsumer = async (io, vehicleStore) => {
  try {
    await consumer.connect();

    await consumer.subscribe({ topic: 'vehicle-tracking', fromBeginning: false });

    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        const payload = message.value.toString();
        const data = JSON.parse(payload);

        const { vehicle_id, speed, timestamp, latitude, longitude } = data;

        if (!vehicleStore[vehicle_id]) {
          vehicleStore[vehicle_id] = {
            current: data,
            history: [],
            averageSpeed: 0
          };
        }

        vehicleStore[vehicle_id].current = data;

        vehicleStore[vehicle_id].history.push({
          speed,
          timestamp,
          latitude,
          longitude
        });

        if (vehicleStore[vehicle_id].history.length > 20) {
          vehicleStore[vehicle_id].history.shift();
        }

        const totalSpeed = vehicleStore[vehicle_id].history.reduce(
          (sum, point) => sum + point.speed,
          0
        );

        const avg = totalSpeed / vehicleStore[vehicle_id].history.length;
        vehicleStore[vehicle_id].averageSpeed = parseFloat(avg.toFixed(1));

        if (speed > 70) {
          const alertData = {
            id: Date.now() + Math.random(),
            vehicle_id: vehicle_id,
            speed: speed,
            time: new Date().toLocaleTimeString(),
            message: `EXCÈS DE VITESSE : ${speed} km/h`
          };

          io.emit('vehicle-alert', alertData);
        }

        io.emit('vehicle-update', vehicleStore);
      }
    });
  } catch (error) {
    console.error('Erreur Consumer Kafka, retry dans 5s...', error);
    setTimeout(() => runConsumer(io, vehicleStore), 5000);
  }
};

module.exports = runConsumer;
