export type DefaultPopup = {
  type: "default";
  title: string;
  description: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export type MulliganPopup = {
  type: "mulligan";
  onDraw: () => void;
  onKeep: () => void;
};

export type ConcedePopup = {
  type: "concede";
  onConcede: () => void;
  onCancel: () => void;
};
