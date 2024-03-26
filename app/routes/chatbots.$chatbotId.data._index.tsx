import { Dialog, Transition } from "@headlessui/react";

import { ActionFunctionArgs, LoaderFunctionArgs, json } from "@remix-run/node";
import {
  Form,
  useFetcher,
  useLoaderData,
  useNavigation,
  useParams,
} from "@remix-run/react";
import { prisma } from "~/db.server";

import { useEffect, useState, useRef, Fragment } from "react";
import { AgGridReact } from "ag-grid-react";
import AgGridStyles from "ag-grid-community/styles/ag-grid.css";
import AgThemeAlpineStyles from "ag-grid-community/styles/ag-theme-alpine.css";

import { v4 as uuidv4 } from "uuid";

import DocumentCard from "~/components/document-card";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { getDocumentsByChatbotId } from "~/models/document.server";
import {
  convertUploadedFilesToDocuments,
  generatePossibleQuestionsForChunk,
  generateSummaryForChunk,
  getEmbeddings,
  splitStringIntoChunks,
} from "~/utils/openai";
import { CONCURRENT_REQUESTS, getDocuments } from "~/utils/webscraper/scrape";
import {
  CHUNK_SIZE,
  Chunk,
  Document,
  FullDocument,
  OVERLAP,
} from "~/utils/types";

const columnDefs = [
  { field: "metadata.sourceURL", checkboxSelection: true, flex: 1 },
];
export const loader = async ({ params }: LoaderFunctionArgs) => {
  const chatbotId = params.chatbotId as string;

  if (!chatbotId) {
    return json({ error: "Chatbot id is required" }, { status: 400 });
  }

  const documents = await getDocumentsByChatbotId({ chatbotId });

  return json({ documents });
};

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const action = formData.get("action") as string;
  const { chatbotId } = params;

  switch (action) {
    case "getLinks": {
      const url = formData.get("url") as string;
      const links = await getDocuments([url], "crawl", 100, true);

      return json({ links });
    }

    case "scrapeLinks": {
      let links = JSON.parse(formData.get("links") as string);
      links = links.map((link) => link.metadata.sourceURL);

      const scrapedDocuments = await getDocuments(
        links,
        "single_urls",
        100,
        false,
      );

      const documents: FullDocument[] = scrapedDocuments.map(
        (document: Document) => {
          const id = uuidv4();
          return {
            name: document.metadata.sourceURL
              ? document.metadata.sourceURL
              : "Untitled document",
            content: document.content,
            id,
          };
        },
      );

      // Create the documents in the database first
      const createdDocuments = await prisma.document.createMany({
        data: documents.map((document) => ({
          name: document.name,
          content: document.content,
          chatbotId: chatbotId as string,
          id: document.id,
        })),
      });

      const baseChunks: Chunk[] = documents.flatMap((document) =>
        splitStringIntoChunks(document, CHUNK_SIZE, OVERLAP),
      );

      console.log("starting");
      const BATCH_SIZE = 10;
      const chunkedBaseChunks = [];
      for (let i = 0; i < baseChunks.length; i += BATCH_SIZE) {
        chunkedBaseChunks.push(baseChunks.slice(i, i + BATCH_SIZE));
      }

      for (const batchChunks of chunkedBaseChunks) {
        console.log("Processing batch of chunks");
        await Promise.all(
          batchChunks.map(async (chunk, index) => {
            const [summary, questions] = await Promise.all([
              generateSummaryForChunk(chunk),
              generatePossibleQuestionsForChunk(chunk),
            ]);

            await Promise.all(
              [chunk, summary, ...questions].map(async (node) => {
                const embedding = await getEmbeddings({ input: node.content });
                await prisma.$executeRaw`
                  INSERT INTO "Embedding" ("id", "embedding", "documentId", "chatbotId", "content")
                  VALUES (${uuidv4()}, ${embedding}::vector, ${
                    node.documentId
                  }, ${chatbotId}, ${chunk.content})
                `;

                console.log(
                  `Inserted embedding for chunk ${index} out of ${baseChunks.length}`,
                );
                return {
                  chunk: chunk.content,
                  embedding: embedding,
                  documentId: chunk.documentId,
                  chatbotId,
                };
              }),
            );
          }),
        );
      }

      console.log("Inserted all embeddings");

      return json({ documents: createdDocuments });
    }

    case "upload": {
      // do same parallel stuff that we do in the scrapeLinks action

      // Get all file entries from the original formData
      const files = formData.getAll("file");

      const fileContents: FullDocument[] =
        await convertUploadedFilesToDocuments(files);

      const baseChunks: Chunk[] = fileContents.flatMap((document) =>
        splitStringIntoChunks(document, CHUNK_SIZE, OVERLAP),
      );

      baseChunks.forEach(async (chunk) => {
        const summary = await generateSummaryForChunk(chunk);
        const questions = await generatePossibleQuestionsForChunk(chunk);

        await [chunk, summary, ...questions].map(async (node) => {
          const embedding = await getEmbeddings({ input: node.content });

          await prisma.$executeRaw`
          INSERT INTO "Embedding" ("id", "embedding", "documentId", "chatbotId", "content")
          VALUES (${uuidv4()}, ${embedding}::vector, ${
            node.documentId
          }, ${chatbotId}, ${chunk.content})
          `;

          return {
            chunk: chunk.content,
            embedding: embedding,
            documentId: chunk.documentId,
            chatbotId,
          };
        });
      });

      // insert the document
      return await prisma.document.createMany({
        data: fileContents.map((document) => ({
          name: document.name,
          content: document.content,
          chatbotId: chatbotId as string,
          id: document.id,
        })),
      });
    }
    default: {
      return json({ error: "Invalid action" }, { status: 400 });
    }
  }
};

