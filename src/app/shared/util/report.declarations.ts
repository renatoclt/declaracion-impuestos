import { Declaration } from "../interfaces/declaration.interface";

export interface PeriodReport {
    period: string;
    totalDeclarations: number;
    totalIncome: number;
    totalTaxCollected: number;
    pending: number;
    completed: number;
    list: Declaration[];
    processing?:number;
}

export class TaxReportService {

    /**
     * Genera un reporte de declaraciones por período específico
     * @param declarations - Array completo de declaraciones
     * @param year - Año (ej: 2025)
     * @param month - Mes ya formateado con cero (ej: "01", "02", "12")
     * @returns Objeto con el resumen del período solicitado
     */

    static getReportByPeriod(declarations: Declaration[], year: number, month: string): PeriodReport {
        const targetPeriod = `${year}-${month}`;
        const periodDeclarations = declarations.filter(declaration =>
            declaration.period === targetPeriod
        );
        if (periodDeclarations.length === 0) {
            return {
                period: targetPeriod,
                totalDeclarations: 0,
                totalIncome: 0,
                totalTaxCollected: 0,
                pending: 0,
                completed: 0,
                list: [],
            };
        }
        const totalDeclarations = periodDeclarations.length;
        const totalIncome = periodDeclarations.reduce((sum, declaration) => sum + declaration.totalIncome, 0);
        const totalTaxCollected = periodDeclarations.reduce((sum, declaration) => sum + declaration.taxAmount, 0);
        const statusCounts = periodDeclarations.reduce((counts, declaration) => {
            counts[declaration.status]++;
            return counts;
        }, { completed: 0, pending: 0 });

        return {
            period: targetPeriod,
            totalDeclarations,
            totalIncome,
            totalTaxCollected,
            pending: statusCounts.pending,
            completed: statusCounts.completed,
            list: periodDeclarations
        };
    }

    /**
     * Método alternativo que recibe el período como string
     * @param declarations - Array completo de declaraciones
     * @param period - Período en formato "YYYY-MM" (ej: "2025-01")
     * @returns Objeto con el resumen del período solicitado
     */
    getReportByPeriodString(declarations: Declaration[], period: string): PeriodReport {
        const periodDeclarations = declarations.filter(declaration =>
            declaration.period === period
        );

        if (periodDeclarations.length === 0) {
            return {
                period,
                totalDeclarations: 0,
                totalIncome: 0,
                totalTaxCollected: 0,
                pending: 0,
                completed: 0,
                list: []
            };
        }

        const totalDeclarations = periodDeclarations.length;
        const totalIncome = periodDeclarations.reduce((sum, decl) => sum + decl.totalIncome, 0);
        const totalTaxCollected = periodDeclarations.reduce((sum, decl) => sum + decl.taxAmount, 0);

        const statusCounts = periodDeclarations.reduce((counts, decl) => {
            counts[decl.status]++;
            return counts;
        }, { completed: 0, pending: 0, processing: 0 });

        return {
            period,
            totalDeclarations,
            totalIncome,
            totalTaxCollected,
            pending: statusCounts.pending,
            completed: statusCounts.completed,
            list: periodDeclarations
        };
    }

    /**
     * Método para formatear el resultado como string para mostrar en UI
     * @param report - Objeto PeriodReport
     * @returns String formateado para mostrar
     */
    formatReportDisplay(report: PeriodReport): string {
        return `
            Período ${report.period}:
            - Total declaraciones: ${report.totalDeclarations}
            - Ingresos totales: $${report.totalIncome.toLocaleString()}
            - Impuestos recaudados: $${report.totalTaxCollected.toLocaleString()}
            - Pendientes: ${report.pending}
            - Completadas: ${report.completed}
            `.trim();
    }
}
