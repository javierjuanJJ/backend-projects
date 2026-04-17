// src/services/whatsapp.service.js
// Envío de notificaciones WhatsApp con Twilio

import twilio from 'twilio'
import { buildReservationUrl } from './qr.service.js'

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
)
const FROM = process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886'

/**
 * Envía un mensaje WhatsApp de confirmación de reserva
 * @param {object} reservation
 * @param {object} user - necesita el campo phone (si existe)
 */
export async function sendReservationWhatsApp(reservation, user) {
  if (!user.phone) return // Campo opcional

  const movie = reservation.showtime?.movie?.title || 'N/A'
  const startTime = reservation.showtime?.startTime
    ? new Date(reservation.showtime.startTime).toLocaleString('es-ES', {
        dateStyle: 'short',
        timeStyle: 'short',
      })
    : 'N/A'
  const seats = reservation.seats?.map(rs => `${rs.seat.rowLabel}${rs.seat.seatNumber}`).join(', ') || 'N/A'
  const reservationUrl = buildReservationUrl(reservation.id)

  const body = [
    `🎬 *Reserva Confirmada*`,
    ``,
    `*Película:* ${movie}`,
    `*Fecha:* ${startTime}`,
    `*Asientos:* ${seats}`,
    `*Total:* €${Number(reservation.totalPrice || 0).toFixed(2)}`,
    ``,
    `Tu entrada: ${reservationUrl}`,
  ].join('\n')

  await client.messages.create({
    from: FROM,
    to: `whatsapp:${user.phone}`,
    body,
  })

  console.log(`[WhatsApp] Confirmación enviada a ${user.phone}`)
}
