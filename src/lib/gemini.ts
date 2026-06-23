import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini SDK safely
const apiKey = process.env.GEMINI_API_KEY || "";
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;
const MODEL_NAME = process.env.NEXT_PUBLIC_GEMINI_MODEL || "gemini-3.5-flash";

// Utility to parse JSON safely from LLM output
function parseJsonFromText(text: string): any {
  try {
    // Strip markdown code block wrappers if present
    let cleanText = text.trim();
    if (cleanText.startsWith("```json")) {
      cleanText = cleanText.substring(7);
    } else if (cleanText.startsWith("```")) {
      cleanText = cleanText.substring(3);
    }
    if (cleanText.endsWith("```")) {
      cleanText = cleanText.substring(0, cleanText.length - 3);
    }
    return JSON.parse(cleanText.trim());
  } catch (e) {
    console.error("JSON parsing error on response text:", text, e);
    throw new Error("Failed to parse AI response into structured data.");
  }
}

/**
 * Helper to convert a File/Buffer to the format Gemini expects for inlineData
 */
function fileToGenerativePart(buffer: Buffer, mimeType: string) {
  return {
    inlineData: {
      data: buffer.toString("base64"),
      mimeType,
    },
  };
}

export interface AnalysisResult {
  category: string;
  confidence: number;
  severity: string;
  reasoning: string;
}

/**
 * AGENT 1 & 2: Combined Issue Classification and Severity Analysis (Vision)
 */
export async function analyzeIssue(
  imageBuffer: Buffer,
  mimeType: string,
  description: string
): Promise<AnalysisResult> {
  if (!genAI) {
    console.warn("Gemini API Key missing. Returning fallback mock analysis.");
    return getFallbackAnalysis(description);
  }

  try {
    const model = genAI.getGenerativeModel({
      model: MODEL_NAME,
      generationConfig: {
        responseMimeType: "application/json",
      },
    });

    const imagePart = fileToGenerativePart(imageBuffer, mimeType);
    
    const prompt = `You are the CivicPulse AI Hyperlocal Issue Analyzer.
Analyze the uploaded image of a local infrastructure issue along with the citizen's description.

Citizen's Description: "${description || "No description provided."}"

You must categorize the issue into one of the following exact categories:
- Pothole
- Garbage
- Water Leakage
- Streetlight Damage
- Sewage Overflow
- Fallen Tree
- Road Damage
- Other

Determine the severity of the issue. Use one of these exact values:
- Low (No immediate danger, minor inconvenience)
- Medium (Moderate hazard or annoyance, needs attention soon)
- High (Significant safety hazard or major service disruption)
- Critical (Immediate danger to lives, safety, or properties, requires emergency action)

Provide a detailed reasoning explaining both the classification (what visual indicators match the category) and the severity (what hazards exist, safety risks, or public impact).

Return a JSON object matching this schema:
{
  "category": "Pothole | Garbage | Water Leakage | Streetlight Damage | Sewage Overflow | Fallen Tree | Road Damage | Other",
  "confidence": 0.95, // confidence score between 0.0 and 1.0 based on visual clarity
  "severity": "Low | Medium | High | Critical",
  "reasoning": "Detailed visual analysis and risk assessment reasoning"
}
`;

    const result = await model.generateContent([prompt, imagePart]);
    const responseText = result.response.text();
    return parseJsonFromText(responseText) as AnalysisResult;
  } catch (error) {
    console.error("Error running Gemini Vision Analysis:", error);
    return getFallbackAnalysis(description);
  }
}

export interface CombinedAnalysisResult {
  category: string;
  confidence: number;
  severity: string;
  reasoning: string;
  complaint: string;
  riskScore: number;
  urgencyWindow: string;
  visualAudits: string[];
  impactedParties: string[];
}

/**
 * AGENTS 1, 2, and 3 Consolidated: Combined Vision Triage & Complaint Drafting
 */
