// src/services/email.service.js
// Envío de emails transaccionales con SendGrid

import sgMail from '@sendgrid/mail'
import { generateQRDataURL, buildReservationUrl } from './qr.service.js'

sgMail.setApiKey(process.env.SENDGRID_API_KEY || '')

const FROM = {
  email: process.env.SENDGRID_FROM_EMAIL || 'noreply@cinema.com',
  name: process.env.SENDGRID_FROM_NAME || 'Cinema Reservations',
}

/**
 * Envía el email de confirmación de reserva con QR adjunto
 * @param {object} reservation - Objeto reserva con relaciones incluidas
 * @param {object} user - { email, username }
 */
export async function sendReservationConfirmationEmail(reservation, user) {
  const reservationUrl = buildReservationUrl(reservation.id)
  const qrDataUrl = await generateQRDataURL(reservationUrl)
  // Extraer la parte base64 (sin el prefijo data:image/png;base64,)
  const qrBase64 = qrDataUrl.split(',')[1]

  const movie = reservation.showtime?.movie?.title || 'N/A'
  const room = reservation.showtime?.room?.name || 'N/A'
  const startTime = reservation.showtime?.startTime
    ? new Date(reservation.showtime.startTime).toLocaleString('es-ES', {
        dateStyle: 'full',
        timeStyle: 'short',
        timeZone: 'Europe/Madrid',
      })
    : 'N/A'
  const seats = reservation.seats?.map(rs => `${rs.seat.rowLabel}${rs.seat.seatNumber}`).join(', ') || 'N/A'
  const total = Number(reservation.totalPrice || 0).toFixed(2)

  const html = `
    <!DOCTYPE html>
    <html lang="es">
    <head><meta charset="UTF-8"><title>Confirmación de Reserva</title></head>
    <body style="font-family: Arial, sans-serif; background: #f4f4f4; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <div style="background: #1a1a2e; color: white; padding: 30px; text-align: center;">
          <h1 style="margin:0; font-size: 24px;">🎬 ¡Reserva Confirmada!</h1>
        </div>
        <div style="padding: 30px;">
          <p>Hola <strong>${user.username}</strong>,</p>
          <p>Tu reserva ha sido confirmada exitosamente. Aquí tienes todos los detalles:</p>
          <table style="width:100%; border-collapse:collapse; margin: 20px 0;">
            <tr style="background:#f8f8f8;"><td style="padding:10px; font-weight:bold;">Película</td><td style="padding:10px;">${movie}</td></tr>
            <tr><td style="padding:10px; font-weight:bold;">Sala</td><td style="padding:10px;">${room}</td></tr>
            <tr style="background:#f8f8f8;"><td style="padding:10px; font-weight:bold;">Fecha y hora</td><td style="padding:10px;">${startTime}</td></tr>
            <tr><td style="padding:10px; font-weight:bold;">Asientos</td><td style="padding:10px;">${seats}</td></tr>
            <tr style="background:#f8f8f8;"><td style="padding:10px; font-weight:bold;">Total pagado</td><td style="padding:10px; color:#16a34a; font-weight:bold;">€${total}</td></tr>
            <tr><td style="padding:10px; font-weight:bold;">ID Reserva</td><td style="padding:10px; font-family:monospace; font-size:12px;">${reservation.id}</td></tr>
          </table>
          <div style="text-align:center; margin: 30px 0;">
            <p style="color:#666; margin-bottom:10px;">Muestra este QR en la entrada del cine:</p>
            <img src="cid:qrcode" alt="QR de reserva" style="width:200px; height:200px;" />
          </div>
          <p style="color:#888; font-size:13px; text-align:center;">
            ¿Necesitas cancelar? Puedes hacerlo hasta la hora de inicio desde tu cuenta.
          </p>
        </div>
        <div style="background:#f4f4f4; padding:15px; text-align:center; color:#888; font-size:12px;">
          Cinema Reservations — ${new Date().getFullYear()}
        </div>
      </div>
    </body>
    </html>
  `

  const msg = {
    to: user.email,
    from: FROM,
    subject: `✅ Reserva confirmada — ${movie}`,
    html,
    attachments: [
      {
        content: qrBase64,
        filename: `reserva-${reservation.id}.png`,
        type: 'image/png',
        disposition: 'inline',
        content_id: 'qrcode',
      },
    ],
  }

  await sgMail.send(msg)
  console.log(`[Email] Confirmación enviada a ${user.email}`)
}

/**
 * Envía email de cancelación de reserva
 */
export async function sendCancellationEmail(reservation, user) {
  const movie = reservation.showtime?.movie?.title || 'N/A'

  const msg = {
    to: user.email,
    from: FROM,
    subject: `❌ Reserva cancelada — ${movie}`,
    html: `
      <div style="font-family:Arial,sans-serif; max-width:600px; margin:0 auto; padding:30px;">
        <h2>Reserva cancelada</h2>
        <p>Hola <strong>${user.username}</strong>,</p>
        <p>Tu reserva para <strong>${movie}</strong> ha sido cancelada correctamente.</p>
        <p style="color:#888; font-size:13px;">ID: ${reservation.id}</p>
        <p>Si tienes alguna pregunta, no dudes en contactarnos.</p>
      </div>
    `,
  }

  await sgMail.send(msg)
  console.log(`[Email] Cancelación enviada a ${user.email}`)
}
