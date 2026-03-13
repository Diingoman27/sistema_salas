const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('Client', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: false, unique: true },
    department: { type: DataTypes.STRING },
    passwordHash: { type: DataTypes.STRING, allowNull: true }
  }, { tableName: 'clients', timestamps: true });
};
