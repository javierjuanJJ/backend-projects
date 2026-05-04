# Hook: Secrets Scanner

## Type
`pre-commit` — runs before every Copilot-assisted commit.

## Purpose
Prevent committing secrets, tokens, or credentials into the leaderboard API repo. Scans staged files for high-entropy strings and known secret patterns.

## Trigger patterns (auto-blocks commit if found)
```
JWT_SECRET=<value>        # actual value, not placeholder
password=<value>
MYSQL_PASSWORD=<value>
DATABASE_URL=.*:.*@       # URL with embedded credentials
ghp_[A-Za-z0-9]{36}      # GitHub PAT
sk-[A-Za-z0-9]{48}       # OpenAI key pattern
-----BEGIN.*PRIVATE KEY   # PEM keys
```

## Action
When any pattern is matched in staged `.js`, `.json`, `.yml`, `.yaml`, `.env*` files (excluding `.env.example`):

1. **Block** the commit.
2. Print which file and line contains the suspicious value.
3. Suggest remediation:
   - Move value to `.env` (gitignored)
   - Replace with `process.env.VARIABLE_NAME`
   - Use `ansible-vault` for deployment secrets

## Safe patterns (allowlist — do not block)
```
JWT_SECRET=CHANGE_ME*          # Placeholder in .env.example
*=your-*                       # Obvious placeholders
*=CHANGE_ME*
*=${VARIABLE_NAME}             # Template references
```

## Shell command equivalent
```bash
# Run manually to audit staged files:
git diff --cached --name-only | xargs grep -En \
  "(ghp_[A-Za-z0-9]{36}|sk-[A-Za-z0-9]{48}|BEGIN PRIVATE KEY|password\s*=\s*[^$'\"]{8,})" \
  2>/dev/null
```

## Notes
- `.env` is in `.gitignore` — this hook catches cases where it was accidentally staged.
- `ansible/vars/secrets.yml` must be ansible-vault encrypted before commit; the hook checks for the `$ANSIBLE_VAULT` header.
