export interface DataReporte{
    data: Array<Array<object>>
}

export interface Reporte {
    cabecera: Array<CabeceraTabla>;
    numeroPagina: number;
    titulo: string;
}

export interface CabeceraTabla {
    cabecera: string;
    cabeceraData: string;
}