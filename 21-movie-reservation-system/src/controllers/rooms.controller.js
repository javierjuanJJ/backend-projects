// src/controllers/rooms.controller.js

import { RoomModel } from '../models/room.model.js'

export class RoomController {
  static async getAll(_req, res, next) {
    try {
      const rooms = await RoomModel.getAll()
      return res.json({ data: rooms, total: rooms.length })
    } catch (err) {
      next(err)
    }
  }

  static async getById(req, res, next) {
    try {
      const { id } = req.params
      const room = await RoomModel.getById(id)
      if (!room) return res.status(404).json({ error: 'Room not found' })
      return res.json(room)
    } catch (err) {
      next(err)
    }
  }

  static async create(req, res, next) {
    try {
      const { name, rows, seatsPerRow } = req.body
      if (!name || !Array.isArray(rows) || !seatsPerRow) {
        return res.status(400).json({ error: 'name, rows (array) and seatsPerRow are required' })
      }
      const room = await RoomModel.create({ name, rows, seatsPerRow })
      return res.status(201).json(room)
    } catch (err) {
      next(err)
    }
  }

  static async update(req, res, next) {
    try {
      const { id } = req.params
      const existing = await RoomModel.getById(id)
      if (!existing) return res.status(404).json({ error: 'Room not found' })
      const updated = await RoomModel.update({ id, ...req.body })
      return res.json(updated)
    } catch (err) {
      next(err)
    }
  }
}
