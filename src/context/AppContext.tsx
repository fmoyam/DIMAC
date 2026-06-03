/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Noticia, Tramite, Cita, Taller, TicketConsulta, Usuario, TramiteEstado } from '../types';

interface AppContextType {
  usuarioActual: Usuario | null;
  noticias: Noticia[];
  tramites: Tramite[];
  citas: Cita[];
  talleres: Taller[];
  tickets: TicketConsulta[];
  notifications: string[];
  simulationTime: Date;
  loginClaveUnica: (rut: string, nombre: string) => Promise<boolean>;
  loginFuncionario: (email: string, rol: 'funcionario_social' | 'funcionario_admin') => Promise<boolean>;
  logout: () => void;
  requestContactUpdate: (nuevoEmail: string, nuevoTelefono: string) => string; // Returns the code
  verifyContactUpdate: (codigo: string) => { success: boolean; message: string };
  scheduleCita: (servicio: Cita['servicio'], fecha: string, hora: string) => { success: boolean; message: string; code?: string };
  cancelCita: (id: string) => void;
  reprogramCita: (id: string, nuevaFecha: string, nuevaHora: string) => { success: boolean; message: string };
  registerTaller: (tallerId: string) => { success: boolean; code: 'OK' | 'WAITLIST' | 'PROFILE_INCOMPLETE'; message: string };
  cancelTaller: (tallerId: string) => void;
  submitTicket: (area: TicketConsulta['area'], asunto: string, mensaje: string, archivo: File | null) => { success: boolean; ticketId: string; message: string };
  replyTicket: (id: string, respuesta: string) => void;
  addNoticia: (nueva: Omit<Noticia, 'id'>) => void;
  updateNoticia: (id: string, editada: Partial<Noticia>, notificarInteresados?: boolean) => void;
  deleteNoticia: (id: string) => void;
  observeDocument: (tramiteId: string, documentoId: string, comentario: string) => void;
  approveDocument: (tramiteId: string, documentoId: string) => void;
  uploadDocumentSimulate: (tramiteId: string, documentoId: string, fileNombre: string, fileSize: number) => void;
  changeTramiteEstado: (tramiteId: string, nuevoEstado: TramiteEstado) => { success: boolean; errorDocs?: string[] };
  triggerConcurrenciaSimulation: () => void;
  clearNotifications: () => void;
  setSimulationTime: (date: Date) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Fix date context relative to the Mockups:
// Let's assume current simulation date is Wednesday Oct 18, 2023 to match the screenshots.
const MOCK_CURRENT_DATE = new Date('2023-10-18T10:00:00');

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // --- Persistent Storage Helpers ---
  const getStored = <T,>(key: string, backup: T): T => {
    try {
      const item = localStorage.getItem(`dimac_${key}`);
      return item ? JSON.parse(item) : backup;
    } catch {
      return backup;
    }
  };

  const setStored = (key: string, data: any) => {
    localStorage.setItem(`dimac_${key}`, JSON.stringify(data));
  };

  // --- Core States ---
  const [usuarioActual, setUsuarioActual] = useState<Usuario | null>(() => getStored<Usuario | null>('usuario', null));
  const [notifications, setNotifications] = useState<string[]>(() => getStored<string[]>('notifications', []));
  const [simulationTime, setSimTime] = useState<Date>(() => new Date(getStored<string>('simulation_time', MOCK_CURRENT_DATE.toISOString())));

