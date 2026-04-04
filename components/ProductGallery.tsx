'use client';

import { useState } from 'react';
import Image from 'next/image';

export function ProductGallery({
  mainImage,
  images,
  alt,
  color,
}: {
  mainImage: string;
  images: string[];
  alt: string;
  color: string;
}) {
  const allImages = images.length > 0 ? images : [mainImage];
  const [selected, setSelected] = useState(0);

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Main display */}
      <div
        className="relative w-full max-w-[420px] aspect-[3/4] rounded-lg overflow-hidden"
        style={{ filter: `drop-shadow(0 0 40px ${color}30)` }}
      >
        <Image
          src={allImages[selected]}
          alt={alt}
          fill
          className="object-contain"
          priority
        />
      </div>

      {/* Thumbnails — only show if more than 1 image */}
      {allImages.length > 1 && (
        <div className="flex gap-2 flex-wrap justify-center">
          {allImages.map((url, i) => (
            <button
              key={url}
              onClick={() => setSelected(i)}
              className={`relative w-16 h-16 rounded border-2 overflow-hidden transition-all ${
                i === selected
                  ? 'border-current opacity-100 scale-105'
                  : 'border-border opacity-50 hover:opacity-80'
              }`}
              style={i === selected ? { borderColor: color } : undefined}
            >
              <Image src={url} alt={`${alt} ${i + 1}`} fill className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
