# Skill: Generate Controller

## Purpose
Generate a complete Express controller class for a new resource following the leaderboard API conventions.

## When to use
Say: **"Generate controller for [resource]"** or **"Create [resource] controller"**

## Output template

Given a resource name (e.g. `scores`), produce `src/controllers/[resource].js`:

```js
import { [Model]Model } from '../models/[resource].js'

export class [Model]Controller {
  static async getAll(req, res) {
    const { limit = 10, offset = 0, ...filters } = req.query
    try {
      const items = await [Model]Model.getAll({ ...filters, limit: Number(limit), offset: Number(offset) })
      return res.json({ data: items, total: items.length, limit: Number(limit), offset: Number(offset) })
    } catch (e) {
      return res.status(500).json({ error: e.message })
    }
  }

  static async getById(req, res) {
    const { id } = req.params
    try {
      const item = await [Model]Model.getById(id)
      if (!item) return res.status(404).json({ error: '[Resource] not found' })
      return res.json(item)
    } catch (e) {
      return res.status(500).json({ error: e.message })
    }
  }

  static async create(req, res) {
    try {
      const newItem = await [Model]Model.create(req.body)
      return res.status(201).json(newItem)
    } catch (e) {
      return res.status(500).json({ error: e.message })
    }
  }

  static async update(req, res) {
    const { id } = req.params
    try {
      const item = await [Model]Model.getById(id)
      if (!item) return res.status(404).json({ error: '[Resource] not found' })
      const updated = await [Model]Model.update({ id, ...req.body })
      return res.json(updated)
    } catch (e) {
      return res.status(500).json({ error: e.message })
    }
  }

  static async partialUpdate(req, res) {
    const { id } = req.params
    try {
      const item = await [Model]Model.getById(id)
      if (!item) return res.status(404).json({ error: '[Resource] not found' })
      const updated = await [Model]Model.partialUpdate({ id, partialData: req.body })
      return res.json(updated)
    } catch (e) {
      return res.status(500).json({ error: e.message })
    }
  }

  static async delete(req, res) {
    const { id } = req.params
    try {
      const item = await [Model]Model.getById(id)
      if (!item) return res.status(404).json({ error: '[Resource] not found' })
      await [Model]Model.delete(id)
      return res.json({ message: '[Resource] deleted successfully' })
    } catch (e) {
      return res.status(500).json({ error: e.message })
    }
  }
}
```

## Checklist after generation
- [ ] Import matches the model file path
- [ ] All methods have try/catch
- [ ] 404 uses `{ error: '...' }` format
- [ ] No business logic in controller — delegate to model
- [ ] Add corresponding route file `src/routes/[resource].js`
