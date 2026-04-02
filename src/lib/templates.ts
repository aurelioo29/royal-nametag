import type { CardType } from "@/types/id-card";

type TextConfig = {
  top: number;
  left: number;
  width: number;
  fontSize: number;
  minFontSize?: number;
  fontFamily?: string;
  fontWeight?: string;
  color?: string;
  textStroke?: string;
  textStrokeColor?: string;
  textShadow?: string;
};

type TemplateConfig = {
  background: string;
  cardWidth: number;
  cardHeight: number;
  photo: {
    top: number;
    left: number;
    width: number;
    height: number;
  };
  name: TextConfig;
  role?: TextConfig;
};

export const templateConfigs: Record<CardType, TemplateConfig> = {
  magang: {
    background: "/templates/magang.png",
    cardWidth: 320,
    cardHeight: 520,
    photo: {
      top: 180,
      left: 65,
      width: 190,
      height: 220,
    },
    name: {
      top: 415,
      left: 35,
      width: 250,
      fontSize: 23,
      minFontSize: 15,
      fontWeight: "700",
      color: "#ffffff",
      fontFamily: '"Myriad Pro", "Myriad", Arial, sans-serif',
      textStroke: "0.8px",
      textStrokeColor: "#285F9D",
      textShadow: "0 1px 1px rgba(0,0,0,0.35)",
    },
  },

  pegawai: {
    background: "/templates/pegawai.png",
    cardWidth: 320,
    cardHeight: 520,
    photo: {
      top: 182,
      left: 93,
      width: 135,
      height: 200,
    },
    name: {
      top: 398,
      left: 45,
      width: 230,
      fontSize: 18,
      minFontSize: 12,
      fontFamily: '"Times New Roman", Times, serif',
      fontWeight: "700",
      color: "#111111",
    },
    role: {
      top: 423,
      left: 45,
      width: 230,
      fontSize: 16,
      minFontSize: 11,
      fontFamily: '"Times New Roman", Times, serif',
      fontWeight: "700",
      color: "#111111",
    },
  },
};
