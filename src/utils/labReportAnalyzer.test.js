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
});
