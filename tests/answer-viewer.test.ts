import { describe, it, expect } from "vitest";
import {
  convertBoundingBoxToPercent,
  BoundingBoxCoordinates,
} from "../src/lib/viewer-utils";

describe("AnswerViewer Coordinate Normalization & Highlighting", () => {
  describe("convertBoundingBoxToPercent", () => {
    it("converts 0-1 normalized unit coordinates to CSS percentages", () => {
      const coords: BoundingBoxCoordinates = {
        xmin: 0.1,
        ymin: 0.25,
        xmax: 0.9,
        ymax: 0.75,
      };

      const result = convertBoundingBoxToPercent(coords);

      expect(result.left).toBe("10%");
      expect(result.top).toBe("25%");
      expect(result.width).toBe("80%");
      expect(result.height).toBe("50%");
    });

    it("converts 0-1000 integer normalized coordinates to CSS percentages", () => {
      const coords: BoundingBoxCoordinates = {
        xmin: 50,
        ymin: 200,
        xmax: 850,
        ymax: 600,
      };

      const result = convertBoundingBoxToPercent(coords);

      expect(result.left).toBe("5%");
      expect(result.top).toBe("20%");
      expect(result.width).toBe("80%");
      expect(result.height).toBe("40%");
    });

    it("handles 0-100 percentage coordinates accurately", () => {
      const coords: BoundingBoxCoordinates = {
        xmin: 3,
        ymin: 43,
        xmax: 97,
        ymax: 68,
      };

      const result = convertBoundingBoxToPercent(coords);

      expect(result.left).toBe("3.000%");
      expect(result.top).toBe("43.000%");
      expect(result.width).toBe("94.000%");
      expect(result.height).toBe("25.000%");
    });

    it("ensures minimum width and height for very small boxes", () => {
      const tinyCoords: BoundingBoxCoordinates = {
        xmin: 0.5,
        ymin: 0.5,
        xmax: 0.5001,
        ymax: 0.5001,
      };

      const result = convertBoundingBoxToPercent(tinyCoords);
      const widthNum = parseFloat(result.width);
      const heightNum = parseFloat(result.height);

      expect(widthNum).toBeGreaterThanOrEqual(0.1);
      expect(heightNum).toBeGreaterThanOrEqual(0.1);
    });
  });
});
