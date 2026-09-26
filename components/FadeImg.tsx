"use client";

import { useState } from "react";

// Фото с мерцающей заглушкой: пока грузится — shimmer, потом плавно проявляется.
export default function FadeImg({ className = "", ...props }: React.ImgHTMLAttributes<HTMLImageElement>) {
  const [loaded, setLoaded] = useState(false);
  return (
    <>
      {!loaded && <div aria-hidden className="absolute inset-0 shimmer" />}
      {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text */}
      <img
        {...props}
        // Из кэша картинка может загрузиться до гидрации — onLoad тогда не придёт.
        ref={(el) => {
          if (el?.complete && el.naturalWidth) setLoaded(true);
        }}
        onLoad={() => setLoaded(true)}
        className={`${className} transition-opacity duration-500 ${loaded ? "opacity-100" : "opacity-0"}`}
      />
    </>
  );
}
