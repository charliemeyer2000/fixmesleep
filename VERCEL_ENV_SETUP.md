# Vercel Environment Variable Setup

## ⚠️ CRITICAL: Use Vercel Dashboard UI, NOT CLI

The Vercel CLI adds trailing newlines to all environment variables, which breaks the Ultrahuman API authentication. You MUST set these through the web dashboard.

## Step-by-Step Instructions

### For MCP Server (fixmesleep-mcp)

1. Go to https://vercel.com/charliemeyer2000s-projects/fixmesleep-mcp/settings/environment-variables

2. Delete the existing variables:
   - ULTRAHUMAN_API_TOKEN
   - ULTRAHUMAN_ACCESS_CODE
   - DATABASE_URL
   - POKE_API_KEY

3. Add them back using the form with these EXACT values (copy/paste carefully):

### ULTRAHUMAN_API_TOKEN
```
eyJhbGciOiJIUzI1NiJ9.eyJzZWNyZXQiOiJkM2M1NzRkMTQ5YWIyODJiNzlhOSIsInNjb3BlcyI6WyJyaW5nIl0sIm5hbWUiOiJmaXhtZXNsZWVwIiwiZXhwIjoyMDc5Mjk0NzIzfQ.TOVqFUKB5U1eiGSjeuh0QtFhTEc1SWClpkVq-WVtNJs
```

### ULTRAHUMAN_ACCESS_CODE
```
CHAKNTAS
```

### DATABASE_URL
```
postgresql://neondb_owner:npg_aWYbTsRXo6j4@ep-spring-base-a44lzsp1-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

### POKE_API_KEY
```
h74I/JfsBlhqJb/3ZTEbwPS6SfjI+9W8H153uiJj8lM=
```

### For Data Dashboard (fixmesleep-dashboard)

1. Go to https://vercel.com/charliemeyer2000s-projects/fixmesleep-dashboard/settings/environment-variables

2. Add these variables for Production:

#### ULTRAHUMAN_API_TOKEN
```
eyJhbGciOiJIUzI1NiJ9.eyJzZWNyZXQiOiJkM2M1NzRkMTQ5YWIyODJiNzlhOSIsInNjb3BlcyI6WyJyaW5nIl0sIm5hbWUiOiJmaXhtZXNsZWVwIiwiZXhwIjoyMDc5Mjk0NzIzfQ.TOVqFUKB5U1eiGSjeuh0QtFhTEc1SWClpkVq-WVtNJs
```

#### ULTRAHUMAN_ACCESS_CODE
```
CHAKNTAS
```

#### DATABASE_URL
```
postgresql://neondb_owner:npg_aWYbTsRXo6j4@ep-spring-base-a44lzsp1-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

#### DASHBOARD_PASSWORD
```
persuasion
```

#### AI_GATEWAY_API_KEY (already set)
```
vck_0c8wnwxCYgfUTxYGa4LAZ4sNml1lUs4lvouEhRXNARWDzgbAJd043FO2
```

#### ANTHROPIC_API_KEY (if not already set)
Contact Charlie for this key.

## Important Notes

- Select "Production" environment for each variable
- Do NOT add any extra spaces or newlines
- After adding all variables, trigger a new deployment by pushing an empty commit:
  ```bash
  git commit --allow-empty -m "chore: trigger redeploy after fixing env vars"
  git push
  ```

## Verification

After deployment, test with:
```bash
curl -X POST https://mcp.fixmysleep.charliemeyer.xyz/api/mcp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_POKE_API_KEY" \
  -d '{"method":"tools/call","params":{"name":"fetch_daily_metrics","arguments":{"date":"2025-11-22"}}}'
```

Should return 200 with sleep data, not 404.

