interface QuickFix {
  title: string;
  steps: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  tools_needed: string[];
  priority: 'low' | 'medium' | 'high';
}

interface IssueType {
  keywords: string[];
  fixes: QuickFix[];
}

const commonIssueTypes: { [key: string]: IssueType } = {
  structural: {
    keywords: ['roof', 'leak', 'ceiling', 'wall', 'crack', 'damage', 'water', 'drip', 'seepage', 'mold', 'damp', 'wet', 'hole'],
    fixes: [
      {
        title: "Roof/Ceiling Leak Emergency",
        steps: [
          "Place buckets/containers to catch water",
          "Move furniture and belongings away",
          "Take photos of the affected area",
          "Document exact leak locations",
          "Contact maintenance immediately",
          "Keep area ventilated to prevent mold"
        ],
        difficulty: "hard",
        tools_needed: ["Buckets", "Phone for photos", "Towels"],
        priority: "high"
      }
    ]
  },
  door_window: {
    keywords: ['door', 'window', 'lock', 'hinge', 'handle', 'knob', 'stuck', 'jammed', 'broken', 'key', 'latch', 'glass', 'frame'],
    fixes: [
      {
        title: "Door Issues",
        steps: [
          "Check if door can be safely closed/opened",
          "Identify specific problem (lock/hinge/handle)",
          "Document any unusual sounds",
          "Take photos of damaged parts",
          "Secure room if lock is broken",
          "Report to maintenance immediately"
        ],
        difficulty: "medium",
        tools_needed: ["Phone for photos", "Basic tools if available"],
        priority: "high"
      },
      {
        title: "Window Problems",
        steps: [
          "Do not force broken windows",
          "Check if window can be secured",
          "Document any broken glass/parts",
          "Place warning sign if necessary",
          "Keep area clear of broken glass",
          "Contact maintenance urgently"
        ],
        difficulty: "medium",
        tools_needed: ["Warning sign", "Phone for photos"],
        priority: "high"
      }
    ]
  },
  plumbing: {
    keywords: ['sink', 'toilet', 'drain', 'pipe', 'faucet', 'shower', 'clog', 'blocked', 'flooding', 'tap', 'bathroom', 'water'],
    fixes: [
      {
        title: "Blocked Drain/Sink",
        steps: [
          "Remove visible debris from drain",
          "Use baking soda and vinegar solution",
          "Wait 15-20 minutes",
          "Flush with hot water",
          "Use plunger if still blocked",
          "Contact maintenance if persists"
        ],
        difficulty: "easy",
        tools_needed: ["Baking soda", "Vinegar", "Plunger"],
        priority: "medium"
      },
      {
        title: "Toilet Issues",
        steps: [
          "Use plunger for blockages",
          "Check if water is running constantly",
          "Don't flush if overflowing",
          "Turn off water valve if leaking",
          "Keep bathroom ventilated",
          "Contact maintenance immediately"
        ],
        difficulty: "medium",
        tools_needed: ["Plunger", "Cleaning supplies"],
        priority: "high"
      },
      {
        title: "Leaking Tap/Shower",
        steps: [
          "Turn off water supply valve",
          "Document the leak location",
          "Place container to catch water",
          "Take photos/video of leak",
          "Note if water is hot or cold",
          "Report to maintenance"
        ],
        difficulty: "medium",
        tools_needed: ["Container", "Phone for photos"],
        priority: "medium"
      }
    ]
  },
  electrical: {
    keywords: ['light', 'switch', 'power', 'outlet', 'bulb', 'socket', 'electricity', 'fan', 'circuit', 'plug', 'tripped', 'flickering'],
    fixes: [
      {
        title: "Power Outlet Issues",
        steps: [
          "Unplug all devices from outlet",
          "Check if other outlets work",
          "Look for tripped circuit breaker",
          "Don't use outlet if sparking/hot",
          "Document any burning smells",
          "Report electrical issues urgently"
        ],
        difficulty: "medium",
        tools_needed: ["Phone for photos"],
        priority: "high"
      },
      {
        title: "Lighting Problems",
        steps: [
          "Check if multiple lights affected",
          "Test light switch functionality",
          "Note any flickering/buzzing",
          "Don't touch damaged fixtures",
          "Use alternate light source",
          "Contact maintenance"
        ],
        difficulty: "medium",
        tools_needed: ["Flashlight", "Phone for photos"],
        priority: "medium"
      }
    ]
  },
  ac_heating: {
    keywords: ['ac', 'air', 'conditioning', 'heat', 'temperature', 'thermostat', 'cold', 'hot', 'ventilation', 'cooling', 'heating', 'warm'],
    fixes: [
      {
        title: "AC Not Cooling",
        steps: [
          "Check thermostat settings",
          "Ensure vents are unblocked",
          "Close windows and doors",
          "Clean/replace air filter",
          "Document room temperature",
          "Report to maintenance"
        ],
        difficulty: "easy",
        tools_needed: ["Thermometer", "Basic cleaning supplies"],
        priority: "medium"
      },
      {
        title: "Heating Problems",
        steps: [
          "Check thermostat batteries",
          "Verify temperature setting",
          "Clear area around heaters",
          "Document room temperature",
          "Note cold/hot spots",
          "Contact maintenance"
        ],
        difficulty: "easy",
        tools_needed: ["Thermometer", "Notepad"],
        priority: "medium"
      }
    ]
  },
  furniture: {
    keywords: ['chair', 'desk', 'bed', 'drawer', 'table', 'cabinet', 'furniture', 'loose', 'wobbly', 'broken', 'stuck', 'squeaking'],
    fixes: [
      {
        title: "Broken Furniture",
        steps: [
          "Stop using damaged item",
          "Take photos of damage",
          "Move away from walkways",
          "Mark as damaged if possible",
          "Note any sharp edges",
          "Report to maintenance"
        ],
        difficulty: "medium",
        tools_needed: ["Warning sign", "Phone"],
        priority: "medium"
      },
      {
        title: "Stuck Drawer/Cabinet",
        steps: [
          "Check for visible obstacles",
          "Don't force it open",
          "Document any sounds",
          "Take photos if possible",
          "Note if items trapped inside",
          "Contact maintenance"
        ],
        difficulty: "medium",
        tools_needed: ["Flashlight", "Phone"],
        priority: "low"
      }
    ]
  },
  appliance: {
    keywords: ['fridge', 'microwave', 'stove', 'oven', 'washer', 'dryer', 'dishwasher', 'appliance', 'machine', 'kettle'],
    fixes: [
      {
        title: "Appliance Not Working",
        steps: [
          "Unplug the appliance",
          "Check power connection",
          "Don't attempt repairs",
          "Document the problem",
          "Note any unusual sounds/smells",
          "Report to maintenance"
        ],
        difficulty: "medium",
        tools_needed: ["Phone for documentation"],
        priority: "medium"
      }
    ]
  },
  floor_damage: {
    keywords: ['floor', 'tile', 'carpet', 'wood', 'laminate', 'loose', 'cracked', 'damaged', 'stain', 'squeaky', 'uneven', 'hole'],
    fixes: [
      {
        title: "Cracked/Broken Floor Tiles",
        steps: [
          "Mark the damaged area with tape",
          "Avoid stepping on cracked tiles",
          "Document the extent of damage",
          "Take close-up photos",
          "Note if tiles are loose/moving",
          "Report to maintenance immediately"
        ],
        difficulty: "medium",
        tools_needed: ["Warning tape", "Phone for photos"],
        priority: "high"
      },
      {
        title: "Carpet Damage",
        steps: [
          "Place warning sign near damaged area",
          "Check for trip hazards",
          "Document type of damage (tear/stain)",
          "Take photos of affected area",
          "Cover exposed tack strips if any",
          "Contact maintenance for repair"
        ],
        difficulty: "medium",
        tools_needed: ["Warning sign", "Phone for photos"],
        priority: "medium"
      },
      {
        title: "Wooden Floor Issues",
        steps: [
          "Document type of damage",
          "Mark any loose/raised boards",
          "Check for water damage signs",
          "Take photos of problem areas",
          "Avoid using damaged section",
          "Report to maintenance team"
        ],
        difficulty: "medium",
        tools_needed: ["Warning tape", "Phone for photos"],
        priority: "medium"
      }
    ]
  },
  door_damage: {
    keywords: ['door', 'hinge', 'handle', 'knob', 'lock', 'stuck', 'jammed', 'broken', 'key', 'latch', 'slam', 'scratch', 'dent', 'gap'],
    fixes: [
      {
        title: "Door Not Closing Properly",
        steps: [
          "Check if door aligns with frame",
          "Inspect hinges for loose screws",
          "Test handle mechanism",
          "Document closing issues",
          "Note any unusual sounds",
          "Report alignment problems"
        ],
        difficulty: "medium",
        tools_needed: ["Phone for photos/video"],
        priority: "high"
      },
      {
        title: "Broken Door Lock/Handle",
        steps: [
          "Do not force damaged lock/handle",
          "Ensure door can be secured",
          "Document lock mechanism issues",
          "Take photos of damage",
          "Note if key works partially",
          "Request urgent maintenance"
        ],
        difficulty: "hard",
        tools_needed: ["Phone for photos", "Temporary lock if available"],
        priority: "high"
      },
      {
        title: "Door Physical Damage",
        steps: [
          "Check if door is still functional",
          "Document type of damage",
          "Take photos of all damage",
          "Test if door closes securely",
          "Mark hazardous areas",
          "Report damage details"
        ],
        difficulty: "medium",
        tools_needed: ["Warning sign", "Phone for photos"],
        priority: "medium"
      }
    ]
  },
  window_damage: {
    keywords: ['window', 'glass', 'pane', 'frame', 'seal', 'crack', 'broken', 'stuck', 'draft', 'handle', 'latch', 'screen', 'sill'],
    fixes: [
      {
        title: "Broken/Cracked Window",
        steps: [
          "Do not touch broken glass",
          "Secure the area immediately",
          "Place warning signs",
          "Document the damage",
          "Take photos safely",
          "Request emergency maintenance"
        ],
        difficulty: "hard",
        tools_needed: ["Warning signs", "Phone for photos"],
        priority: "high"
      },
      {
        title: "Window Not Opening/Closing",
        steps: [
          "Check track for obstacles",
          "Test handle/latch mechanism",
          "Don't force window movement",
          "Document the problem",
          "Note if partially stuck",
          "Report issue to maintenance"
        ],
        difficulty: "medium",
        tools_needed: ["Phone for photos"],
        priority: "medium"
      },
      {
        title: "Window Draft/Seal Issues",
        steps: [
          "Locate source of draft",
          "Check window seal condition",
          "Document temperature issues",
          "Take photos of visible gaps",
          "Note weather effects",
          "Report to maintenance"
        ],
        difficulty: "medium",
        tools_needed: ["Paper (to detect drafts)", "Phone"],
        priority: "medium"
      }
    ]
  },
  wall_damage: {
    keywords: ['wall', 'hole', 'crack', 'dent', 'paint', 'stain', 'mold', 'damp', 'peeling', 'scratch', 'mark', 'bump'],
    fixes: [
      {
        title: "Wall Holes/Large Cracks",
        steps: [
          "Mark the damaged area",
          "Check for loose material",
          "Document size and depth",
          "Take clear photos",
          "Note if getting worse",
          "Report to maintenance"
        ],
        difficulty: "medium",
        tools_needed: ["Warning tape", "Phone for photos"],
        priority: "high"
      },
      {
        title: "Water Damage/Damp Walls",
        steps: [
          "Look for water source",
          "Document affected area",
          "Check for mold growth",
          "Take photos of damage",
          "Monitor if spreading",
          "Report urgently"
        ],
        difficulty: "hard",
        tools_needed: ["Phone for photos"],
        priority: "high"
      },
      {
        title: "Surface Damage (Paint/Marks)",
        steps: [
          "Document type of damage",
          "Measure affected area",
          "Take photos of damage",
          "Note cause if known",
          "Check if spreading",
          "Report to maintenance"
        ],
        difficulty: "easy",
        tools_needed: ["Measuring tape", "Phone"],
        priority: "low"
      }
    ]
  },
};

