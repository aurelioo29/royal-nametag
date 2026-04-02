"use client";

import { forwardRef } from "react";
import { templateConfigs } from "@/lib/templates";
import type { IdCardData } from "@/types/id-card";

type IdCardPreviewProps = {
  data: IdCardData;
  isRemovingBg?: boolean;
  nameFontSizeOverride?: number | null;
  roleFontSizeOverride?: number | null;
};

const getDynamicFontSize = (text: string, baseSize: number, minSize = 12) => {
  const length = text.trim().length;

  if (length <= 12) return baseSize;
  if (length <= 18) return Math.max(baseSize - 1, minSize);
  if (length <= 24) return Math.max(baseSize - 2, minSize);
  if (length <= 30) return Math.max(baseSize - 3, minSize);
  if (length <= 36) return Math.max(baseSize - 4, minSize);

  return minSize;
};

const IdCardPreview = forwardRef<HTMLDivElement, IdCardPreviewProps>(
  (
    {
      data,
      isRemovingBg = false,
      nameFontSizeOverride = null,
      roleFontSizeOverride = null,
    },
    ref,
  ) => {
    const config = templateConfigs[data.type];

    const photoSrc =
      data.removeBackground && data.processedPhoto
        ? data.processedPhoto
        : data.originalPhoto;

    const nameText = data.name || "Nama Lengkap";
    const roleText = data.role || "Role";

    const nameFontSize =
      nameFontSizeOverride ??
      getDynamicFontSize(
        nameText,
        config.name.fontSize,
        config.name.minFontSize ?? 12,
      );

    const roleFontSize =
      config.role && data.type === "pegawai"
        ? (roleFontSizeOverride ??
          getDynamicFontSize(
            roleText,
            config.role.fontSize,
            config.role.minFontSize ?? 10,
          ))
        : undefined;

    return (
      <div
        ref={ref}
        className="relative overflow-hidden rounded-2xl bg-white shadow-xl"
        style={{
          width: `${config.cardWidth}px`,
          height: `${config.cardHeight}px`,
          backgroundImage: `url(${config.background})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        {isRemovingBg && (
          <div className="absolute right-3 top-3 z-20 rounded-full bg-black/70 px-3 py-1 text-xs font-medium text-white">
            Removing BG...
          </div>
        )}

        <div
          className="absolute overflow-hidden bg-transparent"
          style={{
            top: `${config.photo.top}px`,
            left: `${config.photo.left}px`,
            width: `${config.photo.width}px`,
            height: `${config.photo.height}px`,
          }}
        >
          {photoSrc ? (
            <img
              src={photoSrc}
              alt={data.name || "Uploaded photo"}
              className="h-full w-full object-contain object-bottom"
            />
          ) : (
            <div className="grid h-full w-full place-items-center text-sm text-neutral-500">
              Foto
            </div>
          )}
        </div>

        <div
          className="absolute text-center"
          style={{
            top: `${config.name.top}px`,
            left: `${config.name.left}px`,
            width: `${config.name.width}px`,
            fontFamily: config.name.fontFamily,
            fontWeight: config.name.fontWeight,
            color: config.name.color,
            fontSize: `${nameFontSize}px`,
            lineHeight: 1.1,
            WebkitTextStrokeWidth: config.name.textStroke,
            WebkitTextStrokeColor: config.name.textStrokeColor,
            textShadow: config.name.textShadow,
          }}
        >
          {nameText}
        </div>

        {data.type === "pegawai" && config.role && (
          <div
            className="absolute text-center"
            style={{
              top: `${config.role.top}px`,
              left: `${config.role.left}px`,
              width: `${config.role.width}px`,
              fontFamily: config.role.fontFamily,
              fontWeight: config.role.fontWeight,
              color: config.role.color,
              fontSize: `${roleFontSize}px`,
              lineHeight: 1.1,
              WebkitTextStrokeWidth: config.role.textStroke,
              WebkitTextStrokeColor: config.role.textStrokeColor,
              textShadow: config.role.textShadow,
            }}
          >
            {roleText}
          </div>
        )}
      </div>
    );
  },
);

IdCardPreview.displayName = "IdCardPreview";

export default IdCardPreview;
