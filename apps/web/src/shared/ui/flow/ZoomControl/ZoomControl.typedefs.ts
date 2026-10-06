export interface ZoomControlLabels {
  toolbar: string;
  zoomIn: string;
  zoomOut: string;
  fit: string;
}

export interface ZoomControlProps {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFit: () => void;
  labels: ZoomControlLabels;
  min?: number;
  max?: number;
  locale?: string | null;
  className?: string;
}
