export type CardType = "magang" | "pegawai";

export type PhotoSource = "upload" | "webcam";

export type CropArea = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type CropSelection = {
  area: CropArea;
  aspect: number;
};

export type IdCardData = {
  type: CardType;
  name: string;
  role: string;
  originalPhoto: string | null;
  processedPhoto: string | null;
  removeBackground: boolean;
  photoSource: PhotoSource;
};
