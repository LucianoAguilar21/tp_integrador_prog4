const PDFDocument = require('pdfkit');
const { PassThrough } = require('stream');

// ─── Paleta de colores institucional ──────────────────────────────────────────
const COLORES = {
  primario:    '#1a3a5c',   // Azul institucional oscuro
  secundario:  '#2e6da4',   // Azul medio
  acento:      '#c8a84b',   // Dorado
  texto:       '#2c2c2c',
  textoClaro:  '#666666',
  fondo:       '#f8f6f0',
  blanco:      '#ffffff',
};

const PdfService = {

  /**
   * Genera diploma individual para un estudiante en un curso
   * @param {Object} curso     - datos del curso
   * @param {Object} estudiante - datos del estudiante
   * @returns {PassThrough} stream del PDF
   */
  generarDiplomaEstudiante(curso, estudiante) {
    const doc    = new PDFDocument({
      size:    'A4',
      layout:  'landscape',
      margins: { top: 0, bottom: 0, left: 0, right: 0 },
    });

    const stream = new PassThrough();
    doc.pipe(stream);

    const { width, height } = doc.page;

    // ── Fondo ────────────────────────────────────────────────────────────────
    doc.rect(0, 0, width, height).fill(COLORES.fondo);

    // ── Marco exterior doble ─────────────────────────────────────────────────
    doc
      .rect(20, 20, width - 40, height - 40)
      .lineWidth(3)
      .stroke(COLORES.acento);

    doc
      .rect(28, 28, width - 56, height - 56)
      .lineWidth(1)
      .stroke(COLORES.secundario);

    // ── Banda superior institucional ──────────────────────────────────────────
    doc
      .rect(20, 20, width - 40, 80)
      .fill(COLORES.primario);

    // ── Nombre de la facultad ─────────────────────────────────────────────────
    doc
      .font('Helvetica-Bold')
      .fontSize(14)
      .fillColor(COLORES.blanco)
      .text(
        'FACULTAD DE CIENCIAS DE LA ADMINISTRACIÓN',
        0, 45,
        { align: 'center', width }
      );

    doc
      .font('Helvetica')
      .fontSize(9)
      .fillColor(COLORES.acento)
      .text('Sistema de Gestión Académica', 0, 65, { align: 'center', width });

    // ── Título DIPLOMA ────────────────────────────────────────────────────────
    doc
      .font('Helvetica-Bold')
      .fontSize(42)
      .fillColor(COLORES.primario)
      .text('DIPLOMA', 0, 125, { align: 'center', width });

    // Línea decorativa bajo el título
    const lineY = 180;
    doc
      .moveTo(width * 0.25, lineY)
      .lineTo(width * 0.75, lineY)
      .lineWidth(2)
      .stroke(COLORES.acento);

    // Ornamentos en la línea
    doc
      .circle(width * 0.25, lineY, 4).fill(COLORES.acento)
      .circle(width * 0.75, lineY, 4).fill(COLORES.acento)
      .circle(width * 0.50, lineY, 6).fill(COLORES.acento);

    // ── Texto principal ───────────────────────────────────────────────────────
    doc
      .font('Helvetica')
      .fontSize(13)
      .fillColor(COLORES.textoClaro)
      .text('La Facultad de Ciencias de la Administración certifica que', 0, 200, {
        align: 'center',
        width,
      });

    // ── Nombre del estudiante ─────────────────────────────────────────────────
    const nombreCompleto =
      `${estudiante.apellido.toUpperCase()}, ${estudiante.nombre}`;

    doc
      .font('Helvetica-Bold')
      .fontSize(28)
      .fillColor(COLORES.primario)
      .text(nombreCompleto, 0, 228, { align: 'center', width });

    // Documento
    doc
      .font('Helvetica')
      .fontSize(11)
      .fillColor(COLORES.textoClaro)
      .text(`D.N.I.: ${estudiante.documento}`, 0, 270, {
        align: 'center',
        width,
      });

    // ── Texto de curso ────────────────────────────────────────────────────────
    doc
      .font('Helvetica')
      .fontSize(13)
      .fillColor(COLORES.textoClaro)
      .text('ha completado satisfactoriamente el curso', 0, 300, {
        align: 'center',
        width,
      });

    doc
      .font('Helvetica-Bold')
      .fontSize(20)
      .fillColor(COLORES.secundario)
      .text(`"${curso.nombre}"`, 0, 323, { align: 'center', width });

    // ── Detalles del curso ────────────────────────────────────────────────────
    const fechaInicio = new Date(curso.fecha_inicio).toLocaleDateString('es-AR', {
      day: '2-digit', month: 'long', year: 'numeric',
    });

    doc
      .font('Helvetica')
      .fontSize(11)
      .fillColor(COLORES.textoClaro)
      .text(
        `Duración: ${curso.cantidad_horas} horas  ·  Inicio: ${fechaInicio}`,
        0, 360,
        { align: 'center', width }
      );

    // ── Sección de firma ──────────────────────────────────────────────────────
    const firmaY = 420;
    const firmaX = width / 2 - 80;

    doc
      .moveTo(firmaX, firmaY)
      .lineTo(firmaX + 160, firmaY)
      .lineWidth(1)
      .stroke(COLORES.texto);

    doc
      .font('Helvetica-Bold')
      .fontSize(10)
      .fillColor(COLORES.texto)
      .text('Dirección Académica', firmaX - 20, firmaY + 6, { width: 200, align: 'center' });

    doc
      .font('Helvetica')
      .fontSize(9)
      .fillColor(COLORES.textoClaro)
      .text('Facultad de Ciencias de la Administración', firmaX - 20, firmaY + 20, {
        width: 200,
        align: 'center',
      });

    // ── Pie: fecha de emisión y número de diploma ─────────────────────────────
    const fechaEmision = new Date().toLocaleDateString('es-AR', {
      day: '2-digit', month: 'long', year: 'numeric',
    });

    doc
      .rect(20, height - 60, width - 40, 40)
      .fill(COLORES.primario);

    doc
      .font('Helvetica')
      .fontSize(9)
      .fillColor(COLORES.blanco)
      .text(
        `Emitido el ${fechaEmision}  ·  Código: DIPL-${curso.id}-${estudiante.id}`,
        0, height - 46,
        { align: 'center', width }
      );

    doc.end();
    return stream;
  },

  /**
   * Genera PDF con listado de inscriptos de un curso
   * @param {Object} curso
   * @param {Array}  inscriptos
   * @returns {PassThrough} stream del PDF
   */
  generarListadoInscriptos(curso, inscriptos) {
    const doc    = new PDFDocument({ size: 'A4', margins: { top: 60, bottom: 60, left: 50, right: 50 } });
    const stream = new PassThrough();
    doc.pipe(stream);

    const { width } = doc.page;
    const contentWidth = width - 100; // márgenes

    // ── Encabezado ────────────────────────────────────────────────────────────
    doc
      .rect(0, 0, width, 80)
      .fill(COLORES.primario);

    doc
      .font('Helvetica-Bold')
      .fontSize(16)
      .fillColor(COLORES.blanco)
      .text('FACULTAD DE CIENCIAS DE LA ADMINISTRACIÓN', 50, 20, {
        width: contentWidth,
      });

    doc
      .font('Helvetica')
      .fontSize(10)
      .fillColor(COLORES.acento)
      .text('Listado de Inscriptos', 50, 45, { width: contentWidth });

    // ── Info del curso ────────────────────────────────────────────────────────
    doc.moveDown(3);

    doc
      .font('Helvetica-Bold')
      .fontSize(14)
      .fillColor(COLORES.primario)
      .text(curso.nombre, { width: contentWidth });

    doc
      .font('Helvetica')
      .fontSize(10)
      .fillColor(COLORES.textoClaro)
      .text(
        `Estado: ${curso.estado}  ·  Inicio: ${new Date(curso.fecha_inicio).toLocaleDateString('es-AR')}  ·  ` +
        `Horas: ${curso.cantidad_horas}  ·  Cupo: ${curso.inscriptos_actuales}/${curso.inscriptos_max}`,
        { width: contentWidth }
      );

    // Línea separadora
    doc
      .moveDown(0.5)
      .moveTo(50, doc.y)
      .lineTo(width - 50, doc.y)
      .lineWidth(2)
      .stroke(COLORES.acento)
      .moveDown(0.5);

    // ── Encabezado de tabla ───────────────────────────────────────────────────
    const tableTop = doc.y;
    const cols = { n: 50, doc: 65, apellido: 130, nombre: 250, email: 350, estado: 490 };

    doc
      .rect(50, tableTop, contentWidth, 20)
      .fill(COLORES.secundario);

    doc
      .font('Helvetica-Bold')
      .fontSize(9)
      .fillColor(COLORES.blanco);

    doc.text('#',         cols.n,       tableTop + 5, { width: 15 });
    doc.text('Documento', cols.doc,     tableTop + 5, { width: 60 });
    doc.text('Apellido',  cols.apellido,tableTop + 5, { width: 115 });
    doc.text('Nombre',    cols.nombre,  tableTop + 5, { width: 95 });
    doc.text('Email',     cols.email,   tableTop + 5, { width: 135 });
    doc.text('Estado',    cols.estado,  tableTop + 5, { width: 60 });

    // ── Filas de tabla ────────────────────────────────────────────────────────
    let currentY = tableTop + 22;

    inscriptos.forEach((ins, index) => {
      // Alternar color de fila
      if (index % 2 === 0) {
        doc.rect(50, currentY - 3, contentWidth, 18).fill('#eef2f7');
      }

      doc
        .font('Helvetica')
        .fontSize(8)
        .fillColor(COLORES.texto);

      doc.text(String(index + 1),     cols.n,       currentY, { width: 15 });
      doc.text(ins.documento,         cols.doc,     currentY, { width: 60 });
      doc.text(ins.apellido,          cols.apellido,currentY, { width: 115 });
      doc.text(ins.nombre,            cols.nombre,  currentY, { width: 95 });
      doc.text(ins.email,             cols.email,   currentY, { width: 135 });
      doc.text(ins.estado_inscripcion,cols.estado,  currentY, { width: 60 });

      currentY += 18;

      // Nueva página si se acaba el espacio
      if (currentY > doc.page.height - 80) {
        doc.addPage();
        currentY = 60;
      }
    });

    // ── Total y pie ───────────────────────────────────────────────────────────
    doc
      .moveDown(1)
      .font('Helvetica-Bold')
      .fontSize(10)
      .fillColor(COLORES.primario)
      .text(`Total de inscriptos: ${inscriptos.length}`, { align: 'right' });

    doc
      .font('Helvetica')
      .fontSize(8)
      .fillColor(COLORES.textoClaro)
      .text(
        `Generado el ${new Date().toLocaleString('es-AR')}`,
        { align: 'right' }
      );

    doc.end();
    return stream;
  },
};

module.exports = PdfService;