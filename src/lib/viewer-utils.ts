// ==========================================
// Coordinate Conversion Utilities for AnswerViewer
// ==========================================

export interface BoundingBoxCoordinates {
  xmin: number; // 0..1 or 0..1000 or percentage 0..100
  ymin: number;
  xmax: number;
  ymax: number;
}

export interface CSSBoundingBoxPercent {
  top: string;
  left: string;
  width: string;
  height: string;
}

/**
 * Converts normalized bounding box (0-1, 0-1000, or 0-100%) to exact CSS percentages
 */
export function convertBoundingBoxToPercent(
  coords: BoundingBoxCoordinates
): CSSBoundingBoxPercent {
  let { xmin, ymin, xmax, ymax } = coords;

  // Handle 0-1000 coordinate format
  if (xmin > 1 || ymin > 1 || xmax > 1 || ymax > 1) {
    if (xmax <= 100 && ymax <= 100) {
      // Already 0-100 percentage
      const width = Math.max(0.1, xmax - xmin);
      const height = Math.max(0.1, ymax - ymin);
      return {
        left: `${xmin.toFixed(3)}%`,
        top: `${ymin.toFixed(3)}%`,
        width: `${width.toFixed(3)}%`,
        height: `${height.toFixed(3)}%`,
      };
    }

    // 0-1000 normalized format
    xmin = (xmin / 1000) * 100;
    ymin = (ymin / 1000) * 100;
    xmax = (xmax / 1000) * 100;
    ymax = (ymax / 1000) * 100;
  } else {
    // 0-1 normalized unit format
    xmin = xmin * 100;
    ymin = ymin * 100;
    xmax = xmax * 100;
    ymax = ymax * 100;
  }

  const width = Math.max(0.5, xmax - xmin);
  const height = Math.max(0.5, ymax - ymin);

  return {
    left: `${Number(xmin.toFixed(3))}%`,
    top: `${Number(ymin.toFixed(3))}%`,
    width: `${Number(width.toFixed(3))}%`,
    height: `${Number(height.toFixed(3))}%`,
  };
}
