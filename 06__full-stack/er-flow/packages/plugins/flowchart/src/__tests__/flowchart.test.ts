import { describe, it, expect } from "vitest";
import flowchartPlugin from "../index";

describe("Flowchart Diagram Plugin", () => {
  it("should have correct plugin metadata", () => {
    expect(flowchartPlugin.id).toBe("flowchart");
    expect(flowchartPlugin.nodeTypes.length).toBe(4);
    expect(flowchartPlugin.edgeTypes?.length).toBe(1);
  });

  it("should validate flowchart connectivity", () => {
    const validate = flowchartPlugin.validationRules?.[0]?.validate;
    expect(validate).toBeDefined();

    // Empty flowchart
    const emptyResult = validate!([]);
    expect(emptyResult.length).toBe(0);

    // Missing start/end warning
    const processOnly = [
      { id: "proc-1", type: "fc-process", text: "Do Something" }
    ];
    const results = validate!(processOnly);
    expect(results.some(r => r.id === "missing-start")).toBe(true);
    expect(results.some(r => r.id === "missing-end")).toBe(true);
  });
});
