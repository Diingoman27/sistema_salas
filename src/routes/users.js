const express = require('express');
const router = express.Router();
const { User } = require('../models');
const asyncHandler = require('../utils/asyncHandler');
const { body, param, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const permit = require('../middleware/roles');
const bcrypt = require('bcryptjs');

// Only admins can manage users
router.get('/', auth, permit('admin'), asyncHandler(async (req, res) => {
  const items = await User.findAll({ attributes: ['id', 'name', 'email', 'role'] });
  res.json(items);
}));

router.get('/:id', auth, permit('admin'), param('id').isInt(), asyncHandler(async (req, res) => {
  const id = req.params.id;
  const item = await User.findByPk(id, { attributes: ['id', 'name', 'email', 'role'] });
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
  const { name, email, password } = req.body;
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({ name, email, passwordHash, role: 'worker' });
  res.status(201).json({ id: user.id, name: user.name, email: user.email, role: user.role });
}));

router.put('/:id', auth, permit('admin'), [param('id').isInt(), body('email').optional().isEmail(), body('name').optional().isLength({ min: 1 })], asyncHandler(async (req, res) => {
  const item = await User.findByPk(req.params.id);
  if (!item) return res.status(404).json({ error: 'Not found' });
  // Prevent changing role or password via PUT
  const { name, email } = req.body;
  await item.update({ name, email });
  res.json({ id: item.id, name: item.name, email: item.email, role: item.role });
}));

router.delete('/:id', auth, permit('admin'), param('id').isInt(), asyncHandler(async (req, res) => {
  const item = await User.findByPk(req.params.id);
  if (!item) return res.status(404).json({ error: 'Not found' });
  if (item.id === req.user.id) return res.status(400).json({ error: 'No puedes eliminarte a ti mismo' });
  await item.destroy();
  res.json({ success: true });
}));

module.exports = router;