  // --- Mock Data Initializers ---
  const [noticias, setNoticias] = useState<Noticia[]>(() => getStored<Noticia[]>('noticias', [
    {
      id: 'news-1',
      titulo: 'DIMAC en tu Barrio: Villa Los Héroes',
      cuerpo: 'Este sábado acercaremos los servicios de aseo y ornato, junto con inscripción de mascotas a la junta de vecinos de Villa Los Héroes. Los profesionales municipales realizarán vacunación antirrábica e implantación de microchips gratuitos para perros y gatos. Ven con tu familia y tus mascotas.',
      categoria: 'Operativo',
      fecha: '2023-10-15',
      imagen: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDg_zedGfyNIuoLuWy2UMT-WdrlMzT_cwqaVLnJ5b515-zEJDVwPP035moGX09saryuj1X3nSeH19gb1RHyCmfHQlIX9Ek87Ao4tbFJRA2ctlgdc3KWb_YZs8sejSNih6UxmcgAZ3wmALUt33hV4CkqYrgWWe_FO5bjuZ5Not_nr139jyKYklLzl6z_aBVe5tR5xi1deZ4NFNCA02MEAUA4orhJvgmSBiC3OIcEEnKnziuewhr7_6BuvR0c-X9VqFqCEpii8_qXkSU',
      visible: true,
      fechaPublicacion: '2023-10-12T09:00:00',
      fechaExpiracion: '2023-10-21T18:00:00',
      archivoFolleto: 'folleto_villa_los_heroes.pdf'
    },
    {
      id: 'news-2',
      titulo: 'Inauguración de Nuevo Centro de Atención',
      cuerpo: 'Conoce las nuevas instalaciones diseñadas para brindarte un servicio más rápido y cómodo en el sector poniente de Maipú. Ofrecemos módulos de atención de Asistencia Social, Subsidios Estatales y Orientación Jurídica básica. Abierto de lunes a viernes, de 08:30 a 14:00 hrs.',
      categoria: 'Infraestructura',
      fecha: '2023-10-12',
      imagen: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBr2SdYI2vbn3Zqjpb_uhuH1vVfRvEl7rqoDG34_EETrTJediqZKr6XYTyebAqYgIKRYHYL7i5ym13zpaQ2rEpnyaUpbBgxzEoPe0jPjxr5bwsVGz7bFfMI7OonPo0KBrxbWr5XUITbT1iuu13P2UrXjnQ6p1G75vMRlt2iSy3dnLKPid3O9deRr6cKSbh8hgZQe4ynzZ3MI4-gNEXGkiS3ON2T4n6FhnOULInFk3vVqZ3D8Hek5qYj4Eut66PiaMBptn5VC6ildcc',
      visible: true,
      fechaPublicacion: '2023-10-10T12:00:00',
      fechaExpiracion: null,
      archivoFolleto: 'info_nuevo_centro.pdf'
    },
    {
      id: 'news-3',
      titulo: 'Actualización del Portal Ciudadano',
      cuerpo: 'Hemos mejorado la plataforma para que solicitar tus certificados y permisos municipales sea más intuitivo que nunca, permitiendo adjuntar documentos digitales y realizar seguimiento automatizado con folios unificados.',
      categoria: 'Tecnología',
      fecha: '2023-10-10',
      imagen: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD3P6haZhj-_GD5nUhhNZofnbUth6B86Oqxs7dPPZKeiTiHgZKBdOWu9PATmH0EDElk2d2KiErE7dSOkgqaSs33VUoN00N9h5YtHB9cTqLYpfzPLD6FtqR5Mn-mnQyWrrGbVEBsa06ptVKLtWYGIuJuU1fbZHsVDGS9CaXUEuBzuS_k5Hv1BqYWJNfFnjJhDQSMOIhtf2uOphtuKYYWftg1_r3mgy9MEH22SyF-lUYJtdkmrNlMM9vp2CSzmaUKsbCERz9a4BVmaWE',
      visible: true,
      fechaPublicacion: '2023-10-08T08:00:00',
      fechaExpiracion: null,
      archivoFolleto: null
    },
    {
      id: 'news-4',
      titulo: 'Campaña Vacunación Influenza - Plaza Maipú',
      cuerpo: 'Operativo masivo de vacunación de influenza en Plaza Maipú. Gratuito para grupos de riesgo: adultos mayores, niños menores de 10 años, embarazadas y enfermos crónicos. Llevar cédula de identidad.',
      categoria: 'Salud',
      fecha: '2023-10-20',
      imagen: 'https://images.unsplash.com/photo-1584036561566-baf8f5f1b144?auto=format&fit=crop&w=800&q=80',
      visible: true,
      fechaPublicacion: '2023-10-14T09:00:00',
      fechaExpiracion: '2023-11-01T15:00:00',
      archivoFolleto: 'requisitos_vacunacion_influenza.pdf'
    }
  ]));

