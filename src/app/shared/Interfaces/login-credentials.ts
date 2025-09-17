import { DocumentType } from "../enum/document-type";

export interface LoginCredentials {
  documentType: DocumentType;
  documentNumber: string;
  password: string;
}
