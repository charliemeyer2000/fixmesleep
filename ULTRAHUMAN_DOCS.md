# UltraSignal API Documentation

## Overview
Welcome to the UltraSignal API documentation. This API provides comprehensive access to health and fitness metrics collected by Ultrahuman devices.

### What You Can Do
- Access real-time health metrics
- Monitor sleep patterns and quality
- Track physical activity and recovery
- Analyze glucose and metabolic data

## Getting Started

### Prerequisites

1. **Generate Your API Token**
   - Create your Personal API token from the developer portal

2. **Access Scenarios**
   - **Accessing Your Own Data**: If you want to access data for your own account (same email as your login), no additional setup is required. Simply use your API token without the email parameter.
   - **Accessing Other User's Data**: To access another user's data, you'll need their email address and their authorization through the Ultrahuman app (Profile → Settings → Partner ID).

## API Endpoint

**Base URL:** `https://partner.ultrahuman.com/api/v1/partner/daily_metrics`

### Required Headers

- `Authorization`: Your personal API token (e.g., `eyJhbGc...`)

### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `date` | string | Yes* | The specific date for metrics (YYYY-MM-DD format, e.g., 2024-03-15) |
| `start_epoch` | number | Yes* | Start time in epoch seconds (alternative to `date`) |
| `end_epoch` | number | Yes* | End time in epoch seconds (used with `start_epoch`) |
| `email` | string | No | Email address of the user whose data you want to access (omit for your own data) |

\* Either `date` OR (`start_epoch` + `end_epoch`) is required

### Important Notes

- When using `date`, data is fetched for the entire day in user's timezone
- Date range queries cannot exceed 7 days
- All timestamps are processed in the user's latest timezone
- You cannot use both `date` and epoch parameters together

## Response Structure

The API returns data in the following nested structure:

```json
{
  "data": {
    "metrics": {
      "YYYY-MM-DD": [
        { "type": "sleep", "object": {...} },
        { "type": "hr", "object": {...} },
        { "type": "recovery_index", "object": {...} }
      ]
    },
    "latest_time_zone": "America/New_York"
  },
  "error": null,
  "status": 200
}
```

### Metric Types

Each date contains an array of metric objects with a `type` and `object` field:

#### Sleep Metrics (`type: "sleep"`)
```json
{
  "type": "sleep",
  "object": {
    "sleep_score": { "score": 79 },
    "total_sleep": { "minutes": 425, "hours": 7, "remaining_minutes": 5 },
    "deep_sleep": { "minutes": 80, "percentage": 19 },
    "rem_sleep": { "minutes": 195, "percentage": 46 },
    "light_sleep": { "minutes": 150, "percentage": 35 },
    "sleep_efficiency": { "percentage": 77 },
    "temperature_deviation": { "value": -0.5 },
    "restorative_sleep": { "minutes": 275 },
    "night_rhr": { "avg": 54 }
  }
}
```

#### Recovery Metrics
- `avg_sleep_hrv`: `{ "value": 57 }` - Average HRV during sleep
- `sleep_rhr`: `{ "value": 54 }` - Resting heart rate during sleep  
- `recovery_index`: `{ "value": 60 }` - Physical recovery status score
- `movement_index`: `{ "value": 45 }` - Daily physical activity score

#### Activity Metrics
- `active_minutes`: `{ "value": 50 }` - Minutes of moderate to vigorous activity
- `vo2_max`: `{ "value": 52 }` - Maximum oxygen consumption capacity
- `steps`: `{ "total": 3262, "avg": 19.08 }` - Step count with time-series values

#### Physiological Metrics (Time Series)
- `hr`: Heart rate measurements (BPM) throughout the day
- `temp`: Skin temperature readings (°C)
- `hrv`: Heart rate variability measurements
- `night_rhr`: Resting heart rate during sleep

### Available Metric Types

The following metric types may be present in the response:
- `hr` - Heart rate
- `temp` - Skin temperature
- `hrv` - Heart rate variability
- `steps` - Step count
- `night_rhr` - Night resting heart rate
- `avg_sleep_hrv` - Average sleep HRV
- `sleep` - Comprehensive sleep metrics
- `sleep_rhr` - Sleep resting heart rate
- `recovery_index` - Recovery score
- `movement_index` - Movement score
- `active_minutes` - Active minutes
- `vo2_max` - VO2 max
- `spo2` - Blood oxygen saturation (if available)
- `glucose` - Glucose data (if using CGM)
- `metabolic_score` - Metabolic health score (if available)

## Error Responses

| Status Code | Description |
|-------------|-------------|
| 400 | Bad Request - Date range exceeds 7 days, missing parameters, or invalid date format |
| 401 | Unauthorized - User has not shared access for the provided email |
| 404 | Not Found - User not found or no data sharing permission |
| 500 | Internal Server Error - Something went wrong on Ultrahuman's end |

## Example Code (Node.js)

```javascript
const url = 'https://partner.ultrahuman.com/api/v1/partner/daily_metrics';
const headers = {
  Authorization: 'YOUR_AUTH_TOKEN'
};

// Example with date parameter
const dateParams = { date: '2024-03-15' };
const response = await fetch(`${url}?date=${dateParams.date}`, { headers });
const data = await response.json();

// Access metrics for a specific date
const metrics = data.data.metrics['2024-03-15'];
const sleepData = metrics.find(m => m.type === 'sleep')?.object;
console.log('Sleep score:', sleepData?.sleep_score?.score);
console.log('Total sleep:', sleepData?.total_sleep?.minutes, 'minutes');

// Example with epoch parameters
const epochParams = {
  start_epoch: 1234567890,
  end_epoch: 1234654290
};
const response2 = await fetch(
  `${url}?start_epoch=${epochParams.start_epoch}&end_epoch=${epochParams.end_epoch}`,
  { headers }
);
```

## Security

Anyone with your Authorization Key can access your Ultrahuman data. If it is compromised, immediately deactivate or delete the API key from the developer portal.