  const [tramites, setTramites] = useState<Tramite[]>(() => {
    const instructivoRSH = '1. Ingresa a la web de Registro Social de Hogares. 2. Logueate con tu Clave Única. 3. Ve a "Mis Trámites" y haz clic en "Descargar Cartola Hogar". 4. Guarda el documento en formato PDF.';
    const instructivoCedula = '1. Toma una foto nítida de tu cédula de identidad por ambos lados. 2. Asegúrate de que las fechas e información de validez estén perfectamente legibles. 3. Convierte o une las fotos en un archivo único PDF o JPG.';
    const instructivoLiquidacion = '1. Accede al portal de tu AFP o previred. 2. Descarga tu certificado de cotizaciones de los últimos 12 meses. 3. Descarga tus últimas 3 liquidaciones de sueldo de tu empleador.';

    return getStored<Tramite[]>('tramites', [
      {
        id: '84729',
        ciudadanoRut: '12.345.678-9',
        ciudadanoNombre: 'Juan Pérez',
        tipo: 'Renovación Patente Comercial',
        estado: 'En Revisión',
        ingresoFecha: '2023-10-12',
        historialEstados: [
          { estado: 'Recibido', fecha: '2023-10-12' },
          { estado: 'En Revisión', fecha: '2023-10-14' }
        ],
        documentos: [
          { id: 'patente-doc-1', nombre: 'Declaración jurada de capital', requerido: true, cargado: true, archivoUrl: 'declaracion_capital.pdf', archivoSizeMB: 1.2, estado: 'Verificado', comentario: null, instructivoPasoAPaso: 'Obtén el formulario de declaración jurada tributaria si tu empresa cuenta con sucursales.' },
          { id: 'patente-doc-2', nombre: 'Patente anterior pagada', requerido: true, cargado: true, archivoUrl: 'patente_2022.pdf', archivoSizeMB: 0.8, estado: 'Verificado', comentario: null, instructivoPasoAPaso: 'Descarga el comprobante de pago de patentes en el sitio de DIMAC Maipú -> Pagos en línea.' }
        ],
        profesionalCargo: 'Lic. Roberto Pérez',
        adjuntoFinal: null
      },
      {
        id: '84701',
        ciudadanoRut: '12.345.678-9',
        ciudadanoNombre: 'Juan Pérez',
        tipo: 'Subsidio Familiar',
        estado: 'Observaciones',
        ingresoFecha: '2023-10-05',
        historialEstados: [
          { estado: 'Recibido', fecha: '2023-10-05' },
          { estado: 'En Revisión', fecha: '2023-10-07' },
          { estado: 'Observaciones', fecha: '2023-10-15' }
        ],
        documentos: [
          { id: 'sub-doc-1', nombre: 'Copia Cedula de Identidad ambos lados', requerido: true, cargado: false, estado: 'Observado', comentario: 'Copia ilegible. Por favor sube una imagen escaneada con mayor resolución donde se resalte bien el texto y foto.', instructivoPasoAPaso: instructivoCedula },
          { id: 'sub-doc-2', nombre: 'Certificado de Nacimiento para Asignación', requerido: true, cargado: true, archivoUrl: 'cert_nacimiento_hijo.pdf', archivoSizeMB: 0.5, estado: 'Verificado', comentario: null, instructivoPasoAPaso: 'Ingresa a www.registrocivil.cl -> Certificados Gratis -> Nacimiento para Asignación Familiar e ingresa el RUT de tu hijo.' },
          { id: 'sub-doc-3', nombre: 'Liquidaciones de Sueldo (Ultimas 3)', requerido: false, cargado: false, estado: 'Pendiente', comentario: null, instructivoPasoAPaso: instructivoLiquidacion }
        ],
        profesionalCargo: 'Lic. Ana Rojas',
        adjuntoFinal: null
      },
      {
        id: 'EXP-2023-089',
        ciudadanoRut: '9.876.543-2',
        ciudadanoNombre: 'María González P.',
        tipo: 'Subsidio Habitacional',
        estado: 'Recibido',
        ingresoFecha: '2023-10-15',
        historialEstados: [
          { estado: 'Recibido', fecha: '2023-10-15' }
        ],
        documentos: [
          { id: 'hab-doc-1', nombre: 'Cartola de Registro Social de Hogares', requerido: true, cargado: true, archivoUrl: 'cartola_rsh.pdf', archivoSizeMB: 1.5, estado: 'Pendiente', comentario: null, instructivoPasoAPaso: instructivoRSH },
          { id: 'hab-doc-2', nombre: 'Certificado de Ahorro para la Vivienda', requerido: true, cargado: true, archivoUrl: 'ahorro_vivienda.pdf', archivoSizeMB: 0.9, estado: 'Pendiente', comentario: null, instructivoPasoAPaso: 'Solicita el certificado de saldo con código de verificación en el portal de tu banco (e.g. BancoEstado).' }
        ],
        profesionalCargo: 'Asistente Social - Roberto Pérez',
        adjuntoFinal: null
      },
      {
        id: 'EXP-2023-088',
        ciudadanoRut: '15.632.147-K',
        ciudadanoNombre: 'Juan Carlos Silva',
        tipo: 'Ayuda Social Directa',
        estado: 'En Análisis',
        ingresoFecha: '2023-10-12',
        historialEstados: [
          { estado: 'Recibido', fecha: '2023-10-12' },
          { estado: 'En Análisis', fecha: '2023-10-14' }
        ],
        documentos: [
          { id: 'asd-doc-1', nombre: 'Certificado de Residencia', requerido: true, cargado: true, archivoUrl: 'residencia.pdf', archivoSizeMB: 0.7, estado: 'Verificado', comentario: null, instructivoPasoAPaso: 'Solicita una junta de vecinos cercana, o presenta una boleta nominativa de servicios básicos.' },
          { id: 'asd-doc-2', nombre: 'Ficha Social de Registro de Vulnerabilidad', requerido: true, cargado: true, archivoUrl: 'ficha_vulnerabilidad.pdf', archivoSizeMB: 2.1, estado: 'Verificado', comentario: null, instructivoPasoAPaso: 'Evaluación aplicada directamente por personal en terreno municipal.' }
        ],
        profesionalCargo: 'Asistente Social - Carolina Lagos',
        adjuntoFinal: null
      },
      {
        id: 'EXP-2023-085',
        ciudadanoRut: '11.222.333-4',
        ciudadanoNombre: 'Ana Rojas T.',
        tipo: 'Registro Social Hogares',
        estado: 'Rechazado',
        ingresoFecha: '2023-10-01',
        historialEstados: [
          { estado: 'Recibido', fecha: '2023-10-01' },
          { estado: 'En Revisión', fecha: '2023-10-05' },
          { estado: 'Rechazado', fecha: '2023-10-10' }
        ],
        documentos: [
          { id: 'rsh-doc-1', nombre: 'Formulario de Solicitud Firmado', requerido: true, cargado: true, archivoUrl: 'form_solicitud_rechazada.pdf', archivoSizeMB: 1.1, estado: 'Observado', comentario: 'Falta firma de uno de los integrantes del hogar mayores de edad.', instructivoPasoAPaso: 'Descarga, imprime, firma por todos los adultos, y vuelve a escanear en óptima calidad.' }
        ],
        profesionalCargo: 'Lic. Ana Rojas',
        adjuntoFinal: null
      }
    ]);
  });

  const [citas, setCitas] = useState<Cita[]>(() => getStored<Cita[]>('citas', [
    {
      id: 'cita-1',
      ciudadanoRut: '12.345.678-9',
      ciudadanoNombre: 'Juan Pérez',
      servicio: 'Asistencia Social',
      fecha: '2023-10-16', // Thursday Oct 16, 2023 based on mockup timeline
      hora: '10:00',
      estado: 'Confirmada',
      lugar: 'Oficina 302, Edificio Consistorial',
      profesional: 'Asistente Social - Roberto Pérez'
    },
    // Past Citas for history
    {
      id: 'cita-hist-1',
      ciudadanoRut: '12.345.678-9',
      ciudadanoNombre: 'Juan Pérez',
      servicio: 'Asesoría Legal',
      fecha: '2023-09-12',
      hora: '09:30',
      estado: 'Completada',
      lugar: 'Módulo Jurídico Central',
      profesional: 'Lic. Roberto Pérez'
    },
    {
      id: 'cita-hist-2',
      ciudadanoRut: '12.345.678-9',
      ciudadanoNombre: 'Juan Pérez',
      servicio: 'Subsidios',
      fecha: '2023-08-05',
      hora: '11:30',
      estado: 'Cancelada',
      lugar: 'Oficina de Beneficios del Estado',
      profesional: 'Asistente Social - Carolina Lagos'
    },
    {
      id: 'cita-hist-3',
      ciudadanoRut: '12.345.678-9',
      ciudadanoNombre: 'Juan Pérez',
      servicio: 'Vivienda',
      fecha: '2023-05-15',
      hora: '10:00',
      estado: 'Completada',
      lugar: 'Departamento de Vivienda, Piso 2',
      profesional: 'Ing. Rodrigo Castillo'
    },
    // Mock citas for statistics (HU-09)
    {
      id: 'cita-stat-1',
      ciudadanoRut: '10.222.111-3',
      ciudadanoNombre: 'Camila Ríos',
      servicio: 'Asistencia Social',
      fecha: '2023-10-18',
      hora: '09:00',
      estado: 'Completada',
      lugar: 'Oficina 302, Edificio Consistorial',
      profesional: 'Asistente Social - Roberto Pérez'
    },
    {
      id: 'cita-stat-2',
      ciudadanoRut: '14.555.666-7',
      ciudadanoNombre: 'Diego Díaz',
      servicio: 'Asesoría Legal',
      fecha: '2023-10-18',
      hora: '10:00',
      estado: 'Confirmada',
      lugar: 'Módulo Jurídico Central',
      profesional: 'Lic. Roberto Pérez'
    },
    {
      id: 'cita-stat-3',
      ciudadanoRut: '16.777.888-9',
      ciudadanoNombre: 'Gabriela Soto',
      servicio: 'Vivienda',
      fecha: '2023-10-18',
      hora: '11:00',
      estado: 'Cancelada',
      lugar: 'Piso 2',
      profesional: 'Rodrigo Castillo'
    }
  ]));

