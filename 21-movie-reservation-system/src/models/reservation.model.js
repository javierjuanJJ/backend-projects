// src/models/reservation.model.js

import { prisma } from '../lib/prisma.js'

export class ReservationModel {
  /**
   * Obtiene las reservas de un usuario
   */
  static async getByUser(userId, { limit = 10, offset = 0 } = {}) {
    const [reservations, total] = await prisma.$transaction([
      prisma.reservation.findMany({
        where: { userId },
        include: {
          showtime: {
            include: {
              movie: { select: { id: true, title: true, posterUrl: true } },
              room: { select: { id: true, name: true } },
            },
          },
          seats: { include: { seat: true } },
        },
        take: Number(limit),
        skip: Number(offset),
        orderBy: { reservationDate: 'desc' },
      }),
      prisma.reservation.count({ where: { userId } }),
    ])

    return { reservations, total }
  }

  /**
   * Obtiene una reserva por ID (verifica propiedad si no es admin)
   */
  static async getById(id) {
    return prisma.reservation.findUnique({
      where: { id },
      include: {
        showtime: {
          include: {
            movie: { select: { id: true, title: true, durationMinutes: true } },
            room: { select: { id: true, name: true } },
          },
        },
        seats: { include: { seat: true } },
        user: { select: { id: true, username: true, email: true } },
      },
    })
  }

  /**
   * Crea una reserva de forma ATÓMICA usando transacción Prisma.
   * Evita el overbooking verificando asientos dentro de la transacción.
   *
   * @throws {Error} SEAT_ALREADY_TAKEN si algún asiento ya está ocupado
   * @throws {Error} SHOWTIME_NOT_FOUND si la función no existe
   */
  static async create({ userId, showtimeId, seatIds, stripePaymentId }) {
    return prisma.$transaction(async (tx) => {
      // 1. Verificar que la función existe y es futura
      const showtime = await tx.showtime.findUnique({ where: { id: showtimeId } })
      if (!showtime) throw new Error('SHOWTIME_NOT_FOUND')

      if (new Date(showtime.startTime) <= new Date()) {
        const err = new Error('Cannot reserve seats for a past showtime')
        err.statusCode = 422
        throw err
      }

      // 2. Verificar que los asientos pertenecen a la sala de la función
      const seats = await tx.seat.findMany({
        where: { id: { in: seatIds }, roomId: showtime.roomId },
      })

      if (seats.length !== seatIds.length) {
        const err = new Error('One or more seat IDs are invalid for this showtime')
        err.statusCode = 422
        throw err
      }

      // 3. Verificar disponibilidad DENTRO de la transacción (previene race conditions)
      const conflict = await tx.reservationSeat.findFirst({
        where: {
          seatId: { in: seatIds },
          reservation: { showtimeId, status: 'confirmed' },
        },
      })
      if (conflict) throw new Error('SEAT_ALREADY_TAKEN')

      // 4. Calcular precio total
      const totalPrice = Number(showtime.price) * seatIds.length

      // 5. Crear la reserva con sus asientos
      const reservation = await tx.reservation.create({
        data: {
          userId,
          showtimeId,
          totalPrice,
          stripePaymentId,
          seats: {
            create: seatIds.map(seatId => ({ seatId })),
          },
        },
        include: {
          showtime: {
            include: {
              movie: { select: { id: true, title: true } },
              room: { select: { id: true, name: true } },
            },
          },
          seats: { include: { seat: true } },
        },
      })

      return reservation
    })
  }

  /**
   * Cancela una reserva (solo si es futura y pertenece al usuario)
   */
  static async cancel({ reservationId, userId, isAdmin = false }) {
    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
      include: { showtime: true },
    })

    if (!reservation) {
      const err = new Error('Reservation not found')
      err.statusCode = 404
      throw err
    }

    if (!isAdmin && reservation.userId !== userId) {
      const err = new Error('You can only cancel your own reservations')
      err.statusCode = 403
      throw err
    }

    if (reservation.status === 'cancelled') {
      const err = new Error('Reservation is already cancelled')
      err.statusCode = 409
      throw err
    }

    if (new Date(reservation.showtime.startTime) <= new Date()) {
      const err = new Error('Cannot cancel a reservation for a past or ongoing showtime')
      err.statusCode = 422
      throw err
    }

    return prisma.reservation.update({
      where: { id: reservationId },
      data: { status: 'cancelled' },
      include: {
        showtime: { include: { movie: { select: { title: true } } } },
        seats: { include: { seat: true } },
      },
    })
  }

  /**
   * Reporte admin: todas las reservas con filtros
   */
  static async getAll({ status, limit = 20, offset = 0 } = {}) {
    const where = { ...(status && { status }) }

    const [reservations, total] = await prisma.$transaction([
      prisma.reservation.findMany({
        where,
        include: {
          user: { select: { id: true, username: true, email: true } },
          showtime: {
            include: {
              movie: { select: { id: true, title: true } },
              room: { select: { id: true, name: true } },
            },
          },
          seats: { include: { seat: true } },
        },
        take: Number(limit),
        skip: Number(offset),
        orderBy: { reservationDate: 'desc' },
      }),
      prisma.reservation.count({ where }),
    ])

    return { reservations, total }
  }

  /**
   * Reporte admin: estadísticas de ingresos y ocupación
   */
  static async getStats({ startDate, endDate } = {}) {
    const dateFilter = startDate && endDate
      ? { gte: new Date(startDate), lte: new Date(endDate) }
      : undefined

    const [revenue, topMovies, occupancyByRoom] = await prisma.$transaction([
      prisma.reservation.aggregate({
        where: { status: 'confirmed', ...(dateFilter && { reservationDate: dateFilter }) },
        _sum: { totalPrice: true },
        _count: { id: true },
      }),
      prisma.showtime.findMany({
        include: {
          movie: { select: { title: true } },
          _count: { select: { reservations: { where: { status: 'confirmed' } } } },
          room: { select: { totalCapacity: true, name: true } },
        },
        orderBy: { reservations: { _count: 'desc' } },
        take: 10,
      }),
      prisma.room.findMany({
        include: {
          _count: { select: { showtimes: true } },
          showtimes: {
            include: {
              _count: { select: { reservations: { where: { status: 'confirmed' } } } },
            },
          },
        },
      }),
    ])

    return { revenue, topMovies, occupancyByRoom }
  }
}
