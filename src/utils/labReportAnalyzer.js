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
    aliases: ["hba1c", "hba 1c", "glycated hemoglobin", "glycosylated hemoglobin"],
    unit: "%",
    min: 4,
    max: 5.6,
    high: ["prediabetes", "diabetes mellitus", "poor average glucose control"],
  },
  {
    name: "Estimated Average Glucose",
    aliases: ["estimated average glucose", "eag", "average glucose"],
    unit: "mg/dL",
    min: 70,
    max: 126,
    low: ["hypoglycemia"],
    high: ["poor blood sugar control", "prediabetes", "diabetes mellitus"],
  },
  {
    name: "Urine Glucose",
    aliases: ["urine glucose", "urine sugar", "u-glucose", "urine-glucose"],
    unit: "",
    isQualitative: true,
    positiveTerms: ["present", "\\+", "positive", "reactive"],
    negativeTerms: ["nil", "absent", "negative", "non-reactive", "normal"],
    low: [],
    high: ["diabetes mellitus", "poor blood sugar control"],
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
    name: "Homocysteine",
    aliases: ["homocysteine"],
    unit: "umol/L",
    min: 0,
    max: 15,
    high: ["vitamin B12/folate deficiency", "increased cardiovascular risk"],
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
  {
    name: "MPV",
    aliases: ["mpv", "mean platelet volume"],
    unit: "fL",
    min: 9,
    max: 13,
    low: ["thrombocytopenia", "bone marrow underactivity"],
    high: ["platelet destruction", "inflammation", "myeloproliferative disorders"],
  },
  {
    name: "IgE",
    aliases: ["ige", "immunoglobulin e", "total ige"],
    unit: "IU/mL",
    min: 0,
    max: 100,
    high: ["allergies", "asthma", "parasitic infections", "allergic rhinitis"],
  },
  {
    name: "PSA",
    aliases: ["psa", "prostate specific antigen", "total psa"],
    unit: "ng/mL",
    min: 0,
    max: 4,
    high: ["benign prostatic hyperplasia (bph)", "prostatitis", "prostate cancer risk"],
  },
  {
    name: "HIV Screening",
    aliases: ["\\bhiv\\b", "hiv 1 & 2", "hiv 1/2", "hiv antibody", "hiv screening", "hiv test"],
    unit: "",
    isQualitative: true,
    positiveTerms: ["present", "\\+", "positive", "reactive", "detected"],
    negativeTerms: ["nil", "absent", "negative", "non-reactive", "not detected", "normal"],
    low: [],
    high: ["hiv infection risk"],
  },
  {
    name: "HBsAg (Hepatitis B)",
    aliases: ["hbsag", "hepatitis b surface antigen", "hep b surface antigen"],
    unit: "",
    isQualitative: true,
    positiveTerms: ["present", "\\+", "positive", "reactive", "detected"],
    negativeTerms: ["nil", "absent", "negative", "non-reactive", "not detected", "normal"],
    low: [],
    high: ["hepatitis B infection"],
  }
];

const STOP_WORDS = new Set(["age", "date", "page", "id", "pin", "phone"]);
const MAX_ANALYSIS_TEXT_LENGTH = 200000;
const MAX_PDF_PARSE_BYTES = 10485760; // 10MB
const HBA1C_REFERENCE_RANGE_TEXT = "Diabetes >6.5%, Prediabetes 5.7-6.4%, Normal <5.7%";

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

function rowAliasPattern(alias) {
  return `(?:^|\\s)(?:\\d+[.)-]?\\s+)?${escapeRegExp(alias)}(?=$|[^A-Za-z0-9])`;
}

function extractLines(rawText) {
  const normalized = normalizeText(rawText).slice(0, MAX_ANALYSIS_TEXT_LENGTH);
  const sourceLines = normalized
    .split(/\n+/)
    .map(line => line.trim())
    .filter(Boolean);

  const lines = sourceLines.length > 1
    ? sourceLines
    : normalized.split(/\s{2,}|(?=[A-Z][A-Za-z /+-]{2,}\s+\d)/).map(line => line.trim()).filter(Boolean);

  let currentPage = 1;
  return lines.reduce((rows, line) => {
    const pageMatch = line.match(/^\[\[PAGE:(\d+)\]\]$/i);
    if (pageMatch) {
      currentPage = Number(pageMatch[1]);
      return rows;
    }

    rows.push({ text: line, page: currentPage });
    return rows;
  }, []);
}

function findMarkerLines(lines, alias) {
  const pattern = new RegExp(rowAliasPattern(alias), "i");
  return lines
    .map((row, index) => ({ row, index }))
    .filter(({ row }) => pattern.test(row.text));
}

function isDifferentMarkerLine(line, currentAlias) {
  const normalizedAlias = currentAlias.toLowerCase();
  return LAB_MARKERS.some(marker =>
    marker.aliases.some(alias =>
      alias.toLowerCase() !== normalizedAlias
      && new RegExp(rowAliasPattern(alias), "i").test(line)
    )
  );
}

