const token = "eyJhbGciOiJIUzI1NiJ9.eyJzZWNyZXQiOiJkM2M1NzRkMTQ5YWIyODJiNzlhOSIsInNjb3BlcyI6WyJyaW5nIl0sIm5hbWUiOiJmaXhtZXNsZWVwIiwiZXhwIjoyMDc5Mjk0NzIzfQ.TOVqFUKB5U1eiGSjeuh0QtFhTEc1SWClpkVq-WVtNJs";

async function testRecentDates() {
  const today = new Date();
  
  console.log("🔍 Testing last 7 days of data...\n");
  
  for (let i = 0; i < 7; i++) {
    const testDate = new Date(today);
    testDate.setDate(today.getDate() - i);
    const dateStr = testDate.toISOString().split('T')[0];
    
    const url = `https://partner.ultrahuman.com/api/v1/partner/daily_metrics?date=${dateStr}`;
    
    try {
      const res = await fetch(url, {
        headers: { 'Authorization': token }
      });
      
      const status = res.status;
      const text = await res.text();
      
      if (status === 200) {
        const data = JSON.parse(text);
        const metrics = data.data?.metrics?.[dateStr];
        const hasData = metrics && metrics.length > 0;
        const sleepMetric = metrics?.find((m: any) => m.type === 'sleep');
        const hasSleepData = sleepMetric && Object.keys(sleepMetric.object || {}).length > 0;
        
        console.log(`${dateStr}: ✅ ${status} - ${metrics?.length || 0} metrics${hasSleepData ? ' (has sleep data)' : ' (empty sleep)'}`);
      } else {
        console.log(`${dateStr}: ❌ ${status} - ${text.substring(0, 80)}`);
      }
    } catch (error) {
      console.log(`${dateStr}: ❌ Error - ${(error as Error).message}`);
    }
  }
}

testRecentDates();

