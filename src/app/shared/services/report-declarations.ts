import { Injectable } from '@angular/core';
import html2pdf from 'html2pdf.js';
import { PeriodReport } from '../util/report.declarations';

interface TaxType {
  id: string;
  name: string;
  description: string;
  rate: number;
}

interface TaxDeclaration {
  id: string;
  userId: number;
  period: string;
  totalIncome: number;
  totalExpenses: number;
  taxableIncome: number;
  taxAmount: number;
  status: 'completed' | 'pending' | 'processing';
  taxTypeId: number;
  receiptUrl?: string;
  taxType: TaxType;
}

@Injectable({
  providedIn: 'root'
})
export class ReportDeclarations {
  /**
    * Genera y descarga un PDF usando html2pdf con diseño Bootstrap
    * @param reportData - Datos del reporte a incluir en el PDF
    */
  async generatePeriodReportPDF(reportData: PeriodReport): Promise<void> {
    const htmlContent = this.generateHTMLContent(reportData);

    const options = {
      margin: [0.3, 0.3, 0.3, 0.3] as [number, number, number, number],
      filename: `reporte_fiscal_${reportData.period.replace('-', '_')}.pdf`,
      image: {
        type: 'jpeg' as const,
        quality: 0.98
      },
      html2canvas: {
        scale: 1.5,
        useCORS: true,
        letterRendering: true,
        allowTaint: false,
        width: 794,
        height: 1123,
        scrollX: 0,
        scrollY: 0
      },
      jsPDF: {
        unit: 'mm' as const,
        format: 'a4' as const,
        orientation: 'portrait' as const,
        compress: true
      },
      pagebreak: {
        mode: ['avoid-all', 'css', 'legacy'] as const
      }
    };

    try {
      const element = document.createElement('div');
      element.innerHTML = htmlContent;
      element.style.width = '190mm';
      element.style.maxWidth = '190mm';
      element.style.minHeight = '270mm';
      element.style.padding = '0';
      element.style.margin = '0';
      element.style.boxSizing = 'border-box';
      element.style.overflow = 'hidden';

      // Generar y descargar PDF
      await html2pdf().set(options).from(element).save();

      element.remove();
    } catch (error) {
      console.error('Error al generar PDF:', error);
      throw new Error('No se pudo generar el reporte PDF');
    }
  }

