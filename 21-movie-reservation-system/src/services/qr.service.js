// src/services/qr.service.js
// Genera QR codes en base64 para incluir en emails

import QRCode from 'qrcode'

/**
 * Genera un QR code como Data URL (base64 PNG)
 * @param {string} text - Contenido del QR (URL de la reserva)
 * @returns {Promise<string>} Data URL con formato data:image/png;base64,...
 */
export async function generateQRDataURL(text) {
  return QRCode.toDataURL(text, {
    errorCorrectionLevel: 'M',
    type: 'image/png',
    width: 300,
    margin: 2,
    color: { dark: '#1a1a2e', light: '#ffffff' },
  })
}

/**
 * Genera un QR code como Buffer PNG
 */
export async function generateQRBuffer(text) {
  return QRCode.toBuffer(text, {
    errorCorrectionLevel: 'M',
    type: 'png',
    width: 300,
    margin: 2,
  })
}

/**
 * Construye la URL pública de una reserva para el QR
 */
export function buildReservationUrl(reservationId) {
  const base = process.env.QR_BASE_URL || process.env.APP_URL || 'http://localhost:3000'
  return `${base}/reservations/${reservationId}`
}
