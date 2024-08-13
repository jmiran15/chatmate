import {
  useState,
  useCallback,
  useRef,
  useEffect,
  SyntheticEvent,
} from "react";
import { useDropzone } from "react-dropzone-esm";
import ReactCrop, {
  centerCrop,
  makeAspectCrop,
  Crop,
  PixelCrop,
  convertToPixelCrop,
} from "react-image-crop";
import { Dialog, DialogContent, DialogFooter } from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import { CropIcon, Trash2Icon, XIcon } from "lucide-react";
import { UploadIcon } from "@radix-ui/react-icons";
import { motion, AnimatePresence, useAnimation } from "framer-motion";

import "react-image-crop/dist/ReactCrop.css";
import { cn } from "~/lib/utils";
import { useFetcher } from "@remix-run/react";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";

interface FileWithPreview extends File {
  preview: string;
}

export function ImagePicker({
  originalLogoFilepath,
  croppedLogoFilepath,
  savedCrop,
  fetcher,
}: {
  originalLogoFilepath: string | null; // the path to the full image
  croppedLogoFilepath: string | null; // the path to the cropped image which should be the thumbnail
  savedCrop: Prisma.JsonValue | null; // the saved cropped value
  fetcher: ReturnType<typeof useFetcher>;
}) {
  const aspect = 1;
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<FileWithPreview | null>(
    null,
  );
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [croppedImage, setCroppedImage] = useState<string>("");
  const lastCrop = useRef<Crop | undefined>(savedCrop as Crop | undefined);
  const [crop, setCrop] = useState<Crop | undefined>(
    savedCrop as Crop | undefined,
  );
  const controls = useAnimation();

  useEffect(() => {
    return () => {
      if (selectedFile) {
        URL.revokeObjectURL(selectedFile.preview);
      }
    };
  }, [selectedFile]);

  useEffect(() => {
    if (croppedLogoFilepath) {
      setCroppedImage(croppedLogoFilepath);
    }
  }, [croppedLogoFilepath]);

  useEffect(() => {
    if (savedCrop) {
      lastCrop.current = savedCrop as Crop;
      setCrop(savedCrop as Crop);
    }
  }, [savedCrop]);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        const file = acceptedFiles[0];
        const fileWithPreview = Object.assign(file, {
          preview: URL.createObjectURL(file),
        }) as FileWithPreview;
        setSelectedFile(fileWithPreview);
        controls.start({
          scale: [1, 0.95, 1.05, 1],
          transition: { duration: 0.4 },
        });

        setTimeout(() => {
          lastCrop.current = undefined;
          setCrop(undefined);
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
  function onImageLoad(e: SyntheticEvent<HTMLImageElement>) {
    if (aspect) {
      const { width, height } = e.currentTarget;
      let newCrop: Crop;
      if (lastCrop.current) {
        newCrop = lastCrop.current;
      } else {
        newCrop = convertToPixelCrop(
          centerAspectCrop(width, height, aspect),
          width,
          height,
        );
      }
      setCrop(newCrop);
      onCropComplete(newCrop as PixelCrop);
    }
  }

  async function onCropComplete(pixelCrop: PixelCrop) {
    if (imgRef.current && pixelCrop.width && pixelCrop.height) {
      lastCrop.current = pixelCrop;
      const croppedBlob = await getCroppedImg(imgRef.current, pixelCrop);
      setCroppedImage(URL.createObjectURL(croppedBlob));
    }
  }
  function getCroppedImg(
    image: HTMLImageElement,
    crop: PixelCrop,
  ): Promise<Blob> {
    const canvas = document.createElement("canvas");
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    canvas.width = crop.width * scaleX;
    canvas.height = crop.height * scaleY;
    const ctx = canvas.getContext("2d");

    console.log("crop: ", crop);

    if (ctx) {
      ctx.imageSmoothingEnabled = false;

      ctx.drawImage(
        image,
        crop.x * scaleX,
        crop.y * scaleY,
        crop.width * scaleX,
        crop.height * scaleY,
        0,
        0,
        crop.width * scaleX,
        crop.height * scaleY,
      );
    }

    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Canvas is empty"));
            return;
          }
          resolve(blob);
        },
        "image/png",
        1.0,
      );
    });
  }

  async function onCrop() {
    try {
      if (!imgRef.current || !crop) {
        throw new Error("Missing image or crop data");
      }

      const croppedBlob = await getCroppedImg(
        imgRef.current,
        crop as PixelCrop,
      );
      const croppedFile = new File(
        [croppedBlob],
        "cropped_" + (selectedFile?.name ?? v4()),
        {
          type: selectedFile?.type ?? "",
        },
      );

      const croppedFileUrl = URL.createObjectURL(croppedFile);
      setCroppedImage(croppedFileUrl);
      setDialogOpen(false);
      lastCrop.current = crop;
      setCrop(crop);

      // also send the cropped image url - for optimistic rendering
      const formData = new FormData();
      formData.append("intent", "logoImageUpdate");
      if (!selectedFile) {
        if (!originalLogoFilepath) {
          throw new Error("Missing original logo file path");
        }
      } else {
        formData.append("originalLogoFile", selectedFile);
      }
      formData.append("croppedLogoFile", croppedFile);
      formData.append("lastCrop", JSON.stringify(lastCrop.current));
      formData.append("optimisticPath", croppedFileUrl);

      fetcher.submit(formData, {
        method: "POST",
        encType: "multipart/form-data",
        navigate: false,
      });
    } catch (error) {
      alert("Something went wrong!");
      console.error(error);
    }
  }

  const removeImage = useCallback(() => {
    setSelectedFile(null);
    setCroppedImage("");
    lastCrop.current = undefined;
    setCrop(undefined);
    fetcher.submit(
      {
        intent: "removeLogoImage",
      },
      {
        method: "POST",
        encType: "multipart/form-data",

        navigate: false,
      },
    );
  }, []);

  // TODO - revert back to the github example - where the only set the croppedImage after the user confirms the crop

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
          {selectedFile || originalLogoFilepath ? (
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
                  src={croppedImage ? croppedImage : selectedFile?.preview}
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

      {isDialogOpen ? (
        <Dialog open={isDialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <div className="mt-4">
              <ReactCrop
                crop={crop}
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                onChange={(pixelCrop, _) => setCrop(pixelCrop)}
                onComplete={(c) => onCropComplete(c)}
                aspect={aspect}
              >
                <img
                  ref={imgRef}
                  src={
                    selectedFile
                      ? selectedFile.preview
                      : originalLogoFilepath ?? ""
                  }
                  alt="Crop me"
                  crossOrigin="anonymous"
                  onLoad={onImageLoad}
                />
              </ReactCrop>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                <Trash2Icon className="mr-2 h-4 w-4" />
                Cancel
              </Button>

              <Button onClick={onCrop}>
                <CropIcon className="mr-2 h-4 w-4" />
                Crop
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ) : null}
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

// function convertToPixelCrop(
//   crop: Crop,
//   imageWidth: number,
//   imageHeight: number,
// ): PixelCrop {
//   return {
//     unit: "px",
//     x: (crop.x * imageWidth) / 100,
//     y: (crop.y * imageHeight) / 100,
//     width: (crop.width * imageWidth) / 100,
//     height: (crop.height * imageHeight) / 100,
//   };
// }
