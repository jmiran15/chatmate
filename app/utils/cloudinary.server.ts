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

console.log("configs", cloudinary.v2.config());
export { uploadFile };
