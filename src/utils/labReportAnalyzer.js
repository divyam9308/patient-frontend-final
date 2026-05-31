const LAB_MARKERS = [
  {
    name: "Hemoglobin",
    aliases: ["hemoglobin", "haemoglobin", "hb"],
    unit: "g/dL",
    min: 12,
    max: 16,
    low: ["anemia", "iron deficiency", "vitamin B12/folate deficiency", "chronic blood loss"],
    high: ["dehydration", "polycythemia", "chronic low oxygen states"],
  },
  {
    name: "WBC Count",
    aliases: ["wbc", "white blood cell", "total leukocyte count", "tlc"],
    unit: "cells/uL",
    min: 4000,
    max: 11000,
    low: ["viral illness", "bone marrow suppression", "autoimmune conditions"],
    high: ["infection", "inflammation", "stress response", "blood cell disorders"],
  },
  {
    name: "Platelet Count",
    aliases: ["platelet", "plt"],
    unit: "lakhs/uL",
    min: 1.5,
    max: 4.5,
    low: ["viral illness", "dengue or other platelet-lowering infections", "bleeding risk"],
    high: ["inflammation", "iron deficiency", "myeloproliferative disorders"],
  },
  {
    name: "ESR",
    aliases: ["esr", "erythrocyte sedimentation rate"],
    unit: "mm/hr",
    min: 0,
    max: 20,
    high: ["inflammation", "infection", "autoimmune disease"],
  },
  {
    name: "CRP",
    aliases: ["crp", "c reactive protein", "c-reactive protein"],
    unit: "mg/L",
    min: 0,
    max: 5,
    high: ["acute inflammation", "infection", "autoimmune flare"],
  },
  {
    name: "Fasting Glucose",
    aliases: ["fasting glucose", "fasting blood sugar", "fbs"],
    unit: "mg/dL",
    min: 70,
    max: 99,
    low: ["hypoglycemia"],
    high: ["prediabetes", "diabetes mellitus", "stress hyperglycemia"],
  },
  {
    name: "Random Glucose",
    aliases: ["random glucose", "random blood sugar", "rbs"],
    unit: "mg/dL",
    min: 70,
    max: 140,
    low: ["hypoglycemia"],
    high: ["diabetes mellitus", "stress hyperglycemia"],
  },
  {
    name: "HbA1c",
    aliases: ["hba1c", "glycated hemoglobin", "glycosylated hemoglobin"],
    unit: "%",
    min: 4,
    max: 5.6,
    high: ["prediabetes", "diabetes mellitus", "poor average glucose control"],
  },
  {
    name: "Total Cholesterol",
    aliases: ["total cholesterol", "cholesterol total"],
    unit: "mg/dL",
    min: 0,
    max: 200,
    high: ["dyslipidemia", "increased cardiovascular risk"],
  },
  {
    name: "LDL Cholesterol",
    aliases: ["ldl", "ldl cholesterol"],
    unit: "mg/dL",
    min: 0,
    max: 100,
    high: ["dyslipidemia", "increased cardiovascular risk"],
  },
  {
    name: "HDL Cholesterol",
    aliases: ["hdl", "hdl cholesterol"],
    unit: "mg/dL",
    min: 40,
    max: 90,
    low: ["increased cardiovascular risk", "metabolic syndrome"],
  },
  {
    name: "Triglycerides",
    aliases: ["triglycerides", "tg"],
    unit: "mg/dL",
    min: 0,
    max: 150,
    high: ["dyslipidemia", "metabolic syndrome", "pancreatitis risk when very high"],
  },
  {
    name: "TSH",
    aliases: ["tsh", "thyroid stimulating hormone"],
    unit: "mIU/L",
    min: 0.4,
    max: 4.5,
    low: ["hyperthyroidism", "over-replacement of thyroid medicine"],
    high: ["hypothyroidism", "thyroiditis"],
  },
  {
    name: "T3",
    aliases: ["total t3", "t3"],
    unit: "ng/dL",
    min: 80,
    max: 180,
    low: ["hypothyroidism", "non-thyroidal illness"],
    high: ["hyperthyroidism"],
  },
  {
    name: "T4",
    aliases: ["total t4", "thyroxine", "t4"],
    unit: "ug/dL",
    min: 5,
    max: 12,
    low: ["hypothyroidism"],
    high: ["hyperthyroidism"],
  },
  {
    name: "Vitamin D",
    aliases: ["vitamin d", "25-oh vitamin d", "25 hydroxy vitamin d"],
    unit: "ng/mL",
    min: 30,
    max: 100,
    low: ["vitamin D deficiency", "bone pain/weakness risk", "osteomalacia risk"],
    high: ["vitamin D excess", "hypercalcemia risk"],
  },
  {
    name: "Vitamin B12",
    aliases: ["vitamin b12", "b12"],
    unit: "pg/mL",
    min: 200,
    max: 900,
    low: ["B12 deficiency", "megaloblastic anemia", "neuropathy risk"],
  },
  {
    name: "Ferritin",
    aliases: ["ferritin", "serum ferritin"],
    unit: "ng/mL",
    min: 20,
    max: 250,
    low: ["iron deficiency"],
    high: ["inflammation", "iron overload", "liver disease"],
  },
  {
    name: "Creatinine",
    aliases: ["creatinine", "serum creatinine"],
    unit: "mg/dL",
    min: 0.6,
    max: 1.3,
    low: ["low muscle mass"],
    high: ["kidney dysfunction", "dehydration", "urinary obstruction"],
  },
  {
    name: "Urea",
    aliases: ["urea", "blood urea", "bun"],
    unit: "mg/dL",
    min: 7,
    max: 45,
    low: ["low protein intake", "liver disease"],
    high: ["kidney dysfunction", "dehydration", "high protein breakdown"],
  },
  {
    name: "Uric Acid",
    aliases: ["uric acid", "serum uric acid"],
    unit: "mg/dL",
    min: 3.5,
    max: 7.2,
    high: ["gout risk", "kidney stone risk", "metabolic syndrome"],
  },
  {
    name: "Sodium",
    aliases: ["sodium", "na+"],
    unit: "mmol/L",
    min: 135,
    max: 145,
    low: ["hyponatremia", "fluid imbalance"],
    high: ["dehydration", "hypernatremia"],
  },
  {
    name: "Potassium",
    aliases: ["potassium", "k+"],
    unit: "mmol/L",
    min: 3.5,
    max: 5.1,
    low: ["hypokalemia", "arrhythmia risk", "vomiting/diarrhea related loss"],
    high: ["hyperkalemia", "kidney dysfunction", "arrhythmia risk"],
  },
  {
    name: "ALT / SGPT",
    aliases: ["alt", "sgpt"],
    unit: "U/L",
    min: 0,
    max: 45,
    high: ["liver inflammation", "fatty liver", "viral hepatitis", "medicine-related liver injury"],
  },
  {
    name: "AST / SGOT",
    aliases: ["ast", "sgot"],
    unit: "U/L",
    min: 0,
    max: 40,
    high: ["liver inflammation", "muscle injury", "alcohol-related liver injury"],
  },
  {
    name: "Bilirubin Total",
    aliases: ["total bilirubin", "bilirubin total", "bilirubin"],
    unit: "mg/dL",
    min: 0.1,
    max: 1.2,
    high: ["jaundice", "liver disease", "bile duct obstruction", "hemolysis"],
  },
  {
    name: "Calcium",
    aliases: ["calcium", "serum calcium"],
    unit: "mg/dL",
    min: 8.5,
    max: 10.5,
    low: ["vitamin D deficiency", "parathyroid disorder"],
    high: ["hyperparathyroidism", "vitamin D excess", "malignancy-related calcium elevation"],
  },
];

