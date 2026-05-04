# Workflow: Daily API Health Report

## Purpose
Each morning, generate a concise report of the leaderboard API's open GitHub issues, failing CI runs, and stale PRs. Post a summary to the team.

## Schedule
Run daily at 08:00 UTC via GitHub Actions `schedule` trigger (add to `ci.yml` or a separate `daily-report.yml`).

## Steps

### 1. Gather open issues
```
Query GitHub API: GET /repos/{owner}/{repo}/issues?state=open&sort=created&direction=desc
Filter: labels containing "bug" or "high-priority"
```

### 2. Check recent CI runs
```
Query: GET /repos/{owner}/{repo}/actions/runs?per_page=10
Flag: any run with conclusion=failure in the last 24h
Include: workflow name, branch, commit SHA, link
```

### 3. Find stale PRs
```
Query: GET /repos/{owner}/{repo}/pulls?state=open
Stale criteria: last updated > 5 days ago, no review requested
```

### 4. Generate report
Produce a Markdown summary:
```markdown
## 🏆 Leaderboard API — Daily Report {{DATE}}

### 🐛 Open bugs ({{COUNT}})
- #123 Score endpoint returns 500 on null game_id
- #118 Redis cache not invalidated after score delete

### ❌ Failed CI runs
- `ci.yml` on branch `feat/weekly-leaderboard` — commit abc1234

### ⏳ Stale PRs (>5 days)
- #115 Add leaderboard pagination — last activity: 7 days ago
```

### 5. Output options
- Create a GitHub issue with label `daily-report`
- Or post to a Slack webhook (if `SLACK_WEBHOOK_URL` secret is set)

## Required secrets
| Secret | Purpose |
|---|---|
| `GITHUB_TOKEN` | Read issues/PRs/runs (auto-provided) |
| `SLACK_WEBHOOK_URL` | Optional Slack notification |

## Agent to use
`@devops-deploy-agent` can help generate the GitHub Actions YAML for this workflow.
