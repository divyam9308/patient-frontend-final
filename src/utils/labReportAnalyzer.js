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
    name: "RBC Count",
    aliases: ["rbc count", "red blood cell count", "rbc"],
    unit: "million/uL",
    min: 4.2,
    max: 5.9,
    low: ["anemia", "blood loss", "bone marrow suppression"],
    high: ["dehydration", "polycythemia", "chronic low oxygen states"],
  },
  {
    name: "Hematocrit / PCV",
    aliases: ["hematocrit", "haematocrit", "pcv", "packed cell volume"],
    unit: "%",
    min: 36,
    max: 50,
    low: ["anemia", "blood loss"],
    high: ["dehydration", "polycythemia"],
  },
  {
    name: "MCV",
    aliases: ["mcv", "mean corpuscular volume"],
    unit: "fL",
    min: 80,
    max: 100,
    low: ["iron deficiency anemia", "thalassemia trait"],
    high: ["vitamin B12/folate deficiency", "liver disease", "thyroid disease"],
  },
  {
    name: "MCH",
    aliases: ["mch", "mean corpuscular hemoglobin", "mean corpuscular haemoglobin"],
    unit: "pg",
    min: 27,
    max: 33,
    low: ["iron deficiency anemia", "thalassemia trait"],
    high: ["macrocytic anemia", "vitamin B12/folate deficiency"],
  },
  {
    name: "MCHC",
    aliases: ["mchc", "mean corpuscular hemoglobin concentration", "mean corpuscular haemoglobin concentration"],
    unit: "g/dL",
    min: 32,
    max: 36,
    low: ["iron deficiency anemia", "hypochromic anemia"],
    high: ["spherocytosis", "sample or lab artifact"],
  },
  {
    name: "RDW",
    aliases: ["rdw", "red cell distribution width"],
    unit: "%",
    min: 11.5,
    max: 14.5,
    high: ["iron deficiency", "mixed anemia", "recent blood loss"],
  },
  {
    name: "Neutrophils",
    aliases: ["neutrophils", "neutrophil"],
    unit: "%",
    min: 40,
    max: 75,
    low: ["viral illness", "bone marrow suppression"],
    high: ["bacterial infection", "inflammation", "stress response"],
  },
  {
    name: "Lymphocytes",
    aliases: ["lymphocytes", "lymphocyte"],
    unit: "%",
    min: 20,
    max: 45,
    low: ["stress response", "immune suppression"],
    high: ["viral illness", "chronic inflammation", "blood cell disorders"],
  },
  {
    name: "Eosinophils",
    aliases: ["eosinophils", "eosinophil"],
    unit: "%",
    min: 0,
    max: 6,
    high: ["allergy", "asthma", "parasite infection", "drug reaction"],
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
    name: "VLDL Cholesterol",
    aliases: ["vldl", "vldl cholesterol"],
    unit: "mg/dL",
    min: 5,
    max: 40,
    high: ["dyslipidemia", "high triglycerides", "metabolic syndrome"],
  },
  {
    name: "Total Cholesterol / HDL Ratio",
    aliases: ["cholesterol hdl ratio", "chol/hdl ratio", "tc/hdl ratio"],
    unit: "ratio",
    min: 0,
    max: 5,
    high: ["increased cardiovascular risk", "dyslipidemia"],
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
    name: "Free T3",
    aliases: ["free t3", "ft3"],
    unit: "pg/mL",
    min: 2.3,
    max: 4.2,
    low: ["hypothyroidism", "non-thyroidal illness"],
    high: ["hyperthyroidism"],
  },
  {
    name: "Free T4",
    aliases: ["free t4", "ft4"],
    unit: "ng/dL",
    min: 0.8,
    max: 1.8,
    low: ["hypothyroidism"],
    high: ["hyperthyroidism"],
  },
  {
    name: "T3",
    aliases: ["total t3"],
    unit: "ng/dL",
    min: 80,
    max: 180,
    low: ["hypothyroidism", "non-thyroidal illness"],
    high: ["hyperthyroidism"],
  },
  {
    name: "T4",
    aliases: ["total t4", "thyroxine"],
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
    name: "Serum Iron",
    aliases: ["serum iron", "iron"],
    unit: "ug/dL",
    min: 60,
    max: 170,
    low: ["iron deficiency", "chronic inflammation"],
    high: ["iron overload", "hemolysis", "liver disease"],
  },
  {
    name: "TIBC",
    aliases: ["tibc", "total iron binding capacity"],
    unit: "ug/dL",
    min: 240,
    max: 450,
    low: ["chronic inflammation", "malnutrition", "liver disease"],
    high: ["iron deficiency"],
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
    aliases: ["urea", "blood urea"],
    unit: "mg/dL",
    min: 7,
    max: 45,
    low: ["low protein intake", "liver disease"],
    high: ["kidney dysfunction", "dehydration", "high protein breakdown"],
  },
  {
    name: "BUN",
    aliases: ["bun", "blood urea nitrogen"],
    unit: "mg/dL",
    min: 7,
    max: 20,
    low: ["low protein intake", "liver disease"],
    high: ["kidney dysfunction", "dehydration", "high protein breakdown"],
  },
  {
    name: "eGFR",
    aliases: ["egfr", "estimated glomerular filtration rate"],
    unit: "mL/min/1.73m2",
    min: 60,
    max: null,
    low: ["reduced kidney filtration", "chronic kidney disease follow-up area"],
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
    name: "Chloride",
    aliases: ["chloride", "cl-"],
    unit: "mmol/L",
    min: 98,
    max: 107,
    low: ["vomiting/diarrhea related loss", "metabolic alkalosis"],
    high: ["dehydration", "metabolic acidosis"],
  },
  {
    name: "Bicarbonate",
    aliases: ["bicarbonate", "hco3", "co2 total"],
    unit: "mmol/L",
    min: 22,
    max: 29,
    low: ["metabolic acidosis", "kidney or respiratory follow-up area"],
    high: ["metabolic alkalosis", "respiratory follow-up area"],
  },
  {
    name: "Magnesium",
    aliases: ["magnesium", "serum magnesium"],
    unit: "mg/dL",
    min: 1.7,
    max: 2.2,
    low: ["low magnesium", "arrhythmia or muscle cramp risk"],
    high: ["kidney dysfunction", "magnesium excess"],
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
    name: "Alkaline Phosphatase",
    aliases: ["alkaline phosphatase", "alp"],
    unit: "U/L",
    min: 40,
    max: 129,
    low: ["nutritional deficiency", "thyroid follow-up area"],
    high: ["bile duct obstruction", "bone turnover", "liver disease"],
  },
  {
    name: "GGT",
    aliases: ["ggt", "gamma gt", "gamma glutamyl transferase"],
    unit: "U/L",
    min: 0,
    max: 55,
    high: ["bile duct/liver inflammation", "alcohol-related liver stress", "medicine-related liver effect"],
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
    name: "Bilirubin Direct",
    aliases: ["direct bilirubin", "bilirubin direct"],
    unit: "mg/dL",
    min: 0,
    max: 0.3,
    high: ["bile duct obstruction", "hepatitis", "cholestasis"],
  },
  {
    name: "Total Protein",
    aliases: ["total protein", "protein total"],
    unit: "g/dL",
    min: 6,
    max: 8.3,
    low: ["malnutrition", "liver disease", "kidney protein loss"],
    high: ["dehydration", "chronic inflammation", "plasma cell disorder follow-up area"],
  },
  {
    name: "Albumin",
    aliases: ["albumin", "serum albumin"],
    unit: "g/dL",
    min: 3.5,
    max: 5.2,
    low: ["liver disease", "kidney protein loss", "malnutrition", "inflammation"],
    high: ["dehydration"],
  },
  {
    name: "Globulin",
    aliases: ["globulin"],
    unit: "g/dL",
    min: 2,
    max: 3.5,
    low: ["immune protein deficiency follow-up area"],
    high: ["chronic inflammation", "infection", "plasma cell disorder follow-up area"],
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
  {
    name: "Phosphorus",
    aliases: ["phosphorus", "phosphate", "serum phosphorus"],
    unit: "mg/dL",
    min: 2.5,
    max: 4.5,
    low: ["vitamin D deficiency", "malnutrition", "refeeding risk"],
    high: ["kidney dysfunction", "parathyroid disorder"],
  },
];