function isIgnoredNarrativeLine(line) {
  const value = String(line || "").toLowerCase();
  return /\b(explanation|interpretation|references?|footnotes?|citations?|bibliography|journal|doi|et al|volume|vol\.|pages?|pp\.)\b/.test(value);
}

function getReferenceRangeMatches(tail) {
  const ranges = [];
  const rangePattern = /(?:reference|normal|range|ref|interval|bio\.?\s*ref\.?)?\s*:?\s*(-?\d+(?:\.\d+)?)\s*(?:-|to|\u2013|\u2014|â€“|â€”)\s*(-?\d+(?:\.\d+)?)/gi;
  let rangeMatch;

  while ((rangeMatch = rangePattern.exec(tail)) !== null) {
    const min = Number(rangeMatch[1]);
    const max = Number(rangeMatch[2]);
    if (min > max) continue;

    ranges.push({
      min,
      max,
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
    const min = Number(rangeMatch[1]);
    const max = Number(rangeMatch[2]);
    if (min > max) return null;

    return {
      min,
      max,
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
  const before = tail.slice(Math.max(0, start - 6), start).toLowerCase();
  return after.startsWith("-oh")
    || after.startsWith(" hydroxy")
    || after.startsWith("^")
    || before.endsWith("^")
    || before.endsWith("10^");
}

function getResultCandidates(tail, ranges) {
  const preferredPattern = /(?:result|observed|value|reading|level)\s*[:=-]?\s*([<>]?)\s*(-?\d+(?:\.\d+)?)/i;
  const preferred = tail.match(preferredPattern);

  if (preferred && !isInsideRanges(preferred.index || 0, ranges)) {
    return [{
      prefix: preferred[1] || "",
      value: Number(preferred[2]),
      valueText: `${preferred[1] || ""}${preferred[2]}`,
      start: preferred.index || 0,
      end: (preferred.index || 0) + preferred[0].length,
    }];
  }

  const numberPattern = /([<>]?)\s*(-?\d+(?:\.\d+)?)/g;
  return [...tail.matchAll(numberPattern)]
    .filter(match => !isInsideRanges(match.index || 0, ranges))
    .filter(match => !isDescriptorNumber(tail, match))
    .map(match => ({
      prefix: match[1] || "",
      value: Number(match[2]),
      valueText: `${match[1] || ""}${match[2]}`,
      start: match.index || 0,
      end: (match.index || 0) + match[0].length,
    }));
}

function extractExplicitFlag(tail) {
  const flagMatch = tail.match(/(?:^|[\s|,;:(])(?:flag|status)?\s*:?\s*(critical|crit|panic|hh|ll|high|low|h|l)(?=$|[\s|,;:)])/i);
  if (!flagMatch) return null;

  const flag = flagMatch[1].toLowerCase();
  if (["critical", "crit", "panic", "hh", "ll"].includes(flag)) return "critical";
  if (["h", "high"].includes(flag)) return "high";
  if (["l", "low"].includes(flag)) return "low";
  return null;
}

const UNIT_ALIASES = {
  "g/dL": ["g/dl", "gm/dl", "g dl"],
  "cells/uL": ["cells/ul", "cells/µl", "cells/μl", "/cumm", "cumm", "10^3/ul", "10^3/µl", "10^9/l"],
  "lakhs/uL": ["lakhs/ul", "lakh/ul", "lakhs/cumm", "lakh/cumm", "10^3/ul", "10^3/µl"],
  "mm/hr": ["mm/hr", "mm/hour"],
  "mg/L": ["mg/l"],
  "mg/dL": ["mg/dl"],
  "%": ["%"],
  "mIU/L": ["miu/l", "uiu/ml", "µiu/ml", "μiu/ml"],
  "ng/dL": ["ng/dl"],
  "ug/dL": ["ug/dl", "µg/dl", "μg/dl", "mcg/dl"],
  "pg/mL": ["pg/ml"],
  "ng/mL": ["ng/ml"],
  "mL/min/1.73m2": ["ml/min/1.73m2", "ml/min/1.73 m2", "ml/min"],
  "mmol/L": ["mmol/l", "meq/l"],
  "U/L": ["u/l", "iu/l"],
  "ratio": ["ratio"],
  "fL": ["fl"],
  "pg": ["pg"],
};

function normalizeUnitText(unit) {
  return String(unit || "")
    .replace(/μ/g, "µ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function getExpectedUnits(marker) {
  return [...new Set([marker.unit, ...(UNIT_ALIASES[marker.unit] || [])].filter(Boolean).map(normalizeUnitText))];
}

function extractUnitAfterValue(tail, candidate, marker) {
  const afterValue = tail
    .slice(candidate.end)
    .trim()
    .replace(/^(critical|crit|panic|hh|ll|high|low|h|l)(?=$|[\s|,;:)])\s*/i, "");
  const expectedUnits = getExpectedUnits(marker);

  if (/^(?:reference|normal|range|ref|interval|bio\.?\s*ref\.?)(?=$|[\s:])/i.test(afterValue)) {
    return {
      unit: "",
      rawUnit: "",
      valid: false,
    };
  }

  for (const expected of expectedUnits) {
    const pattern = new RegExp(`^${escapeRegExp(expected).replace(/\\ /g, "\\s*")}(?=$|[\\s|,;:)\\-])`, "i");
    const match = normalizeUnitText(afterValue).match(pattern);
    if (match) {
      return {
        unit: marker.unit,
        rawUnit: afterValue.slice(0, match[0].length).trim(),
        valid: true,
      };
    }
  }

  const rawMatch = afterValue.match(/^([A-Za-zµμ%/.\d^+-]{1,20})/);
  return {
    unit: "",
    rawUnit: rawMatch ? rawMatch[1] : "",
    valid: false,
  };
}

function hasInvalidRawUnit(unit) {
  return Boolean(unit.rawUnit && !unit.valid);
}

function isHbA1cMarker(marker) {
  return marker.name === "HbA1c";
}

function getHbA1cReferenceRange() {
  return {
    min: 0,
    max: 5.6,
    text: HBA1C_REFERENCE_RANGE_TEXT,
  };
}

function isHbA1cStructuredResultTail(tail, candidate) {
  const beforeValue = tail
    .slice(0, candidate.start)
    .replace(/\b(result|observed|value|reading|level)\b/gi, "")
    .trim();

  return /^[\s.:=|_-]*$/.test(beforeValue);
}

function isPhysiologicallyRealistic(value, marker, reportRange) {
  if (!Number.isFinite(value) || value < 0) return false;
  if (isHbA1cMarker(marker)) {
    return value >= 2 && value <= 20;
  }

  if (reportRange && (typeof reportRange.min === "number" || typeof reportRange.max === "number")) {
    const lower = typeof reportRange.min === "number" ? Math.max(0, reportRange.min / 10) : 0;
    const upper = typeof reportRange.max === "number" ? reportRange.max * 20 + 10 : 100000;
    return value >= lower && value <= upper;
  }

  const lower = typeof marker.min === "number" ? Math.max(0, marker.min / 10) : 0;
  const upper = typeof marker.max === "number" ? marker.max * 20 + 10 : 100000;
  return value >= lower && value <= upper;
}

function statusFromRange(value, prefix, reportRange) {
  if (!reportRange) return "uncertain";

  if (typeof reportRange.min === "number" && value < reportRange.min) return "low";
  if (typeof reportRange.max === "number" && value > reportRange.max) return "high";
  if (prefix === "<" && typeof reportRange.max === "number" && value <= reportRange.max) return "normal";
  if (prefix === ">" && typeof reportRange.min === "number" && value >= reportRange.min) return "normal";
  return "normal";
}

function extractNumberAfterAlias(matchObj, alias, marker, lines) {
  if (STOP_WORDS.has(alias.toLowerCase())) return null;

  const row = matchObj.row || matchObj;
  const index = matchObj.index;
  let line = typeof row === "string" ? row : row.text;
  const sourcePage = typeof row === "string" ? 1 : row.page;
  const isHbA1c = isHbA1cMarker(marker);

  if (isHbA1c && isIgnoredNarrativeLine(line)) {
    return null;
  }

  if (!isHbA1c && lines && typeof index === "number") {
    for (let i = 1; i <= 3; i++) {
      if (lines[index + i]) {
        const nextLine = typeof lines[index + i] === "string" ? lines[index + i] : lines[index + i].text;
        if (isDifferentMarkerLine(nextLine, alias)) break;
        line += "  " + nextLine;
      }
    }
  }

  if (alias.toLowerCase() === "hb" && (line.toLowerCase().includes("a1c") || line.toLowerCase().includes("glyc") || line.toLowerCase().includes("avg") || line.toLowerCase().includes("estimat"))) {
    return null;
  }

  const pattern = new RegExp(rowAliasPattern(alias), "i");
  const match = line.match(pattern);
  if (!match) return null;

  const tail = line.slice((match.index || 0) + match[0].length);
  const ranges = getReferenceRangeMatches(tail);
  const reportRange = isHbA1c ? getHbA1cReferenceRange() : parseReferenceFromTail(tail);
  const candidates = getResultCandidates(tail, ranges);

  if (candidates.length === 0) {
    return {
      status: "uncertain",
      confidence: 70,
      reason: "ambiguous extraction",
      raw: line.trim(),
      source_page: sourcePage || 0,
      page: sourcePage || 0,
    };
  }

  const result = candidates[0];
  const unit = extractUnitAfterValue(tail, result, marker);
  if (isHbA1c && (!isHbA1cStructuredResultTail(tail, result) || !unit.valid || unit.unit !== "%" || result.value < 2 || result.value > 20)) {
    return {
      prefix: result.prefix,
      value: result.value,
      valueText: result.valueText,
      unit: unit.unit,
      rawUnit: unit.rawUnit,
      raw: line.trim(),
      reportRange,
      abnormalFlag: "",
      status: "uncertain",
      confidence: 0,
      reason: "HbA1c result must be a same-row percentage between 2.0 and 20.0",
      source_page: sourcePage || 0,
      page: sourcePage || 0,
      valid: false,
    };
  }

  const explicitFlag = extractExplicitFlag(tail);
  const realistic = isPhysiologicallyRealistic(result.value, marker, reportRange);

  let confidence = 100;
  let status = explicitFlag || statusFromRange(result.value, result.prefix, reportRange);
  let reason = "";

  if (hasInvalidRawUnit(unit)) {
    confidence = Math.min(confidence, 90);
    reason = "unit validation failed";
  }
  if (!reportRange && !explicitFlag) {
    confidence = Math.min(confidence, 90);
    reason = reason || "missing report reference range or flag";
  }
  if (!sourcePage) {
    confidence = Math.min(confidence, 90);
    reason = reason || "source page unavailable";
  }
  if (!realistic) {
    confidence = Math.min(confidence, 70);
    reason = "physiological validation failed";
  }
  // Removed the strict override to "uncertain" to allow returning more results
  // if (confidence < 95) {
  //   status = "uncertain";
  // }

  const valid = realistic
    && confidence >= 90
    && !hasInvalidRawUnit(unit);

  return {
    prefix: result.prefix,
    value: result.value,
    valueText: result.valueText,
    unit: unit.unit,
    rawUnit: unit.rawUnit,
    raw: line.trim(),
    reportRange,
    abnormalFlag: explicitFlag,
    status,
    confidence,
    reason,
    source_page: sourcePage || 0,
    page: sourcePage || 0,
    valid,
  };
}

function buildRange(marker, reportRange, unitOverride = marker.unit) {
  if (reportRange?.text) {
    if (isHbA1cMarker(marker)) return reportRange.text;
    return `${reportRange.text} ${unitOverride || ""}`.trim();
  }
  return "";
}

export function generateFindingsGroups(vitals) {
  const groups = [];

  const bloodSugarVitals = vitals.filter(v => 
    ["Fasting Glucose", "Random Glucose", "HbA1c", "Estimated Average Glucose", "Urine Glucose"].includes(v.name)
  );
  if (bloodSugarVitals.length > 0) {
    const isAbnormal = bloodSugarVitals.some(v => v.status !== "Normal");
    const hba1c = bloodSugarVitals.find(v => v.name === "HbA1c");
    const fbs = bloodSugarVitals.find(v => v.name === "Fasting Glucose");
    const eag = bloodSugarVitals.find(v => v.name === "Estimated Average Glucose");
    const urineGlucose = bloodSugarVitals.find(v => v.name === "Urine Glucose");

    let interpretation = "Your blood sugar levels are within the normal range.";
    if (isAbnormal) {
      if ((hba1c && hba1c.numericValue >= 6.5) || (fbs && fbs.numericValue >= 126) || (eag && eag.numericValue >= 140)) {
        interpretation = "The report is consistent with diabetes, not just prediabetes. Prompt clinical consultation is highly recommended to establish a treatment or management plan.";
      } else {
        interpretation = "The report is consistent with prediabetes, indicating an increased risk of developing type 2 diabetes. Lifestyle modifications like diet and exercise can help reverse this trend.";
      }
      if (urineGlucose && urineGlucose.status === "High") {
        interpretation += " Notably, glucose is present in the urine (glucosuria), which typically occurs when blood glucose levels exceed the kidneys' filtration threshold.";
      }
    }

    groups.push({
      title: "Diabetes / Poor blood sugar control",
      severity: isAbnormal ? "high" : "normal",
      badge: isAbnormal ? "⚠️" : "💚",
      vitals: bloodSugarVitals.map(v => ({
        name: v.name,
        value: v.value,
        range: v.range,
        status: v.status
      })),
      interpretation
    });
  }

  const vitD = vitals.find(v => v.name === "Vitamin D");
  if (vitD) {
    const isAbnormal = vitD.status !== "Normal";
    let interpretation = "Your Vitamin D level is optimal, supporting healthy bone density and immune function.";
    if (isAbnormal && vitD.numericValue < 10) {
      interpretation = "Severe Vitamin D deficiency detected. This very low level can lead to chronic fatigue, muscle weakness, bone/joint pain, and decreased immune defense. A high-dose clinical supplement is usually required.";
    } else if (isAbnormal && vitD.numericValue < 30) {
      interpretation = "Vitamin D insufficiency. Levels are below the optimal threshold. Consider dietary adjustments, moderate sun exposure, or standard supplementation to support bone and muscle health.";
    } else if (isAbnormal && vitD.numericValue > 100) {
      interpretation = "Vitamin D levels are elevated above the usual reference range. High levels are typically due to excessive supplementation and can increase risk of calcium build-up.";
    }

    groups.push({
      title: vitD.numericValue < 10 ? "Severe Vitamin D deficiency" : "Vitamin D deficiency / Insufficiency",
      severity: vitD.numericValue < 10 ? "high" : isAbnormal ? "warning" : "normal",
      badge: isAbnormal ? "⚠️" : "💚",
      vitals: [{
        name: vitD.name,
        value: vitD.value,
        range: vitD.range,
        status: vitD.status
      }],
      interpretation
    });
  }

  const b12 = vitals.find(v => v.name === "Vitamin B12");
  const homocysteine = vitals.find(v => v.name === "Homocysteine");
  if (b12 || homocysteine) {
    const isAbnormal = (b12 && b12.status !== "Normal") || (homocysteine && homocysteine.status !== "Normal");
    let interpretation = "Your Vitamin B12 and homocysteine levels are normal.";
    if (isAbnormal) {
      if (b12 && b12.status === "Low" && homocysteine && homocysteine.status === "High") {
        interpretation = "Active Vitamin B12 deficiency confirmed by elevated homocysteine. High homocysteine is a direct cellular marker of deficiency and is linked to elevated cardiovascular and neurological risks.";
      } else if (b12 && b12.status === "Low") {
        interpretation = "Vitamin B12 deficiency. Low B12 can cause megaloblastic anemia, fatigue, weakness, or neurological symptoms like numbness/tingling in hands/feet.";
      } else if (homocysteine && homocysteine.status === "High") {
        interpretation = "Elevated Homocysteine. High levels are commonly linked to low vitamin B12 or folate status and are considered an independent risk factor for vascular health.";
      }
    }

    groups.push({
      title: "Vitamin B12 & Metabolic Health",
      severity: isAbnormal ? "high" : "normal",
      badge: isAbnormal ? "⚠️" : "💚",
      vitals: [
        ...(b12 ? [b12] : []),
        ...(homocysteine ? [homocysteine] : [])
      ].map(v => ({
        name: v.name,
        value: v.value,
        range: v.range,
        status: v.status
      })),
      interpretation
    });
  }

  const lipidVitals = vitals.filter(v =>
    ["Total Cholesterol", "LDL Cholesterol", "HDL Cholesterol", "Triglycerides", "VLDL Cholesterol", "Total Cholesterol / HDL Ratio"].includes(v.name)
  );
  if (lipidVitals.length > 0) {
    const isAbnormal = lipidVitals.some(v => v.status !== "Normal");
    let interpretation = "Your lipid panel indicators are optimal, supporting good cardiovascular health.";
    if (isAbnormal) {
      interpretation = "Lipid panel imbalance detected (dyslipidemia). High LDL ('bad' cholesterol) or high Triglycerides, combined with low HDL ('good' cholesterol), can accelerate plaque buildup in blood vessels. Focus on dietary fat changes and check with a physician.";
    }

    groups.push({
      title: "Cardiovascular / Lipid Panel",
      severity: isAbnormal ? "high" : "normal",
      badge: isAbnormal ? "⚠️" : "💚",
      vitals: lipidVitals.map(v => ({
        name: v.name,
        value: v.value,
        range: v.range,
        status: v.status
      })),
      interpretation
    });
  }

  const inflammatoryVitals = vitals.filter(v =>
    ["IgE", "CRP", "ESR", "Eosinophils"].includes(v.name)
  );
  if (inflammatoryVitals.length > 0) {
    const isAbnormal = inflammatoryVitals.some(v => v.status !== "Normal");
    const ige = inflammatoryVitals.find(v => v.name === "IgE");
    let interpretation = "Inflammatory markers are low and there are no signs of systemic allergic response.";
    if (isAbnormal) {
      interpretation = "Elevated inflammatory or allergic markers detected. ";
      if (ige && ige.status === "High") {
        interpretation += `High Total IgE (${ige.value}) suggests a highly active allergic response, which is common in conditions like asthma, allergic rhinitis, eczema, or active exposure to environmental allergens.`;
      } else {
        interpretation += "Elevated CRP/ESR/Eosinophils indicates active systemic inflammation or infection that warrants clinical correlation.";
      }
    }

    groups.push({
      title: "Allergy & Inflammation",
      severity: isAbnormal ? "high" : "normal",
      badge: isAbnormal ? "⚠️" : "💚",
      vitals: inflammatoryVitals.map(v => ({
        name: v.name,
        value: v.value,
        range: v.range,
        status: v.status
      })),
      interpretation
    });
  }

  const cbcVitals = vitals.filter(v =>
    ["Hemoglobin", "WBC Count", "Platelet Count", "RBC Count", "Hematocrit / PCV", "MCV", "MCH", "MCHC", "RDW", "Neutrophils", "Lymphocytes", "MPV"].includes(v.name)
  );
  if (cbcVitals.length > 0) {
    const isAbnormal = cbcVitals.some(v => v.status !== "Normal");
    const hb = cbcVitals.find(v => v.name === "Hemoglobin");
    let interpretation = "Complete blood count and red cell parameters are normal.";
    if (isAbnormal) {
      if (hb && hb.status === "Low") {
        interpretation = "Low Hemoglobin levels detected, which indicates anemia. This may be due to iron deficiency, B12/folate deficiency, or blood loss. Can cause fatigue, pale skin, or shortness of breath.";
      } else {
        interpretation = "Some blood cell metrics (white cells, platelets, or cell volumes like MCV/MPV) are outside normal reference limits, indicating potential immune response, infection, or cell size variations.";
      }
    }

    groups.push({
      title: "Anemia & Complete Blood Count (CBC)",
      severity: isAbnormal ? "high" : "normal",
      badge: isAbnormal ? "⚠️" : "💚",
      vitals: cbcVitals.map(v => ({
        name: v.name,
        value: v.value,
        range: v.range,
        status: v.status
      })),
      interpretation
    });
  }

  const kidneyVitals = vitals.filter(v =>
    ["Creatinine", "Urea", "BUN", "eGFR", "Uric Acid"].includes(v.name)
  );
  if (kidneyVitals.length > 0) {
    const isAbnormal = kidneyVitals.some(v => v.status !== "Normal");
    let interpretation = "Kidney function parameters (Urea, Creatinine, and glomerular filtration) are healthy.";
    if (isAbnormal) {
      interpretation = "Some renal markers are out of range. Elevated urea or creatinine can signify mild dehydration, high protein intake, or early decrease in kidney clearance. Check with your doctor.";
    }

    groups.push({
      title: "Kidney Function / Renal Panel",
      severity: isAbnormal ? "high" : "normal",
      badge: isAbnormal ? "⚠️" : "💚",
      vitals: kidneyVitals.map(v => ({
        name: v.name,
        value: v.value,
        range: v.range,
        status: v.status
      })),
      interpretation
    });
  }

  const liverVitals = vitals.filter(v =>
    ["ALT / SGPT", "AST / SGOT", "Alkaline Phosphatase", "GGT", "Bilirubin Total", "Bilirubin Direct", "Total Protein", "Albumin", "Globulin"].includes(v.name)
  );
  if (liverVitals.length > 0) {
    const isAbnormal = liverVitals.some(v => v.status !== "Normal");
    let interpretation = "Liver function markers, proteins, and liver enzymes are all within optimal limits.";
    if (isAbnormal) {
      interpretation = "Elevated hepatic enzymes (SGPT/SGOT) or bilirubin indicates liver cell stress, which can be related to fatty liver, alcohol use, or medication effects.";
    }

    groups.push({
      title: "Liver Function & Hepatic Health",
      severity: isAbnormal ? "high" : "normal",
      badge: isAbnormal ? "⚠️" : "💚",
      vitals: liverVitals.map(v => ({
        name: v.name,
        value: v.value,
        range: v.range,
        status: v.status
      })),
      interpretation
    });
  }

  const thyroidVitals = vitals.filter(v =>
    ["TSH", "Free T3", "Free T4", "T3", "T4"].includes(v.name)
  );
  if (thyroidVitals.length > 0) {
    const isAbnormal = thyroidVitals.some(v => v.status !== "Normal");
    let interpretation = "Thyroid hormone levels (TSH, T3, T4) are balanced.";
    if (isAbnormal) {
      interpretation = "Thyroid hormone levels are out of range. High TSH points to hypothyroidism (underactive thyroid), while low TSH suggests hyperthyroidism (overactive thyroid).";
    }

    groups.push({
      title: "Thyroid Panel",
      severity: isAbnormal ? "high" : "normal",
      badge: isAbnormal ? "⚠️" : "💚",
      vitals: thyroidVitals.map(v => ({
        name: v.name,
        value: v.value,
        range: v.range,
        status: v.status
      })),
      interpretation
    });
  }

  const screeningVitals = vitals.filter(v =>
    ["HIV Screening", "HBsAg (Hepatitis B)"].includes(v.name)
  );
  if (screeningVitals.length > 0) {
    const isAbnormal = screeningVitals.some(v => v.status !== "Normal");
    let interpretation = "Viral screenings (HIV, Hep B) are negative and non-reactive.";
    if (isAbnormal) {
      interpretation = "Reactive/Positive screening results found. This requires immediate confirmatory medical diagnostic testing (like PCR or Western Blot) to confirm presence of viral infection. Please consult a doctor immediately.";
    }

    groups.push({
      title: "Infectious Disease Screenings",
      severity: isAbnormal ? "high" : "normal",
      badge: isAbnormal ? "⚠️" : "💚",
      vitals: screeningVitals.map(v => ({
        name: v.name,
        value: v.value,
        range: v.range,
        status: v.status
      })),
      interpretation
    });
  }

  const classifiedNames = [
    "Fasting Glucose", "Random Glucose", "HbA1c", "Estimated Average Glucose", "Urine Glucose",
    "Vitamin D", "Vitamin B12", "Homocysteine",
    "Total Cholesterol", "LDL Cholesterol", "HDL Cholesterol", "Triglycerides", "VLDL Cholesterol", "Total Cholesterol / HDL Ratio",
    "IgE", "CRP", "ESR", "Eosinophils",
    "Hemoglobin", "WBC Count", "Platelet Count", "RBC Count", "Hematocrit / PCV", "MCV", "MCH", "MCHC", "RDW", "Neutrophils", "Lymphocytes", "MPV",
    "Creatinine", "Urea", "BUN", "eGFR", "Uric Acid",
    "ALT / SGPT", "AST / SGOT", "Alkaline Phosphatase", "GGT", "Bilirubin Total", "Bilirubin Direct", "Total Protein", "Albumin", "Globulin",
    "TSH", "Free T3", "Free T4", "T3", "T4",
    "HIV Screening", "HBsAg (Hepatitis B)"
  ];
  const otherVitals = vitals.filter(v => !classifiedNames.includes(v.name));
  if (otherVitals.length > 0) {
    const isAbnormal = otherVitals.some(v => v.status !== "Normal");
    groups.push({
      title: "Other Health Markers",
      severity: isAbnormal ? "high" : "normal",
      badge: isAbnormal ? "⚠️" : "💚",
      vitals: otherVitals.map(v => ({
        name: v.name,
        value: v.value,
        range: v.range,
        status: v.status
      })),
      interpretation: isAbnormal 
        ? "Some of your other lab parameters are outside the reference ranges and should be discussed with your physician."
        : "All other parameters are normal."
    });
  }

  return groups.sort((a, b) => (a.severity === "high" ? -1 : 1) - (b.severity === "high" ? -1 : 1));
}

export function analyzeLabReport(rawText) {
  const lines = extractLines(rawText);
  const vitals = [];
  const seen = new Set();

  for (const marker of LAB_MARKERS) {
    for (const alias of marker.aliases) {
      const markerLines = findMarkerLines(lines, alias);
      if (markerLines.length === 0 || seen.has(marker.name)) continue;

      const extractedResults = markerLines
        .map(matchObj => extractNumberAfterAlias(matchObj, alias, marker, lines));
      const found = isHbA1cMarker(marker)
        ? extractedResults.find(result => result?.valid)
        : extractedResults.find(result => result && (result.status === "uncertain" || !Number.isNaN(result.value)));
      if (!found) continue;

      const resultValue = found.valueText || "";
      const rowUnit = found.unit || "";
      const referenceRange = buildRange(marker, found.reportRange, rowUnit);

      vitals.push({
        test_name: marker.name,
        testName: marker.name,
        name: marker.name,
        value: resultValue,
        numericValue: found.value,
        unit: rowUnit,
        reference_range: referenceRange,
        range: referenceRange,
        abnormal_flag: found.abnormalFlag || "",
        status: found.status || "uncertain",
        source_page: found.source_page || 0,
        sourcePage: found.source_page || 0,
        confidence: found.confidence || 0,
        reason: found.reason || "",
        valid: found.valid === true,
        sourceSnippet: found.raw,
        source_row: found.raw,
        possibleConditions: [],
      });
      seen.add(marker.name);
      break;
    }
  }

  return {
    extractedText: rawText || "",
    vitals,
    analysis: buildAnalysis(vitals.filter(vital => vital.valid), rawText),
  };
}

export function buildAnalysis(vitals, rawText) {
  const confirmedAbnormal = vitals.filter(vital =>
    ["high", "low", "critical"].includes(String(vital.status || "").toLowerCase())
  );
  const normal = vitals.filter(vital => String(vital.status || "").toLowerCase() === "normal");
  const uncertain = vitals.filter(vital => String(vital.status || "").toLowerCase() === "uncertain");

  if (!String(rawText || "").trim()) {
    return {
      headline: "No readable report text found",
      conclusion: "No readable lab result rows were found.",
      abnormalCount: 0,
      normalCount: 0,
      uncertainCount: 0,
      abnormalResults: [],
      possibleConditions: [],
      findingsGroups: [],
      recommendations: [],
      disclaimer: "Results are extracted from the report. Please verify with the original document.",
    };
  }

  if (!vitals.length) {
    return {
      headline: "No known lab markers detected",
      conclusion: "The report text was read, but no supported lab result row passed extraction.",
      abnormalCount: 0,
      normalCount: 0,
      uncertainCount: 0,
      abnormalResults: [],
      possibleConditions: [],
      findingsGroups: [],
      recommendations: [],
      disclaimer: "Results are extracted from the report. Please verify with the original document.",
    };
  }

  return {
    headline: confirmedAbnormal.length
      ? `${confirmedAbnormal.length} abnormal result${confirmedAbnormal.length === 1 ? "" : "s"} detected`
      : "No abnormal results detected",
    conclusion: `${vitals.length} result${vitals.length === 1 ? "" : "s"} extracted; ${uncertain.length} marked uncertain.`,
    abnormalCount: confirmedAbnormal.length,
    normalCount: normal.length,
    uncertainCount: uncertain.length,
    abnormalResults: confirmedAbnormal.map(vital => ({
      test_name: vital.test_name || vital.name,
      value: vital.value,
      unit: vital.unit,
      reference_range: vital.reference_range || vital.range,
      status: vital.status,
      source_page: vital.source_page || vital.sourcePage || 0,
      confidence: vital.confidence || 0,
    })),
    possibleConditions: [],
    findingsGroups: [],
    recommendations: [],
    disclaimer: "Results are extracted from the report. Please verify with the original document.",
  };
}

export async function extractTextFromFile(file) {
  if (!file) return "";

  const extension = file.name.split(".").pop()?.toLowerCase();
  const isTextLike = file.type.startsWith("text/")
    || ["txt", "csv", "tsv", "json", "xml"].includes(extension);

  if (isTextLike) {
    const text = await file.text();
    return text.trim() ? `[[PAGE:1]]\n${text}` : "";
  }

  if (["png", "jpg", "jpeg", "webp", "heic"].includes(extension) || file.type.startsWith("image/")) {
    return "";
  }

  if (file.type === "application/pdf" || extension === "pdf") {
    // Use pdf.js for proper text extraction (handles font encoding, CMap, etc.)
    try {
      const pdfjsLib = await import("pdfjs-dist");

      // Use local worker file copied to public/ to avoid webpack bundling issues
      pdfjsLib.GlobalWorkerOptions.workerSrc = `${process.env.PUBLIC_URL}/pdf.worker.min.mjs`;

      const buffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(buffer) }).promise;
      const pageTexts = [];

      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const content = await page.getTextContent();

        // Group text items by their Y position to reconstruct lines
        const lineMap = new Map();
        for (const item of content.items) {
          if (!item.str || !item.str.trim()) continue;
          // Round Y to nearest integer to group items on the same line
          const y = Math.round(item.transform[5]);
          if (!lineMap.has(y)) lineMap.set(y, []);
          lineMap.get(y).push({ x: item.transform[4], text: item.str });
        }

        // Sort lines by Y (descending since PDF Y goes bottom-up) then items by X
        const sortedYs = [...lineMap.keys()].sort((a, b) => b - a);
        const lines = sortedYs.map(y => {
          const items = lineMap.get(y).sort((a, b) => a.x - b.x);
          return items.map(i => i.text).join("  ");
        });

        pageTexts.push(`[[PAGE:${pageNum}]]\n${lines.join("\n")}`);
      }

      const fullText = pageTexts.join("\n").trim();
      if (fullText) return fullText;
    } catch (pdfJsError) {
      console.warn("pdf.js extraction failed, falling back to regex parser:", pdfJsError);
    }

    // Fallback: naive regex-based extraction for when pdf.js fails
    try {
      const buffer = await file.slice(0, MAX_PDF_PARSE_BYTES).arrayBuffer();
      const bytes = new Uint8Array(buffer);
      const binary = new TextDecoder("latin1").decode(bytes);
      const detectedPageCount = (binary.match(/\/Type\s*\/Page\b/g) || []).length;
      const sourcePage = detectedPageCount <= 1 ? 1 : 0;

      const candidates = [];
      const textMatches = binary.match(/\(([^()]{2,})\)\s*Tj/g) || [];
      textMatches.forEach(match => {
        candidates.push(match.replace(/^\(/, "").replace(/\)\s*Tj$/, ""));
      });

      const arrayMatches = binary.match(/\[([^\]]+)\]\s*TJ/g) || [];
      arrayMatches.forEach(match => {
        const pieces = [...match.matchAll(/\(([^()]*)\)/g)].map(piece => piece[1]);
        if (pieces.length) candidates.push(pieces.join(""));
      });

      // eslint-disable-next-line no-control-regex
      const fallback = binary.replace(/[^\x09\x0A\x0D\x20-\x7E]/g, " ").replace(/\s+/g, " ");

      const extracted = (candidates.join("\n") || fallback)
        .replace(/\\n/g, "\n")
        .replace(/\\r/g, "\n")
        .replace(/\\t/g, " ")
        .replace(/\\\\/g, "\\")
        .trim();

      return extracted ? `[[PAGE:${sourcePage}]]\n${extracted}` : "";
    } catch (fallbackError) {
      console.warn("Fallback PDF extraction also failed:", fallbackError);
      return "";
    }
  }

  return "";
}
