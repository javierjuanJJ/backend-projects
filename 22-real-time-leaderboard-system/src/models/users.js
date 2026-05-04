// src/models/users.js
import { prisma } from '../lib/prisma.js'

/** Public fields — password_hash is NEVER included. */
const PUBLIC_SELECT = {
  id: true,
  username: true,
  email: true,
  created_at: true,
}

export class UserModel {
  /**
   * List users with pagination.
   * @param {{ limit?: number, offset?: number }} params
   */
  static async getAll({ limit = 10, offset = 0 } = {}) {
    try {
      return await prisma.user.findMany({
        select: PUBLIC_SELECT,
        skip: Number(offset),
        take: Number(limit),
        orderBy: { created_at: 'desc' },
      })
    } catch (e) {
      throw new Error(`DB: getAll users failed — ${e.message}`)
    }
  }

  /**
   * Find a user by UUID (no password).
   * @param {string} id
   */
  static async getById(id) {
    try {
      return await prisma.user.findUnique({ where: { id }, select: PUBLIC_SELECT })
    } catch (e) {
      throw new Error(`DB: getById user ${id} failed — ${e.message}`)
    }
  }

  /**
   * Find a user by email — INCLUDES password_hash for auth checks only.
   * @param {string} email
   */
  static async getByEmailWithPassword(email) {
    try {
      return await prisma.user.findUnique({ where: { email } })
    } catch (e) {
      throw new Error(`DB: getByEmail user failed — ${e.message}`)
    }
  }

  /**
   * Create a new user. password_hash must already be hashed by the caller.
   * @param {{ username: string, email: string, password_hash: string }} data
   */
  static async create({ username, email, password_hash }) {
    try {
      return await prisma.user.create({
        data: { id: crypto.randomUUID(), username, email, password_hash },
        select: PUBLIC_SELECT,
      })
    } catch (e) {
      if (e.code === 'P2002') {
        const field = e.meta?.target?.[0] ?? 'field'
        throw Object.assign(new Error(`${field} already exists`), { status: 409 })
      }
      throw new Error(`DB: create user failed — ${e.message}`)
    }
  }

  /**
   * Partial update of a user (username/email).
   * @param {{ id: string, partialData: object }} params
   */
  static async partialUpdate({ id, partialData }) {
    try {
      return await prisma.user.update({
        where: { id },
        data: partialData,
        select: PUBLIC_SELECT,
      })
    } catch (e) {
      if (e.code === 'P2025') throw Object.assign(new Error('User not found'), { status: 404 })
      throw new Error(`DB: partialUpdate user ${id} failed — ${e.message}`)
    }
  }

  /**
   * Delete a user by id.
   * @param {string} id
   */
  static async delete(id) {
    try {
      await prisma.user.delete({ where: { id } })
    } catch (e) {
      if (e.code === 'P2025') throw Object.assign(new Error('User not found'), { status: 404 })
      throw new Error(`DB: delete user ${id} failed — ${e.message}`)
    }
  }
}
