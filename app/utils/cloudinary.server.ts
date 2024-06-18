import { writeAsyncIterableToWritable } from "@remix-run/node";
import cloudinary from "cloudinary";

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function uploadFile(file: AsyncIterable<Uint8Array>, public_id?: string) {
  const uploadPromise = new Promise(async (resolve, reject) => {
    console.log("files public_id - ", public_id);
    const options = public_id
      ? {
          folder: "remix",
          resource_type: "auto",
          public_id,
          // use_filename: true,
        }
      : {
          folder: "remix",
          resource_type: "auto",
        };

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
