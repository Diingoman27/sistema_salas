const express = require('express');
const router = express.Router();
const { Reservation, Room, Client } = require('../models');
const { Op } = require('sequelize');
const asyncHandler = require('../utils/asyncHandler');
const { body, param, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const permit = require('../middleware/roles');

// List
router.get('/', auth, permit('admin','worker','client'), asyncHandler(async (req, res) => {
  const where = { startTime: { [Op.gte]: new Date() } }; // only active (future) reservations

  // If this is a client account, filter by their clientId.
  // The JWT payload can provide either clientId (preferred) or id (fallback).
  if (req.user.role === 'client') {
    const clientId = req.user.clientId || req.user.id;
    where.clientId = clientId;
  }

  const items = await Reservation.findAll({ where, include: [Room, Client], order: [['startTime', 'ASC']] });
  res.json(items);
}));

router.get('/:id', auth, permit('admin','worker','client'), param('id').isInt(), asyncHandler(async (req, res) => {
  const item = await Reservation.findByPk(req.params.id, { include: [Room, Client] });
  if (!item) return res.status(404).json({ error: 'Not found' });
  if (req.user.role === 'client' && item.clientId !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
  res.json(item);
}));

// Create with simple conflict check for same room and overlapping time
router.post('/', auth, permit('admin','worker'), [
  body('roomId').isInt().withMessage('roomId requerido'),
  body('clientId').isInt().withMessage('clientId requerido'),
  body('startTime').isISO8601().withMessage('startTime inválido'),
  body('endTime').isISO8601().withMessage('endTime inválido')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { roomId, startTime, endTime } = req.body;
  if (new Date(startTime) >= new Date(endTime)) return res.status(400).json({ error: 'startTime debe ser antes de endTime' });
  if (new Date(startTime) < new Date()) return res.status(400).json({ error: 'No se pueden crear reservaciones para fechas pasadas' });

  const conflicts = await Reservation.findOne({
    where: {
      roomId,
      [Op.or]: [
        { startTime: { [Op.between]: [startTime, endTime] } },
        { endTime: { [Op.between]: [startTime, endTime] } },
        { [Op.and]: [{ startTime: { [Op.lte]: startTime } }, { endTime: { [Op.gte]: endTime } }] }
      ]
    }
  });

  if (conflicts) return res.status(409).json({ error: 'Time conflict for this room' });

  const r = await Reservation.create(req.body);
  res.status(201).json(await Reservation.findByPk(r.id, { include: [Room, Client] }));
}));

router.put('/:id', auth, permit('admin','worker'), [
  param('id').isInt(),
  body('roomId').optional().isInt().withMessage('roomId inválido'),
  body('clientId').optional().isInt().withMessage('clientId inválido'),
  body('startTime').optional().isISO8601().withMessage('startTime inválido'),
  body('endTime').optional().isISO8601().withMessage('endTime inválido')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const item = await Reservation.findByPk(req.params.id);
  if (!item) return res.status(404).json({ error: 'Not found' });

  const { roomId, startTime, endTime } = req.body;
  if (startTime && endTime && new Date(startTime) >= new Date(endTime)) return res.status(400).json({ error: 'startTime debe ser antes de endTime' });
  if (startTime && new Date(startTime) < new Date()) return res.status(400).json({ error: 'No se pueden actualizar reservaciones a fechas pasadas' });

  // Check conflicts if roomId or times changed
  if (roomId !== undefined || startTime || endTime) {
    const checkRoomId = roomId !== undefined ? roomId : item.roomId;
    const checkStart = startTime || item.startTime;
    const checkEnd = endTime || item.endTime;

    const conflicts = await Reservation.findOne({
      where: {
        id: { [Op.ne]: req.params.id }, // exclude self
        roomId: checkRoomId,
        [Op.or]: [
          { startTime: { [Op.between]: [checkStart, checkEnd] } },
          { endTime: { [Op.between]: [checkStart, checkEnd] } },
          { [Op.and]: [{ startTime: { [Op.lte]: checkStart } }, { endTime: { [Op.gte]: checkEnd } }] }
        ]
      }
    });
    if (conflicts) return res.status(409).json({ error: 'Time conflict for this room' });
  }

  await item.update(req.body);
  res.json(await Reservation.findByPk(req.params.id, { include: [Room, Client] }));
}));

router.delete('/:id', auth, permit('admin'), param('id').isInt(), asyncHandler(async (req, res) => {
  const item = await Reservation.findByPk(req.params.id);
  if (!item) return res.status(404).json({ error: 'Not found' });
  await item.destroy();
  res.json({ success: true });
}));

module.exports = router;
