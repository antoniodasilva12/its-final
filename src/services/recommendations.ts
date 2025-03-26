interface ResourceLevels {
  electricity_kwh: number;
  water_liters: number;
}

export const getResourceRecommendations = (resources: ResourceLevels): string[] => {
  const recommendations: string[] = [];

  // Water recommendations based on liters
  if (resources.water_liters <= 10) {
    recommendations.push(
      "Your water usage is very efficient! Keep up the good practices:",
      "• Consider using a water bottle to track daily consumption",
      "• Report any leaking taps promptly"
    );
  } else if (resources.water_liters <= 20) {
    recommendations.push(
      "Your water usage is moderate. Here are some tips to reduce consumption:",
      "• Take shorter showers (aim for 5 minutes)",
      "• Turn off taps while brushing teeth",
      "• Use a cup when brushing teeth",
      "• Report any dripping faucets immediately"
    );
  } else if (resources.water_liters <= 30) {
    recommendations.push(
      "Your water usage is high. Consider these water-saving measures:",
      "• Install a low-flow showerhead",
      "• Collect and reuse greywater for plants",
      "• Fix any leaks in your room",
      "• Use washing machines with full loads only",
      "• Keep track of your usage with our water monitoring chart"
    );
  } else {
    recommendations.push(
      "Your water consumption is very high. Immediate action recommended:",
      "• Schedule a maintenance check for possible leaks",
      "• Install water-saving devices",
      "• Consider using the laundry service instead of personal washing",
      "• Track your daily usage and set reduction goals",
      "• Attend our water conservation workshop",
      "• Consider switching to water-efficient appliances"
    );
  }

  // Electricity recommendations based on kWh
  if (resources.electricity_kwh <= 10) {
    recommendations.push(
      "Your electricity usage is very efficient! Keep up these practices:",
      "• Continue using natural light during daytime",
      "• Keep using LED bulbs",
      "• Unplug devices when not in use"
    );
  } else if (resources.electricity_kwh <= 20) {
    recommendations.push(
      "Your electricity usage is moderate. Try these energy-saving tips:",
      "• Use natural light when possible",
      "• Switch to LED bulbs if you haven't",
      "• Turn off lights when leaving the room",
      "• Use power strips to avoid phantom energy loss",
      "• Keep your devices on power-saving mode"
    );
  } else if (resources.electricity_kwh <= 30) {
    recommendations.push(
      "Your electricity usage is high. Consider these measures:",
      "• Conduct an energy audit of your room",
      "• Replace any inefficient appliances",
      "• Use smart power strips",
      "• Maximize natural light usage",
      "• Set your devices to energy-saving mode",
      "• Consider using our study areas instead of your room during day"
    );
  } else {
    recommendations.push(
      "Your electricity consumption is very high. Immediate action recommended:",
      "• Schedule an energy audit",
      "• Replace all bulbs with LED alternatives",
      "• Use timers for electrical devices",
      "• Consider upgrading to energy-efficient appliances",
      "• Attend our energy conservation workshop",
      "• Monitor your daily consumption patterns",
      "• Use the hostel's common areas for activities requiring high power"
    );
  }

  return recommendations;
};
