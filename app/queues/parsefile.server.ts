// queue for converting files to text
import { Document } from "@prisma/client";
import invariant from "tiny-invariant";
import { prisma } from "~/db.server";
import { Queue } from "~/utils/queue.server";
import axios from "axios";

export interface ParseFileQueueData {
  document: Document;
}

const LLAMAPARSE_BASE_URL = "https://api.cloud.llamaindex.ai/api/parsing";
const UNSTRUCTURED_URL =
  "https://chatmate-cqdx54s5.api.unstructuredapp.io/general/v0/general";

export const parseFileQueue = Queue<ParseFileQueueData>(
  "parseFile",
  async (job): Promise<Document> => {
    console.log("parseFileQueue", job.data.document.filepath);
    invariant(job.data.document.filepath, "Filepath is required");

    const file = await getFileFromUrl(job.data.document.filepath);
    const parsedContents = await parseFileWithLlamaparse(file);
    console.log("parsedContents", parsedContents);
    const updatedDocument = await prisma.document.update({
      where: { id: job.data.document.id },
      data: {
        content: parsedContents,
      },
    });

    return updatedDocument;
  },
);

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

async function parseFileWithLlamaparse(file: File): Promise<string> {
  let content = "";

  if (process.env.LLAMAPARSE_API_KEY) {
    try {
      const formData = new FormData();
      formData.append("file", file);

      const uploadUrl = `${LLAMAPARSE_BASE_URL}/upload`;
      const uploadResponse = await axios.post(uploadUrl, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Accept: "application/json",
          Authorization: `Bearer ${process.env.LLAMAPARSE_API_KEY}`,
        },
      });

      const jobId = uploadResponse.data.id;
      const resultType = "markdown";
      const resultUrl = `${LLAMAPARSE_BASE_URL}/job/${jobId}/result/${resultType}`;

      let resultResponse;
      let attempt = 0;
      const maxAttempts = 10; // Maximum number of attempts
      let resultAvailable = false;

      while (attempt < maxAttempts && !resultAvailable) {
        try {
          resultResponse = await axios.get(resultUrl, {
            headers: {
              Authorization: `Bearer ${process.env.LLAMAPARSE_API_KEY}`,
            },
          });
          if (resultResponse.status === 200) {
            resultAvailable = true; // Exit condition met
          } else {
            // If the status code is not 200, increment the attempt counter and wait
            attempt++;
            await new Promise((resolve) => setTimeout(resolve, 250)); // Wait for 2 seconds
          }
        } catch (error) {
          console.error("Error fetching result:", error);
          attempt++;
          await new Promise((resolve) => setTimeout(resolve, 250)); // Wait for 2 seconds before retrying
          // You may want to handle specific errors differently
        }
      }

      if (!resultAvailable) {
        content = await parseFileWithUnstructured(file);
      }
      content = resultResponse?.data[resultType];
    } catch (error) {
      console.error(
        `parsefile.server.ts - error parsing file with llamaparse ${error}`,
      );
      content = await parseFileWithUnstructured(file);
    }
  } else {
    content = await parseFileWithUnstructured(file);
  }

  return content;
}

async function parseFileWithUnstructured(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("files", file);

  try {
    const response = await axios({
      method: "post",
      url: UNSTRUCTURED_URL,
      headers: {
        accept: "application/json",
        "unstructured-api-key": process.env.UNSTRUCTURED_API_KEY as string,
      },
      data: formData,
    });

    if (response.status !== 200) {
      throw new Error(
        `Failed to partition file with error ${response.status} and message ${response.statusText}`,
      );
    }

    const elements = response.data;
    if (!Array.isArray(elements)) {
      throw new Error(
        `Expected partitioning request to return an array, but got ${typeof elements}`,
      );
    }

    if (elements[0].constructor !== Array) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return elements.map((element: any) => element.text).join("\n");
    }

    return "unstructured error";
  } catch (error) {
    console.error(
      "Error during file parsing:",
      error.response?.data || error.message,
    ); // Enhanced error logging
    return "unstructured error";
  }
}