  const [talleres, setTalleres] = useState<Taller[]>(() => getStored<Taller[]>('talleres', [
    {
      id: 'taller-1',
      nombre: 'Taller de Emprendimiento y Modelo de Negocios',
      descripcion: 'Aprende a formular tu propuesta de valor, administrar finanzas y formalizar tu negocio en el centro CAM. Cupos limitados con aforo controlado.',
      cuposMax: 15,
      cuposDisponibles: 3,
      inscritos: ['9.876.543-2', '11.222.333-4', '15.632.147-K'],
      listaEspera: [],
      horario: 'Sábados de 10:00 a 13:00 hrs',
      lugar: 'Sala de Conferencias CAM Poniente'
    },
    {
      id: 'taller-2',
      nombre: 'Taller de Huertos Urbanos Autogestionados',
      descripcion: 'Diseño e implementación de un huerto familiar en espacios reducidos. Ideal para aprender producción de hortalizas y compostaje doméstico.',
      cuposMax: 5,
      cuposDisponibles: 0,
      inscritos: ['9.876.543-2', '11.222.333-4', '15.632.147-K', '14.555.666-7', '16.777.888-9'],
      listaEspera: ['11.111.111-1'],
      horario: 'Miércoles de 16:00 a 18:00 hrs',
      lugar: 'Invernadero Territorial CAM Poniente'
    },
    {
      id: 'taller-3',
      nombre: 'Alfabetización Digital para Adultos Mayores',
      descripcion: 'Uso de smartphone, trámites por internet (DIMAC, Banco Estado, Registro Civil, Clave Única). Totalmente práctico y guiado desde cero.',
      cuposMax: 20,
      cuposDisponibles: 12,
      inscritos: [],
      listaEspera: [],
      horario: 'Martes y Jueves de 15:30 a 17:00 hrs',
      lugar: 'Laboratorio de Computación CAM Poniente'
    },
    {
      id: 'taller-4',
      nombre: 'Yoga al Aire Libre y Meditación Guiada',
      descripcion: 'Desconéctate del estrés diario mediante rutinas suaves de asanas, técnicas de respiración pranayama y relajación profunda al aire libre.',
      cuposMax: 25,
      cuposDisponibles: 18,
      inscritos: [],
      listaEspera: [],
      horario: 'Lunes y Miércoles de 09:00 a 10:15 hrs',
      lugar: 'Plaza Central de Deporte CAM Pajaritos'
    },
    {
      id: 'taller-5',
      nombre: 'Club de Lectura y Creación Literaria',
      descripcion: 'Análisis colectivo de autores nacionales y talleres prácticos de escritura de microcuentos y poesía. Abierto a todas las edades.',
      cuposMax: 12,
      cuposDisponibles: 5,
      inscritos: ['12.345.678-9'],
      listaEspera: [],
      horario: 'Jueves de 18:00 a 19:30 hrs',
      lugar: 'Biblioteca Comunitaria CAM Pajaritos'
    },
    {
      id: 'taller-6',
      nombre: 'Primeros Auxilios Básicos y RCP Comunitario',
      descripcion: 'Capacitación teórico-práctica para actuar frente a paros cardíacos, asfixias, heridas y fracturas en el hogar o entorno inmediato.',
      cuposMax: 18,
      cuposDisponibles: 3,
      inscritos: ['12.345.678-9', '11.222.333-4'],
      listaEspera: [],
      horario: 'Viernes de 17:30 a 20:00 hrs',
      lugar: 'Auditorio del CAM Ciudad Satélite'
    },
    {
      id: 'taller-7',
      nombre: 'Taller de Reciclaje y Ecodiseño de Vestuario',
      descripcion: 'Transformación creativa de excedentes textiles y plásticos en productos útiles, bolsos ecológicos o de-confección estética consciente.',
      cuposMax: 10,
      cuposDisponibles: 0,
      inscritos: ['9.876.543-2', '11.222.333-4', '15.632.147-K', '14.555.666-7', '16.777.888-9', '11.111.111-1', '12.345.678-9', '15.555.222-3', '10.999.888-7', '18.333.444-5'],
      listaEspera: [],
      horario: 'Martes de 10:00 a 12:30 hrs',
      lugar: 'Punto Limpio Aula Verde CAM Ciudad Satélite'
    }
  ]));

