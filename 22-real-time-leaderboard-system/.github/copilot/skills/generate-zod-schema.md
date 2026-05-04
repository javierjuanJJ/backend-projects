# Skill: Generate Zod Schema

## Purpose
Generate a Zod v4 validation schema for a leaderboard API resource, with `validateX` and `validatePartialX` exports.

## When to use
Say: **"Generate schema for [resource]"** or **"Add Zod validation for [resource]"**

## Schema rules for this project
- Import from `'zod'` (Zod v4, object syntax changed — use `error:` not `message:` in v4)
- Always export two functions: `validateX(input)` and `validatePartialX(input)`
- Use `.safeParse()` never `.parse()`
- UUIDs validated with `z.string().uuid()`
- Dates as ISO strings: `z.string().datetime()`
- Scores: `z.number().int().positive()`

## Output template

`src/schemas/[resource].js`:

```js
import { z } from 'zod'

const [resource]Schema = z.object({
  // --- Fill fields based on Prisma model ---
  // Example for Score:
  user_id: z.string({ error: 'user_id is required' }).uuid('Must be a valid UUID'),
  game_id: z.string({ error: 'game_id is required' }).uuid('Must be a valid UUID'),
  score_value: z.number({ error: 'score_value is required' }).int().positive('Score must be a positive integer'),
})

export function validate[Resource](input) {
  return [resource]Schema.safeParse(input)
}

export function validatePartial[Resource](input) {
  return [resource]Schema.partial().safeParse(input)
}
```

## Field mapping reference
| Prisma field | Zod type |
|---|---|
| String (UUID) | `z.string().uuid()` |
| String (general) | `z.string().min(1).max(N)` |
| Int | `z.number().int()` |
| DateTime | `z.string().datetime()` or omit (DB sets it) |
| Optional field | `.optional()` at end |

## Checklist
- [ ] Schema name matches resource (camelCase)
- [ ] Both `validate` and `validatePartial` exported
- [ ] No `.parse()` calls
- [ ] Error messages are user-friendly strings
