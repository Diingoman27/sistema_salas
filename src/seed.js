require('dotenv').config();
const { sequelize, Client, Room, Reservation, User } = require('./models');
const bcrypt = require('bcryptjs');

async function seed(){
  await sequelize.sync({ alter: true });

  // sample clients
  const clientPass = process.env.SEED_CLIENT_PASS || 'clientpass';
  const clientPwHash = await bcrypt.hash(clientPass, 10);
  const [c1, c2] = await Promise.all([
    Client.findOrCreate({ where: { email: 'ana@example.com' }, defaults: { name: 'Ana López', department: 'Ventas', passwordHash: clientPwHash } }),
    Client.findOrCreate({ where: { email: 'jose@example.com' }, defaults: { name: 'José Pérez', department: 'TI', passwordHash: clientPwHash } })
  ]).then(r => r.map(x => x[0]));

  // sample rooms
  const [r1, r2] = await Promise.all([
    Room.findOrCreate({ where: { name: 'Sala A' }, defaults: { capacity: 6, resources: 'Proyector, Pizarra' } }),
    Room.findOrCreate({ where: { name: 'Sala B' }, defaults: { capacity: 4, resources: 'TV' } })
  ]).then(r => r.map(x => x[0]));

  // sample reservations
  const now = new Date();
  const later = new Date(now.getTime() + 60*60*1000);
  await Reservation.findOrCreate({ where: { clientId: c1.id, roomId: r1.id, startTime: now.toISOString() }, defaults: { endTime: later.toISOString(), purpose: 'Reunión' } });

  // sample users (admin, worker, client)
  const adminPassword = process.env.SEED_ADMIN_PASS || 'adminpass';
  const workerPassword = process.env.SEED_WORKER_PASS || 'workerpass';
  const clientPassword = process.env.SEED_CLIENT_PASS || 'clientpass';
  const adminPw = await bcrypt.hash(adminPassword, 10);
  const workerPw = await bcrypt.hash(workerPassword, 10);
  const clientPw = await bcrypt.hash(clientPassword, 10);
  await User.findOrCreate({ where: { email: 'admin@example.com' }, defaults: { name: 'Admin', passwordHash: adminPw, role: 'admin' } });
  await User.findOrCreate({ where: { email: 'worker@example.com' }, defaults: { name: 'Worker', passwordHash: workerPw, role: 'worker' } });
  await User.findOrCreate({ where: { email: 'client@example.com' }, defaults: { name: 'Cliente', passwordHash: clientPw, role: 'client' } });

  console.log('\n=== Seed completo ===');
  console.log('Usuarios creados / verificados:');
  console.log(`- Administrador: email=admin@example.com  password=${adminPassword}`);
  console.log(`- Trabajador:   email=worker@example.com password=${workerPassword}`);
  console.log(`- Cliente:      email=client@example.com password=${clientPassword}`);
  console.log('Si deseas cambiar las contraseñas del seed, define variables de entorno SEED_ADMIN_PASS, SEED_WORKER_PASS y SEED_CLIENT_PASS antes de ejecutar el seed.');
  process.exit(0);
}

seed().catch(err=>{ console.error(err); process.exit(1); });
