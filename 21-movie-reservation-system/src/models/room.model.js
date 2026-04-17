// src/models/room.model.js

import { prisma } from '../lib/prisma.js'

export class RoomModel {
  static async getAll() {
    return prisma.room.findMany({
      include: { _count: { select: { seats: true } } },
      orderBy: { name: 'asc' },
    })
  }

  static async getById(id) {
    return prisma.room.findUnique({
      where: { id },
      include: {
        seats: { orderBy: [{ rowLabel: 'asc' }, { seatNumber: 'asc' }] },
        _count: { select: { seats: true } },
      },
    })
  }

  /**
   * Crea una sala y genera sus asientos automáticamente
   * @param {string[]} rows - e.g. ['A','B','C']
   * @param {number} seatsPerRow - e.g. 15
   */
  static async create({ name, rows = [], seatsPerRow = 0 }) {
    const seats = []
    for (const row of rows) {
      for (let n = 1; n <= seatsPerRow; n++) {
        seats.push({ rowLabel: row, seatNumber: n })
      }
    }

    return prisma.room.create({
      data: {
        name,
        totalCapacity: seats.length,
        seats: { create: seats },
      },
      include: { seats: true },
    })
  }

  static async update({ id, name }) {
    return prisma.room.update({ where: { id }, data: { name } })
  }
}