  const [tickets, setTickets] = useState<TicketConsulta[]>(() => getStored<TicketConsulta[]>('tickets', [
    {
      id: 'TK-992',
      ciudadanoRut: '12.345.678-9',
      ciudadanoNombre: 'Juan Pérez',
      correo: 'juan.perez@email.com',
      asunto: 'Duda sobre postulación a beca',
      mensaje: 'Buenas tardes, intento subir mis documentos para la beca municipal pero el sistema me indica que el formato no es válido o que supera el tamaño. ¿Qué debo hacer? Saludos.',
      area: 'Social',
      evidenciaUrl: 'comprobante_error.jpg',
      evidenciaNombre: 'comprobante_error.jpg',
      evidenciaSizeMB: 1.8,
      ingresoFecha: '2023-10-18',
      estado: 'Pendiente',
      respuesta: null,
      fechaRespuesta: null
    },
    {
      id: 'TK-988',
      ciudadanoRut: '9.876.543-2',
      ciudadanoNombre: 'María González',
      correo: 'maria.g@gmail.com',
      asunto: 'Horarios de atención DIDECO',
      mensaje: 'Necesito saber si están atendiendo presencialmente esta semana para el trámite de adulto mayor.',
      area: 'Social',
      evidenciaUrl: null,
      evidenciaNombre: null,
      evidenciaSizeMB: null,
      ingresoFecha: '2023-10-17',
      estado: 'Pendiente',
      respuesta: null,
      fechaRespuesta: null
    }
  ]));

  // --- Synced Save Events ---
  useEffect(() => { setStored('usuario', usuarioActual); }, [usuarioActual]);
  useEffect(() => { setStored('noticias', noticias); }, [noticias]);
  useEffect(() => { setStored('tramites', tramites); }, [tramites]);
  useEffect(() => { setStored('citas', citas); }, [citas]);
  useEffect(() => { setStored('talleres', talleres); }, [talleres]);
  useEffect(() => { setStored('tickets', tickets); }, [tickets]);
  useEffect(() => { setStored('notifications', notifications); }, [notifications]);
  useEffect(() => { setStored('simulation_time', simulationTime.toISOString()); }, [simulationTime]);

  const addNotification = (notif: string) => {
    setNotifications(prev => {
      const updated = [notif, ...prev].slice(0, 30);
      return updated;
    });
  };

  const clearNotifications = () => setNotifications([]);

  const setSimulationTime = (date: Date) => {
    setSimTime(date);
    // Auto-archive check! (HU-10-3: Programación de caducidad)
    setNoticias(prev => prev.map(n => {
      if (n.fechaExpiracion && new Date(n.fechaExpiracion) < date) {
        return { ...n, visible: false }; // Archiva
      }
      return n;
    }));
  };

  // --- Authentication Operations ---
  // HU-03-3 (Do not store password / Clave Única logic is delegated to registry)
  const loginClaveUnica = async (rut: string, nombreCompleto: string): Promise<boolean> => {
    // Basic formatting
    let formattedRUT = rut.trim();
    if (!formattedRUT.includes('-') && formattedRUT.length > 2) {
      formattedRUT = formattedRUT.slice(0, -1) + '-' + formattedRUT.slice(-1);
    }
    const citizen: Usuario = {
      rut: formattedRUT || '12.345.678-9',
      nombreCompleto: nombreCompleto || 'Juan Pérez',
      email: 'juan.perez@email.com',
      telefono: '+56 9 1234 5678',
      direccion: 'Av. Esquina Blanca 501, Maipú, Chile',
      rol: 'ciudadano',
      validado: true
    };
    setUsuarioActual(citizen);
    addNotification(`Sesión iniciada correctamente con Clave Única para ${citizen.nombreCompleto}`);
    return true;
  };

  const loginFuncionario = async (email: string, rol: 'funcionario_social' | 'funcionario_admin'): Promise<boolean> => {
    const defaultName = rol === 'funcionario_social' ? 'Asistente Social Roberto' : 'Administrador del CAM';
    const func: Usuario = {
      rut: '7.777.777-7',
      nombreCompleto: defaultName,
      email: email,
      telefono: '+56 9 9999 9999',
      direccion: 'DIMAC Central Maipú',
      rol: rol,
      validado: true
    };
    setUsuarioActual(func);
    addNotification(`Sesión funcionario iniciada: ${func.nombreCompleto} (${rol === 'funcionario_social' ? 'Asistente Social' : 'Administrador'})`);
    return true;
  };

  const logout = () => {
    setUsuarioActual(null);
    addNotification('Cierre de sesión de la plataforma');
  };

  // --- Profile Modifications (HU-04) ---
  const requestContactUpdate = (nuevoEmail: string, nuevoTelefono: string): string => {
    if (!usuarioActual) return '';
    const generatedCode = Math.floor(1000 + Math.random() * 9000).toString(); // HU-04-4 actualizacion efectiva de datos de contacto por codigo
    setUsuarioActual(prev => {
      if (!prev) return null;
      return {
        ...prev,
        pendienteCodigo: {
          codigo: generatedCode,
          nuevoEmail,
          nuevoTelefono,
          expiracion: Date.now() + 5 * 60 * 1000 // 5 minutes expiration
        }
      };
    });
    addNotification(`Se ha solicitado cambiar datos. CÓDIGO DE VERIFICACIÓN generado: ${generatedCode}`);
    return generatedCode;
  };

  const verifyContactUpdate = (codigo: string): { success: boolean; message: string } => {
    if (!usuarioActual || !usuarioActual.pendienteCodigo) {
      return { success: false, message: 'No hay actualizaciones de contacto pendientes.' };
    }

    const { codigo: coreCod, nuevoEmail, nuevoTelefono, expiracion } = usuarioActual.pendienteCodigo;

    // Check expiration
    if (Date.now() > expiracion) {
      setUsuarioActual(prev => prev ? { ...prev, pendienteCodigo: null } : null);
      return { success: false, message: 'El código de verificación ha expirado. Por favor solicita uno nuevo.' };
    }

    if (codigo !== coreCod) {
      return { success: false, message: 'Código incorrecto. Los errores de verificación de capa 8 no invalidarán el intento total de cambio, reintenta.' };
    }

    // Success update!
    setUsuarioActual(prev => {
      if (!prev) return null;
      return {
        ...prev,
        email: nuevoEmail,
        telefono: nuevoTelefono,
        validado: true,
        pendienteCodigo: null
      };
    });

    addNotification(`¡Datos de contacto verificados e incorporados! Correo: ${nuevoEmail} Teléfono: ${nuevoTelefono}`);
    return { success: true, message: 'Tus datos de contacto han sido actualizados y verificados de manera segura.' };
  };