export async function analyzeAndDraftComplaint(
  imageBuffer: Buffer,
  mimeType: string,
  description: string,
  address: string,
  latitude: number,
  longitude: number
): Promise<CombinedAnalysisResult> {
  if (!genAI) {
    console.warn("Gemini API Key missing. Returning fallback mock analysis.");
    const fallback = getFallbackAnalysis(description);
    return {
      ...fallback,
      complaint: `MUNICIPAL COMPLAINT FORM\n\nSubject: Urgent Attention Required: ${fallback.category} at ${address}\n\nTo Whom It May Concern,\n\nI am writing to officially report a ${fallback.severity} severity issue classified as "${fallback.category}" located at:\nAddress: ${address}\nCoordinates: (${latitude}, ${longitude})\n\nDescription:\n${description}\n\nPlease take prompt action to resolve this matter.\n\nSincerely,\nLocal Citizen (via CivicPulse AI)`,
    };
  }

  try {
    const model = genAI.getGenerativeModel({
      model: MODEL_NAME,
      generationConfig: {
        responseMimeType: "application/json",
      },
    });

    const imagePart = fileToGenerativePart(imageBuffer, mimeType);

    const prompt = `You are the CivicPulse AI Hyperlocal Assistant.
Analyze the uploaded image of a local infrastructure issue along with the citizen's description.

Citizen's Description: "${description || "No description provided."}"
Location Address: "${address}"
Coordinates: Latitude ${latitude}, Longitude ${longitude}

You must perform a detailed, multi-agent triage audit:
1. Categorize the issue into one of these exact categories: Pothole, Garbage, Water Leakage, Streetlight Damage, Sewage Overflow, Fallen Tree, Road Damage, Other. Evaluate the visual evidence deeply.
2. Determine the severity: Low, Medium, High, Critical.
3. Calculate a precise Risk Score between 0 and 100 based on physical danger, public impact, and structural instability (0 = none, 100 = life-threatening).
4. Establish an Urgency Window (e.g., "Within 24 Hours", "Within 72 Hours", "Within 7 Days", "Scheduled Maintenance").
5. List 2-4 specific visual clues/audits seen in the image (e.g. "Deep tire damage hazard", "Flowing raw wastewater", "Pedestrian obstruction", "Exposed wires").
6. List who is impacted (e.g. "Motorists", "Pedestrians", "Children", "Elderly", "Local Businesses").
7. Provide a detailed, deep visual reasoning paragraph explaining the category selection and the calculated risk.
8. Write a formal, professional, municipality-ready complaint letter to the Public Works department.

Return a JSON object matching this schema:
{
  "category": "Pothole | Garbage | Water Leakage | Streetlight Damage | Sewage Overflow | Fallen Tree | Road Damage | Other",
  "confidence": 0.95, // confidence score between 0.0 and 1.0
  "severity": "Low | Medium | High | Critical",
  "riskScore": 85, // integer 0-100
  "urgencyWindow": "Within 24 Hours | Within 72 Hours | Within 7 Days | Scheduled Maintenance",
  "visualAudits": ["clue 1", "clue 2"],
  "impactedParties": ["group 1", "group 2"],
  "reasoning": "Detailed visual analysis and risk assessment reasoning",
  "complaint": "Full text of the complaint letter. Keep it highly concise, formal, and direct, maximum 120 words."
}
`;

    const result = await model.generateContent([prompt, imagePart]);
    const responseText = result.response.text();
    return parseJsonFromText(responseText) as CombinedAnalysisResult;
  } catch (error) {
    console.error("Error running consolidated Gemini Vision Analysis:", error);
    const fallback = getFallbackAnalysis(description);
    return {
      ...fallback,
      complaint: `To: Municipal Works Department\nSubject: Formal Complaint - ${fallback.category} (Severity: ${fallback.severity})\n\nLocation: ${address} (${latitude}, ${longitude})\n\nDetails:\n${description}\n\nPlease address this issue immediately to ensure public safety.\n\nRegards,\nConcured Resident`,
    };
  }
}

/**
 * AGENT 3: Complaint Generator Agent (Legacy backup - kept for compatibility)
 */
