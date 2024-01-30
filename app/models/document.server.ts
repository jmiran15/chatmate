import PDFParser from "pdf2json";

export async function processFiles({ files }) {
  // const formData = await request.formData();
  // const files = formData.getAll("file"); // Assuming "file" is the name attribute in your input field

  const fileContents = await Promise.all(
    files.map(async (file) => {
      if (!(file instanceof File)) {
        throw new Error("Expected file");
      }

      const fileExtension = file.name.split(".").pop();
      let fileContent = "";

      switch (fileExtension) {
        case "txt":
        case "csv":
        case "html":
        case "json":
        case "md":
        case "mdx":
          fileContent = await file.text();
          break;
        case "pdf": {
          const fileBuffer = await file.arrayBuffer();
          const pdfParser = new PDFParser(this, 1);

          fileContent = await new Promise((resolve, reject) => {
            pdfParser.on("pdfParser_dataError", reject);
            pdfParser.on("pdfParser_dataReady", (pdfData) => {
              resolve(pdfParser.getRawTextContent());
            });
            pdfParser.parseBuffer(new Buffer(fileBuffer));
          });
          break;
        }
        default:
          fileContent = "Unsupported file type";
          break;
      }

      return { file: file.name, content: fileContent };
    }),
  );

  return { files: fileContents };
}
