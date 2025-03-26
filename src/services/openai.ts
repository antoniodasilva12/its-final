import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: import.meta.env.VITE_OPENAI_API_KEY,
    dangerouslyAllowBrowser: true
});

// Define usage thresholds
const THRESHOLDS = {
    ELECTRICITY: {
        LOW: 5, // kWh
        MODERATE: 10,
        HIGH: 15
    },
    WATER: {
        LOW: 100, // liters
        MODERATE: 200,
        HIGH: 300
    }
};

const HIGH_USAGE_RECOMMENDATIONS = {
    ELECTRICITY: [
        "⚠️ High electricity usage! Consider using natural light during daytime",
        "Unplug all electronic devices when not in use - they draw power even when off",
        "Switch to energy-efficient LED bulbs if you haven't already",
        "Use power strips to easily turn off multiple devices at once",
        "Adjust your AC temperature by 1-2 degrees to save significant power",
        "Keep windows closed when AC is running to maintain efficiency",
        "Clean your AC filters regularly for better efficiency",
        "Use a fan instead of AC when possible",
        "Study in common areas to share lighting and AC with others",
        "Schedule high-power activities during off-peak hours"
    ],
    WATER: [
        "⚠️ High water usage detected! Take shorter showers (aim for 5 minutes)",
        "Report any leaking taps or running toilets immediately",
        "Use a cup when brushing teeth instead of running water",
        "Collect and reuse greywater for plants if applicable",
        "Wait for full loads before doing laundry",
        "Use cold water for laundry when possible",
        "Keep a reusable water bottle to avoid running tap repeatedly",
        "Turn off taps completely - even small drips waste lots of water",
        "Use a bucket instead of running water for cleaning",
        "Consider using a low-flow showerhead"
    ]
};

const getFallbackRecommendations = (
    recentUsage: { electricity_kwh: number; water_liters: number },
    averageUsage?: { electricity_kwh: number; water_liters: number }
): string[] => {
    const recommendations: string[] = [];

    // Electricity recommendations based on thresholds
    if (recentUsage.electricity_kwh > THRESHOLDS.ELECTRICITY.HIGH) {
        // Get 3 random recommendations from the high usage list
        const highElecRecs = HIGH_USAGE_RECOMMENDATIONS.ELECTRICITY
            .sort(() => Math.random() - 0.5)
            .slice(0, 3);
        recommendations.push(...highElecRecs);
    } else if (recentUsage.electricity_kwh > THRESHOLDS.ELECTRICITY.MODERATE) {
        recommendations.push(
            'Moderate electricity usage - try using energy-efficient settings on your appliances',
            'Remember to unplug chargers and devices when not in use'
        );
    } else {
        recommendations.push('👍 Great job on keeping electricity usage low! Keep up these good habits');
    }

    // Water recommendations based on thresholds
    if (recentUsage.water_liters > THRESHOLDS.WATER.HIGH) {
        // Get 3 random recommendations from the high usage list
        const highWaterRecs = HIGH_USAGE_RECOMMENDATIONS.WATER
            .sort(() => Math.random() - 0.5)
            .slice(0, 3);
        recommendations.push(...highWaterRecs);
    } else if (recentUsage.water_liters > THRESHOLDS.WATER.MODERATE) {
        recommendations.push(
            'Moderate water usage - try using a cup when brushing teeth instead of running tap',
            'Consider collecting and reusing greywater for plants if applicable'
        );
    } else {
        recommendations.push('👍 Excellent water conservation! Your low usage helps preserve resources');
    }

    // If we have average usage data, add comparative insights
    if (averageUsage) {
        const elecDiff = ((recentUsage.electricity_kwh - averageUsage.electricity_kwh) / averageUsage.electricity_kwh) * 100;
        const waterDiff = ((recentUsage.water_liters - averageUsage.water_liters) / averageUsage.water_liters) * 100;

        if (elecDiff > 20) {
            recommendations.push(`⚠️ Your electricity usage is ${elecDiff.toFixed(0)}% above average - try to identify high-consumption activities`);
        }
        if (waterDiff > 20) {
            recommendations.push(`⚠️ Your water usage is ${waterDiff.toFixed(0)}% above average - consider ways to reduce consumption`);
        }
        if (elecDiff < -20 && waterDiff < -20) {
            recommendations.push('🌟 Outstanding! Your resource usage is well below average');
        }
    }

    // For very high usage, add an urgent call to action
    if (recentUsage.electricity_kwh > THRESHOLDS.ELECTRICITY.HIGH * 1.5 ||
        recentUsage.water_liters > THRESHOLDS.WATER.HIGH * 1.5) {
        recommendations.unshift('🚨 URGENT: Your resource usage is significantly high! Please take immediate action to reduce consumption.');
    }

    return recommendations.slice(0, 5); // Return top 5 most relevant recommendations
};

