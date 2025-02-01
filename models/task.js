const { Sequelize, DataTypes } = require('sequelize');
const sequelize = new Sequelize('postgres://postgres:666@localhost:61203/vamps', {
  logging: false,  // Disable SQL logging
});

const Task = sequelize.define('Task', {
  title: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT },
  status: { type: DataTypes.STRING, defaultValue: 'pending' },
  deadline: { type: DataTypes.DATEONLY },
  intern_id: { type: DataTypes.INTEGER }  // Add this line
}, {
  timestamps: true
});


// Sync the model with the database
sequelize.sync()
  .then(() => console.log('Database synced'))
  .catch(err => console.log('Error syncing database', err));

module.exports = { Task };
