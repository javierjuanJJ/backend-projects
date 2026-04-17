// src/models/showtime.model.js

import { prisma } from '../lib/prisma.js'

export class ShowtimeModel {
  /**
   * Lista funciones filtradas por fecha y/o película
   */
  static async getAll({ date, movieId, limit = 20, offset = 0 } = {}) {
    let startOfDay, endOfDay
    if (date) {
      startOfDay = new Date(date)
      startOfDay.setHours(0, 0, 0, 0)
      endOfDay = new Date(date)
      endOfDay.setHours(23, 59, 59, 999)
    }

    const where = {
      startTime: date
        ? { gte: startOfDay, lte: endOfDay }
        : { gte: new Date() },
      ...(movieId && { movieId }),
    }

    const [showtimes, total] = await prisma.$transaction([
      prisma.showtime.findMany({
        where,
        include: {
          movie: { select: { id: true, title: true, posterUrl: true, durationMinutes: true } },
          room: { select: { id: true, name: true, totalCapacity: true } },
          _count: { select: { reservations: { where: { status: 'confirmed' } } } },
        },
        take: Number(limit),
        skip: Number(offset),
        orderBy: { startTime: 'asc' },
      }),
      prisma.showtime.count({ where }),
    ])

    return { showtimes, total }
  }

  /**
   * Obtiene una función por ID
   */
  static async getById(id) {
    return prisma.showtime.findUnique({
      where: { id },
      include: {
        movie: true,
        room: { include: { seats: { orderBy: [{ rowLabel: 'asc' }, { seatNumber: 'asc' }] } } },
      },
    })
  }

  /**
   * Obtiene los asientos disponibles para una función
   * Evita overbooking comprobando reservas confirmadas
   */
  static async getAvailableSeats(showtimeId) {
    const showtime = await prisma.showtime.findUnique({
      where: { id: showtimeId },
      include: {
        room: {
          include: {
            seats: { orderBy: [{ rowLabel: 'asc' }, { seatNumber: 'asc' }] },
          },
        },
      },
    })

    if (!showtime) return null

    const reservedSeats = await prisma.reservationSeat.findMany({
      where: {
        reservation: { showtimeId, status: 'confirmed' },
      },
      select: { seatId: true },
    })

    const reservedSeatIds = new Set(reservedSeats.map(rs => rs.seatId))

    const seats = showtime.room.seats.map(seat => ({
      ...seat,
      available: !reservedSeatIds.has(seat.id),
    }))

    return {
      showtime: {
        id: showtime.id,
        startTime: showtime.startTime,
        price: showtime.price,
        room: { id: showtime.room.id, name: showtime.room.name },
      },
      seats,
      availableCount: seats.filter(s => s.available).length,
      totalCapacity: showtime.room.totalCapacity,
    }
  }

  /**
   * Crea una nueva función
   */
  static async create({ movieId, roomId, startTime, price }) {
    return prisma.showtime.create({
      data: { movieId, roomId, startTime: new Date(startTime), price },
      include: {
        movie: { select: { id: true, title: true } },
        room: { select: { id: true, name: true } },
      },
    })
  }

  /**
   * Elimina una función (solo si no tiene reservas)
   */
  static async delete(id) {
    const reservationCount = await prisma.reservation.count({
      where: { showtimeId: id, status: 'confirmed' },
    })

    if (reservationCount > 0) {
      const err = new Error('Cannot delete a showtime with confirmed reservations')
      err.statusCode = 409
      throw err
    }

    return prisma.showtime.delete({ where: { id } })
  }
}
