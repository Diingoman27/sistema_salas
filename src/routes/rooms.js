const express = require('express');
const router = express.Router();
const { Room, Reservation } = require('../models');
const asyncHandler = require('../utils/asyncHandler');
const { body, param, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const permit = require('../middleware/roles');

router.get('/', auth, permit('admin','worker','client'), asyncHandler(async (req, res) => {
  const items = await Room.findAll();
  res.json(items);
}));

router.get('/:id', auth, permit('admin','worker','client'), param('id').isInt(), asyncHandler(async (req, res) => {
  const item = await Room.findByPk(req.params.id);
  if (!item) return res.status(404).json({ error: 'Not found' });
  res.json(item);
}));

router.post('/', auth, permit('admin'), [body('name').isLength({ min: 1 }).withMessage('Nombre requerido')], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  const r = await Room.create(req.body);
  res.status(201).json(r);
}));

router.put('/:id', auth, permit('admin'), [param('id').isInt()], asyncHandler(async (req, res) => {
  const item = await Room.findByPk(req.params.id);
  if (!item) return res.status(404).json({ error: 'Not found' });
  await item.update(req.body);
  res.json(item);
}));

router.delete('/:id', auth, permit('admin'), param('id').isInt(), asyncHandler(async (req, res) => {
  const item = await Room.findByPk(req.params.id);
  if (!item) return res.status(404).json({ error: 'Not found' });
  // remove related reservations via cascade if configured
  await item.destroy();
  res.json({ success: true });
}));

// get reservations for a room
router.get('/:id/reservations', auth, permit('admin','worker','client'), param('id').isInt(), asyncHandler(async (req, res) => {
  const id = req.params.id;
  const items = await Reservation.findAll({ where: { roomId: id }, order: [['startTime', 'ASC']] });
  res.json(items);
}));

module.exports = router;