export async function generateComplaint(
  category: string,
  severity: string,
  description: string,
  address: string,
  latitude: number,
  longitude: number
): Promise<{ complaint: string }> {
  if (!genAI) {
    return {
      complaint: `MUNICIPAL COMPLAINT FORM\n\nSubject: Urgent Attention Required: ${category} at ${address}\n\nTo Whom It May Concern,\n\nI am writing to officially report a ${severity} severity issue classified as "${category}" located at:\nAddress: ${address}\nCoordinates: (${latitude}, ${longitude})\n\nDescription:\n${description}\n\nPlease take prompt action to resolve this matter.\n\nSincerely,\nLocal Citizen (via CivicPulse AI)`,
    };
  }

  try {
    const model = genAI.getGenerativeModel({
      model: MODEL_NAME,
      generationConfig: {
        responseMimeType: "application/json",
      },
    });

    const prompt = `You are a professional Civic Complaint Writer.
Write a formal, municipality-ready complaint letter based on the following details:

Issue Category: ${category}
Severity Level: ${severity}
Citizen's Description: ${description || "No description provided."}
Location/Address: ${address}
Coordinates: Latitude ${latitude}, Longitude ${longitude}

The language must be professional, formal, respectful, and appropriately urgent.

Return a JSON object matching this schema:
{
  "complaint": "Full text of the complaint letter, formatted with appropriate newlines."
}
`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    return parseJsonFromText(responseText);
  } catch (error) {
    console.error("Error generating complaint draft:", error);
    return {
      complaint: `To: Municipal Works Department\nSubject: Formal Complaint - ${category} (Severity: ${severity})\n\nLocation: ${address} (${latitude}, ${longitude})\n\nDetails:\n${description}\n\nPlease address this issue immediately to ensure public safety.`,
    };
  }
}

export interface InsightResult {
  summary: string;
  hotspots: string[];
  recommendations: string[];
}

/**
 * AGENT 4: Insight Agent
 */
export async function generateInsights(summaryData: {
  totalReports: number;
  categoryCounts: Record<string, number>;
  severityCounts: Record<string, number>;
  recentReports: Array<{
    category: string;
    severity: string;
    description: string;
    address: string;
  }>;
}): Promise<InsightResult> {
  if (!genAI) {
    return {
      summary: "Dynamic community report analysis is currently running in mock mode. Main categories are garbage accumulation and road potholes.",
      hotspots: ["Area near local main roads (Potholes)", "Commercial sector side alleys (Garbage)"],
      recommendations: [
        "Initiate a targeted road repair drive for high-traffic corridors.",
        "Increase garbage collection frequency in the commercial sectors.",
        "Replace broken sodium streetlights with LED counterparts."
      ],
    };
  }

  try {
    const model = genAI.getGenerativeModel({
      model: MODEL_NAME,
      generationConfig: {
        responseMimeType: "application/json",
      },
    });

    const prompt = `You are the CivicPulse AI Policy and Urban Insight Analyst.
Analyze the following summary of hyperlocal issue reports submitted by citizens:

Total Reports: ${summaryData.totalReports}
Category Counts: ${JSON.stringify(summaryData.categoryCounts)}
Severity Counts: ${JSON.stringify(summaryData.severityCounts)}
Recent Reports Samples: ${JSON.stringify(summaryData.recentReports)}

Generate a high-level summary of the current state of local infrastructure. Detail:
1. The most prevalent/common issue categories and their trend context.
2. The severity distribution and public risk zones.
3. 3-4 highly actionable recommendations for the municipal council (e.g. resource deployment, preventative measures).

Return a JSON object matching this schema:
{
  "summary": "High-level summary paragraph of the civic status.",
  "hotspots": ["Hotspot/Trend Description 1", "Hotspot/Trend Description 2"],
  "recommendations": ["Recommendation 1", "Recommendation 2", "Recommendation 3"]
}
`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    return parseJsonFromText(responseText) as InsightResult;
  } catch (error) {
    console.error("Error generating insights:", error);
    return {
      summary: "Error gathering insights. Potholes and garbage remain dominant community issues.",
      hotspots: ["Unmapped sectors"],
      recommendations: ["Ensure regular infrastructure audits."],
    };
  }
}

