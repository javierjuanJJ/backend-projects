---
name: prisma-model
description: Prisma model patterns for this project. Use when writing new DB query classes.
---

# Prisma Model Skill

## Singleton import
```js
import prisma from '../lib/prisma.js'
```

## Class pattern
```js
export class ResourceModel {
  static #safeSelect = { id: true, name: true, createdAt: true } // never include passwordHash

  static async findById(id) {
    return prisma.resource.findUnique({ where: { id }, select: ResourceModel.#safeSelect })
  }

  static async findAll({ page = 1, limit = 10 }) {
    const skip = (page - 1) * limit
    const [items, total] = await prisma.$transaction([
      prisma.resource.findMany({ skip, take: limit, orderBy: { createdAt: 'desc' } }),
      prisma.resource.count(),
    ])
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) }
  }

  static async create(data) { return prisma.resource.create({ data }) }
  static async update(id, data) { return prisma.resource.update({ where: { id }, data }) }
  static async delete(id) { return prisma.resource.delete({ where: { id } }) }
}
```

## Rules
- Paginate with `$transaction([findMany, count])` — single round trip
- Cap pagination: `take: Math.min(limit, 100)`
- Prisma error `P2025` = record not found → 404
- Prisma error `P2002` = unique constraint → 409
