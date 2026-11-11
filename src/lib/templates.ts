import type { CardType } from "@/types/id-card";

export type TextConfig = {
  top: number;
  left: number;
  width: number;
  height: number;
  fontSize: number;
  minFontSize: number;
  fontFamily: string;
  fontWeight: number;
  color: string;
  textStroke?: string;
  textStrokeColor?: string;
  textShadow?: string;
};

export type TemplateConfig = {
  background: string;
  cardWidth: number;
  cardHeight: number;
  sourceWidth: number;
  sourceHeight: number;
  sourceDpi: number | null;
  photo: {
    top: number;
    left: number;
    width: number;
    height: number;
  };
  name: TextConfig;
  role?: TextConfig;
};

const SOURCE_WIDTH = 652;
const SOURCE_HEIGHT = 1008;
const CARD_WIDTH = 320;

const templateSize = {
  cardWidth: CARD_WIDTH,
  cardHeight: (CARD_WIDTH * SOURCE_HEIGHT) / SOURCE_WIDTH,
  sourceWidth: SOURCE_WIDTH,
  sourceHeight: SOURCE_HEIGHT,
  sourceDpi: 300,
};

function toPreviewPixels(sourcePixels: number): number {
  return (sourcePixels * CARD_WIDTH) / SOURCE_WIDTH;
}

export const templateConfigs: Record<CardType, TemplateConfig> = {
  magang: {
    ...templateSize,
    background: "/templates/magang.png",

    photo: {
      top: toPreviewPixels(357),
      left: toPreviewPixels(116),
      width: toPreviewPixels(415),
      height: toPreviewPixels(415),
    },

    name: {
      top: 388,
      left: 35,
      width: 250,
      height: 30,
      fontSize: 23,
      minFontSize: 15,
      fontFamily: '"Myriad Pro", "Myriad", Arial, sans-serif',
      fontWeight: 700,
      color: "#ffffff",
      textStroke: "0.8px",
      textStrokeColor: "#285F9D",
      textShadow: "0 1px 1px rgba(0,0,0,0.35)",
    },
  },

  pegawai: {
    ...templateSize,
    background: "/templates/pegawai.png",

    photo: {
      top: toPreviewPixels(368),
      left: toPreviewPixels(196),
      width: toPreviewPixels(261),
      height: toPreviewPixels(371),
    },

    name: {
      top: 373,
      left: 45,
      width: 230,
      height: 24,
      fontSize: 18,
      minFontSize: 12,
      fontFamily: '"Times New Roman", Times, serif',
      fontWeight: 700,
      color: "#111111",
    },

    role: {
      top: 411,
      left: 45,
      width: 230,
      height: 24,
      fontSize: 16,
      minFontSize: 11,
      fontFamily: '"Times New Roman", Times, serif',
      fontWeight: 700,
      color: "#111111",
    },
  },
};
