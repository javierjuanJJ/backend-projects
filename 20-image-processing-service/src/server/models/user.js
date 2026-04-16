/**
 * @file models/user.js
 * @description Prisma model for users. Handles all DB operations for the users table.
 * Passwords are never returned — always use the select exclusion pattern.
 */
import prisma from '../lib/prisma.js'

export class UserModel {
  /** Fields returned by default — password_hash is always excluded */
  static #safeSelect = {
    id:               true,
    email:            true,
    role:             true,
    stripeCustomerId: true,
    createdAt:        true,
    updatedAt:        true,
  }

  /**
   * Find a user by email (includes passwordHash for auth comparison).
   * @param {string} email
   */
  static async findByEmail(email) {
    return prisma.user.findUnique({ where: { email } })
  }

  /**
   * Find a user by ID without sensitive fields.
   * @param {string} id
   */
  static async findById(id) {
    return prisma.user.findUnique({
      where: { id },
      select: UserModel.#safeSelect,
    })
  }

  /**
   * Create a new user with a hashed password.
   * @param {{ email: string, passwordHash: string }} data
   */
  static async create({ email, passwordHash }) {
    return prisma.user.create({
      data: { email, passwordHash },
      select: UserModel.#safeSelect,
    })
  }

  /**
   * Update stripe customer ID for a user.
   * @param {string} id
   * @param {string} stripeCustomerId
   */
  static async updateStripeId(id, stripeCustomerId) {
    return prisma.user.update({
      where:  { id },
      data:   { stripeCustomerId },
      select: UserModel.#safeSelect,
    })
  }
}
