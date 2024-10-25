import { z } from "zod";

export class Document {
  id?: string;
  content: string;
  createdAt?: Date;
  updatedAt?: Date;
  type?: string;
  provider: string;
  metadata: {
    sourceURL?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
  };

  constructor(data: Partial<Document>) {
    if (!data.content) {
      throw new Error("Missing required fields");
    }
    this.content = data.content;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
    this.type = data.type || "unknown";
    this.provider = data.provider || "unknown";
    this.metadata = data.metadata || { sourceURL: "" };
  }
}

export interface Progress {
  current: number;
  total: number;
  status: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metadata?: any;
  currentDocumentUrl?: string;
}

export const CHUNK_SIZE = 1024;
export const OVERLAP = 20;

export interface FullDocument {
  name: string;
  content: string;
  id: string;
}

export interface Chunk {
  content: string;
  id: string;
  documentId: string;
}

export const UNSTRUCTURED_URL =
  "https://chatmate-cqdx54s5.api.unstructuredapp.io/general/v0/general";

export const STEPS = {
  SELECT_TYPE: "select-type",
  WEBSITE: "website",
  FILE: "file",
  BLANK: "blank",
  QA: "qa",
};

export type ListOfErrors = Array<string | null | undefined> | null | undefined;

export const PasswordSchema = z
  .string({ required_error: "Password is required" })
  .min(6, { message: "Password is too short" })
  .max(100, { message: "Password is too long" });

export const EmailSchema = z
  .string({ required_error: "Email is required" })
  .email({ message: "Email is invalid" })
  .min(3, { message: "Email is too short" })
  .max(100, { message: "Email is too long" })
  .transform((value) => value.toLowerCase());
