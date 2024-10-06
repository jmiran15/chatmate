import { Document, DocumentType } from "@prisma/client";
import { Fetcher, useFetchers } from "@remix-run/react";

const INTENTS = {
  scrapeLinks: "scrapeLinks",
  parseFiles: "parseFiles",
  blank: "blank",
};

interface PendingDocument extends Omit<Document, "createdAt" | "updatedAt"> {
  createdAt: string;
  updatedAt: string;
}

// This doesn't really work ... all the fetchers die off when the modal closes so none of them are pending here...
// we need to set the use_stable ... future flag for this to work
export function usePendingDocuments(): PendingDocument[] {
  return useFetchers()
    .filter(isPreprocessingFetcher)
    .map((fetcher) => {
      let newDocs: PendingDocument[] = [];
      const chatbotId = String(fetcher.formData?.get("chatbotId"));
      const intent = String(fetcher.formData?.get("intent"));
      switch (intent) {
        case INTENTS.parseFiles: {
          const files = fetcher.formData?.getAll("files") as File[];
          if (!files || files.length === 0) break;
          const fileIds = JSON.parse(String(fetcher.formData?.get("fileIds")));
          newDocs = files.map((file: File) => ({
            id: fileIds[file.name],
            name: file.name,
            content: null, // Keep content null for files until processed
            type: DocumentType.FILE,
            chatbotId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            url: null,
            filepath: null,
            isPending: true,
          }));
          break;
        }
        case INTENTS.scrapeLinks: {
          const urls = JSON.parse(
            String(fetcher.formData?.getAll("links")),
          ) as {
            id: string;
            url: string;
          }[];
          newDocs = urls.map((el: { id: string; url: string }) => ({
            id: el.id,
            chatbotId,
            name: el.url,
            url: el.url,
            content: null, // Keep content null for websites until scraped
            type: DocumentType.WEBSITE,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isPending: true,
            filepath: null,
          }));
          break;
        }
        case INTENTS.blank: {
          const name = String(fetcher.formData?.get("name"));
          const content = String(fetcher.formData?.get("content"));
          const id = String(fetcher.formData?.get("documentId"));
          newDocs = [
            {
              id,
              name,
              content, // Use the provided content for blank documents
              chatbotId,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              type: DocumentType.RAW,
              isPending: true,
              url: null,
              filepath: null,
            },
          ];
          break;
        }
        default: {
          break;
        }
      }
      return newDocs;
    })
    .flat()
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
}

function isPreprocessingFetcher(fetcher: Fetcher) {
  if (!fetcher.formData) return false;
  const intent = fetcher.formData.get("intent");
  return (
    intent === INTENTS.scrapeLinks ||
    intent === INTENTS.parseFiles ||
    intent === INTENTS.blank
  );
}
