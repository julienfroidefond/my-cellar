"use client";

import { useState } from "react";
import ImagePicker from "@/components/ImagePicker";

export default function WineImageField({
  wineId,
  wineName,
  currentImage,
}: {
  wineId: string;
  wineName: string;
  currentImage: string | null;
}) {
  const [imageUrl, setImageUrl] = useState(currentImage ?? "");

  return (
    <>
      <ImagePicker
        wineId={wineId}
        wineName={wineName}
        currentImage={currentImage}
        onSelect={setImageUrl}
      />
      <input type="hidden" name="imageUrl" value={imageUrl} />
    </>
  );
}
