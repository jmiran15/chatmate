// queue for converting files to text
import { Document } from "@prisma/client";
import invariant from "tiny-invariant";
import { prisma } from "~/db.server";
import { Queue } from "~/utils/queue.server";
import axios from "axios";

export interface ParseFileQueueData {
  document: Document;
}

export const parseFileQueue = Queue<ParseFileQueueData>(
  "parseFile",
  async (job): Promise<Document> => {
    console.log(`parsefile.server.ts - got called with job ${job}`);
    invariant(job.data.document.filepath, "Filepath is required");

    try {
      const file = await getFileFromUrl(job.data.document.filepath);
      const parsedContents = await parseFile(file);
      // console.log(`parsefile.server.ts - parsedContents ${parsedContents}`);
      const updatedDocument = await prisma.document.update({
        where: { id: job.data.document.id },
        data: {
          content: parsedContents,
        },
      });
      console.log(
        `parsefile.server.ts - updatedDocument ${JSON.stringify(
          updatedDocument,
        )}`,
      );
      return updatedDocument;
    } catch (error) {
      console.error(`parsefile.server.ts - error parsing file ${error}`);
      throw error;
    }
  },
);

const UNSTRUCTURED_URL =
  "https://chatmate-cqdx54s5.api.unstructuredapp.io/general/v0/general";

async function parseFile(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("files", file);

  console.log("Sending file with name:", file.name); // Debugging: log file name

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
      return elements.map((element: any) => element.text).join("\n");
    }

    return "";
  } catch (error) {
    console.error(
      "Error during file parsing:",
      error.response?.data || error.message,
    ); // Enhanced error logging
    throw error;
  }
}

async function getFileFromUrl(fileUrl: string): Promise<File> {
  try {
    const response = await axios.get(fileUrl, { responseType: "blob" });
    const contentDisposition = response.headers["content-disposition"];
    let fileName = "file";
    const fileType =
      response.headers["content-type"] || "application/octet-stream";

    if (contentDisposition) {
      console.log(`getFileFromUrl - contentDisposition ${contentDisposition}`);
      const fileNameMatch = contentDisposition.match(/filename="?([^"]+)"?/i);
      if (fileNameMatch && fileNameMatch[1]) {
        console.log(`getFileFromUrl - fileNameMatch ${fileNameMatch[1]}`);
        fileName = fileNameMatch[1];
      }
    }

    return new File([response.data], fileName, { type: fileType });
  } catch (error) {
    throw new Error(`Failed to fetch file from URL: ${error.message}`);
  }
}