/**
 * Fallback analyzer logic for mock mode
 */
function getFallbackAnalysis(description: string): Omit<CombinedAnalysisResult, "complaint"> {
  const descLower = description.toLowerCase();
  
  let category = "Other";
  let severity = "Medium";
  let reasoning = "The system analyzed the report. Based on descriptions of local conditions, this is classified as a standard community issue.";
  let riskScore = 45;
  let urgencyWindow = "Within 7 Days";
  let visualAudits = ["Unidentified obstruction"];
  let impactedParties = ["General Public"];

  if (descLower.includes("pothole") || descLower.includes("road") || descLower.includes("hole") || descLower.includes("cavity")) {
    category = "Pothole";
    severity = "High";
    riskScore = 78;
    urgencyWindow = "Within 72 Hours";
    visualAudits = ["Asphalt pavement cavity", "Sudden deceleration hazard"];
    impactedParties = ["Motorists", "Cyclists"];
    reasoning = "Visual inspection and description point to a cavity in the asphalt pavement. This causes sudden vehicle braking and potential tire damage, presenting a high risk on active roadways.";
  } else if (descLower.includes("garbage") || descLower.includes("trash") || descLower.includes("dump") || descLower.includes("waste")) {
    category = "Garbage";
    severity = "Medium";
    riskScore = 48;
    urgencyWindow = "Within 7 Days";
    visualAudits = ["Public pathway obstruction", "Sanitation hazard"];
    impactedParties = ["Pedestrians", "Local Businesses"];
    reasoning = "Accumulation of refuse on public sidewalks or roads. Poses sanitation risks, foul odor, and attracts pests, though it does not present immediate physical danger to motorists.";
  } else if (descLower.includes("water") || descLower.includes("leak") || descLower.includes("pipe") || descLower.includes("burst")) {
    category = "Water Leakage";
    severity = "Medium";
    riskScore = 52;
    urgencyWindow = "Within 72 Hours";
    visualAudits = ["Clean water wastage pooling", "Pavement erosion hazard"];
    impactedParties = ["Pedestrians", "Motorists"];
    reasoning = "Liquid pooling indicating pipe damage. Causes clean water wastage and sidewalk erosion, requiring dispatch of plumbing crews.";
  } else if (descLower.includes("light") || descLower.includes("streetlight") || descLower.includes("dark") || descLower.includes("bulb")) {
    category = "Streetlight Damage";
    severity = "Medium";
    riskScore = 40;
    urgencyWindow = "Scheduled Maintenance";
    visualAudits = ["Non-functional light fixture", "Low visibility corridor"];
    impactedParties = ["Pedestrians", "Residents"];
    reasoning = "Non-functional overhead light fixture. Reduces nighttime visibility, increasing pedestrian hazard and safety risks in residential areas.";
  } else if (descLower.includes("sewage") || descLower.includes("drain") || descLower.includes("overflow") || descLower.includes("gutter")) {
    category = "Sewage Overflow";
    severity = "Critical";
    riskScore = 95;
    urgencyWindow = "Within 24 Hours";
    visualAudits = ["Wastewater discharge on roads", "Biological odor hazard"];
    impactedParties = ["Pedestrians", "Nearby Households", "Children"];
    reasoning = "Wastewater leaking onto roads or pathways. Presents severe biohazard risks and immediate health concerns for residents, requiring emergency wastewater remediation.";
  } else if (descLower.includes("tree") || descLower.includes("branch") || descLower.includes("fall")) {
    category = "Fallen Tree";
    severity = "High";
    riskScore = 82;
    urgencyWindow = "Within 24 Hours";
    visualAudits = ["Physical pathway blockage", "Potential electrical line tangling"];
    impactedParties = ["Motorists", "Pedestrians", "Emergency Vehicles"];
    reasoning = "Vegetation blocking public rights of way. Obstructs vehicle passages and could be tangling power lines, demanding immediate utility crew dispatch.";
  }

  return {
    category,
    confidence: 0.91,
    severity,
    reasoning,
    riskScore,
    urgencyWindow,
    visualAudits,
    impactedParties,
  };
}