export const getResourceRecommendations = async (
    historicalData: {
        electricity_kwh: number;
        water_liters: number;
        date: string;
    }[]
) => {
    if (!import.meta.env.VITE_OPENAI_API_KEY || import.meta.env.VITE_OPENAI_API_KEY === 'your_openai_api_key') {
        console.log('OpenAI API key not configured, using fallback recommendations');
        const recentUsage = historicalData[historicalData.length - 1];

        // Calculate average usage if we have historical data
        const averageUsage = historicalData.length > 1 ? {
            electricity_kwh: historicalData.reduce((acc, curr) => acc + curr.electricity_kwh, 0) / historicalData.length,
            water_liters: historicalData.reduce((acc, curr) => acc + curr.water_liters, 0) / historicalData.length
        } : undefined;

        return getFallbackRecommendations(recentUsage, averageUsage);
    }

    try {
        const recentUsage = historicalData[historicalData.length - 1];
        const averageUsage = historicalData.reduce(
            (acc, curr) => ({
                electricity_kwh: acc.electricity_kwh + curr.electricity_kwh,
                water_liters: acc.water_liters + curr.water_liters
            }),
            { electricity_kwh: 0, water_liters: 0 }
        );

        const avgElectricity = averageUsage.electricity_kwh / historicalData.length;
        const avgWater = averageUsage.water_liters / historicalData.length;

        // Determine usage levels for more specific recommendations
        const electricityLevel = recentUsage.electricity_kwh > THRESHOLDS.ELECTRICITY.HIGH ? 'high' :
            recentUsage.electricity_kwh > THRESHOLDS.ELECTRICITY.MODERATE ? 'moderate' : 'low';
        const waterLevel = recentUsage.water_liters > THRESHOLDS.WATER.HIGH ? 'high' :
            recentUsage.water_liters > THRESHOLDS.WATER.MODERATE ? 'moderate' : 'low';

        const prompt = `As an AI energy efficiency expert, analyze this student's hostel resource usage:

Current usage:
- Electricity: ${recentUsage.electricity_kwh} kWh (${electricityLevel} usage)
- Water: ${recentUsage.water_liters} liters (${waterLevel} usage)

Average usage:
- Electricity: ${avgElectricity.toFixed(2)} kWh
- Water: ${avgWater.toFixed(2)} liters

Thresholds:
- Electricity: Low < ${THRESHOLDS.ELECTRICITY.LOW}kWh, High > ${THRESHOLDS.ELECTRICITY.HIGH}kWh
- Water: Low < ${THRESHOLDS.WATER.LOW}L, High > ${THRESHOLDS.WATER.HIGH}L

Provide 3 specific, actionable recommendations focusing on:
1. Areas where usage is high compared to thresholds
2. Practical tips for students in hostels
3. Positive reinforcement if usage is low
Format each recommendation as a concise, single-line statement.`;

        const completion = await openai.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: "gpt-3.5-turbo",
            temperature: 0.7,
            max_tokens: 300
        });

        const recommendations = completion.choices[0].message.content
            ?.split('\n')
            .filter(rec => rec.trim().length > 0)
            .map(rec => rec.replace(/^\d+\.\s*/, '')) || [];

        return recommendations.length > 0 ? recommendations : getFallbackRecommendations(recentUsage);

    } catch (error) {
        console.error('Error getting AI recommendations:', error);
        const recentUsage = historicalData[historicalData.length - 1];
        return getFallbackRecommendations(recentUsage);
    }
};
