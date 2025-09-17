export class DocumentValidator {
  static validateDocument(documentType: 'DNI' | 'RUC', documentNumber: string): boolean {
    if (documentType === 'DNI') {
      return /^\d{8}$/.test(documentNumber);
    } else if (documentType === 'RUC') {
      return /^\d{11}$/.test(documentNumber);
    }
    return false;
  }
}
