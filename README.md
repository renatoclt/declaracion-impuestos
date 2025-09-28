## Sistema de Declaración de Impuestos con Angular

## INTEGRANTES
Franklin Joffre Bautista Roca  
Jhosep Junior Espinoza Sanjinez  
Renato Jesus Cohaila La Torre  
Luis Simon Martinez  

## INDICACIONES
1. Proyecto desarrollado con **Angular 20+**.  
2. Instalar dependencias del proyecto con:  
   npm install  
3. Ejecutar el proyecto con:  
   npm start  
4. Levantar la API simulada con **json-server** (base de datos db.json incluida en el proyecto):  
   npx json-server --watch db.json --port 3000  

## CREDENCIALES DE ACCESO

### ADMINISTRADOR
Documento (DNI): 87654321  
Contraseña: admin123  

Permisos:  
- Realizar CRUD de usuarios (contribuyentes).  
- Ver y gestionar los impuestos existentes.  
- Descargar reportes de declaraciones.  

### USUARIO (CONTRIBUYENTE)
Documento (RUC): 20123456789  
Contraseña: 654321  

Permisos:  
- Ver dashboard principal.  
- Declaración de ingresos.  
- Declaración de gastos.  
- Cálculo automático de impuestos.  
- Historial de declaraciones.  

 Importante: En los módulos de ingresos y gastos solo se podrán visualizar y registrar los datos pertenecientes al usuario logueado.  

## FUNCIONALIDADES PRINCIPALES

### PARA CONTRIBUYENTES
- Declaración de ingresos (salarios, honorarios, alquileres, etc.).  
- Declaración de gastos deducibles (educación, salud, etc.).  
- Cálculo automático de impuestos (Impuesto a la Renta, IGV).  
- Generación y descarga de comprobantes en PDF.  
- Revisión de historial de declaraciones.  

### PARA ADMINISTRADORES
- Gestión de contribuyentes (CRUD).  
- Configuración de tipos de impuestos y tasas.  
- Reportes de declaraciones por período.  

## ENDPOINTS CLAVE (json-server)
- GET /users → Lista de usuarios.  
- GET /incomes?userId=1 → Ingresos del contribuyente con ID 1.  
- GET /expenses?userId=1 → Gastos del contribuyente con ID 1.  
- POST /declarations → Crear nueva declaración.  
- GET /taxTypes → Tipos de impuestos disponibles.  

## TECNOLOGÍAS UTILIZADAS
- Angular 20+  
- json-server (API simulada)  
- Reactive Forms  
- Observables / RxJS  
- jsPDF para generación de comprobantes en PDF  

