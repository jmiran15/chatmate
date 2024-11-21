import { DocumentType, MatchType, ResponseType } from "@prisma/client";
import { ActionFunctionArgs, json } from "@remix-run/node";
import invariant from "tiny-invariant";
import { prisma } from "~/db.server";
import { deleteDocumentById } from "~/models/document.server";
import { batchIngestionQueue } from "~/queues/batchIngestion.server";
import { crawlQueue } from "~/queues/crawl.server";
import { queue } from "~/queues/ingestion/ingestion.server";
import { parseFileQueue } from "~/queues/parsefile.server";
import { qaqueue } from "~/queues/qaingestion/qaingestion.server";
import { scrapeQueue } from "~/queues/scrape.server";
import { validateUrl } from "~/utils";
import { webFlow } from "./flows.server";

export const CACHE_DURATION = 86400;
const BATCH_THRESHOLD = 50;

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const intent = formData.get("intent") as string;
  const { chatbotId } = params;

  if (!chatbotId) {
    throw new Error("Chatbot id is required");
  }

  switch (intent) {
    case "getLinks": {
      const url = String(formData.get("url"));

      if (!validateUrl(url)) {
        return json(
          { errors: { url: "Url is invalid" }, intent, job: null },
          { status: 400 },
        );
      }

      const job = await crawlQueue.add("crawl", {
        url,
      });

      return json({
        errors: null,
        intent,
        job,
      });
    }
    case "scrapeLinks": {
      console.log("scrapeLinks - called");
      const urls = JSON.parse(String(formData.get("links")));
      const crawled = formData.get("crawled");
      invariant(Array.isArray(urls), "Links must be an array");

      if (!crawled) {
        invariant(urls.length === 1, "urls must be an array of length 1");
        if (!validateUrl(urls[0].url)) {
          return json(
            {
              errors: { url: "Url is invalid" },
              intent,
              trees: null,
              documents: null,
            },
            { status: 400 },
          );
        }
      }

      // should do this stuff in validation for user feedback
      invariant(urls.length > 0, "Links must be an array");

      const documents = await prisma.document.createManyAndReturn({
        data: urls.map((el: { id: string; url: string }) => ({
          id: el.id,
          name: el.url,
          url: el.url,
          type: DocumentType.WEBSITE,
          chatbotId,
        })),
      });

      console.log("created documents", documents);
      if (formData.get("revisionForMessageId")) {
        await prisma.messageRevision.createMany({
          data: documents.map((doc) => ({
            messageId: String(formData.get("revisionForMessageId")),
            documentId: doc.id,
          })),
        });
      }

      if (documents.length > BATCH_THRESHOLD) {
        const batchJob = await batchIngestionQueue.add("batchIngestion", {
          documents,
          chatbotId,
        });
        return json({ errors: null, intent, batchJob, documents });
      } else {
        console.log("scrapeLinks - webFlow called");
        const trees = await webFlow!({
          documents,
          preprocessingQueue: scrapeQueue,
        });
        console.log("scrapeLinks - webFlow trees");
        console.log("env: ", process.env.REDIS_URL_PROD);
        return json({ errors: null, intent, trees, documents });
      }
    }
    case "parseFiles": {
      try {
        const isDev = process.env.NODE_ENV === "development";
        const BASE_URL = isDev ? process.env.DEV_BASE : process.env.PROD_BASE;

        const response = await fetch(`${BASE_URL}/api/upload`, {
          method: "POST",
          body: formData,
        });

        const cloudinaryResponse = await response.json();

        if (cloudinaryResponse.error) {
          throw new Error(`Error uploading files: ${cloudinaryResponse.error}`);
        }

        const fileSrcs = cloudinaryResponse.fileSrcs;
        const fileIds = cloudinaryResponse.fileIds;

        invariant(Array.isArray(fileSrcs), "File srcs must be an array");
        invariant(fileSrcs.length > 0, "File srcs must be an array");

        const documents = await prisma.document.createManyAndReturn({
          data: fileSrcs.map((file: { src: string; name: string }) => ({
            id: fileIds[file.name],
            name: file.name,
            filepath: file.src,
            type: DocumentType.FILE,
            chatbotId,
          })),
        });

        if (formData.get("revisionForMessageId")) {
          await prisma.messageRevision.createMany({
            data: documents.map((doc) => ({
              messageId: String(formData.get("revisionForMessageId")),
              documentId: doc.id,
            })),
          });
        }

        const trees = await webFlow!({
          documents,
          preprocessingQueue: parseFileQueue,
        });

        return json({ intent, trees, documents });
      } catch (error) {
        console.error("Error uploading files: ", error);
        throw new Error(`Error uploading files: ${error}`);
      }
    }

    case "blank": {
      const name = String(formData.get("name"));
      const content = String(formData.get("content"));
      const id = String(formData.get("documentId"));
      const revisionForMessageId = formData.get("revisionForMessageId");

      const document = await prisma.document.create({
        data: {
          id,
          name,
          content,
          chatbotId,
        },
      });

      if (revisionForMessageId) {
        await prisma.messageRevision.create({
          data: {
            messageId: String(revisionForMessageId),
            documentId: document.id,
          },
        });
      }

      await queue.add(
        `ingestion-${document.id}`,
        { document },
        { jobId: document.id },
      );

      return json({ intent, documents: [document] });
    }
    case "qa": {
      const question = String(formData.get("question"));
      const matchType = String(formData.get("matchType"));
      const answer = String(formData.get("answer"));
      const responseType = String(formData.get("responseType"));

      const revisionForMessageId = formData.get("revisionForMessageId");

      console.log("revisionForMessageId", revisionForMessageId);

      const document = await prisma.document.create({
        data: {
          type: DocumentType.QA,
          name: question,
          chatbotId,
          question,
          content: answer,
          matchType: matchType as MatchType,
          responseType: responseType as ResponseType,
        },
      });

      // if we have a revisionForMessageId, we need to create a revision in the message with the document (i.e. connect the document to the message)

      if (revisionForMessageId) {
        console.log("we have id", revisionForMessageId);
        const revision = await prisma.messageRevision.create({
          data: {
            messageId: String(revisionForMessageId),
            documentId: document.id,
          },
        });

        console.log("revision", revision);
      }

      await qaqueue.add(
        `qaingestion-${document.id}`,
        { document },
        { jobId: document.id },
      );

      return json({ intent, documents: [document] });
    }
    case "reset": {
      return null;
    }
    case "delete": {
      const documentId = String(formData.get("documentId"));
      const deletedDocument = await deleteDocumentById({ id: documentId });

      return json({
        intent: "delete",
        document: deletedDocument,
      });
    }
    default: {
      return json({ error: "Invalid action" }, { status: 400 });
    }
  }
};
