# Skill: Generate Express Route

## Purpose
Generate a complete `src/routes/[resource].js` with validation middleware wired, auth guard applied, and all CRUD verbs mapped.

## When to use
Say: **"Generate route for [resource]"** or **"Create Express router for [resource]"**

## Output template

`src/routes/[resource].js`:

```js
import { Router } from 'express'
import { [Resource]Controller } from '../controllers/[resource].js'
import { validate[Resource], validatePartial[Resource] } from '../schemas/[resource].js'
import { authMiddleware } from '../middlewares/auth.js'

export const [resource]Router = Router()

// ─── Validation middleware factories ────────────────────────────────────────

function validateCreate(req, res, next) {
  const result = validate[Resource](req.body)
  if (!result.success) {
    return res.status(400).json({ error: 'Invalid request', details: result.error.issues })
  }
  req.body = result.data
  return next()
}

function validateUpdate(req, res, next) {
  const result = validatePartial[Resource](req.body)
  if (!result.success) {
    return res.status(400).json({ error: 'Invalid request', details: result.error.issues })
  }
  req.body = result.data
  return next()
}

// ─── Routes (all protected except noted) ────────────────────────────────────

[resource]Router.get('/',     authMiddleware, [Resource]Controller.getAll)
[resource]Router.get('/:id',  authMiddleware, [Resource]Controller.getById)
[resource]Router.post('/',    authMiddleware, validateCreate, [Resource]Controller.create)
[resource]Router.patch('/:id',authMiddleware, validateUpdate, [Resource]Controller.partialUpdate)
[resource]Router.put('/:id',  authMiddleware, validateUpdate, [Resource]Controller.update)
[resource]Router.delete('/:id',authMiddleware, [Resource]Controller.delete)
```

## Mounting in app.js
After generating the route, add this to `app.js`:
```js
import { [resource]Router } from './src/routes/[resource].js'
app.use('/[resource]', [resource]Router)
```

## Special cases

### Public routes (no auth)
Remove `authMiddleware` only for:
- `GET /health`
- `POST /auth/register`
- `POST /auth/login`

### Leaderboard routes (read-only, cached)
```js
leaderboardRouter.get('/:gameId',         authMiddleware, LeaderboardController.getByGame)
leaderboardRouter.get('/:gameId/weekly',  authMiddleware, LeaderboardController.getWeekly)
leaderboardRouter.get('/:gameId/alltime', authMiddleware, LeaderboardController.getAllTime)
```

## Checklist
- [ ] `authMiddleware` on all non-public routes
- [ ] Validation middleware uses `.issues` not `.errors` (Zod v4)
- [ ] Router exported as named const `[resource]Router`
- [ ] Route mounted in `app.js`
- [ ] Corresponding test file updated
