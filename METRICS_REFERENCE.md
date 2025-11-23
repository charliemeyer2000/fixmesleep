# Metrics Reference

This document lists all health metrics captured from your Ultrahuman Ring and stored in the database.

## Database Schema

The `daily_metrics` table stores comprehensive daily health data with the following columns:

### Core Sleep Metrics

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `total_sleep_minutes` | integer | Total sleep duration | 415 (6h 55m) |
| `deep_sleep_minutes` | integer | Deep sleep duration | 95 |
| `rem_sleep_minutes` | integer | REM sleep duration | 130 |
| `light_sleep_minutes` | integer | Light sleep duration | 190 |
| `sleep_score` | integer | Overall sleep quality (0-100) | 82 |
| `sleep_efficiency` | double | % of time in bed actually sleeping | 78.0 |
| `restorative_sleep_minutes` | integer | Deep + REM sleep | 225 |
| `temperature_deviation` | double | Body temp deviation from baseline | -0.5 |

### Sleep Details

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `bedtime_start` | integer | When you went to bed (Unix timestamp) | 1763790300 |
| `bedtime_end` | integer | When you woke up (Unix timestamp) | 1763822100 |
| `time_in_bed_minutes` | integer | Total time in bed | 530 (8h 50m) |
| `tosses_and_turns` | integer | Number of position changes | 11 |
| `movements` | integer | Total movement count | 25 |
| `morning_alertness_minutes` | integer | Time to full alertness after waking | 108 |
| `average_body_temp_celsius` | double | Average body temperature | 34.7 |

### Heart Metrics

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `avg_sleep_hrv` | double | Average heart rate variability during sleep | 57 |
| `night_rhr` | double | Resting heart rate at night | 54 |
| `sleep_rhr` | double | Sleep-specific resting heart rate | 54 |

### Recovery & Activity

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `readiness_score` | double | Overall readiness (0-100) | 85.0 |
| `recovery_index` | double | Physical recovery score (0-100) | 61 |
| `movement_index` | double | Daily activity score (0-100) | 53 |
| `active_minutes` | integer | Minutes of moderate to vigorous activity | 60 |
| `vo2_max` | double | Maximum oxygen consumption capacity | 52 |
| `metabolic_score` | double | Metabolic health score (if CGM used) | null |

### System Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | serial | Primary key |
| `user_email` | text | User identifier (default: "self") |
| `metric_date` | date | Date of the metric (YYYY-MM-DD) |
| `payload` | jsonb | Full raw API response |
| `created_at` | timestamp | When record was created |
| `updated_at` | timestamp | When record was last updated |

## Data Refresh Process

When you click "Refresh Data" in the dashboard:

1. **Fetch from Ultrahuman API**: Gets last 3 days of metrics
2. **Parse with Zod**: Validates and extracts all fields
3. **Upsert to Database**: Inserts new records or updates existing ones
4. **All Fields Stored**: Every metric is saved to its own column
5. **Conflict Resolution**: On duplicate date, updates all fields with latest data

## Example Data (Nov 22, 2025)

```json
{
  "metric_date": "2025-11-22",
  "sleep_score": 82,
  "total_sleep_minutes": 415,
  "deep_sleep_minutes": 95,
  "rem_sleep_minutes": 130,
  "light_sleep_minutes": 190,
  "sleep_efficiency": 78,
  "bedtime_start": 1763790300,
  "bedtime_end": 1763822100,
  "time_in_bed_minutes": 530,
  "tosses_and_turns": 11,
  "movements": 25,
  "morning_alertness_minutes": 108,
  "average_body_temp_celsius": 34.7,
  "avg_sleep_hrv": 57,
  "night_rhr": 54,
  "recovery_index": 61,
  "movement_index": 53,
  "active_minutes": 60,
  "vo2_max": 52
}
```

## Field Availability

Not all fields are populated every day:

- **Always Present** (when ring worn): movement_index, basic heart metrics
- **Sleep Night Required**: All sleep metrics (total_sleep, deep_sleep, etc.)
- **Full Sleep Session**: Advanced sleep metrics (tosses_and_turns, morning_alertness)
- **CGM Required**: metabolic_score
- **May Be Null**: temperature_deviation, restorative_sleep (API dependent)

## Query Examples

### Get Last 7 Days of Sleep Data
```sql
SELECT 
  metric_date,
  sleep_score,
  total_sleep_minutes,
  deep_sleep_minutes,
  rem_sleep_minutes,
  avg_sleep_hrv,
  recovery_index
FROM daily_metrics
WHERE metric_date >= CURRENT_DATE - INTERVAL '7 days'
ORDER BY metric_date DESC;
```

### Calculate Weekly Averages
```sql
SELECT 
  AVG(sleep_score) as avg_sleep_score,
  AVG(total_sleep_minutes) as avg_sleep_minutes,
  AVG(avg_sleep_hrv) as avg_hrv,
  AVG(recovery_index) as avg_recovery
FROM daily_metrics
WHERE metric_date >= CURRENT_DATE - INTERVAL '7 days'
  AND total_sleep_minutes IS NOT NULL;
```

### Find Best Sleep Nights
```sql
SELECT 
  metric_date,
  sleep_score,
  total_sleep_minutes,
  deep_sleep_minutes,
  avg_sleep_hrv
FROM daily_metrics
WHERE sleep_score IS NOT NULL
ORDER BY sleep_score DESC
LIMIT 10;
```

## API Integration

### MCP Tools
The MCP server exposes these tools that use this data:
- `fetch_daily_metrics` - Get raw metrics from Ultrahuman API
- `refresh_and_store_metrics` - Fetch + store in database
- `list_cached_metrics` - Query stored metrics
- `get_metric_summary` - Get formatted summary for specific date

### Dashboard
The data dashboard displays:
- **Summary Cards**: Latest sleep score, total sleep, readiness, HRV
- **Charts**: 7-day trends for sleep duration and efficiency
- **Metrics Table**: Detailed breakdown with all fields
- **Logs**: Recent MCP tool calls from Poke

## Data Privacy

- All data stored in **Neon Postgres** (production database)
- Access protected by **password authentication** (password: "persuasion")
- API keys stored as **environment variables** in Vercel
- Database connection uses **SSL with channel binding**
- MCP server requires **API key authentication**

