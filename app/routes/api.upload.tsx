import {
  ActionFunctionArgs,
  UploadHandler,
  json,
  unstable_composeUploadHandlers,
  unstable_createMemoryUploadHandler,
  unstable_parseMultipartFormData,
} from "@remix-run/node";
import { uploadFile } from "~/utils/cloudinary.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const uploadHandler: UploadHandler = unstable_composeUploadHandlers(
    async ({ name, filename, data }) => {
      if (name !== "files") {
        return undefined;
      }

      const uploadedFile = await uploadFile(data, filename);

      console.log("uploadedFile - ", uploadedFile);

      // return the name of the file as well
      return JSON.stringify({
        src: uploadedFile.secure_url,
        name: filename,
      });
    },
    unstable_createMemoryUploadHandler(),
  );

  const formData = await unstable_parseMultipartFormData(
    request,
    uploadHandler,
  );
  const fileSrcs = formData.getAll("files");
  if (!fileSrcs || fileSrcs.length === 0) {
    return json({
      error: "No files uploaded",
      fileSrcs: null,
    });
  }

  let fileSrcsArray = fileSrcs.map((src) => JSON.parse(src));
  if (!Array.isArray(fileSrcsArray)) {
    fileSrcsArray = [fileSrcsArray];
  }

  return json({ error: null, fileSrcs: fileSrcsArray });
};
