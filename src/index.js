const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();

const morgan = require('morgan');
const { sequelize } = require('./models');

const clientsRouter = require('./routes/clients');
const roomsRouter = require('./routes/rooms');
const reservationsRouter = require('./routes/reservations');
const authRouter = require('./routes/auth');
const usersRouter = require('./routes/users');
const errorHandler = require('./middleware/errorHandler');
const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// Logging
app.use(morgan('tiny'));

app.use('/api/clients', clientsRouter);
app.use('/api/rooms', roomsRouter);
app.use('/api/reservations', reservationsRouter);
app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);

// Error handler (last middleware)
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

async function start() {
  try {
    await sequelize.sync();
    app.listen(PORT, () => {
      console.log(`Server listening on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
  }
}

start();
