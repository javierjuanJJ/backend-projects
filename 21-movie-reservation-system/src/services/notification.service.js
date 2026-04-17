// src/services/notification.service.js
// Orquesta el envío de notificaciones por múltiples canales

import { sendReservationConfirmationEmail, sendCancellationEmail } from './email.service.js'
import { sendReservationWhatsApp } from './whatsapp.service.js'

export class NotificationService {
  /**
   * Envía confirmación de reserva por email y WhatsApp (si disponible)
   */
  static async sendReservationConfirmation(reservation, user) {
    const results = await Promise.allSettled([
      sendReservationConfirmationEmail(reservation, user),
      sendReservationWhatsApp(reservation, user),
    ])

    results.forEach((result, i) => {
      const channel = i === 0 ? 'Email' : 'WhatsApp'
      if (result.status === 'rejected') {
        console.error(`[Notification] ${channel} failed:`, result.reason?.message)
      }
    })
  }

  /**
   * Envía confirmación de cancelación
   */
  static async sendCancellationConfirmation(reservation, user) {
    try {
      await sendCancellationEmail(reservation, user)
    } catch (err) {
      console.error('[Notification] Cancellation email failed:', err.message)
    }
  }
}
