// src/schemas/reservation.schema.js

import * as z from 'zod'

const reservationSchema = z.object({
  showtimeId: z.string().min(1, 'showtimeId is required'),
  seatIds: z
    .array(z.string().min(1))
    .min(1, 'At least one seat must be selected')
    .max(10, 'Cannot reserve more than 10 seats at once'),
})

export const validateReservation = (input) => reservationSchema.safeParse(input)
