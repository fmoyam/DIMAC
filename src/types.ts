/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Noticia {
  id: string;
  titulo: string;
  cuerpo: string;
  categoria: 'Operativo' | 'Infraestructura' | 'Tecnología' | 'Salud';
  fecha: string;
  imagen: string;
  visible: boolean;
  fechaPublicacion: string | null; // Programación de noticias (HU-01-2)
  fechaExpiracion: string | null; // Programación de caducidad (HU-10-3)
  archivoFolleto: string | null; // Adjuntar folletos informativos (HU-10-4)
}

export type TramiteEstado = 'Recibido' | 'En Revisión' | 'Observaciones' | 'Completado' | 'En Análisis' | 'Rechazado';

export interface DocumentoRequerido {
  id: string;
  nombre: string;
  requerido: boolean;
  cargado: boolean;
  archivoUrl?: string; // Simulación de archivo subido
  archivoSizeMB?: number;
  estado: 'Pendiente' | 'Verificado' | 'Observado';
  comentario: string | null; // Observación y rechazo (HU-02-3)
  instructivoPasoAPaso: string; // Instructivos (HU-02-2)
}

export interface Tramite {
  id: string; // Folio
  ciudadanoRut: string;
  ciudadanoNombre: string;
  tipo: 'Renovación Patente Comercial' | 'Subsidio Familiar' | 'Subsidio Habitacional' | 'Registro Social Hogares' | 'Ayuda Social Directa';
  estado: TramiteEstado;
  ingresoFecha: string;
  historialEstados: { estado: TramiteEstado; fecha: string }[]; // Visualización de historial de estados (HU-07-3)
  documentos: DocumentoRequerido[];
  profesionalCargo: string;
  adjuntoFinal: string | null; // Descarga de documentos finales (HU-07-4)
}

export interface Cita {
  id: string;
  ciudadanoRut: string;
  ciudadanoNombre: string;
  servicio: 'Asistencia Social' | 'Asesoría Legal' | 'Vivienda' | 'Subsidios';
  fecha: string;
  hora: string;
  estado: 'Confirmada' | 'Reprogramada' | 'Cancelada' | 'Completada';
  lugar: string;
  profesional: string;
}

export interface Taller {
  id: string;
  nombre: string;
  descripcion: string;
  cuposMax: number;
  cuposDisponibles: number;
  inscritos: string[]; // RUTs de ciudadanos inscritos
  listaEspera: string[]; // RUTs de ciudadanos en lista de espera (HU-06-2)
  horario: string;
  lugar: string;
}

export interface TicketConsulta {
  id: string; // #TK-992...
  ciudadanoRut: string;
  ciudadanoNombre: string;
  correo: string;
  asunto: string;
  mensaje: string;
  area: 'Salud' | 'Social' | 'Legal';
  evidenciaUrl: string | null;
  evidenciaNombre: string | null;
  evidenciaSizeMB: number | null; // Validación de aforo o peso máximo (HU-08-3)
  ingresoFecha: string;
  estado: 'Pendiente' | 'Respondido';
  respuesta: string | null;
  fechaRespuesta: string | null;
}

export interface Usuario {
  rut: string;
  nombreCompleto: string;
  email: string;
  telefono: string;
  direccion: string;
  rol: 'ciudadano' | 'funcionario_social' | 'funcionario_admin';
  validado: boolean; // HU-04-4 (noticia de código verificación)
  pendienteCodigo?: {
    codigo: string;
    nuevoEmail: string;
    nuevoTelefono: string;
    expiracion: number;
  } | null;
}