  /**
   * Genera el contenido HTML del reporte con estilos Bootstrap inline
   * @param reportData - Datos del reporte
   * @returns HTML string con el reporte completo
   */
  private generateHTMLContent(reportData: PeriodReport): string {
    const periodFormatted = this.formatPeriodTitle(reportData.period);
    const currentDate = new Date().toLocaleDateString('es-PE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const statistics = this.calculateStatistics(reportData);

    return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reporte Período ${periodFormatted}</title>
  <style>
    /* Reset y configuración base */
    * {
      margin: 0 0 0 10px;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.4;
      color: #212529;
      font-size: 12px;
    }

    .container {
      width: 100%;
      max-width: 190mm; /* Ajustado para A4 */
      margin: 0 auto;
      padding: 30px; /* Reducido */
      box-sizing: border-box;
    }

    /* Colores Bootstrap */
    .bg-primary { background-color: #0d6efd !important; }
    .bg-success { background-color: #198754 !important; }
    .bg-warning { background-color: #ffc107 !important; }
    .bg-danger { background-color: #dc3545 !important; }
    .bg-secondary { background-color: #6c757d !important; }
    .bg-light { background-color: #f8f9fa !important; }
    .bg-dark { background-color: #212529 !important; }
    
    .text-white { color: #ffffff !important; }
    .text-dark { color: #212529 !important; }
    .text-center { text-align: center !important; }
    .text-end { text-align: right !important; }

    /* Header */
    .header {
      background: linear-gradient(135deg, #0d6efd 0%, #0b5ed7 100%);
      color: white;
      padding: 20px; /* Reducido */
      margin: -15px -15px 25px 15px; /* Ajustado */
      border-radius: 0;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }

    .header h1 {
      font-size: 24px;
      font-weight: 700;
      margin-bottom: 5px;
      text-shadow: 0 2px 4px rgba(0,0,0,0.3);
    }

    .header .subtitle {
      font-size: 14px;
      opacity: 0.9;
      font-weight: 300;
    }

    /* Secciones */
    .section {
      margin-bottom: 30px;
      page-break-inside: avoid;
    }

    .section-title {
      font-size: 18px;
      font-weight: 600;
      color: #0d6efd;
      margin-bottom: 15px;
      padding-bottom: 8px;
      border-bottom: 3px solid #e9ecef;
    }

    /* Cards de resumen */
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); /* Reducido */
      gap: 12px; /* Reducido */
      margin-bottom: 20px; /* Reducido */
    }

    .summary-card {
      background: white;
      border: 1px solid #dee2e6;
      border-radius: 6px; /* Reducido */
      padding: 12px; /* Reducido */
      text-align: center;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .summary-card .icon {
      font-size: 24px;
      margin-bottom: 8px;
    }

    .summary-card .label {
      font-size: 11px;
      color: #6c757d;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .summary-card .value {
      font-size: 16px;
      font-weight: 700;
      color: #212529;
      margin-top: 4px;
    }

    /* Tablas */
    .table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
      background: white;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .table th {
      background: #6c757d;
      color: white;
      padding: 8px 6px; /* Reducido */
      text-align: center;
      font-weight: 600;
      font-size: 10px; /* Reducido */
      text-transform: uppercase;
      letter-spacing: 0.3px;
      border-bottom: 2px solid #495057;
      word-wrap: break-word;
    }

    .table td {
      padding: 8px 6px; /* Reducido */
      border-bottom: 1px solid #e9ecef;
      font-size: 10px; /* Reducido */
      vertical-align: middle;
      word-wrap: break-word;
      max-width: 0; /* Para forzar word-wrap */
    }

    .table tbody tr:nth-child(even) {
      background-color: #f8f9fa;
    }

    .table tbody tr:hover {
      background-color: #e3f2fd;
    }

    /* Estados con colores */
    .status-badge {
      display: inline-block;
      padding: 4px 8px;
      border-radius: 12px;
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }

    .status-completed {
      background-color: #198754;
      color: white;
    }

    .status-pending {
      background-color: #ffc107;
      color: #212529;
    }

    .status-processing {
      background-color: #0d6efd;
      color: white;
    }

    /* Utilidades de texto */
    .currency {
      font-family: 'Courier New', monospace;
      font-weight: 600;
      font-size: 12px; /* Reducido para mejor ajuste */
    }

    .text-right {
      text-align: right;
    }

    /* Responsive para tabla */
    @media screen and (max-width: 800px) {
      .table {
        font-size: 8px;
      }
      .table th, .table td {
        padding: 6px 4px;
      }
    }

    /* Footer */
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 2px solid #e9ecef;
      font-size: 10px;
      color: #6c757d;
      text-align: center;
    }

    .footer-grid {
      display: grid;
      grid-template-columns: 1fr auto 1fr;
      align-items: center;
      gap: 20px;
    }

    .footer .left { text-align: left; }
    .footer .right { text-align: right; }

    /* Estadísticas */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 15px;
      margin-top: 20px;
    }

    .stat-item {
      background: #f8f9fa;
      border: 1px solid #e9ecef;
      border-radius: 6px;
      padding: 12px;
    }

    .stat-item .stat-label {
      font-size: 11px;
      color: #6c757d;
      font-weight: 500;
    }

    .stat-item .stat-value {
      font-size: 14px;
      font-weight: 700;
      color: #0d6efd;
    }

    /* Page breaks */
    .page-break {
      page-break-before: always;
    }

    @media print {
      .container { padding: 10px; }
      .summary-grid { grid-template-columns: repeat(3, 1fr); }
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- HEADER -->
    <div class="header">
      <h1 class="text-center">Reporte Período ${periodFormatted}</h1>
      <div class="subtitle text-center">Generado el: ${currentDate}</div>
    </div>

    <!-- RESUMEN EJECUTIVO -->
    <div class="section">
      <h2 class="section-title">Resumen Ejecutivo</h2>
      
      <div class="summary-grid">
        <div class="summary-card">
          <div class="icon">📊</div>
          <div class="label">Total Declaraciones</div>
          <div class="value">${reportData.totalDeclarations}</div>
        </div>
        
        <div class="summary-card">
          <div class="icon">💰</div>
          <div class="label">Ingresos Totales</div>
          <div class="value currency">S/. ${reportData.totalIncome.toLocaleString('es-PE')}</div>
        </div>
        
        <div class="summary-card">
          <div class="icon">🏛️</div>
          <div class="label">Impuestos Recaudados</div>
          <div class="value currency">S/. ${reportData.totalTaxCollected.toLocaleString('es-PE')}</div>
        </div>
        
        <div class="summary-card">
          <div class="icon">✅</div>
          <div class="label">Completadas</div>
          <div class="value">${reportData.completed}</div>
        </div>
        
        <div class="summary-card">
          <div class="icon">⏳</div>
          <div class="label">Pendientes</div>
          <div class="value">${reportData.pending}</div>
        </div>
        
        ${reportData.processing ? `
        <div class="summary-card">
          <div class="icon">⚙️</div>
          <div class="label">En Proceso</div>
          <div class="value">${reportData.processing}</div>
        </div>
        ` : ''}
      </div>

      <!-- Estadísticas adicionales -->
      <div class="stats-grid">
        <div class="stat-item">
          <div class="stat-label">Ingreso Promedio</div>
          <div class="stat-value currency">S/. ${statistics.averageIncome.toLocaleString('es-PE')}</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">Impuesto Promedio</div>
          <div class="stat-value currency">S/. ${statistics.averageTax.toLocaleString('es-PE')}</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">Tasa Efectiva Promedio</div>
          <div class="stat-value">${statistics.effectiveRate.toFixed(2)}%</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">Porcentaje Completado</div>
          <div class="stat-value">${statistics.completedPercentage.toFixed(1)}%</div>
        </div>
      </div>
    </div>

    <!-- DETALLE DE DECLARACIONES -->
    <div class="section">
      <h2 class="section-title">Detalle de Declaraciones</h2>
      
      <table class="table">
        <thead>
          <tr>
            <th>Ingresos</th>
            <th>Gastos</th>
            <th>Base Imponible</th>
            <th>Impuesto</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          ${reportData.list.map(declaration => `
            <tr>
              <td class="text-right currency">S/. ${declaration.totalIncome.toLocaleString('es-PE')}</td>
              <td class="text-right currency">S/. ${declaration.totalExpenses.toLocaleString('es-PE')}</td>
              <td class="text-right currency">S/. ${declaration.taxableIncome.toLocaleString('es-PE')}</td>
              <td class="text-right currency">S/. ${declaration.taxAmount.toLocaleString('es-PE')}</td>
              <td class="text-center">
                <span class="status-badge status-${declaration.status}">
                  ${this.getStatusDisplay(declaration.status)}
                </span>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>

    <!-- FOOTER -->
    <div class="footer">
      <div class="footer-grid">
        <div class="left">
          <strong>Sistema de Gestión Fiscal</strong><br>
          Reporte generado automáticamente
        </div>
        <div class="center">
          Dev: Luis Simon Martinez
        </div>
        <div class="right">
          <strong>Documento Oficial</strong><br>
          ${currentDate}
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;
  }

  /**
   * Convierte el período en formato legible
   * @param period - Período en formato "YYYY-MM"
   * @returns Período formateado (ej: "Septiembre 2025")
   */
  private formatPeriodTitle(period: string): string {
    const [year, month] = period.split('-');
    const monthNames = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];

    const monthIndex = parseInt(month) - 1;
    return `${monthNames[monthIndex]} ${year}`;
  }

  /**
   * Convierte el estado en texto legible
   * @param status - Estado de la declaración
   * @returns Estado formateado
   */
  private getStatusDisplay(status: string): string {
    const statusMap = {
      'completed': 'Completado',
      'pending': 'Pendiente',
      'processing': 'En Proceso'
    };
    return statusMap[status as keyof typeof statusMap] || status;
  }

  /**
   * Calcula estadísticas adicionales para el reporte
   * @param reportData - Datos del reporte
   * @returns Objeto con estadísticas calculadas
   */
  private calculateStatistics(reportData: PeriodReport) {
    const declarations = reportData.list;
    const totalDeclarations = declarations.length;

    const averageIncome = totalDeclarations > 0
      ? reportData.totalIncome / totalDeclarations
      : 0;

    const averageTax = totalDeclarations > 0
      ? reportData.totalTaxCollected / totalDeclarations
      : 0;

    const effectiveRate = reportData.totalIncome > 0
      ? (reportData.totalTaxCollected / reportData.totalIncome) * 100
      : 0;

    const completedPercentage = totalDeclarations > 0
      ? (reportData.completed / totalDeclarations) * 100
      : 0;

    return {
      averageIncome,
      averageTax,
      effectiveRate,
      completedPercentage
    };
  }
}