const STOP_WORDS = new Set(["age", "date", "page", "id", "pin", "phone"]);
const MAX_ANALYSIS_TEXT_LENGTH = 60000;
const MAX_PDF_PARSE_BYTES = 1200000;

function normalizeText(text) {
  return String(text || "")
    .replace(/\r/g, "\n")
    .replace(/[|]+/g, " ")
    .replace(/\s+/g, " ")
    .replace(/([a-zA-Z])(\d)/g, "$1 $2");
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function extractNumberAfterAlias(text, alias) {
  const escapedAlias = escapeRegExp(alias);
  const pattern = new RegExp(`\\b${escapedAlias}\\b[^\\d<>-]{0,45}([<>]?)\\s*(-?\\d+(?:\\.\\d+)?)`, "i");
  const match = text.match(pattern);
  if (!match) return null;
  if (STOP_WORDS.has(alias.toLowerCase())) return null;
  return {
    prefix: match[1] || "",
    value: Number(match[2]),
    raw: match[0].trim(),
  };
}

function inferStatus(value, marker) {
  if (typeof marker.min === "number" && value < marker.min) return "Low";
  if (typeof marker.max === "number" && value > marker.max) return "High";
  return "Normal";
}

function buildRange(marker) {
  if (typeof marker.min === "number" && typeof marker.max === "number") {
    return `${marker.min}-${marker.max} ${marker.unit}`;
  }
  if (typeof marker.max === "number") return `< ${marker.max} ${marker.unit}`;
  if (typeof marker.min === "number") return `> ${marker.min} ${marker.unit}`;
  return "Reference varies";
}

export function analyzeLabReport(rawText) {
  const normalized = normalizeText(rawText).slice(0, MAX_ANALYSIS_TEXT_LENGTH);
  const vitals = [];
  const seen = new Set();

  for (const marker of LAB_MARKERS) {
    for (const alias of marker.aliases) {
      const found = extractNumberAfterAlias(normalized, alias);
      if (!found || Number.isNaN(found.value) || seen.has(marker.name)) continue;

      const status = inferStatus(found.value, marker);
      const conditionHints = status === "Low"
        ? marker.low || []
        : status === "High"
          ? marker.high || []
          : [];

      vitals.push({
        name: marker.name,
        value: `${found.prefix}${found.value} ${marker.unit}`.trim(),
        numericValue: found.value,
        unit: marker.unit,
        range: buildRange(marker),
        status,
        explanation: status === "Normal"
          ? `${marker.name} is within the usual adult reference range.`
          : `${marker.name} is ${status.toLowerCase()} compared with the usual adult reference range.`,
        possibleConditions: conditionHints,
        sourceSnippet: found.raw,
      });
      seen.add(marker.name);
      break;
    }
  }

  return {
    extractedText: rawText || "",
    vitals,
    analysis: buildAnalysis(vitals, rawText),
  };
}

export function buildAnalysis(vitals, rawText) {
  const abnormal = vitals.filter(vital => vital.status !== "Normal");
  const normal = vitals.filter(vital => vital.status === "Normal");
  const possibleConditions = [...new Set(abnormal.flatMap(vital => vital.possibleConditions || []))];

  if (!String(rawText || "").trim()) {
    return {
      headline: "No readable report text found",
      conclusion: "Upload text-based reports when possible, or paste the report text into the extracted text box before analysis.",
      abnormalCount: 0,
      normalCount: 0,
      possibleConditions: [],
      recommendations: ["Ask the lab or hospital for a text-searchable PDF if the report is a scanned image."],
      disclaimer: "This AI-assisted summary is not a diagnosis. Confirm results with a qualified clinician.",
    };
  }

  if (!vitals.length) {
    return {
      headline: "No known lab markers detected",
      conclusion: "The report text was read, but no supported lab values were confidently extracted.",
      abnormalCount: 0,
      normalCount: 0,
      possibleConditions: [],
      recommendations: ["Paste the result table text manually if the report layout prevented extraction."],
      disclaimer: "This AI-assisted summary is not a diagnosis. Confirm results with a qualified clinician.",
    };
  }

  const abnormalText = abnormal
    .slice(0, 5)
    .map(vital => `${vital.name} is ${vital.status.toLowerCase()} (${vital.value}; reference ${vital.range})`)
    .join("; ");

  return {
    headline: abnormal.length
      ? `${abnormal.length} result${abnormal.length === 1 ? "" : "s"} need attention`
      : "Detected values are within usual ranges",
    conclusion: abnormal.length
      ? `${abnormalText}. These findings may need clinical correlation with symptoms, medicines, age, and medical history.`
      : `I detected ${normal.length} lab value${normal.length === 1 ? "" : "s"}, and all were within the usual adult reference ranges available to this analyzer.`,
    abnormalCount: abnormal.length,
    normalCount: normal.length,
    possibleConditions,
    recommendations: abnormal.length
      ? [
        "Review abnormal values with a doctor instead of self-diagnosing.",
        "Compare with previous reports to see whether values are improving or worsening.",
        "Seek urgent care for severe symptoms, very high potassium, severe anemia, chest pain, breathing difficulty, or confusion.",
      ]
      : ["Keep this report for trend comparison with future tests."],
    disclaimer: "This AI-assisted summary is not a diagnosis. It highlights patterns and possible follow-up areas only.",
  };
}

export async function extractTextFromFile(file) {
  if (!file) return "";

  const extension = file.name.split(".").pop()?.toLowerCase();
  const isTextLike = file.type.startsWith("text/")
    || ["txt", "csv", "tsv", "json", "xml"].includes(extension);

  if (isTextLike) return file.text();

  if (["png", "jpg", "jpeg", "webp", "heic"].includes(extension) || file.type.startsWith("image/")) {
    return "";
  }

  if (file.type === "application/pdf" || extension === "pdf") {
    const buffer = await file.slice(0, MAX_PDF_PARSE_BYTES).arrayBuffer();
    const bytes = new Uint8Array(buffer);
    const binary = new TextDecoder("latin1").decode(bytes);

    const candidates = [];
    const textMatches = binary.match(/\(([^()]{2,})\)\s*Tj/g) || [];
    textMatches.forEach(match => {
      candidates.push(match.replace(/^\(/, "").replace(/\)\s*Tj$/, ""));
    });

    const arrayMatches = binary.match(/\[(.*?)\]\s*TJ/gs) || [];
    arrayMatches.forEach(match => {
      const pieces = [...match.matchAll(/\(([^()]*)\)/g)].map(piece => piece[1]);
      if (pieces.length) candidates.push(pieces.join(""));
    });

    const fallback = binary
      .split("")
      .map((character) => {
        const code = character.charCodeAt(0);
        return code === 9 || code === 10 || code === 13 || (code >= 32 && code <= 126)
          ? character
          : " ";
      })
      .join("")
      .replace(/\s+/g, " ");

    return (candidates.join("\n") || fallback)
      .replace(/\\n/g, "\n")
      .replace(/\\r/g, "\n")
      .replace(/\\t/g, " ")
      .replace(/\\\\/g, "\\")
      .trim();
  }

  return "";
}