  // --- Appointment Handling (HU-05) ---
  const scheduleCita = (servicio: Cita['servicio'], fecha: string, hora: string): { success: boolean; message: string; code?: string } => {
    if (!usuarioActual) {
      return { success: false, message: 'Debes iniciar sesión con tu Clave Única para agendar.' };
    }

    // 1. Minimum 12 hours anticipation validation (HU-05-3)
    const currentSimString = simulationTime.toISOString().split('T')[0];
    const selectedDateTimeString = `${fecha}T${hora}:00`;
    const appointmentDate = new Date(selectedDateTimeString);
    const msDiff = appointmentDate.getTime() - simulationTime.getTime();
    const hoursDiff = msDiff / (1000 * 60 * 60);

    if (hoursDiff < 12) {
      return {
        success: false,
        message: 'No es posible agendar. Las citas deben ser reservadas con al menos 12 horas de anticipación.'
      };
    }

    // 2. Concurrencia Simulation (HU-05-2)
    // To simulate concurrencia, we inspect if they scheduled 10:30 (our conflict slot trigger)
    if (hora === '10:30' && fecha === '2023-10-18') {
      return {
        success: false,
        message: '¡Conflicto de reserva! Este bloque acaba de ser tomado simultáneamente por otra persona. Por favor selecciona el bloque de las 11:00 u otro disponible.'
      };
    }

    // 3. Perfect confirmation (HU-05-4)
    const newId = `cita-${Math.floor(100 + Math.random() * 900)}`;
    const newCita: Cita = {
      id: newId,
      ciudadanoRut: usuarioActual.rut,
      ciudadanoNombre: usuarioActual.nombreCompleto,
      servicio,
      fecha,
      hora,
      estado: 'Confirmada',
      lugar: servicio === 'Asistencia Social' ? 'Oficina 302, Edificio Consistorial' :
             servicio === 'Asesoría Legal' ? 'Módulo Jurídico Central' :
             servicio === 'Vivienda' ? 'Piso 2, Oficina de Planificación' : 'Oficina Subsidios Estatales',
      profesional: servicio === 'Asistencia Social' ? 'Asis. Social Roberto Pérez' :
                   servicio === 'Asesoría Legal' ? 'Abogado Rodrigo Díaz' :
                   servicio === 'Vivienda' ? 'Silvia Lagos' : 'Carolina Olea'
    };

    setCitas(prev => [newCita, ...prev]);
    // Send simulated email receipt
    addNotification(`[COMPROBANTE PDF ENVIADO] Comprobante de cita #${newId} enviado a ${usuarioActual.email}`);

    return {
      success: true,
      message: `¡Cita agendada con éxito! Comprobante PDF emitido y despachado al correo ${usuarioActual.email}.`,
      code: newId
    };
  };

  const cancelCita = (id: string) => {
    setCitas(prev => prev.map(c => {
      if (c.id === id) {
        return { ...c, estado: 'Cancelada' };
      }
      return c;
    }));
    addNotification(`Cita #${id} cancelada exitosamente.`);
  };

  const reprogramCita = (id: string, nuevaFecha: string, nuevaHora: string): { success: boolean; message: string } => {
    // Same 12 hours check
    const appointmentDate = new Date(`${nuevaFecha}T${nuevaHora}:00`);
    const msDiff = appointmentDate.getTime() - simulationTime.getTime();
    const hoursDiff = msDiff / (1000 * 60 * 60);

    if (hoursDiff < 12) {
      return {
        success: false,
        message: 'Reprogramación cancelada. El cambio de bloque requiere un mínimo de 12 horas de anticipación.'
      };
    }

    setCitas(prev => prev.map(c => {
      if (c.id === id) {
        return { ...c, fecha: nuevaFecha, hora: nuevaHora, estado: 'Confirmada' };
      }
      return c;
    }));

    addNotification(`Cita #${id} reprogramada para la fecha ${nuevaFecha} a las ${nuevaHora} hrs.`);
    return { success: true, message: 'La reprogramación se completó correctamente.' };
  };

  // --- Workshops Handling (HU-06) ---
  const registerTaller = (tallerId: string): { success: boolean; code: 'OK' | 'WAITLIST' | 'PROFILE_INCOMPLETE'; message: string } => {
    if (!usuarioActual) {
      return { success: false, code: 'PROFILE_INCOMPLETE', message: 'Inicia sesión para postular a los talleres.' };
    }

    // 1. Profile fully complete check (HU-06-4)
    // If phone is blank, or email is blank or matches placeholder, force completing profile!
    const isContactMissing = !usuarioActual.email || !usuarioActual.telefono || usuarioActual.email.trim() === '' || usuarioActual.telefono.trim() === '';
    if (isContactMissing) {
      return {
        success: false,
        code: 'PROFILE_INCOMPLETE',
        message: 'Falta información. Tu teléfono y correo electrónico deben ser ingresados y validados en el Perfil para inscribirte en talleres municipales.'
      };
    }

    let resultStatus: 'OK' | 'WAITLIST' = 'OK';
    let alertMsg = '';

    setTalleres(prev => prev.map(t => {
      if (t.id === tallerId) {
        // Check if already registered
        if (t.inscritos.includes(usuarioActual.rut) || t.listaEspera.includes(usuarioActual.rut)) {
          alertMsg = 'Ya te encuentras registrado en este taller.';
          return t;
        }

        if (t.cuposDisponibles > 0) {
          // Normal booking (HU-06-1)
          alertMsg = `¡Inscripción confirmada! Te has inscrito de forma exitosa en el taller: ${t.nombre}`;
          resultStatus = 'OK';
          return {
            ...t,
            cuposDisponibles: t.cuposDisponibles - 1,
            inscritos: [...t.inscritos, usuarioActual.rut]
          };
        } else {
          // Waitlist booking (HU-06-2)
          alertMsg = `¡Cupos agotados! Se te ha incorporado a la Lista de Espera del taller: ${t.nombre}.`;
          resultStatus = 'WAITLIST';
          return {
            ...t,
            listaEspera: [...t.listaEspera, usuarioActual.rut]
          };
        }
      }
      return t;
    }));

    if (alertMsg.includes('ya te encuentras')) {
      return { success: false, code: 'OK', message: alertMsg };
    }

    addNotification(alertMsg);
    return { success: true, code: resultStatus, message: alertMsg };
  };

