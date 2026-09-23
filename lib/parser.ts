import mammoth from "mammoth";

export interface ParsedDocument {
  text: string;
  pageCount?: number;
}

export async function extractTextFromFile(
  buffer: Buffer,
  mimeType: string,
  fileName: string
): Promise<ParsedDocument> {
  const extension = fileName.toLowerCase().split(".").pop();

  if (extension === "pdf" || mimeType === "application/pdf") {
    try {
      const pdfModule: any = await import("pdf-parse");
      if (typeof pdfModule.PDFParse === "function") {
        const parser = new pdfModule.PDFParse({ data: buffer });
        const result = await parser.getText();
        return {
          text: (result.text || "").trim(),
          pageCount: result.total,
        };
      } else if (typeof pdfModule === "function") {
        const result = await pdfModule(buffer);
        return {
          text: (result.text || "").trim(),
          pageCount: result.numpages,
        };
      } else if (typeof pdfModule.default === "function") {
        const result = await pdfModule.default(buffer);
        return {
          text: (result.text || "").trim(),
          pageCount: result.numpages,
        };
      }
    } catch (err) {
      console.warn("PDF parser error, attempting fallback text extraction:", err);
    }

    // Binary regex text recovery fallback
    const rawStr = buffer.toString("latin1");
    const streamMatches = rawStr.match(/\((.*?)\)/g);
    if (streamMatches && streamMatches.length > 5) {
      const extracted = streamMatches
        .map((s) => s.slice(1, -1))
        .join(" ")
        .replace(/\\[nrt]/g, " ");
      if (extracted.trim().length > 50) {
        return { text: extracted.trim() };
      }
    }
  }

  if (
    extension === "docx" ||
    extension === "doc" ||
    mimeType.includes("wordprocessingml") ||
    mimeType.includes("msword")
  ) {
    try {
      const result = await mammoth.extractRawText({ buffer });
      return {
        text: (result.value || "").trim(),
      };
    } catch (err) {
      console.warn("Mammoth docx extraction error:", err);
    }
  }

  // Fallback for plain text, markdown, or text-encoded files
  const text = buffer.toString("utf8").trim();
  return { text };
}
