const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME || 'salas',
  process.env.DB_USER || 'root',
  process.env.DB_PASS || '',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: false,
  }
);

const Client = require('./client')(sequelize);
const Room = require('./room')(sequelize);
const Reservation = require('./reservation')(sequelize);
const User = require('./user')(sequelize);

Client.hasMany(Reservation, { foreignKey: 'clientId', onDelete: 'CASCADE' });
Reservation.belongsTo(Client, { foreignKey: 'clientId' });

Room.hasMany(Reservation, { foreignKey: 'roomId', onDelete: 'CASCADE' });
Reservation.belongsTo(Room, { foreignKey: 'roomId' });

module.exports = { sequelize, Client, Room, Reservation, User };