const STOP_WORDS = new Set(["age", "date", "page", "id", "pin", "phone"]);
const MAX_ANALYSIS_TEXT_LENGTH = 60000;
const MAX_PDF_PARSE_BYTES = 1200000;

function normalizeText(text) {
  return String(text || "")
    .replace(/\r/g, "\n")
    .replace(/[|]+/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/([a-zA-Z])(\d)/g, "$1 $2");
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function aliasPattern(alias) {
  return `(?:^|[^A-Za-z0-9])${escapeRegExp(alias)}(?=$|[^A-Za-z0-9])`;
}

function extractLines(rawText) {
  const normalized = normalizeText(rawText).slice(0, MAX_ANALYSIS_TEXT_LENGTH);
  const lines = normalized
    .split(/\n+/)
    .map(line => line.trim())
    .filter(Boolean);

  return lines.length > 1 ? lines : normalized.split(/\s{2,}|(?=[A-Z][A-Za-z /+-]{2,}\s+\d)/).map(line => line.trim()).filter(Boolean);
}

function findMarkerLines(lines, alias) {
  const pattern = new RegExp(aliasPattern(alias), "i");
  return lines.filter(line => pattern.test(line));
}

function getReferenceRangeMatches(tail) {
  const ranges = [];
  const rangePattern = /(?:reference|normal|range|ref|interval|bio\.?\s*ref\.?)?\s*:?\s*(-?\d+(?:\.\d+)?)\s*(?:-|to|\u2013|\u2014|â€“|â€”)\s*(-?\d+(?:\.\d+)?)/gi;
  let rangeMatch;

  while ((rangeMatch = rangePattern.exec(tail)) !== null) {
    ranges.push({
      min: Number(rangeMatch[1]),
      max: Number(rangeMatch[2]),
      text: `${rangeMatch[1]}-${rangeMatch[2]}`,
      start: rangeMatch.index,
      end: rangeMatch.index + rangeMatch[0].length,
    });
  }

  const upperPattern = /(?:reference|normal|range|ref|interval|bio\.?\s*ref\.?)\s*:?\s*(?:<|<=|less than|upto|up to)\s*(-?\d+(?:\.\d+)?)/gi;
  let upperMatch;

  while ((upperMatch = upperPattern.exec(tail)) !== null) {
    ranges.push({
      min: null,
      max: Number(upperMatch[1]),
      text: `< ${upperMatch[1]}`,
      start: upperMatch.index,
      end: upperMatch.index + upperMatch[0].length,
    });
  }

  const lowerPattern = /(?:reference|normal|range|ref|interval|bio\.?\s*ref\.?)\s*:?\s*(?:>|>=|more than|above)\s*(-?\d+(?:\.\d+)?)/gi;
  let lowerMatch;

  while ((lowerMatch = lowerPattern.exec(tail)) !== null) {
    ranges.push({
      min: Number(lowerMatch[1]),
      max: null,
      text: `> ${lowerMatch[1]}`,
      start: lowerMatch.index,
      end: lowerMatch.index + lowerMatch[0].length,
    });
  }

  return ranges;
}

function parseReferenceFromTail(tail) {
  const [detectedRange] = getReferenceRangeMatches(tail);
  if (detectedRange) {
    return {
      min: detectedRange.min,
      max: detectedRange.max,
      text: detectedRange.text,
    };
  }

  const rangeMatch = tail.match(/(?:reference|normal|range|ref)?\s*:?\s*(-?\d+(?:\.\d+)?)\s*(?:-|to|–|—)\s*(-?\d+(?:\.\d+)?)/i);
  if (rangeMatch) {
    return {
      min: Number(rangeMatch[1]),
      max: Number(rangeMatch[2]),
      text: `${rangeMatch[1]}-${rangeMatch[2]}`,
    };
  }

  const upperMatch = tail.match(/(?:reference|normal|range|ref)\s*:?\s*(?:<|<=|less than|upto|up to)\s*(-?\d+(?:\.\d+)?)/i);
  if (upperMatch) {
    return {
      min: null,
      max: Number(upperMatch[1]),
      text: `< ${upperMatch[1]}`,
    };
  }

  const lowerMatch = tail.match(/(?:reference|normal|range|ref)\s*:?\s*(?:>|>=|more than|above)\s*(-?\d+(?:\.\d+)?)/i);
  if (lowerMatch) {
    return {
      min: Number(lowerMatch[1]),
      max: null,
      text: `> ${lowerMatch[1]}`,
    };
  }

  return null;
}

function isInsideRanges(index, ranges) {
  return ranges.some(range => index >= range.start && index < range.end);
}

function isDescriptorNumber(tail, numberMatch) {
  const start = numberMatch.index || 0;
  const after = tail.slice(start + numberMatch[0].length, start + numberMatch[0].length + 10).toLowerCase();
  return after.startsWith("-oh") || after.startsWith(" hydroxy");
}

function pickResultFromTail(tail, ranges) {
  const preferredPattern = /(?:result|observed|value|reading|level)\s*[:=-]?\s*([<>]?)\s*(-?\d+(?:\.\d+)?)/i;
  const preferred = tail.match(preferredPattern);

  if (preferred && !isInsideRanges(preferred.index || 0, ranges)) {
    return {
      prefix: preferred[1] || "",
      value: Number(preferred[2]),
    };
  }

  const numberPattern = /([<>]?)\s*(-?\d+(?:\.\d+)?)/g;
  const numbers = [...tail.matchAll(numberPattern)]
    .filter(match => !isInsideRanges(match.index || 0, ranges))
    .filter(match => !isDescriptorNumber(tail, match));

  if (!numbers.length) return null;

  return {
    prefix: numbers[0][1] || "",
    value: Number(numbers[0][2]),
  };
}

function extractNumberAfterAlias(line, alias) {
  if (STOP_WORDS.has(alias.toLowerCase())) return null;

  const pattern = new RegExp(aliasPattern(alias), "i");
  const match = line.match(pattern);
  if (!match) return null;

  const tail = line.slice((match.index || 0) + match[0].length);
  const ranges = getReferenceRangeMatches(tail);
  const reportRange = parseReferenceFromTail(tail);
  const result = pickResultFromTail(tail, ranges);
  if (!result) return null;

  return {
    prefix: result.prefix,
    value: result.value,
    raw: line.trim(),
    reportRange,
  };
}

function inferStatus(value, marker, reportRange) {
  const min = typeof reportRange?.min === "number" ? reportRange.min : marker.min;
  const max = typeof reportRange?.max === "number" ? reportRange.max : marker.max;
  if (typeof min === "number" && value < min) return "Low";
  if (typeof max === "number" && value > max) return "High";
  return "Normal";
}

function buildRange(marker, reportRange) {
  if (reportRange?.text) {
    return `${reportRange.text} ${marker.unit}`.trim();
  }
  if (typeof marker.min === "number" && typeof marker.max === "number") {
    return `${marker.min}-${marker.max} ${marker.unit}`;
  }
  if (typeof marker.max === "number") return `< ${marker.max} ${marker.unit}`;
  if (typeof marker.min === "number") return `> ${marker.min} ${marker.unit}`;
  return "Reference varies";
}

export function analyzeLabReport(rawText) {
  const lines = extractLines(rawText);
  const vitals = [];
  const seen = new Set();

  for (const marker of LAB_MARKERS) {
    for (const alias of marker.aliases) {
      const markerLines = findMarkerLines(lines, alias);
      if (markerLines.length === 0 || seen.has(marker.name)) continue;

      const found = markerLines
        .map(line => extractNumberAfterAlias(line, alias))
        .find(result => result && !Number.isNaN(result.value));
      if (!found) continue;

      const status = inferStatus(found.value, marker, found.reportRange);
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
        range: buildRange(marker, found.reportRange),
        status,
        explanation: status === "Normal"
          ? `${marker.name} is within the reference range used for this analysis.`
          : `${marker.name} is ${status.toLowerCase()} compared with the reference range used for this analysis.`,
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
      conclusion: "No readable lab values were found. Add the key result values manually if this is a scanned report.",
      abnormalCount: 0,
      normalCount: 0,
      abnormalResults: [],
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
      abnormalResults: [],
      possibleConditions: [],
      recommendations: ["Add the missing result values manually if the report layout prevented extraction."],
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
    abnormalResults: abnormal.map(vital => ({
      name: vital.name,
      value: vital.value,
      range: vital.range,
      status: vital.status,
      possibleConditions: vital.possibleConditions || [],
    })),
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
