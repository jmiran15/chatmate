// queue for converting files to text
import { Document } from "@prisma/client";
import invariant from "tiny-invariant";
import { prisma } from "~/db.server";
import { Queue } from "~/utils/queue.server";
import axios from "axios";
import { json } from "@remix-run/node";

export interface ParseFileQueueData {
  document: Document;
}

export const parseFileQueue = Queue<ParseFileQueueData>(
  "parseFile",
  async (job): Promise<Document> => {
    invariant(job.data.document.filepath, "Filepath is required");

    try {
      const file = await getFileFromUrl(job.data.document.filepath);
      const parsedContents = await parseFile(file);
      const updatedDocument = await prisma.document.update({
        where: { id: job.data.document.id },
        data: {
          content: parsedContents,
        },
      });

      return updatedDocument;
    } catch (error) {
      console.error(`parsefile.server.ts - error parsing file ${error}`);
      return json({ error });
      // throw error;
    }
  },
);

const LLAMAPARSE_BASE_URL = "https://api.cloud.llamaindex.ai/api/parsing";

async function parseFile(file: File): Promise<string> {
  const formData = new FormData();
  console.log(`parsefile.server.ts - file - ${file.name}`);
  formData.append("file", file);

  const uploadUrl = `${LLAMAPARSE_BASE_URL}/upload`;
  const uploadResponse = await axios.post(uploadUrl, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
      Accept: "application/json",
      Authorization: `Bearer ${process.env.LLAMAPARSE_API_KEY}`,
    },
  });

  // if (uploadResponse.status !== 200) {
  //   throw new Error(
  //     `Failed to upload file with error ${uploadResponse.status} and message ${uploadResponse.statusText}`,
  //   );
  // }

  console.log(
    `parsefile.server.ts - uploadResponse - ${uploadResponse.data.id}`,
  );

  // const jobId = uploadResponse.data.id;
  // const resultType = "text";
  // const resultUrl = `${LLAMAPARSE_BASE_URL}/job/${jobId}/result/${resultType}`;

  // let resultResponse;
  // let attempt = 0;
  // const maxAttempts = 10;
  // let resultAvailable = false;

  // while (attempt < maxAttempts && !resultAvailable) {
  //   try {
  //     resultResponse = await axios.get(resultUrl, {
  //       headers: {
  //         accept: "application/json",
  //         Authorization: `Bearer ${process.env.LLAMAPARSE_API_KEY}`,
  //       },
  //     });
  //     if (resultResponse.status === 200) {
  //       resultAvailable = true;
  //     } else {
  //       attempt++;
  //       await new Promise((resolve) => setTimeout(resolve, 250));
  //     }
  //   } catch (error) {
  //     attempt++;
  //     await new Promise((resolve) => setTimeout(resolve, 250));
  //   }
  // }

  // if (!resultAvailable) {
  //   throw new Error("Failed to fetch parsing result");
  // }

  // return resultResponse.data[resultType];
  return "";
}

async function getFileFromUrl(fileUrl: string): Promise<File> {
  try {
    const response = await axios.get(fileUrl, { responseType: "arraybuffer" });
    const contentDisposition = response.headers["content-disposition"];
    let fileName = fileUrl;
    const fileType =
      response.headers["content-type"] || "application/octet-stream";

    if (contentDisposition) {
      const fileNameMatch = contentDisposition.match(/filename="?([^"]+)"?/i);
      if (fileNameMatch && fileNameMatch[1]) {
        fileName = fileNameMatch[1];
      }
    }

    const buffer = Buffer.from(response.data, "binary");
    const file = new File([buffer], fileName, { type: fileType });

    return file;
  } catch (error) {
    throw new Error(`Failed to fetch file from URL: ${error.message}`);
  }
}
