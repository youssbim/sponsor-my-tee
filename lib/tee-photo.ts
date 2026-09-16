import type { Side } from "./spots";

// Studio photos of the tee being worn. Spot rectangles are percentages of each photo,
// measured on the fabric (see the collar, hem and sleeve landmarks of each shot).

export const teePhotos: Record<Side, { src: string; width: number; height: number }> = {
  front: { src: "/tee/front.jpg", width: 1024, height: 1420 },
  back: { src: "/tee/back.jpg", width: 1024, height: 1420 },
};

export type PhotoRect = { x: number; y: number; w: number; h: number };

export const photoSpots: Record<string, PhotoRect> = {
  F1: { x: 56.35, y: 40.49, w: 9.47, h: 6.83 },
  F2: { x: 37.7, y: 40.49, w: 9.47, h: 6.83 },
  F3: { x: 39.06, y: 51.76, w: 25.29, h: 9.08 },
  F4: { x: 39.06, y: 65.28, w: 6.35, h: 4.58 },
  F5: { x: 48.54, y: 65.28, w: 6.35, h: 4.58 },
  F6: { x: 58.01, y: 65.28, w: 6.35, h: 4.58 },
  S1: { x: 73.73, y: 41.41, w: 7.32, h: 5.28 },
  S2: { x: 22.95, y: 41.41, w: 7.32, h: 5.28 },
  B1: { x: 35.64, y: 35.56, w: 28.81, h: 5.21 },
  B2: { x: 37.7, y: 44.37, w: 24.71, h: 17.82 },
  B3: { x: 35.64, y: 66.2, w: 13.38, h: 4.44 },
  B4: { x: 51.07, y: 66.2, w: 13.38, h: 4.44 },
};

/** Close-ups of each sleeve: a spot on a sleeve is shown on the arm, not on the body shot. */
export const sleevePhotos: Record<string, { src: string; width: number; height: number; rect: PhotoRect }> = {
  S1: { src: "/tee/sleeve-left.jpg", width: 560, height: 747, rect: { x: 35, y: 30, w: 30, h: 15 } },
  S2: { src: "/tee/sleeve-right.jpg", width: 560, height: 747, rect: { x: 28, y: 31, w: 30, h: 15 } },
};
