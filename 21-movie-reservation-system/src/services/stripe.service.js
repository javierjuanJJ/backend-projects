// src/services/stripe.service.js
// Procesamiento de pagos con Stripe

import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-10-28.acacia',
})

/**
 * Crea un PaymentIntent para la reserva
 * @param {number} totalPrice - Precio total en EUR
 * @param {object} metadata - Datos adicionales para el webhook
 * @returns {{ clientSecret, paymentIntentId }}
 */
export async function createPaymentIntent({ totalPrice, metadata = {} }) {
  const amount = Math.round(Number(totalPrice) * 100) // Stripe usa céntimos

  const paymentIntent = await stripe.paymentIntents.create({
    amount,
    currency: 'eur',
    metadata,
    automatic_payment_methods: { enabled: true },
  })

  return {
    clientSecret: paymentIntent.client_secret,
    paymentIntentId: paymentIntent.id,
  }
}

/**
 * Verifica la firma de un webhook de Stripe
 * @returns {object} Evento de Stripe verificado
 */
export function constructWebhookEvent(payload, signature) {
  return stripe.webhooks.constructEvent(
    payload,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET || ''
  )
}