const SUPPORTED_FILE_TYPES = [
  "txt",
  "eml",
  "msg",
  "xml",
  "html",
  "md",
  "rst",
  "json",
  "rtf",
  "jpeg",
  "png",
  "doc",
  "docx",
  "ppt",
  "pptx",
  "pdf",
  "odt",
  "epub",
  "csv",
  "tsv",
  "xlsx",
  "gz",
];

export default function Data() {
  const data = useLoaderData<typeof loader>();
  const { chatbotId } = useParams();
  const navigation = useNavigation();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [links, setLinks] = useState<any[]>([]);
  const [isScrapingWebsiteModalOpen, setIsScrapingWebsiteModalOpen] =
    useState(false);

  const fetcher = useFetcher();

  const isSubmitting =
    navigation.formAction === `/chatbots/${chatbotId}/data?index` ||
    fetcher.state === "submitting" ||
    fetcher.state === "loading";

  useEffect(() => {
    if (fetcher.formData) {
      const action = fetcher.formData.get("action");

      if (action === "getLinks") {
        if (fetcher.data) {
          setLinks(fetcher.data.links);
          setIsScrapingWebsiteModalOpen(true);
        }
      } else if (action === "scrapeLinks") {
        if (fetcher.data) {
          // console.log("fetcher data documents", fetcher.data);
          setIsScrapingWebsiteModalOpen(false);
          setLinks([]);
        }
      }
    }

    if (fetcher.state === "submitting" || fetcher.state === "loading") {
      // loading
    }

    if (fetcher.state === "idle") {
      // done
    }
  }, [fetcher.state]);

  return (
    <>
      <div className="flex flex-col p-4 gap-8 w-full overflow-y-auto h-full">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold">Data</h1>
          <h1 className="font-normal text-gray-700 dark:text-gray-400">
            This is the data that your chatbot will be able to reference in it's
            responses
          </h1>

          <fetcher.Form method="post" encType="multipart/form-data">
            <fieldset
              disabled={isSubmitting}
              className="flex flex-row justify-between items-center gap-4"
            >
              <input type="hidden" name="action" value="getLinks" />
              <Input
                type="text"
                name="url"
                placeholder="Enter website url, e.g. https://example.com"
                multiple
                className="flex-1"
              />
              <Button type="submit" className="flex-none">
                Scrape website
              </Button>
            </fieldset>
          </fetcher.Form>

          <Form
            method="post"
            encType="multipart/form-data"
            className="flex flex-col gap-4"
          >
            <fieldset
              disabled={isSubmitting}
              className="flex flex-row justify-between items-center gap-4"
            >
              <input type="hidden" name="action" value="upload" />
              <Input type="file" name="file" multiple className="flex-1" />
              <Button type="submit" className="flex-none">
                + Upload Document
              </Button>
            </fieldset>

            <div className="flex flex-row gap-1 flex-wrap">
              <span className="text-sm font-normal text-gray-700">
                Supported file types:
              </span>
              {SUPPORTED_FILE_TYPES.map((fileType, index) => (
                <Badge key={index} variant="secondary">
                  {fileType}
                </Badge>
              ))}
            </div>
          </Form>
        </div>

        {isSubmitting ? (
          <div
            role="status"
            className="flex flex-col items-center justify-center w-full "
          >
            <svg
              aria-hidden="true"
              className="w-8 h-8 text-gray-200 animate-spin dark:text-gray-600 fill-blue-600"
              viewBox="0 0 100 101"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                fill="currentColor"
              />
              <path
                d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                fill="currentFill"
              />
            </svg>
            <span className="sr-only">Loading...</span>
          </div>
        ) : (
          <></>
        )}

        {data.documents.length === 0 ? (
          <p className="p-4">No documents yet</p>
        ) : (
          <ol className="space-y-4 ">
            {data.documents.map((document) => (
              <DocumentCard key={document.id} document={document} />
            ))}
          </ol>
        )}
      </div>
      <ScrapeWebsiteModal
        open={isScrapingWebsiteModalOpen}
        setOpen={setIsScrapingWebsiteModalOpen}
        fetcher={fetcher}
        links={links}
        loading={isSubmitting}
      />
    </>
  );
}

