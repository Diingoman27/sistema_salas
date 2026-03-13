const { Reservation, Client, User, sequelize } = require('../src/models');

(async () => {
  try {
    await sequelize.authenticate();
    const clients = await Client.findAll();
    console.log('Clients:', clients.map(c => ({ id: c.id, name: c.name, email: c.email })));
    const users = await User.findAll();
    console.log('Users:', users.map(u => ({ id: u.id, name: u.name, email: u.email, role: u.role })));
    const res = await Reservation.findAll({ include: Client });
    console.log('Reservations:', res.map(r => ({ id: r.id, clientId: r.clientId, clientName: r.Client?.name, start: r.startTime, end: r.endTime })));
  } catch (e) {
    console.error(e);
  } finally {
    await sequelize.close();
  }
})();