export function getLocalRecommendations(title: string, description: string): QuickFix[] {
  const combinedText = `${title} ${description}`.toLowerCase();
  let bestMatches: QuickFix[] = [];
  let maxScore = 0;

  Object.entries(commonIssueTypes).forEach(([category, issueType]) => {
    let score = 0;
    issueType.keywords.forEach(keyword => {
      const regex = new RegExp(keyword.toLowerCase(), 'g');
      const matches = (combinedText.match(regex) || []).length;
      if (matches > 0) {
        const titleMatches = (title.toLowerCase().match(regex) || []).length;
        const exactMatchBonus = combinedText.includes(` ${keyword} `) ? 2 : 0;
        score += matches + (titleMatches * 2) + exactMatchBonus;
      }
    });

    if (score > 0) {
      issueType.fixes.forEach(fix => {
        if (score >= maxScore && !bestMatches.some(existing => existing.title === fix.title)) {
          if (score > maxScore) {
            bestMatches = [];
            maxScore = score;
          }
          bestMatches.push(fix);
        }
      });
    }
  });

  if (bestMatches.length > 0) {
    return bestMatches.slice(0, 2).sort((a, b) => 
      priorityValue(b.priority) - priorityValue(a.priority)
    );
  }

  return [{
    title: "General Damage Assessment",
    steps: [
      "Ensure area is safe to approach",
      "Document damage clearly",
      "Take multiple photos",
      "Note when damage occurred",
      "Mark hazardous areas",
      "Report to maintenance"
    ],
    difficulty: "medium",
    tools_needed: ["Phone/Camera", "Warning signs"],
    priority: "medium"
  }];
}

function priorityValue(priority: string): number {
  switch (priority) {
    case 'high': return 3;
    case 'medium': return 2;
    case 'low': return 1;
    default: return 0;
  }
}
