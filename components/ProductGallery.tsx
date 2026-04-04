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
    <div className="flex flex-col w-full max-w-[520px]">
      {/* Main image — large */}
      <div
        className="relative w-full aspect-square rounded-xl overflow-hidden bg-black/20"
        style={{ boxShadow: `0 0 60px ${color}20` }}
      >
        <Image
          src={allImages[selected]}
          alt={alt}
          fill
          className="object-cover"
          priority
          sizes="(max-width: 768px) 100vw, 520px"
        />
      </div>

      {/* Thumbnail slider — only show if more than 1 image */}
      {allImages.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {allImages.map((url, i) => (
            <button
              key={url}
              onClick={() => setSelected(i)}
              className={`relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                i === selected
                  ? 'opacity-100 scale-105'
                  : 'border-transparent opacity-50 hover:opacity-80'
              }`}
              style={i === selected ? { borderColor: color } : undefined}
            >
              <Image
                src={url}
                alt={`${alt} ${i + 1}`}
                fill
                className="object-cover"
                sizes="64px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
