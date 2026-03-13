const express = require('express');
const router = express.Router();
const { Client, Reservation } = require('../models');
const asyncHandler = require('../utils/asyncHandler');
const { body, param, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const permit = require('../middleware/roles');
const bcrypt = require('bcryptjs');

router.get('/', auth, permit('admin','worker'), asyncHandler(async (req, res) => {
  const items = await Client.findAll();
  res.json(items);
}));

router.get('/:id', auth, permit('admin','worker'), param('id').isInt(), asyncHandler(async (req, res) => {
  const id = req.params.id;
  const item = await Client.findByPk(id);
  if (!item) return res.status(404).json({ error: 'Not found' });
  res.json(item);
}));

router.post('/', auth, permit('admin'), [
  body('name').isLength({ min: 1 }).withMessage('Nombre requerido'),
  body('email').isEmail().withMessage('Email inválido'),
  body('password').isLength({ min: 6 }).withMessage('Contraseña debe tener al menos 6 caracteres')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  const { name, email, password, department } = req.body;
  const passwordHash = await bcrypt.hash(password, 10);
  const c = await Client.create({ name, email, passwordHash, department });
  res.status(201).json(c);
}));

router.put('/:id', auth, permit('admin'), [param('id').isInt(), body('email').optional().isEmail()], asyncHandler(async (req, res) => {
  const item = await Client.findByPk(req.params.id);
  if (!item) return res.status(404).json({ error: 'Not found' });
  await item.update(req.body);
  res.json(item);
}));

router.delete('/:id', auth, permit('admin'), param('id').isInt(), asyncHandler(async (req, res) => {
  const item = await Client.findByPk(req.params.id);
  if (!item) return res.status(404).json({ error: 'Not found' });
  // cascade: delete reservations of client handled by DB/Sequelize setup
  await item.destroy();
  res.json({ success: true });
}));

// get reservations for a client
router.get('/:id/reservations', auth, permit('admin','worker','client'), param('id').isInt(), asyncHandler(async (req, res) => {
  const id = req.params.id;
  // clients can only view their own reservations
  if (req.user.role === 'client' && req.user.id != id) return res.status(403).json({ error: 'Forbidden' });
  const items = await Reservation.findAll({ where: { clientId: id }, order: [['startTime', 'ASC']] });
  res.json(items);
}));

module.exports = router;