  const cancelTaller = (tallerId: string) => {
    if (!usuarioActual) return;

    setTalleres(prev => prev.map(t => {
      if (t.id === tallerId) {
        const isRegistered = t.inscritos.includes(usuarioActual.rut);
        const inWaitlist = t.listaEspera.includes(usuarioActual.rut);

        if (isRegistered) {
          const updatedInscritos = t.inscritos.filter(r => r !== usuarioActual.rut);
          
          if (t.listaEspera.length > 0) {
            // HU-06-3: Cancel of class and release to first waitlisted citizen
            const nextRutInWait = t.listaEspera[0];
            const updatedWait = t.listaEspera.slice(1);
            
            addNotification(`[NOTIFICACIÓN] Cupo liberado. Ciudadano con RUT ${nextRutInWait} ha sido promovido de la Lista de Espera.`);
            
            return {
              ...t,
              inscritos: [...updatedInscritos, nextRutInWait],
              listaEspera: updatedWait
              // Cupos remains 0 because waitlist immediately took the position
            };
          } else {
            // No waitlist, increase cupos
            return {
              ...t,
              inscritos: updatedInscritos,
              cuposDisponibles: t.cuposDisponibles + 1
            };
          }
        } else if (inWaitlist) {
          return {
            ...t,
            listaEspera: t.listaEspera.filter(r => r !== usuarioActual.rut)
          };
        }
      }
      return t;
    }));

    addNotification(`Inscripción retirada del taller.`);
  };

  // --- Support Portal / Buzón / Inquiries (HU-08) ---
  const submitTicket = (area: TicketConsulta['area'], asunto: string, mensaje: string, archivo: File | null): { success: boolean; ticketId: string; message: string } => {
    if (!usuarioActual) {
      return { success: false, ticketId: '', message: 'Inicia sesión antes de proponer consultas.' };
    }

    // Validation (HU-08-3): Check file size matches <10MB requirement
    let fileUrl: string | null = null;
    let fileName: string | null = null;
    let fileSize: number | null = null;

    if (archivo) {
      fileName = archivo.name;
      fileSize = parseFloat((archivo.size / (1024 * 1024)).toFixed(2)); // MB
      if (fileSize > 10) {
        return {
          success: false,
          ticketId: '',
          message: `El archivo supera los 10MB máximos configurados (${fileSize}MB cargados). Por favor comprime tu evidencia.`
        };
      }
      fileUrl = URL.createObjectURL(archivo);
    }

    const nextId = `TK-${Math.floor(100 + Math.random() * 900)}`;
    const newTicket: TicketConsulta = {
      id: nextId,
      ciudadanoRut: usuarioActual.rut,
      ciudadanoNombre: usuarioActual.nombreCompleto,
      correo: usuarioActual.email,
      asunto,
      mensaje,
      area,
      evidenciaUrl: fileUrl,
      evidenciaNombre: fileName,
      evidenciaSizeMB: fileSize,
      ingresoFecha: simulationTime.toISOString().split('T')[0],
      estado: 'Pendiente',
      respuesta: null,
      fechaRespuesta: null
    };

    setTickets(prev => [newTicket, ...prev]);
    addNotification(`[NUEVA CONSULTA REGISTRADA] Ticket correlativo ${nextId} derivado al área de ${area}.`);

    return {
      success: true,
      ticketId: nextId,
      message: `Tu consulta ha sido ingresada con éxito. Folio de registro: ${nextId}. Recibirás respuestas a la brevedad en tu mail: ${usuarioActual.email}.`
    };
  };

  const replyTicket = (id: string, respuesta: string) => {
    setTickets(prev => prev.map(t => {
      if (t.id === id) {
        const ticketOwnerMail = t.correo;
        addNotification(`[SMTP NOTIFICACIÓN ENVIADA] Ticket ${id} respondido. Envío de correo electrónico a ${ticketOwnerMail} completado.`);
        return {
          ...t,
          estado: 'Respondido',
          respuesta,
          fechaRespuesta: simulationTime.toISOString().split('T')[0]
        };
      }
      return t;
    }));
  };

  // --- Public Information Builder (HU-01 & HU-10) ---
  const addNoticia = (nueva: Omit<Noticia, 'id'>) => {
    const nextId = `news-${Math.floor(100 + Math.random() * 900)}`;
    const fresh: Noticia = {
      ...nueva,
      id: nextId,
      imagen: nueva.imagen || 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=800&q=80'
    };

    setNoticias(prev => [fresh, ...prev]);
    addNotification(`Noticia publicada bajo el identificador: ${nextId}.`);
  };

