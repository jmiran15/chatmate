import React, { useState, useCallback, useRef, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import ReactCrop, {
  centerCrop,
  makeAspectCrop,
  Crop,
  PixelCrop,
} from "react-image-crop";
import { Dialog, DialogContent, DialogFooter } from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import { CropIcon, Trash2Icon, XIcon } from "lucide-react";
import { UploadIcon } from "@radix-ui/react-icons";
import { motion, AnimatePresence, useAnimation } from "framer-motion";

import "react-image-crop/dist/ReactCrop.css";
import { cn } from "~/lib/utils";

interface FileWithPreview extends File {
  preview: string;
}

export function LogoPicker() {
  const [selectedFile, setSelectedFile] = useState<FileWithPreview | null>(
    null,
  );
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [crop, setCrop] = useState<Crop>();
  const lastCrop = useRef<Crop>();
  const [croppedImageUrl, setCroppedImageUrl] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isFileDropped, setIsFileDropped] = useState(false);

  const imgRef = useRef<HTMLImageElement | null>(null);
  const controls = useAnimation();

  useEffect(() => {
    if (crop) {
      lastCrop.current = crop;
    }
  }, [crop]);

  useEffect(() => {
    return () => {
      if (selectedFile) {
        URL.revokeObjectURL(selectedFile.preview);
      }
    };
  }, [selectedFile]);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        const file = acceptedFiles[0];
        const fileWithPreview = Object.assign(file, {
          preview: URL.createObjectURL(file),
        }) as FileWithPreview;
        setSelectedFile(fileWithPreview);
        setIsFileDropped(true);
        controls.start({
          scale: [1, 0.95, 1.05, 1],
          transition: { duration: 0.4 },
        });
        setTimeout(() => {
          setIsFileDropped(false);
          setDialogOpen(true);
        }, 400);
      }
    },
    [controls],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [] },
    maxFiles: 1,
  });

  const onImageLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      const { width, height } = e.currentTarget;
      setCrop(centerAspectCrop(width, height, 1));
    },
    [],
  );

  const onCropComplete = useCallback((crop: PixelCrop) => {
    if (imgRef.current && crop.width && crop.height) {
      const croppedImageUrl = getCroppedImg(imgRef.current, crop);
      setCroppedImageUrl(croppedImageUrl);
    }
  }, []);

  const getCroppedImg = useCallback(
    (image: HTMLImageElement, crop: PixelCrop): string => {
      const canvas = document.createElement("canvas");
      const scaleX = image.naturalWidth / image.width;
      const scaleY = image.naturalHeight / image.height;
      canvas.width = crop.width;
      canvas.height = crop.height;
      const ctx = canvas.getContext("2d");

      if (ctx) {
        ctx.drawImage(
          image,
          crop.x * scaleX,
          crop.y * scaleY,
          crop.width * scaleX,
          crop.height * scaleY,
          0,
          0,
          crop.width,
          crop.height,
        );
      }

      return canvas.toDataURL("image/png");
    },
    [],
  );

  const onCrop = useCallback(() => {
    setIsProcessing(true);
    setTimeout(() => {
      setCroppedImageUrl(croppedImageUrl);
      setDialogOpen(false);
      setIsProcessing(false);
    }, 500);
  }, [croppedImageUrl]);

  const removeImage = useCallback(() => {
    setSelectedFile(null);
    setCroppedImageUrl("");
  }, []);

  return (
    <div className="relative w-full">
      <motion.div
        {...getRootProps()}
        animate={controls}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
        className={cn(
          "group relative grid h-52 w-full cursor-pointer place-items-center rounded-lg border-2 border-dashed border-muted-foreground/25 px-5 py-2.5 text-center transition hover:bg-muted/25",
          "ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          isDragActive && "border-muted-foreground/50",
        )}
      >
        <input {...getInputProps()} />
        <AnimatePresence>
          {selectedFile ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              className="relative w-36 h-36"
            >
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  setDialogOpen(true);
                }}
                className="w-full h-full"
              >
                <img
                  src={croppedImageUrl || selectedFile.preview}
                  alt="Selected"
                  className="w-full h-full object-cover rounded-lg"
                />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
                onClick={(e) => {
                  e.stopPropagation();
                  removeImage();
                }}
                className="absolute -top-2 -right-2 bg-white rounded-full p-1 shadow-md"
              >
                <XIcon className="w-4 h-4 text-gray-600" />
              </motion.button>
            </motion.div>
          ) : isDragActive ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col items-center justify-center gap-4 sm:px-5"
            >
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                className="rounded-full border border-dashed p-3"
              >
                <UploadIcon
                  className="size-7 text-muted-foreground"
                  aria-hidden="true"
                />
              </motion.div>
              <p className="font-medium text-muted-foreground">
                Drop the files here
              </p>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col items-center justify-center gap-4 sm:px-5"
            >
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="rounded-full border border-dashed p-3"
              >
                <UploadIcon
                  className="size-7 text-muted-foreground"
                  aria-hidden="true"
                />
              </motion.div>
              <div className="space-y-px">
                <p className="font-medium text-muted-foreground">
                  Drag {`'n'`} drop files here, or click to select files
                </p>
                <p className="text-sm text-muted-foreground/70">
                  You can upload 1 file
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <AnimatePresence>
        {isDialogOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          >
            <Dialog open={isDialogOpen} onOpenChange={setDialogOpen}>
              <DialogContent className="sm:max-w-[425px]">
                <div className="mt-4">
                  {selectedFile && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <ReactCrop
                        crop={lastCrop.current || crop}
                        onChange={(_, percentCrop) => setCrop(percentCrop)}
                        onComplete={(c) => onCropComplete(c)}
                        aspect={1}
                      >
                        <motion.img
                          ref={imgRef}
                          src={selectedFile.preview}
                          alt="Crop me"
                          onLoad={onImageLoad}
                          layoutId="preview-image"
                        />
                      </ReactCrop>
                    </motion.div>
                  )}
                </div>
                <DialogFooter>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      variant="outline"
                      onClick={() => setDialogOpen(false)}
                    >
                      <Trash2Icon className="mr-2 h-4 w-4" />
                      Cancel
                    </Button>
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button onClick={onCrop} disabled={isProcessing}>
                      <CropIcon className="mr-2 h-4 w-4" />
                      {isProcessing ? "Processing..." : "Crop"}
                    </Button>
                  </motion.div>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isProcessing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-8 h-8 border-t-2 border-white rounded-full"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function centerAspectCrop(
  mediaWidth: number,
  mediaHeight: number,
  aspect: number,
): Crop {
  return centerCrop(
    makeAspectCrop(
      {
        unit: "%",
        width: 90,
      },
      aspect,
      mediaWidth,
      mediaHeight,
    ),
    mediaWidth,
    mediaHeight,
  );
}
