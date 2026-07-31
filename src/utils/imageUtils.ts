import heic2any from 'heic2any';

export const dataUrlToBlob = async (dataUrl: string): Promise<Blob> => {
  const response = await fetch(dataUrl);
  return await response.blob();
};

export interface FastProcessedImage {
  aiBase64: string;
  aiDataUrl: string;
  storageBlob: Blob;
  thumbDataUrl: string;
  mimeType: string;
}

export const processImageFast = async (
  source: File | Blob | string,
  fileName = "image.jpg"
): Promise<FastProcessedImage> => {
  let fileToProcess: Blob | string = source;

  if (source instanceof File) {
    if (source.name.toLowerCase().endsWith(".heic") || source.type === "image/heic") {
      try {
        const converted = await heic2any({
          blob: source,
          toType: "image/jpeg",
          quality: 0.75,
        });
        fileToProcess = Array.isArray(converted) ? converted[0] : converted;
      } catch (e) {
        console.warn("HEIC conversion failed, processing directly", e);
      }
    }
  }

  let srcUrl = "";
  let shouldRevoke = false;

  if (typeof fileToProcess === "string") {
    srcUrl = fileToProcess;
  } else {
    srcUrl = URL.createObjectURL(fileToProcess);
    shouldRevoke = true;
  }

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      if (shouldRevoke) URL.revokeObjectURL(srcUrl);
      reject(new Error("Image processing timeout"));
    }, 10000);

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = srcUrl;

    img.onload = async () => {
      try {
        clearTimeout(timeout);
        const origWidth = img.width;
        const origHeight = img.height;

        const getScaled = (maxDim: number, quality: number, outputType: "dataUrl" | "blob") => {
          const canvas = document.createElement("canvas");
          let w = origWidth;
          let h = origHeight;

          if (w > h) {
            if (w > maxDim) {
              h = Math.round((h * maxDim) / w);
              w = maxDim;
            }
          } else {
            if (h > maxDim) {
              w = Math.round((w * maxDim) / h);
              h = maxDim;
            }
          }

          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext("2d", { alpha: false });
          if (!ctx) throw new Error("Canvas context error");

          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = "medium";
          ctx.drawImage(img, 0, 0, w, h);

          if (outputType === "dataUrl") {
            return canvas.toDataURL("image/jpeg", quality);
          } else {
            return new Promise<Blob>((resBlob, rejBlob) => {
              canvas.toBlob(
                (b) => (b ? resBlob(b) : rejBlob(new Error("Blob creation failed"))),
                "image/jpeg",
                quality
              );
            });
          }
        };

        // 1. Storage Blob (1024px, 0.75) -> ~100-150KB
        const storageBlob = (await getScaled(1024, 0.75, "blob")) as Blob;

        // 2. AI DataURL (640px, 0.65) -> ~35-50KB base64
        const aiDataUrl = getScaled(640, 0.65, "dataUrl") as string;
        const aiBase64 = aiDataUrl.replace(/^data:image\/\w+;base64,/, "");

        // 3. Thumbnail (240px, 0.5) -> ~8-12KB
        const thumbDataUrl = getScaled(240, 0.5, "dataUrl") as string;

        if (shouldRevoke) URL.revokeObjectURL(srcUrl);

        resolve({
          aiBase64,
          aiDataUrl,
          storageBlob,
          thumbDataUrl,
          mimeType: "image/jpeg",
        });
      } catch (err) {
        if (shouldRevoke) URL.revokeObjectURL(srcUrl);
        reject(err);
      }
    };

    img.onerror = (err) => {
      clearTimeout(timeout);
      if (shouldRevoke) URL.revokeObjectURL(srcUrl);
      reject(err);
    };
  });
};

export const compressImage = async (file: File, maxWidth = 1024, maxHeight = 1024, quality = 0.7): Promise<{ dataUrl: string, blob: Blob }> => {
  let fileToProcess: Blob = file;
  
  // Convert HEIC to JPEG if necessary
  if (file.name.toLowerCase().endsWith('.heic') || file.type === 'image/heic') {
    try {
      const converted = await heic2any({
        blob: file,
        toType: 'image/jpeg',
        quality: quality
      });
      fileToProcess = Array.isArray(converted) ? converted[0] : converted;
    } catch (e) {
      console.error("HEIC conversion failed", e);
      throw new Error("HEIC conversion failed");
    }
  }

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error("Compression timeout")), 15000);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        try {
          clearTimeout(timeout);
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) return reject(new Error('Canvas context not available'));
          
          ctx.drawImage(img, 0, 0, width, height);
          
          const dataUrl = canvas.toDataURL('image/jpeg', quality);
          canvas.toBlob((blob) => {
            if (blob) {
              resolve({ dataUrl, blob });
            } else {
              reject(new Error("Blob conversion failed"));
            }
          }, 'image/jpeg', quality);
        } catch (e) {
          reject(e);
        }
      };
      img.onerror = (error) => {
        clearTimeout(timeout);
        reject(error);
      };
    };
    reader.onerror = (error) => {
      clearTimeout(timeout);
      reject(error);
    };
    try {
      reader.readAsDataURL(fileToProcess);
    } catch (e) {
      clearTimeout(timeout);
      reject(e);
    }
  });
};
