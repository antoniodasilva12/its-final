interface ResourceUsage {
  electricity_kwh: number;
  water_liters: number;
  date: string;
  room_number: string;
}

interface ResourceAnalytics {
  electricityTrend: 'increasing' | 'decreasing' | 'stable';
  waterTrend: 'increasing' | 'decreasing' | 'stable';
  averageElectricityUsage: number;
  averageWaterUsage: number;
  peakElectricityTime: string;
  peakWaterTime: string;
  recommendations: string[];
}

export const analyzeResourceUsage = async (usageData: ResourceUsage[]): Promise<ResourceAnalytics> => {
  if (!usageData || usageData.length === 0) {
    return {
      electricityTrend: 'stable',
      waterTrend: 'stable',
      averageElectricityUsage: 0,
      averageWaterUsage: 0,
      peakElectricityTime: '-',
      peakWaterTime: '-',
      recommendations: ['No resource usage data available yet.']
    };
  }

  // Calculate trends
  const sortedByDate = [...usageData].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const recentDays = sortedByDate.slice(-7);
  const previousDays = sortedByDate.slice(-14, -7);

  const recentElectricityAvg = average(recentDays.map(d => d.electricity_kwh));
  const previousElectricityAvg = average(previousDays.map(d => d.electricity_kwh));
  const recentWaterAvg = average(recentDays.map(d => d.water_liters));
  const previousWaterAvg = average(previousDays.map(d => d.water_liters));

  const electricityTrend = getTrend(recentElectricityAvg, previousElectricityAvg);
  const waterTrend = getTrend(recentWaterAvg, previousWaterAvg);

  // Find peak usage times
  const peakElectricity = sortedByDate.reduce((max, curr) => 
    curr.electricity_kwh > max.electricity_kwh ? curr : max
  );
  const peakWater = sortedByDate.reduce((max, curr) => 
    curr.water_liters > max.water_liters ? curr : max
  );

  // Get AI recommendations
  const recommendations = await getAIRecommendations({
    electricityTrend,
    waterTrend,
    recentElectricityAvg,
    recentWaterAvg,
    peakElectricity,
    peakWater
  });

  return {
    electricityTrend,
    waterTrend,
    averageElectricityUsage: recentElectricityAvg,
    averageWaterUsage: recentWaterAvg,
    peakElectricityTime: peakElectricity.date,
    peakWaterTime: peakWater.date,
    recommendations
  };
};

const average = (numbers: number[]): number => 
  numbers.length ? numbers.reduce((a, b) => a + b) / numbers.length : 0;

const getTrend = (recent: number, previous: number): 'increasing' | 'decreasing' | 'stable' => {
  const percentChange = ((recent - previous) / previous) * 100;
  if (percentChange > 5) return 'increasing';
  if (percentChange < -5) return 'decreasing';
  return 'stable';
};

const getAIRecommendations = async (data: {
  electricityTrend: string;
  waterTrend: string;
  recentElectricityAvg: number;
  recentWaterAvg: number;
  peakElectricity: ResourceUsage;
  peakWater: ResourceUsage;
}): Promise<string[]> => {
  if (!import.meta.env.VITE_OPENAI_API_KEY) {
    return [
      'Configure OpenAI API key to get AI-powered recommendations.',
      'Consider implementing energy-saving measures during peak usage times.',
      'Monitor water usage patterns for potential leaks or inefficiencies.',
      'Educate students about resource conservation practices.'
    ];
  }

  try {
    const prompt = `
      Analyze this hostel resource usage data and provide 3-5 specific recommendations:
      - Electricity trend: ${data.electricityTrend}
      - Water trend: ${data.waterTrend}
      - Recent average electricity usage: ${data.recentElectricityAvg} kWh
      - Recent average water usage: ${data.recentWaterAvg} liters
      - Peak electricity usage: ${data.peakElectricity.electricity_kwh} kWh on ${data.peakElectricity.date}
      - Peak water usage: ${data.peakWater.water_liters} liters on ${data.peakWater.date}
    `;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [{
          role: "user",
          content: prompt
        }],
        temperature: 0.7,
        max_tokens: 200
      })
    });

    if (!response.ok) {
      throw new Error('Failed to get AI recommendations');
    }

    const result = await response.json();
    if (!result.choices?.[0]?.message?.content) {
      throw new Error('Invalid AI response format');
    }

    const recommendations: string[] = result.choices[0].message.content
      .split('\n')
      .filter(Boolean)
      .map((rec: string) => rec.replace(/^[0-9-.\s]+/, '').trim());

    return recommendations;
  } catch (error) {
    console.error('Error getting AI recommendations:', error);
    return [
      'Consider implementing energy-saving measures during peak usage times',
      'Monitor water usage patterns for potential leaks or inefficiencies',
      'Educate students about resource conservation practices'
    ];
  }
};
