import { analyzeLabReport } from "./labReportAnalyzer";

describe("analyzeLabReport range extraction", () => {
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
});
