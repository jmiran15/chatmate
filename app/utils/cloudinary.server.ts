import { writeAsyncIterableToWritable } from "@remix-run/node";
import cloudinary from "cloudinary";

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function uploadFile(file: AsyncIterable<Uint8Array>, public_id?: string) {
  // eslint-disable-next-line no-async-promise-executor
  const uploadPromise = new Promise(async (resolve, reject) => {
    const uploadStream = cloudinary.v2.uploader.upload_stream(
      {
        folder: "remix",
        resource_type: "auto",
        public_id,
        filename_override: public_id,
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(result);
      },
    );
    await writeAsyncIterableToWritable(file, uploadStream);
  });

  return uploadPromise;
}

async function uploadImage(data: AsyncIterable<Uint8Array>) {
  // eslint-disable-next-line no-async-promise-executor
  const uploadPromise = new Promise(async (resolve, reject) => {
    const uploadStream = cloudinary.v2.uploader.upload_stream(
      {
        folder: "remix",
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(result);
      },
    );
    await writeAsyncIterableToWritable(data, uploadStream);
  });

  return uploadPromise;
}

async function uploadScreenshot(data: Blob) {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.v2.uploader.upload_stream(
      {
        folder: "screenshots",
      },
      (error, result) => {
        if (error) {
          console.error("❌ ERROR UPLOADING TO CLOUDINARY:", error);
          reject(error);
          return;
        }
        console.log("✅ CLOUDINARY UPLOAD SUCCESSFUL");
        resolve(result);
      },
    );

    data
      .arrayBuffer()
      .then((arrayBuffer) => {
        const buffer = Buffer.from(arrayBuffer);
        uploadStream.write(buffer);
        uploadStream.end();
      })
      .catch((error) => {
        console.error("❌ ERROR CONVERTING BLOB TO BUFFER:", error);
        reject(error);
      });
  });
}

export { uploadFile, uploadImage, uploadScreenshot };