export const handle = {
  breadcrumb: "data",
};

export function links() {
  return [
    { rel: "stylesheet", href: AgGridStyles },
    { rel: "stylesheet", href: AgThemeAlpineStyles },
  ];
}

function ScrapeWebsiteModal({
  open,
  setOpen,
  fetcher,
  links,
  loading,
}: {
  open: boolean;
  setOpen: (value: boolean) => void;
  fetcher: ReturnType<typeof useFetcher>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  links: any[];
  loading: boolean;
}) {
  const cancelButtonRef = useRef(null);
  const [selectedRows, setSelectedRows] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredDocuments, setFilteredDocuments] = useState(links);

  useEffect(() => {
    setFilteredDocuments(
      links.filter((link) =>
        link.metadata.sourceURL
          .toLowerCase()
          .includes(searchTerm.toLowerCase()),
      ),
    );
  }, [searchTerm, links]);

  // Handler for row selection
  const onSelectionChanged = (params) => {
    const selectedNodes = params.api.getSelectedNodes();
    const selectedData = selectedNodes.map((node) => node.data);
    setSelectedRows(selectedData);
  };

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog
        as="div"
        className="relative z-10"
        initialFocus={cancelButtonRef}
        onClose={setOpen}
      >
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-3/5 sm:p-6 w-full">
                <div className="sm:flex sm:items-start">
                  <div className="m-3 text-center sm:text-left w-full">
                    <Dialog.Title
                      as="h3"
                      className="text-base font-semibold leading-6 text-gray-900"
                    >
                      Select the links you would like to add
                    </Dialog.Title>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        You can select the links you would like to add to your
                        chatbot
                      </p>
                    </div>
                    <Input
                      type="text"
                      className="mt-2"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search by Source URL"
                    />
                    <p className="mt-2 text-sm text-gray-500">
                      Currently showing {filteredDocuments.length} links
                    </p>
                    <div className="ag-theme-alpine w-full h-96 mt-2">
                      <AgGridReact
                        rowData={filteredDocuments}
                        columnDefs={columnDefs}
                        rowSelection="multiple"
                        onSelectionChanged={onSelectionChanged}
                        rowMultiSelectWithClick={true}
                      ></AgGridReact>
                    </div>
                  </div>
                </div>
                <fetcher.Form method="POST">
                  <fieldset
                    disabled={loading}
                    className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse"
                  >
                    <input type="hidden" name="action" value="scrapeLinks" />
                    <input
                      type="hidden"
                      name="links"
                      value={JSON.stringify(selectedRows)}
                    />
                    <button
                      type="submit"
                      className="inline-flex w-full justify-center rounded-md bg-orange-500 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 sm:ml-3 sm:w-auto"
                      // onClick={() => setOpen(false)}
                    >
                      Scrape
                    </button>
                    <button
                      type="button"
                      className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                      onClick={() => setOpen(false)}
                      ref={cancelButtonRef}
                    >
                      Cancel
                    </button>
                  </fieldset>
                </fetcher.Form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
