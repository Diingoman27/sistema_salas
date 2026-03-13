const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('Room', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING, allowNull: false, unique: true },
    capacity: { type: DataTypes.INTEGER, defaultValue: 1 },
    resources: { type: DataTypes.TEXT } // JSON string or comma separated
  }, { tableName: 'rooms', timestamps: true });
};
