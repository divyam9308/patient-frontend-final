import { analyzeLabReport, extractReportMetadata } from "./labReportAnalyzer";

describe("analyzeLabReport range extraction", () => {
  test("extracts report metadata for upload prefilling", () => {
    const report = [
      "City Diagnostics Laboratory",
      "Report Date: 14/05/2026",
      "Referred By: Dr. Ramesh Kumar",
      "LDL Cholesterol 128 mg/dL <100",
    ].join("\n");

    expect(extractReportMetadata(report)).toMatchObject({
      reportDate: "2026-05-14",
      doctor: "Dr. Ramesh Kumar",
      facility: "City Diagnostics Laboratory",
    });
  });

  test("returns report metadata from analyzeLabReport", () => {
    const report = [
      "HealthCare Labs",
      "Reported: 02 Jun 2026",
      "Doctor: Dr. Asha Mehta",
      "Hemoglobin 13.5 12.0 - 16.0 g/dL",
    ].join("\n");

    expect(analyzeLabReport(report).metadata).toMatchObject({
      reportDate: "2026-06-02",
      doctor: "Dr. Asha Mehta",
      facility: "HealthCare Labs",
    });
  });

  test("reads an adjacent numeric reference range after the result", () => {
    const report = "Hemoglobin 13.5 12.0 - 16.0 g/dL";

    const hemoglobin = analyzeLabReport(report).vitals.find(vital => vital.name === "Hemoglobin");

    expect(hemoglobin).toMatchObject({
      value: "13.5",
      numericValue: 13.5,
      range: "12.0-16.0",
      status: "normal",
      valid: true,
    });
  });

  test("reads a split-line numeric reference range", () => {
    const report = [
      "Hemoglobin",
      "13.5",
      "Reference Range",
      "12.0 - 16.0",
      "g/dL",
    ].join("\n");

    const hemoglobin = analyzeLabReport(report).vitals.find(vital => vital.name === "Hemoglobin");

    expect(hemoglobin).toMatchObject({
      value: "13.5",
      range: "12.0-16.0",
      status: "normal",
      valid: true,
    });
  });

  test("reads categorical lipid ranges without treating them as units", () => {
    const report = [
      "Total Cholesterol",
      "180",
      "Desirable <200 Borderline High 200-239 High >240 mg/dL",
    ].join("\n");

    const cholesterol = analyzeLabReport(report).vitals.find(vital => vital.name === "Total Cholesterol");

    expect(cholesterol).toMatchObject({
      value: "180",
      numericValue: 180,
      range: "Desirable: <200; Borderline High: 200-239; High: >240",
      status: "normal",
      valid: true,
    });
  });

  test("uses LDL categorical bands instead of marking near-optimal values high", () => {
    const report = [
      "LDL Cholesterol",
      "100.39",
      "Optimal <100 Near To Above Optimal 022321600126 Borderline High 130-159 High >160 mg/dL",
    ].join("\n");

    const ldl = analyzeLabReport(report).vitals.find(vital => vital.name === "LDL Cholesterol");

    expect(ldl).toMatchObject({
      value: "100.39",
      numericValue: 100.39,
      range: "Optimal: <100; Near To Above Optimal: 100-129; Borderline High: 130-159; High: >160",
      status: "borderline",
      valid: true,
    });
  });

  test("uses the reported lipid value instead of trailing categorical reference numbers", () => {
    const report = [
      "[[PAGE:3]]",
      "Lipid Profile",
      "Test Result Unit Biological Ref. Interval",
      "Direct LDL H 100.39 mg/dL Optimal: <100",
      "Direct measured",
      "Near to above Optimal:",
      "100 - 129",
      "Borderline High: 130-159",
      "High: 160 - 189",
      "Very High: =190",
      "Triglyceride H 168.0 mg/dL Normal : <150",
      "Borderline : 150-199",
      "High : 200-499",
      "Very High : >500",
    ].join("\n");

    const result = analyzeLabReport(report);
    const ldl = result.vitals.find(vital => vital.name === "LDL Cholesterol");
    const triglycerides = result.vitals.find(vital => vital.name === "Triglycerides");

    expect(ldl).toMatchObject({
      value: "100.39",
      numericValue: 100.39,
      unit: "mg/dL",
      status: "borderline",
      valid: true,
    });
    expect(ldl.range).toContain("Optimal: <100");

    expect(triglycerides).toMatchObject({
      value: "168.0",
      numericValue: 168,
      unit: "mg/dL",
      status: "borderline",
      valid: true,
    });
    expect(triglycerides.range).toContain("Normal: <150");
  });

  test("keeps mildly high values out of critical", () => {
    const report = [
      "WBC Count",
      "10570",
      "4000-10000 cells/uL",
    ].join("\n");

    const wbc = analyzeLabReport(report).vitals.find(vital => vital.name === "WBC Count");

    expect(wbc).toMatchObject({
      value: "10570",
      numericValue: 10570,
      status: "high",
      valid: true,
    });
  });

  test("marks values 30 percent above the upper range as critical", () => {
    const report = [
      "Fasting Glucose",
      "141.0",
      "74-106 mg/dL",
    ].join("\n");

    const glucose = analyzeLabReport(report).vitals.find(vital => vital.name === "Fasting Glucose");

    expect(glucose).toMatchObject({
      value: "141.0",
      numericValue: 141,
      range: "74-106",
      status: "critical",
      valid: true,
    });
  });

  test("normalizes private-use PDF glyph text before parsing", () => {
    const report = [
      "\uF048\uF065\uF06D\uF06F\uF067\uF06C\uF06F\uF062\uF069\uF06E",
      "\uF031\uF033\uF02E\uF035",
      "\uF031\uF032\uF02E\uF030 \uF02D \uF031\uF036\uF02E\uF030 \uF067\uF02F\uF064\uF04C",
    ].join("\n");

    const hemoglobin = analyzeLabReport(report).vitals.find(vital => vital.name === "Hemoglobin");

    expect(hemoglobin).toMatchObject({
      value: "13.5",
      range: "12.0-16.0",
      status: "normal",
      valid: true,
    });
  });

  test("reads table rows where result appears immediately above the marker", () => {
    const report = [
      "Test Name Results Units Bio. Ref. Interval",
      "46.00 mg/dL 46 - 174",
      "APOLIPOPROTEIN B (Apo B)",
      "(Immunoturbidimetry)",
      "1.00 mg/L <1.00",
      "CARDIO C-REACTIVE PROTEIN (hsCRP), SERUM",
    ].join("\n");

    const result = analyzeLabReport(report);
    const apoB = result.vitals.find(vital => vital.name === "Apolipoprotein B");
    const crp = result.vitals.find(vital => vital.name === "CRP");

    expect(apoB).toMatchObject({
      value: "46.00",
      range: "46-174 mg/dL",
      status: "normal",
      valid: true,
    });
    expect(crp).toMatchObject({
      value: "1.00",
      range: "< 1.00 mg/L",
      status: "normal",
      valid: true,
    });
  });

  test("reads PDF-extracted rows where units and reference range appear before result", () => {
    const report = [
      "Test Name Results Units Bio. Ref. Interval",
      "APOLIPOPROTEIN B (Apo B)",
      "(Immunoturbidimetry)",
      "mg/dL 46 - 174 46.00",
      "CARDIO C-REACTIVE PROTEIN (hsCRP), SERUM",
      "(Immunoturbidimetry)",
      "mg/L <1.00 1.00",
      "TROPONIN- I, SERUM HIGH SENSITIVE",
      "(CMIA)",
      "ng/L 4",
    ].join("\n");

    const result = analyzeLabReport(report);
    const apoB = result.vitals.find(vital => vital.name === "Apolipoprotein B");
    const crp = result.vitals.find(vital => vital.name === "CRP");
    const troponin = result.vitals.find(vital => vital.name === "Troponin I");

    expect(apoB).toMatchObject({
      value: "46.00",
      range: "46-174 mg/dL",
      status: "normal",
      valid: true,
    });
    expect(crp).toMatchObject({
      value: "1.00",
      range: "< 1.00 mg/L",
      status: "normal",
      valid: true,
    });
    expect(troponin).toMatchObject({
      value: "4",
      unit: "ng/L",
      status: "normal",
      valid: true,
    });
  });

  test("does not invent VLDL value from reference range only", () => {
    const report = [
      "Lipid Profile",
      "VLDL Cholesterol",
      "Reference Range 5 - 40 mg/dL",
      "LDL Cholesterol 100 mg/dL <100",
    ].join("\n");

    const result = analyzeLabReport(report);
    const vldl = result.vitals.find(vital => vital.name === "VLDL Cholesterol");
    const ldl = result.vitals.find(vital => vital.name === "LDL Cholesterol");

    expect(vldl).toBeUndefined();
    expect(ldl).toMatchObject({
      value: "100",
      valid: true,
    });
  });

  test("does not treat unit-prefixed less-than ranges as lipid results", () => {
    const report = [
      "LIPID PROFILE, BASIC, SERUM",
      "Cholesterol Total mg/dL <200",
      "Triglycerides mg/dL <150",
      "HDL Cholesterol mg/dL >40",
      "LDL Cholesterol,Direct mg/dL <100",
      "VLDL Cholesterol mg/dL <30",
    ].join("\n");

    const result = analyzeLabReport(report);

    expect(result.vitals.find(vital => vital.name === "Total Cholesterol")).toBeUndefined();
    expect(result.vitals.find(vital => vital.name === "Triglycerides")).toBeUndefined();
    expect(result.vitals.find(vital => vital.name === "HDL Cholesterol")).toBeUndefined();
    expect(result.vitals.find(vital => vital.name === "LDL Cholesterol")).toBeUndefined();
    expect(result.vitals.find(vital => vital.name === "VLDL Cholesterol")).toBeUndefined();
  });
});
