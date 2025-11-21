Overview
Welcome to the UltraSignal API documentation. This API provides comprehensive access to health and fitness metrics collected by Ultrahuman devices.

What You Can Do
• Access real-time health metrics
• Monitor sleep patterns and quality
• Track physical activity and recovery
• Analyze glucose and metabolic data
Getting Started
Prerequisites
1
Generate Your API Token

Create your Personal API token from the developer portal

2
Access Scenarios

Accessing Your Own Data
If you want to access data for your own account (same email as your login), no additional setup is required. Simply use your API token without the email parameter.

Accessing Other User's Data
To access another user's data, you'll need:

Their email address (to be used as a parameter in the API)
Their authorization through the Ultrahuman app:
• The data owner opens their Ultrahuman app

• Go to Profile tab → Settings → Partner ID

• Enter the data sharing code provided by the API developer

API Endpoint
Base URL:

https://partner.ultrahuman.com/api/v1/partner/daily_metrics
Making API Requests
Required Headers
Authorization
Your personal API token that grants access to the API.

Example: eyJhbGc...

Query Parameters
date
(string)
required
The specific date for which you want to retrieve metrics (required if you are not using epoch-based date range).

Format: YYYY-MM-DD

Example: 2024-03-15

email
(string)
optional
Email address of the user whose data you want to access.

•
If not provided, returns data for your own account (same email as your login)

•
If provided, the specified user must have authorized data sharing through the Ultrahuman app

Alternative: Date Range using Epoch Timestamps (cannot be used together with the date parameter – choose either date or epoch timestamps, not both)

start_epoch
(number)
Start time in epoch seconds

end_epoch
(number)
End time in epoch seconds

Important Notes
•
When using date, data is fetched for the entire day in user's timezone
•
Date range queries cannot exceed 7 days
•
All timestamps are processed in the user's latest timezone
Error Responses
400 Bad Request
• Date range exceeds 7 days
• Missing required parameters
• Invalid date format
404 Not Found
User not found or no data sharing permission

500 Internal Server Error
Something went wrong on Ultrahuman's end. (These are rare.)

Anyone with this Authorization Key can use the Ultrahuman API as you. If it is compromised, you can deactivate or delete the API key.

Response Overview
The API returns a comprehensive set of health metrics including:

hr
Heart rate measurements throughout the day in beats per minute (BPM)

temp
Skin temperature readings in Celsius

hrv
Heart Rate Variability - a measure of the variation in time between heartbeats

steps
Step count throughout the day

motion
Movement intensity measurements

night_rhr
Resting Heart Rate during sleep

sleep
Detailed sleep analysis including stages, efficiency, and insights

recovery
Overall recovery score based on various metrics

glucose
Continuous glucose monitoring data in mg/dL

metabolic_score
Overall metabolic health score

glucose_variability
Percentage of glucose fluctuation throughout the day

average_glucose
Mean glucose level for the day in mg/dL

hba1c
Estimated HbA1c based on glucose data

time_in_target
Percentage of time glucose levels stayed within target range

recovery_index
Score indicating physical recovery status

movement_index
Score based on daily physical activity

vo2_max
Maximum oxygen consumption capacity during exercise

sleep_rhr
Resting heart rate during sleep, indicating recovery quality

avg_sleep_hrv
Average heart rate variability during sleep, measuring recovery

spo2
Blood oxygen saturation levels, measured as a percentage

active_minutes
Total minutes of moderate to vigorous physical activity throughout the day

sleep_score
Overall sleep quality score based on multiple sleep factors

total_sleep
Total duration of sleep including all sleep stages

sleep_efficiency
Percentage of time spent sleeping while in bed

time_in_bed
Total time spent in bed from bedtime start to end

rem_sleep
Rapid Eye Movement sleep duration and percentage

deep_sleep
Deep sleep duration and percentage, crucial for recovery

light_sleep
Light sleep duration and percentage

temperature_deviation
Deviation from baseline skin temperature during sleep

hr_drop
Heart rate drop during sleep compared to daytime average

restorative_sleep
Measure of how restorative the sleep was for recovery

movements
Number and intensity of movements during sleep

morning_alertness
Level of alertness and readiness upon waking

full_sleep_cycles
Number of complete sleep cycles achieved during the night

tosses_and_turns
Frequency of restless movements during sleep

average_body_temperature
Average body temperature maintained during sleep



example code snippet (nodejs)

const axios = require('axios');

const url = 'https://partner.ultrahuman.com/api/v1/partner/daily_metrics';
const headers = {
  Authorization: 'YOUR_AUTH_TOKEN'
};

// Example with date parameter
const dateParams = {
  date: 'yyyy-mm-dd'
};
axios.get(url, { params: dateParams, headers })
  .then(response => console.log(response.data))
  .catch(error => console.error(error));

// Example with epoch parameters
const epochParams = {
  start_epoch: '1234567890',
  end_epoch: '1234654290'
};
axios.get(url, { params: epochParams, headers })
  .then(response => console.log(response.data))
  .catch(error => console.error(error));