  const updateNoticia = (id: string, editada: Partial<Noticia>, notificarInteresados = false) => {
    setNoticias(prev => prev.map(n => {
      if (n.id === id) {
        if (notificarInteresados) {
          // HU-10-2: Trigger proactive SMTP broadcast simulation
          addNotification(`[ALERTA MASIVA MUNICIPAL] Envío de boletines post-modificación para la campaña "${n.titulo}" completado de forma íntegra por protocolo institucional.`);
        }
        return { ...n, ...editada };
      }
      return n;
    }));
    addNotification(`Noticia o campaña de salud modificada en tiempo real.`);
  };

  const deleteNoticia = (id: string) => {
    setNoticias(prev => prev.filter(n => n.id !== id));
    addNotification(`Noticia removida del listado público.`);
  };

  // --- Social Folder Evaluations (HU-02) ---
  const observeDocument = (tramiteId: string, documentoId: string, comentario: string) => {
    setTramites(prev => prev.map(t => {
      if (t.id === tramiteId) {
        const updatedDocs = t.documentos.map(d => {
          if (d.id === documentoId) {
            return {
              ...d,
              estado: 'Observado',
              comentario,
              cargado: false // Enable reload button for citizen
            };
          }
          return d;
        });

        // Toggle state to 'Observaciones' if evaluating
        return {
          ...t,
          estado: 'Observaciones',
          documentos: updatedDocs
        };
      }
      return t;
    }));

    addNotification(`Documento observado en trámite #${tramiteId}. Comentario registrado: "${comentario}"`);
  };

  const approveDocument = (tramiteId: string, documentoId: string) => {
    setTramites(prev => prev.map(t => {
      if (t.id === tramiteId) {
        const updatedDocs = t.documentos.map(d => {
          if (d.id === documentoId) {
            return { ...d, estado: 'Verificado', comentario: null };
          }
          return d;
        });
        return { ...t, documentos: updatedDocs };
      }
      return t;
    }));

    addNotification(`Documento verificado.`);
  };

  const uploadDocumentSimulate = (tramiteId: string, documentoId: string, fileNombre: string, fileSize: number) => {
    setTramites(prev => prev.map(t => {
      if (t.id === tramiteId) {
        const updatedDocs = t.documentos.map(d => {
          if (d.id === documentoId) {
            return {
              ...d,
              cargado: true,
              archivoUrl: fileNombre,
              archivoSizeMB: fileSize,
              estado: 'Pendiente', // Re-evaluated
              comentario: null
            };
          }
          return d;
        });
        addNotification(`Ciudadano cargó el documento digital: ${fileNombre} (${fileSize}MB) en el trámite #${tramiteId}.`);
        return {
          ...t,
          estado: t.estado === 'Observaciones' ? 'En Revisión' : t.estado,
          documentos: updatedDocs
        };
      }
      return t;
    }));
  };

  const changeTramiteEstado = (tramiteId: string, nuevoEstado: TramiteEstado): { success: boolean; errorDocs?: string[] } => {
    let checkSuccess = true;
    let missingDocsList: string[] = [];

    // Locate the dossier
    const dossier = tramites.find(t => t.id === tramiteId);
    if (!dossier) return { success: false };

    // HU-02-4 Validation: Prevent advancing state to "En Revisión" or "Completado" when missing mandatory files
    if (nuevoEstado === 'En Revisión' || nuevoEstado === 'Completado') {
      const incompleteMandatory = dossier.documentos.filter(d => d.requerido && (!d.cargado || d.estado === 'Observado'));
      if (incompleteMandatory.length > 0) {
        checkSuccess = false;
        missingDocsList = incompleteMandatory.map(d => d.nombre);
      }
    }

    if (!checkSuccess) {
      addNotification(`ERROR DE INTEGRIDAD: Validaciones de expediente impiden marcar como "${nuevoEstado}".`);
      return { success: false, errorDocs: missingDocsList };
    }

    setTramites(prev => prev.map(t => {
      if (t.id === tramiteId) {
        const timestamp = simulationTime.toISOString().split('T')[0];
        
        // Generate mockup pdf if changing to completed
        const generatedFormObject = nuevoEstado === 'Completado' ? `INFORME_SOCIAL_SOCIOPATOLOGICO_APROBADO_${tramiteId}.pdf` : null;
        if (nuevoEstado === 'Completado') {
          addNotification(`[INFORME SOCIAL EMITIDO] Procesamiento digital completado del expediente #${tramiteId}. Documento firmado digitalmente.`);
        }

        return {
          ...t,
          estado: nuevoEstado,
          adjuntoFinal: generatedFormObject,
          historialEstados: [...t.historialEstados, { estado: nuevoEstado, fecha: timestamp }]
        };
      }
      return t;
    }));

    addNotification(`Trámite Folio #${tramiteId} modificado de estado a: "${nuevoEstado}"`);
    return { success: true };
  };

  // --- Trigger Concurrencia helper ---
  const triggerConcurrenciaSimulation = () => {
    addNotification('SIMULACIÓN CONCURRENCIA: Dos solicitantes intentan reservar. El primer boleto fue adjudicado. Segundo recibe advertencia.');
  };

  return (
    <AppContext.Provider
      value={{
        usuarioActual,
        noticias,
        tramites,
        citas,
        talleres,
        tickets,
        notifications,
        simulationTime,
        loginClaveUnica,
        loginFuncionario,
        logout,
        requestContactUpdate,
        verifyContactUpdate,
        scheduleCita,
        cancelCita,
        reprogramCita,
        registerTaller,
        cancelTaller,
        submitTicket,
        replyTicket,
        addNoticia,
        updateNoticia,
        deleteNoticia,
        observeDocument,
        approveDocument,
        uploadDocumentSimulate,
        changeTramiteEstado,
        triggerConcurrenciaSimulation,
        clearNotifications,
        setSimulationTime
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used inside the AppProvider');
  }
  return context;
};
