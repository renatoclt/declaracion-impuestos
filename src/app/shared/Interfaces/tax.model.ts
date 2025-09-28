export interface TaxType {
  id: string;
  name: string;
  description: string;
  rate: number;
}



// Interfaz para el JSON completo (simulando respuesta de una API global)
export interface TaxDataResponse {
    users: any[];
    taxTypes: TaxType[];
    incomes: any[];
    expenses: any[];
    declarations: any[];
}
