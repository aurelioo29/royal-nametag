export type CardType = "magang" | "pegawai";
export type PhotoSource = "upload" | "webcam";

export type IdCardData = {
  type: CardType;
  name: string;
  role: string;
  originalPhoto: string | null;
  processedPhoto: string | null;
  removeBackground: boolean;
  photoSource: PhotoSource;
};
