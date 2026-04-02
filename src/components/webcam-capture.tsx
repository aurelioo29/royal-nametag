"use client";

import { useEffect, useRef, useState } from "react";

type WebcamCaptureProps = {
  onCapture: (imageDataUrl: string) => void;
};

export default function WebcamCapture({ onCapture }: WebcamCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startCamera = async () => {
    try {
      setError(null);

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
        },
        audio: false,
      });

      streamRef.current = stream;
      setIsCameraOpen(true);
    } catch (err) {
      console.error(err);
      setError("Tidak bisa mengakses kamera. Pastikan izin kamera diberikan.");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setIsCameraOpen(false);
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    if (!video) return;

    if (!video.videoWidth || !video.videoHeight) {
      setError(
        "Video kamera belum siap. Coba tunggu sebentar lalu ambil foto lagi.",
      );
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Balik hasil capture supaya tidak mirror
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageDataUrl = canvas.toDataURL("image/png");
    onCapture(imageDataUrl);

    stopCamera();
  };

  useEffect(() => {
    const attachStreamToVideo = async () => {
      if (!isCameraOpen || !videoRef.current || !streamRef.current) return;

      videoRef.current.srcObject = streamRef.current;

      try {
        await videoRef.current.play();
      } catch (err) {
        console.error("Failed to play webcam stream:", err);
      }
    };

    attachStreamToVideo();
  }, [isCameraOpen]);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <div className="space-y-3">
      {!isCameraOpen ? (
        <button
          type="button"
          onClick={startCamera}
          className="inline-flex w-full items-center justify-center rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
        >
          Buka Kamera
        </button>
      ) : (
        <>
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-black">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="block h-auto w-full scale-x-[-1]"
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={capturePhoto}
              className="inline-flex w-full items-center justify-center rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              Ambil Foto
            </button>

            <button
              type="button"
              onClick={stopCamera}
              className="inline-flex w-full items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Tutup Kamera
            </button>
          </div>
        </>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
