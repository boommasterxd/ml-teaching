export interface MLImage {
  id: string;
  dataUrl: string;
  featureArray: number[];
}

export interface MLClass {
  id: string;
  name: string;
  images: MLImage[];
  color: string;
}

export interface Prediction {
  label: string;
  confidences: { [label: string]: number };
}

export const COLORS = ['#dc2626', '#2563eb', '#059669', '#d97706', '#7c3aed', '#db2777'];
