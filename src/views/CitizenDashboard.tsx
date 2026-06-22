/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Noticia, Tramite, Cita, Taller, TicketConsulta, TramiteEstado } from '../types';
import { PDFModal } from '../components/PDFModal';

interface CitizenDashboardProps {
  onOpenClaveUnica: () => void;
  subView: string;
  setSubView: (view: string) => void;
  onLogout?: () => void;
}

export const CitizenDashboard: React.FC<CitizenDashboardProps> = ({
  onOpenClaveUnica,
  subView,
  setSubView,
  onLogout,
}) => {
  const {
    usuarioActual,
    noticias,
    tramites,
    citas,
    talleres,
    tickets,
    simulationTime,
    requestContactUpdate,
    verifyContactUpdate,
    scheduleCita,
    cancelCita,
    reprogramCita,
    registerTaller,
    cancelTaller,
    submitTicket,
    uploadDocumentSimulate,
  } = useApp();

  const [isNavExpanded, setIsNavExpanded] = useState(false);

  // --- Dynamic Geolocalization & News States ---
  const [selectedNews, setSelectedNews] = useState<Noticia | null>(null);
  const [simulatedAddress, setSimulatedAddress] = useState(usuarioActual?.direccion || 'Av. Esquina Blanca 501, Maipú, Chile');
  const [selectedTalleresCam, setSelectedTalleresCam] = useState<string>('todos');

  const getSimulatedCAMInfo = (address: string) => {
    const addr = address.toLowerCase();
    if (addr.includes('satélite') || addr.includes('satelite') || addr.includes('melipilla') || addr.includes('austro') || addr.includes('galaxia')) {
      return {
        name: 'CAM Ciudad Satélite',
        address: 'Parque Central Oriente 100, Ciudad Satélite',
        distance: '650 metros',
        travelTime: '8 minutos caminando',
        phone: '+56 2 2677 6890',
        newsFilter: 'Ciudad Satélite',
        slug: 'satelite',
        bannerColor: 'bg-emerald-600',
        badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200'
      };
    } else if (addr.includes('pajaritos') || addr.includes('consistorial') || addr.includes('plaza') || addr.includes('portales') || addr.includes('central') || addr.includes('norte')) {
      return {
        name: 'CAM Pajaritos',
        address: 'Av. Los Pajaritos 2200, Maipú',
        distance: '920 metros',
        travelTime: '12 minutos caminando',
        phone: '+56 2 2677 6420',
        newsFilter: 'Pajaritos',
        slug: 'pajaritos',
        bannerColor: 'bg-sky-600',
        badgeColor: 'bg-sky-100 text-sky-800 border-sky-300'
      };
    } else {
      return {
        name: 'CAM Poniente',
        address: 'Av. Las Naciones 340, Maipú',
        distance: '1.2 kilómetros',
        travelTime: '5 minutos en auto',
        phone: '+56 2 2677 6511',
        newsFilter: 'Poniente',
        slug: 'poniente',
        bannerColor: 'bg-indigo-600',
        badgeColor: 'bg-indigo-100 text-indigo-850 border-indigo-200'
      };
    }
  };

  // --- Profile States ---
  const [editEmail, setEditEmail] = useState(usuarioActual?.email || '');
  const [editTelefono, setEditTelefono] = useState(usuarioActual?.telefono || '');
  const [verificationCode, setVerificationCode] = useState('');
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [profileMessage, setProfileMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // --- Appointment Booking States ---
  const [selectedService, setSelectedService] = useState<'Asistencia Social' | 'Asesoría Legal' | 'Vivienda' | 'Subsidios'>('Asistencia Social');
  const [selectedDate, setSelectedDate] = useState('2023-10-18'); // Default Oct 10, or Oct 18 standard
  const [selectedHour, setSelectedHour] = useState('10:00');
  const [citaResultMsg, setCitaResultMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // --- Support Box States ---
  const [ticketAsunto, setTicketAsunto] = useState('');
  const [ticketMensaje, setTicketMensaje] = useState('');
  const [ticketArea, setTicketArea] = useState<TicketConsulta['area']>('Social');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [ticketSuccessMsg, setTicketSuccessMsg] = useState<string | null>(null);

  // --- Document Upload States ---
  const [uploadProgressTramite, setUploadProgressTramite] = useState<Tramite | null>(null);
  const [instructiveDoc, setInstructiveDoc] = useState<{ name: string; text: string } | null>(null);

  // --- PDF Download simulation states ---
  const [customPDFData, setCustomPDFData] = useState<{
    isOpen: boolean;
    title: string;
    subtitle: string;
    details: { label: string; value: string }[];
    paragraphs: string[];
    signatureName: string;
    signatureRole: string;
  } | null>(null);

  if (!usuarioActual) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center text-slate-800 bg-white border border-slate-200 rounded-3xl p-8 max-w-lg mx-auto">
        <span className="material-symbols-outlined text-5xl text-secondary animate-pulse mb-4">lock</span>
        <h2 className="text-xl font-bold font-sans">Acceso Restringido</h2>
        <p className="text-sm text-gray-500 mt-2 leading-relaxed">
          Para ver tu panel ciudadano, solicitudes personalizadas y agendar horas, debes estar autenticado en la plataforma.
        </p>
        <button
          onClick={onOpenClaveUnica}
          className="mt-6 px-6 py-2.5 bg-secondary hover:bg-secondary-container text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-all shadow-ambient-l1 cursor-pointer"
        >
          Iniciar sesión con Clave Única
        </button>
      </div>
    );
  }

  // --- 1. My Procedures (Trámites) logic ---
  const personalTramites = tramites.filter(t => t.ciudadanoRut === usuarioActual.rut);

  const handleTriggerUpload = (d: any, tramite: Tramite) => {
    setUploadProgressTramite(tramite);
    // Simulate drop or file selection triggers
    const randomSizeMB = parseFloat((0.5 + Math.random() * 4).toFixed(2));
    const randomFileName = `${d.nombre.replace(/\s+/g, '_')}_CARGADO.pdf`;
    uploadDocumentSimulate(tramite.id, d.id, randomFileName, randomSizeMB);
  };

  const handleLaunchPDFReceipt = (tramite: Tramite) => {
    setCustomPDFData({
      isOpen: true,
      title: `Resolución y Dictamen Municipal`,
      subtitle: `Servicio de Carpeta Digital - DIMAC`,
      details: [
        { label: 'FOLIO EXPEDIENTE', value: tramite.id },
        { label: 'CIUDADANO', value: tramite.ciudadanoNombre },
        { label: 'TIPO DE SOLICITUD', value: tramite.tipo },
        { label: 'FECHA INGRESO', value: tramite.ingresoFecha },
        { label: 'PROFESIONAL EXAMINADOR', value: tramite.profesionalCargo }
      ],
      paragraphs: [
        `Por medio de la presente resolución oficial, el Departamento de Apoyo Comunitario (DIMAC) de la Ilustre Municipalidad de Maipú concluye la revisión de los documentos acompañados y procede a sancionar de forma favorable el beneficio solicitado.`,
        `Habiendo verificado el cumplimiento estricto de las directrices de integridad documental y regularidad municipal, se valida el expediente digital y se despacha la entrega del beneficio correspondiente de acuerdo con la ordenanza presupuestaria vigente chilena.`
      ],
      signatureName: tramite.profesionalCargo,
      signatureRole: 'Asistente de Revisión Social DIMAC'
    });
  };

  // --- 2. Appointments booking logic ---
  const personalCitas = citas.filter(c => c.ciudadanoRut === usuarioActual.rut);

  const handleBookCita = (e: React.FormEvent) => {
    e.preventDefault();
    setCitaResultMsg(null);

    const check = scheduleCita(selectedService, selectedDate, selectedHour);
    if (check.success) {
      setCitaResultMsg({ type: 'success', text: check.message });
      // Clear form success after timeout
      setTimeout(() => setCitaResultMsg(null), 8000);
    } else {
      setCitaResultMsg({ type: 'error', text: check.message });
    }
  };

  const handleDownloadCitaReceipt = (cita: Cita) => {
    setCustomPDFData({
      isOpen: true,
      title: `Comprobante de Reserva de Cita`,
      subtitle: `Servicio Municipal DIMAC Maipú`,
      details: [
        { label: 'CÓDIGO DE RESERVA', value: cita.id },
        { label: 'DEPARTAMENTO / ÁREA', value: cita.servicio },
        { label: 'FECHA DE CITACIÓN', value: cita.fecha },
        { label: 'HORARIO BLOQUE', value: `${cita.hora} hrs` },
        { label: 'OFICINA / LUGAR', value: cita.lugar },
        { label: 'PROFESIONAL DE ATENCIÓN', value: cita.profesional }
      ],
      paragraphs: [
        `Este documento representa su comprobante formal de confirmación para el bloque agendado. Por favor conserve este ticket digital y verifique que cumple con las medidas vigentes de concurrencia y aforo.`,
        `Se le solicita asistir con un margen mínimo de 10 minutos previo a su horario y acompañar copia física de su cédula de identidad en caso de no contar con su expediente digital validado.`
      ],
      signatureName: 'MUNICIPALIDAD DE MAIPÚ',
      signatureRole: 'Gestor de Agendamiento DIMAC'
    });
  };

  // --- 3. Profile data updates -- HU-04 ---
  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMessage(null);

    if (!editEmail.trim() || !editTelefono.trim()) {
      setProfileMessage({ type: 'error', text: 'El correo y teléfono no pueden ser nulos.' });
      return;
    }

    if (editEmail === usuarioActual.email && editTelefono === usuarioActual.telefono) {
      setProfileMessage({ type: 'error', text: 'No has modificado tus datos respecto de los existentes.' });
      return;
    }

    // Trigger Code request (HU-04-4)
    requestContactUpdate(editEmail, editTelefono);
    setShowVerificationModal(true);
  };

  const handleVerifyCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const verify = verifyContactUpdate(verificationCode);
    if (verify.success) {
      setProfileMessage({ type: 'success', text: verify.message });
      setShowVerificationModal(false);
      setVerificationCode('');
    } else {
      setProfileMessage({ type: 'error', text: verify.message });
    }
  };

  // --- 4. Support Box ticket submission -- HU-08 ---
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setUploadedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadedFile(e.target.files[0]);
    }
  };

  const handleSupportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTicketSuccessMsg(null);

    if (!ticketAsunto.trim() || !ticketMensaje.trim()) {
      alert('Por favor complete todos los campos requeridos del formulario.');
      return;
    }

    const check = submitTicket(ticketArea, ticketAsunto, ticketMensaje, uploadedFile);
    if (check.success) {
      setTicketSuccessMsg(check.message);
      setTicketAsunto('');
      setTicketMensaje('');
      setUploadedFile(null);
    } else {
      alert(check.message);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-left">
      {/* Side Menu Navigation matching Mockups layout style */}
      <aside className="col-span-12 lg:col-span-3 flex flex-col bg-[#0b0f59] text-white p-6 rounded-2xl shadow-lg border border-slate-700/30 h-max lg:sticky lg:top-24">
        <div className="flex justify-between items-start mb-6 border-b border-white/10 pb-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-secondary text-white flex items-center justify-center font-black text-sm border-2 border-white/20 shadow-md uppercase">
              {usuarioActual.nombreCompleto.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <h3 className="font-bold text-sm tracking-tight truncate max-w-[150px]">{usuarioActual.nombreCompleto}</h3>
              <p className="text-[10px] text-gray-300 font-mono mt-0.5">{usuarioActual.rut}</p>
            </div>
          </div>
          <button
            title="Desplegar Menú"
            onClick={() => setIsNavExpanded(!isNavExpanded)}
            className="lg:hidden p-2 bg-white/10 rounded-lg text-white hover:bg-white/20 transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-xl leading-none">
              {isNavExpanded ? 'expand_less' : 'menu'}
            </span>
          </button>
        </div>

        <nav className={`flex-col gap-1.5 flex-grow ${isNavExpanded ? 'flex' : 'hidden lg:flex'}`}>
          {/* Active Navigation states have surface-container backgrounds and left borders */}
          <button
            onClick={() => { setSubView('tramites'); setIsNavExpanded(false); }}
            className={`w-full flex items-center gap-3 py-3 rounded-r-lg text-xs font-bold tracking-wide uppercase transition-all text-left ${
              subView === 'tramites'
                ? 'bg-surface-container text-on-surface border-l-4 border-secondary pl-3'
                : 'text-gray-300 hover:text-white hover:bg-white/5 border-l-4 border-transparent pl-4'
            }`}
          >
            <span className="material-symbols-outlined text-base normal-case">description</span>
            <span>Mis Trámites</span>
          </button>

          <button
            onClick={() => { setSubView('citas'); setIsNavExpanded(false); }}
            className={`w-full flex items-center gap-3 py-3 rounded-r-lg text-xs font-bold tracking-wide uppercase transition-all text-left ${
              subView === 'citas'
                ? 'bg-surface-container text-on-surface border-l-4 border-secondary pl-3'
                : 'text-gray-300 hover:text-white hover:bg-white/5 border-l-4 border-transparent pl-4'
            }`}
          >
            <span className="material-symbols-outlined text-base normal-case">calendar_month</span>
            <span>Gestionar Citas</span>
          </button>

          <button
            onClick={() => { setSubView('talleres'); setIsNavExpanded(false); }}
            className={`w-full flex items-center gap-3 py-3 rounded-r-lg text-xs font-bold tracking-wide uppercase transition-all text-left ${
              subView === 'talleres'
                ? 'bg-surface-container text-on-surface border-l-4 border-secondary pl-3'
                : 'text-gray-300 hover:text-white hover:bg-white/5 border-l-4 border-transparent pl-4'
            }`}
          >
            <span className="material-symbols-outlined text-base normal-case">groups</span>
            <span>Talleres CAM</span>
          </button>

          <button
            onClick={() => { setSubView('buzon'); setIsNavExpanded(false); }}
            className={`w-full flex items-center gap-3 py-3 rounded-r-lg text-xs font-bold tracking-wide uppercase transition-all text-left ${
              subView === 'buzon'
                ? 'bg-surface-container text-on-surface border-l-4 border-secondary pl-3'
                : 'text-gray-300 hover:text-white hover:bg-white/5 border-l-4 border-transparent pl-4'
            }`}
          >
            <span className="material-symbols-outlined text-base normal-case">mail_outline</span>
            <span>Consultas / Buzón</span>
          </button>

          <button
            onClick={() => { setSubView('perfil'); setIsNavExpanded(false); }}
            className={`w-full flex items-center gap-3 py-3 rounded-r-lg text-xs font-bold tracking-wide uppercase transition-all text-left ${
              subView === 'perfil'
                ? 'bg-surface-container text-on-surface border-l-4 border-secondary pl-3'
                : 'text-gray-300 hover:text-white hover:bg-white/5 border-l-4 border-transparent pl-4'
            }`}
          >
            <span className="material-symbols-outlined text-base normal-case">manage_accounts</span>
            <span>Mi Perfil</span>
          </button>

          <div className="my-2 border-t border-white/10"></div>

          <button
            onClick={() => { setSubView('noticias'); setIsNavExpanded(false); }}
            className={`w-full flex items-center gap-3 py-3 rounded-r-lg text-xs font-bold tracking-wide uppercase transition-all text-left ${
              subView === 'noticias'
                ? 'bg-surface-container text-on-surface border-l-4 border-secondary pl-3'
                : 'text-gray-300 hover:text-white hover:bg-white/5 border-l-4 border-transparent pl-4'
            }`}
          >
            <span className="material-symbols-outlined text-base normal-case">campaign</span>
            <span>Noticias</span>
          </button>

          {onLogout && (
            <>
              <div className="my-2 border-t border-white/10"></div>
              <button
                onClick={onLogout}
                className="w-full flex items-center gap-3 py-3 rounded-r-lg text-xs font-bold tracking-wide uppercase transition-all text-left text-red-300 hover:text-red-100 hover:bg-red-500/10 border-l-4 border-transparent pl-4 cursor-pointer"
              >
                <span className="material-symbols-outlined text-base normal-case">logout</span>
                <span>Cerrar Sesión</span>
              </button>
            </>
          )}
        </nav>
      </aside>

      {/* Main Content Area Subviews */}
      <div className="col-span-12 lg:col-span-9 space-y-6">
        {/* VIEW 1: MY REQUESTS / TRAMITES (Mockup 4) */}
        {subView === 'tramites' && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-xs">
            <div className="border-b border-gray-100 pb-4 mb-6">
              <h2 className="text-xl font-black text-slate-900 tracking-tight leading-none uppercase">Mis Trámites</h2>
              <p className="text-xs text-gray-500 mt-1">Revisa el estado de tus expedientes ingresados y descarga resoluciones oficiales.</p>
            </div>

            {personalTramites.length === 0 ? (
              <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <span className="material-symbols-outlined text-4xl text-gray-300">folder_open</span>
                <p className="text-xs text-gray-500 mt-2 font-semibold">No registras antecedentes ni carpetas cargadas actualmente.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {personalTramites.map((tramite) => (
                  <div
                    key={tramite.id}
                    className="border border-slate-200 rounded-lg p-5 hover:border-secondary transition-colors bg-white shadow-xs relative overflow-hidden"
                  >
                    {/* Visual warning border accent if observations needed */}
                    {tramite.estado === 'Observaciones' && (
                      <div className="absolute top-0 left-0 w-1 bg-yellow-500 h-full"></div>
                    )}

                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                      <div>
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <span className="bg-slate-900 text-white text-[10px] font-mono uppercase tracking-wider font-semibold px-2 py-0.5 rounded">
                            FOLIO #{tramite.id}
                          </span>
                          <span className="text-[10px] font-semibold text-gray-500">Ingresado el {tramite.ingresoFecha}</span>
                        </div>
                        <h4 className="text-base font-bold text-slate-800 leading-snug">{tramite.tipo}</h4>
                        <p className="text-[10px] text-gray-400 font-mono mt-0.5">Analista: {tramite.profesionalCargo}</p>
                      </div>

                      <div className="flex gap-2">
                        {/* Download final document once completed (HU-07-4) */}
                        {tramite.estado === 'Completado' && tramite.adjuntoFinal && (
                          <button
                            onClick={() => handleLaunchPDFReceipt(tramite)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg px-3 py-1.5 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm hover:scale-102 duration-150 cursor-pointer"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1M2 11l10-10m0 0l10 10m-10-10v12" />
                            </svg>
                            <span>Descargar Resolución PDF</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Timeline Tracker */}
                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 mb-5 text-center">
                      <div className="relative pt-6 pb-2 text-xs font-medium">
                        {/* Tracker horizontal background */}
                        <div className="hidden md:block absolute top-[2.25rem] left-[10%] right-[10%] h-1 bg-gray-200 z-0"></div>
                        
                        {/* Color progress fill based on state */}
                        <div
                          className="hidden md:block absolute top-[2.25rem] left-[10%] h-1 bg-secondary z-0 transition-all duration-300"
                          style={{
                            width: tramite.estado === 'Recibido' ? '0%' :
                                   tramite.estado === 'En Revisión' ? '35%' :
                                   tramite.estado === 'Observaciones' ? '35%' :
                                   tramite.estado === 'En Análisis' ? '35%' : '80%'
                          }}
                        ></div>

                        <div className="flex flex-col md:flex-row justify-between relative z-10 gap-4 md:gap-0">
                          {/* Step 1 */}
                          <div className="flex items-center md:flex-col gap-3 md:gap-1 text-left md:text-center shrink-0">
                            <div className="w-8 h-8 rounded-full bg-secondary text-white font-bold text-xs flex items-center justify-center">
                              <span className="material-symbols-outlined text-sm font-bold">check</span>
                            </div>
                            <div>
                              <p className="font-bold text-slate-800">Recibido</p>
                              <p className="text-[10px] text-gray-400 font-mono">12 Oct</p>
                            </div>
                          </div>

                          {/* Step 2 */}
                          <div className={`flex items-center md:flex-col gap-3 md:gap-1 text-left md:text-center shrink-0 ${['En Revisión', 'En Análisis', 'Observaciones', 'Completado'].includes(tramite.estado) ? '' : 'opacity-40'}`}>
                            <div className="w-8 h-8 rounded-full border-2 border-secondary bg-white text-secondary font-bold text-xs flex items-center justify-center">
                              <span className="material-symbols-outlined text-sm font-bold">hourglass_empty</span>
                            </div>
                            <div>
                              <p className="font-bold text-secondary">Eva. Documental</p>
                              <span className="text-[10px] bg-secondary/10 text-secondary px-1.5 py-0.5 rounded font-bold uppercase">Actual</span>
                            </div>
                          </div>

                          {/* Step 3 */}
                          <div className={`flex items-center md:flex-col gap-3 md:gap-1 text-left md:text-center shrink-0 ${['Observaciones', 'Completado'].includes(tramite.estado) ? '' : 'opacity-40'}`}>
                            <div className={`w-8 h-8 rounded-full font-bold text-xs flex items-center justify-center ${tramite.estado === 'Observaciones' ? 'bg-amber-500 text-white animate-pulse' : 'bg-gray-200 text-gray-500'}`}>
                              <span className="material-symbols-outlined text-sm font-bold">warning</span>
                            </div>
                            <div>
                              <p className="font-bold text-slate-800">Observaciones</p>
                            </div>
                          </div>

                          {/* Step 4 */}
                          <div className={`flex items-center md:flex-col gap-3 md:gap-1 text-left md:text-center shrink-0 ${tramite.estado === 'Completado' ? '' : 'opacity-40'}`}>
                            <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-500 font-bold text-xs flex items-center justify-center">
                              <span className="material-symbols-outlined text-sm font-bold">task_alt</span>
                            </div>
                            <div>
                              <p className="font-bold text-slate-800">Cerrado / Listo</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Pending / Observed Files list to let citizens submit uploads (HU-02-3) */}
                    <div className="space-y-3">
                      <p className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">Documentos Acompañados:</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                        {tramite.documentos.map((doc) => (
                          <div
                            key={doc.id}
                            className={`p-3.5 rounded-lg border text-xs flex flex-col justify-between gap-3 ${
                              doc.estado === 'Observado'
                                ? 'bg-yellow-50 border-yellow-200' 
                                : doc.estado === 'Verificado'
                                ? 'bg-emerald-50/50 border-emerald-100'
                                : 'bg-slate-50/50 border-slate-100'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className="font-bold text-slate-800 leading-none">{doc.nombre}</p>
                                <div className="flex items-center gap-1.5 mt-1 font-mono text-[9px] text-gray-500">
                                  {doc.requerido && <span className="text-red-500 font-bold uppercase">*Obligatorio</span>}
                                  <span>{doc.cargado ? 'Cargado' : 'Pendiente'}</span>
                                </div>
                              </div>
                              <span className={`px-2 py-0.5 rounded text-[9px] font-bold tracking-wider uppercase ${
                                doc.estado === 'Observado' ? 'bg-yellow-100 text-yellow-800' :
                                doc.estado === 'Verificado' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                              }`}>
                                {doc.estado}
                              </span>
                            </div>

                            {/* Comment if Observed (HU-02-3) */}
                            {doc.estado === 'Observado' && doc.comentario && (
                              <p className="bg-white p-2.5 rounded-lg text-[11px] text-yellow-700 italic border border-yellow-100 font-sans leading-relaxed">
                                {doc.comentario}
                              </p>
                            )}

                            {/* Actions area: Instructives checklist + Upload buttons */}
                            <div className="flex gap-2 flex-wrap mt-1 border-t border-slate-200/50 pt-2.5">
                              {/* Instructives help trigger (HU-02-2) */}
                              <button
                                onClick={() => setInstructiveDoc({ name: doc.nombre, text: doc.instructivoPasoAPaso })}
                                className="text-[10px] text-sky-700 hover:underline font-bold uppercase tracking-wider flex items-center gap-1"
                              >
                                <span className="material-symbols-outlined text-[13px] font-bold">help_outline</span>
                                <span>¿Cómo obtenerlo?</span>
                              </button>

                              {/* Upload Simulator button if observed or pending (HU-02-3) */}
                              {(!doc.cargado || doc.estado === 'Observado') && (
                                <button
                                  onClick={() => handleTriggerUpload(doc, tramite)}
                                  className="ml-auto bg-secondary hover:bg-secondary-container text-white rounded px-2.5 py-1 text-[10px] font-bold tracking-wider uppercase transition-colors pointer-events-auto cursor-pointer"
                                >
                                  Cargar Archivo
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* VIEW 2: GESTION DE CITAS (Mockup 3) */}
        {subView === 'citas' && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-xs text-left">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-4 mb-6">
              <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight leading-none uppercase">Gestión de Citas</h2>
                <p className="text-xs text-gray-500 mt-1">Programa y revisa tus bloques de atención con asistentes municipales.</p>
              </div>
            </div>

            {/* Layout Grid: Scheduling Card vs Timeline Tracker */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Form & Calendar (col-span-8) */}
              <div className="lg:col-span-8 bg-slate-50 border border-slate-100 p-5 rounded-2xl flex flex-col gap-6">
                <div>
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Paso 1: Seleccionar Departamento</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { icon: 'diversity_3', label: 'Asistencia Social' },
                      { icon: 'gavel', label: 'Asesoría Legal' },
                      { icon: 'home_work', label: 'Vivienda' },
                      { icon: 'payments', label: 'Subsidios' }
                    ].map((item) => (
                      <button
                        key={item.label}
                        type="button"
                        onClick={() => setSelectedService(item.label as any)}
                        className={`p-3.5 border rounded-lg flex flex-col items-center justify-center text-center transition-all cursor-pointer ${
                          selectedService === item.label
                            ? 'bg-secondary/5 border-secondary text-secondary font-bold scale-[1.02] shadow-sm'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <span className="material-symbols-outlined text-2xl mb-1.5">{item.icon}</span>
                        <span className="text-[10px] uppercase tracking-wide leading-tight">{item.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Paso 2: Registrar Fecha de Reserva</h3>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full text-xs h-10 px-4 bg-white border border-slate-300 rounded-lg focus:border-secondary focus:ring-1 focus:ring-secondary outline-none"
                  />
                  <span className="text-[10px] text-gray-400 mt-1 block">Rango de prueba recomendado: Octubre de 2023.</span>
                </div>

                <div>
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Paso 3: Seleccionar Bloque Horario Disponible</h3>
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2.5 text-center">
                    {[
                      { h: '09:00', status: 'all' },
                      { h: '09:30', status: 'all' },
                      { h: '10:00', status: 'all' },
                      { h: '10:30', status: 'conflict' }, // This simulates concurrency conflict trigger (HU-05-2)
                      { h: '11:00', status: 'all' },
                      { h: '11:30', status: 'all' }
                    ].map((slot) => (
                      <button
                        key={slot.h}
                        type="button"
                        onClick={() => setSelectedHour(slot.h)}
                        className={`py-2 text-xs border rounded-lg transition-colors cursor-pointer ${
                          selectedHour === slot.h
                            ? 'bg-secondary text-white border-secondary font-bold'
                            : slot.status === 'conflict'
                            ? 'bg-yellow-50 border-yellow-200 text-yellow-800 font-semibold'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-secondary/5'
                        }`}
                      >
                        <span>{slot.h} hrs</span>
                        {slot.status === 'conflict' && (
                          <span className="block text-[8px] font-mono leading-none tracking-normal uppercase text-yellow-600 font-bold mt-0.5">Conflicto</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {citaResultMsg && (
                  <div className={`p-4 rounded-xl text-xs font-semibold leading-relaxed ${
                    citaResultMsg.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-100' : 'bg-red-50 text-red-800 border border-red-100'
                  }`}>
                    {citaResultMsg.text}
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleBookCita}
                  className="w-full h-11 bg-secondary hover:bg-secondary-container active:scale-[0.99] text-white rounded-lg font-bold text-xs uppercase tracking-wider transition-all shadow-ambient-l1 cursor-pointer"
                >
                  Confirmar Reserva Horaria
                </button>
              </div>

              {/* Right Column: Upcoming & Past Timeline (col-span-4) */}
              <div className="lg:col-span-4 flex flex-col gap-6">
                {/* Upcoming */}
                <div className="bg-[#0b0f59] text-white p-5 rounded-2xl shadow-md border border-slate-700/30">
                  <h4 className="text-xs font-black uppercase tracking-wider text-secondary mb-4 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>Siguiente Cita</span>
                  </h4>

                  {personalCitas.filter(c => c.estado === 'Confirmada').length === 0 ? (
                    <p className="text-xs text-gray-400 text-center py-6 leading-relaxed">No registras reservas horarias pendientes.</p>
                  ) : (
                    personalCitas.filter(c => c.estado === 'Confirmada').map((cita) => (
                      <div key={cita.id} className="bg-white/5 border border-white/10 rounded-xl p-4">
                        <span className="inline-block bg-emerald-550 border border-emerald-500 text-emerald-300 text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider mb-2 leading-none">
                          CONFIRMADA
                        </span>
                        <h5 className="font-bold text-xs text-white leading-snug">{cita.servicio}</h5>
                        
                        <div className="space-y-1.5 mt-3 text-[11px] text-gray-300 font-medium font-mono leading-none">
                          <p className="flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-xs">calendar_today</span>
                            <span>{cita.fecha}</span>
                          </p>
                          <p className="flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-xs">schedule</span>
                            <span>{cita.hora} hrs</span>
                          </p>
                          <p className="flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-xs text-gray-500">location_on</span>
                            <span className="max-w-[140px] truncate">{cita.lugar}</span>
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-2 mt-4">
                          <button
                            onClick={() => cancelCita(cita.id)}
                            className="bg-red-950/50 hover:bg-red-900 text-red-200 border border-red-900 px-2 py-1.5 rounded text-[10px] font-bold tracking-wider uppercase transition-colors"
                          >
                            Anular
                          </button>
                          <button
                            onClick={() => handleDownloadCitaReceipt(cita)}
                            className="bg-white/10 hover:bg-white/20 text-white px-2 py-1.5 rounded text-[10px] font-bold tracking-wider uppercase transition-colors"
                          >
                            Recibo PDF
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Past / history */}
                <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Bitácora Histórica</h4>
                  <div className="relative border-l border-slate-200 pl-4 space-y-4">
                    {personalCitas.filter(c => c.estado !== 'Confirmada').slice(0, 4).map((cita, idx) => (
                      <div key={idx} className="relative text-xs">
                        {/* Dot indicator */}
                        <div className={`absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full border-2 border-white ring-2 ${
                          cita.estado === 'Completada' ? 'bg-emerald-500 ring-emerald-100' : 'bg-gray-400 ring-slate-100'
                        }`}></div>
                        <p className="text-[10px] font-semibold text-gray-400 font-mono leading-none">{cita.fecha}</p>
                        <h5 className="font-bold text-slate-800 leading-snug mt-1">{cita.servicio}</h5>
                        <p className="text-[10px] text-gray-500 font-sans mt-0.5">{cita.profesional}</p>
                        <span className={`inline-block text-[9px] font-bold uppercase mt-1 ${
                          cita.estado === 'Completada' ? 'text-emerald-600' : 'text-red-500'
                        }`}>
                          {cita.estado}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 3: TALLERES (HU-06) */}
        {subView === 'talleres' && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-xs">
            <div className="border-b border-gray-100 pb-4 mb-5">
              <h2 className="text-xl font-black text-slate-900 tracking-tight leading-none uppercase">Talleres del CAM</h2>
              <p className="text-xs text-gray-500 mt-1">Inscríbete de forma responsable en las diversas actividades comunitarias con control de aforo municipal.</p>
            </div>

            {/* CAM Selector Control for Talleres */}
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl mb-6">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2.5">Filtrar por Sede de Centro de Atención Municipal (CAM):</p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedTalleresCam('todos')}
                  className={`px-3.5 py-2 rounded-lg text-xs font-bold cursor-pointer transition-all border ${
                    selectedTalleresCam === 'todos'
                      ? 'bg-[#0b0f59] border-[#0b0f59] text-white shadow-xs'
                      : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  🌐 Todas las Sedes
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedTalleresCam('poniente')}
                  className={`px-3.5 py-2 rounded-lg text-xs font-bold cursor-pointer transition-all border ${
                    selectedTalleresCam === 'poniente'
                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs'
                      : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  🏡 CAM Poniente
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedTalleresCam('pajaritos')}
                  className={`px-3.5 py-2 rounded-lg text-xs font-bold cursor-pointer transition-all border ${
                    selectedTalleresCam === 'pajaritos'
                      ? 'bg-sky-600 border-sky-600 text-white shadow-xs'
                      : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  🚇 CAM Pajaritos
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedTalleresCam('satelite')}
                  className={`px-3.5 py-2 rounded-lg text-xs font-bold cursor-pointer transition-all border ${
                    selectedTalleresCam === 'satelite'
                      ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
                      : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  🏙️ CAM Ciudad Satélite
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {(() => {
                const filtered = talleres.filter((taller) => {
                  if (selectedTalleresCam === 'todos') return true;
                  const lugarLower = taller.lugar.toLowerCase();
                  if (selectedTalleresCam === 'poniente') return lugarLower.includes('poniente');
                  if (selectedTalleresCam === 'pajaritos') return lugarLower.includes('pajaritos');
                  if (selectedTalleresCam === 'satelite') return lugarLower.includes('satélite') || lugarLower.includes('satelite');
                  return true;
                });

                if (filtered.length === 0) {
                  return (
                    <div className="col-span-1 md:col-span-2 bg-slate-50 border p-12 text-center rounded-2xl border-dashed border-slate-200 flex flex-col items-center justify-center">
                      <span className="material-symbols-outlined text-4xl text-gray-300">groups</span>
                      <p className="text-xs text-gray-500 mt-2 font-semibold">No se encontraron talleres disponibles programados para la sede seleccionada.</p>
                    </div>
                  );
                }

                return filtered.map((taller) => {
                  const isRegistered = taller.inscritos.includes(usuarioActual.rut);
                  const isWaiting = taller.listaEspera.includes(usuarioActual.rut);

                  const handleInscribe = () => {
                    const check = registerTaller(taller.id);
                    if (check.code === 'PROFILE_INCOMPLETE') {
                      alert(check.message);
                      setSubView('perfil'); // Redirect to fill email/phone!
                    } else {
                      alert(check.message);
                    }
                  };

                  return (
                    <div
                      key={taller.id}
                      className="border border-slate-200 rounded-xl p-5 hover:border-sky-400 transition-colors bg-white flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex justify-between items-start gap-4 mb-3">
                          <span className="bg-sky-50 text-sky-800 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded">
                            {taller.lugar.toLowerCase().includes('poniente') 
                              ? 'CAM Poniente' 
                              : taller.lugar.toLowerCase().includes('pajaritos') 
                              ? 'CAM Pajaritos' 
                              : 'CAM Ciudad Satélite'}
                          </span>
                          <div className="text-right">
                            <p className="text-[11px] font-bold text-slate-800">Aforo: {taller.cuposMax} Máx</p>
                            <p className={`text-[10px] font-bold leading-none mt-1 ${taller.cuposDisponibles > 0 ? 'text-emerald-600' : 'text-amber-600 uppercase'}`}>
                              {taller.cuposDisponibles > 0 ? `${taller.cuposDisponibles} Vacantes` : 'Sin vacantes (Lista de espera activa)'}
                            </p>
                          </div>
                        </div>

                        <h4 className="text-sm font-extrabold text-slate-900 leading-snug tracking-tight mb-2">
                          {taller.nombre}
                        </h4>
                        <p className="text-xs text-gray-500 leading-relaxed mb-4 text-justify">
                          {taller.descripcion}
                        </p>

                        <div className="space-y-1.5 text-[10px] text-gray-500 font-mono leading-none border-t border-slate-100 pt-3 mb-4">
                          <p className="flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-xs">schedule</span>
                            <span>{taller.horario}</span>
                          </p>
                          <p className="flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-xs">location_on</span>
                            <span>{taller.lugar}</span>
                          </p>
                        </div>
                      </div>

                      <div className="border-t border-slate-100 pt-4 flex gap-2">
                        {isRegistered ? (
                          <div className="w-full">
                            <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 p-2 text-center rounded-lg text-xs font-semibold mb-2">
                              ✓ Inscrito de forma exitosa
                            </div>
                            <button
                              onClick={() => cancelTaller(taller.id)}
                              className="w-full py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-[10px] font-bold tracking-wider uppercase transition-colors cursor-pointer"
                            >
                              Remover Inscripción
                            </button>
                          </div>
                        ) : isWaiting ? (
                          <div className="w-full">
                            <div className="bg-amber-50 border border-amber-100 text-amber-800 p-2 text-center rounded-lg text-xs font-semibold mb-2">
                              ⏳ En Lista de Espera
                            </div>
                            <button
                              onClick={() => cancelTaller(taller.id)}
                              className="w-full py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-[10px] font-bold tracking-wider uppercase transition-colors cursor-pointer"
                            >
                              Retirar de Lista de Espera
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={handleInscribe}
                            className="w-full h-10 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
                          >
                            {taller.cuposDisponibles > 0 ? 'Inscribirse en Taller' : 'Unirse a Lista de Espera'}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        )}

        {/* VIEW 4: BUZON CONSULTAS / SUGERENCIAS (HU-08) */}
        {subView === 'buzon' && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-xs">
            <div className="border-b border-gray-100 pb-4 mb-6">
              <h2 className="text-xl font-black text-slate-900 tracking-tight leading-none uppercase">Consultas Ciudadanas</h2>
              <p className="text-xs text-gray-500 mt-1">Envía tus consultas o sugerencias directamente al departamento administrativo del CAM.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
              {/* Form card (col-span-8) */}
              <form onSubmit={handleSupportSubmit} className="md:col-span-8 space-y-4">
                {ticketSuccessMsg && (
                  <div className="p-4 bg-emerald-50 border border-emerald-100 text-xs font-bold text-emerald-800 rounded-xl leading-relaxed">
                    {ticketSuccessMsg}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Nombre Completo</label>
                    <input
                      type="text"
                      className="w-full text-xs h-10 px-4 bg-slate-100 border border-transparent rounded-lg text-gray-500 cursor-not-allowed"
                      value={usuarioActual.nombreCompleto}
                      disabled
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Mail de Respuesta</label>
                    <input
                      type="text"
                      className="w-full text-xs h-10 px-4 bg-slate-100 border border-transparent rounded-lg text-gray-500 cursor-not-allowed"
                      value={usuarioActual.email}
                      disabled
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Área o Categoría Evaluadora</label>
                  <select
                    value={ticketArea}
                    onChange={(e) => setTicketArea(e.target.value as any)}
                    className="w-full text-xs h-10 px-4 bg-white border border-slate-300 rounded-lg outline-none focus:border-secondary focus:ring-1 focus:ring-secondary font-medium text-slate-700"
                  >
                    <option value="Social">Asistencia Social / DIDECO</option>
                    <option value="Legal">Asesoría Legal Interna</option>
                    <option value="Salud">Operativos Territoriales de Salud</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Asunto de Requerimiento</label>
                  <input
                    type="text"
                    placeholder="Ej: Ayuda para postular a exención de aseo"
                    required
                    value={ticketAsunto}
                    onChange={(e) => setTicketAsunto(e.target.value)}
                    className="w-full text-xs h-10 px-4 bg-white border border-slate-300 rounded-lg outline-none focus:border-secondary focus:ring-1 focus:ring-secondary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Detalle del Mensaje</label>
                  <textarea
                    placeholder="Escribe de forma detallada los motivos de tu sugerencia..."
                    rows={4}
                    required
                    value={ticketMensaje}
                    onChange={(e) => setTicketMensaje(e.target.value)}
                    className="w-full text-xs p-4 bg-white border border-slate-300 rounded-lg outline-none focus:border-secondary focus:ring-1 focus:ring-secondary resize-none font-sans"
                  />
                </div>

                {/* Upload attachment dragzone with <10MB rule validations (HU-08-3) */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Adjuntar Comprobantes o Evidencia (Opcional - Máx 10MB)</label>
                  <div
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors flex flex-col items-center justify-center cursor-pointer ${
                      dragActive ? 'border-secondary bg-secondary/5' : 'border-slate-300 hover:border-slate-400 bg-slate-50'
                    }`}
                  >
                    <span className="material-symbols-outlined text-4xl text-gray-400 mb-2">cloud_upload</span>
                    <p className="text-[11px] text-gray-500 font-medium">Arrastra y suelta tu archivo PDF o JPG aquí, o navega en tu equipo.</p>
                    <input
                      type="file"
                      id="ticket-file"
                      onChange={handleFileChange}
                      className="hidden"
                      accept=".pdf,.jpg,.jpeg,.png"
                    />
                    <label
                      htmlFor="ticket-file"
                      className="mt-3 px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-[10px] font-bold tracking-wider uppercase transition-colors"
                    >
                      Seleccionar Archivo
                    </label>

                    {uploadedFile && (
                      <div className="mt-4 p-2 bg-emerald-50 border border-emerald-100 rounded-lg flex items-center justify-between text-[10px] text-slate-700 w-full max-w-xs">
                        <span className="truncate pr-4 font-mono font-bold">{uploadedFile.name} ({(uploadedFile.size / (1024 * 1024)).toFixed(2)} MB)</span>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            setUploadedFile(null);
                          }}
                          className="text-red-500 font-bold uppercase hover:underline"
                        >
                          Quitar
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-secondary hover:bg-secondary-container text-white font-bold text-xs uppercase tracking-wider rounded-lg shadow-ambient-l1 transition-all cursor-pointer"
                  >
                    Enviar Mensaje de Consulta
                  </button>
                </div>
              </form>

              {/* Tickets List sidepanel */}
              <div className="md:col-span-4 bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-4">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-200 pb-2 flex items-center justify-between">
                  <span>Respuestas Recibidas</span>
                  <span className="bg-secondary text-white text-[9px] font-mono px-2 py-0.5 rounded-full font-bold">
                    {tickets.filter(t => t.ciudadanoRut === usuarioActual.rut).length}
                  </span>
                </h4>

                <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                  {tickets.filter(t => t.ciudadanoRut === usuarioActual.rut).length === 0 ? (
                    <p className="text-[10px] text-gray-400 text-center py-6 leading-relaxed">No registras tiques enviados en este portal.</p>
                  ) : (
                    tickets.filter(t => t.ciudadanoRut === usuarioActual.rut).map((tk) => (
                      <div key={tk.id} className="bg-white p-3.5 rounded-xl border border-slate-200/60 shadow-xs relative">
                        <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
                          <span className="text-[10px] font-mono font-bold text-slate-900 border border-slate-200 bg-slate-100 px-1.5 py-0.5 rounded leading-none">{tk.id}</span>
                          <span className={`text-[9px] font-bold tracking-wider uppercase ${tk.estado === 'Respondido' ? 'text-emerald-600' : 'text-slate-500'}`}>
                            {tk.estado}
                          </span>
                        </div>
                        <h5 className="font-extrabold text-xs text-slate-800 line-clamp-1 leading-snug">{tk.asunto}</h5>
                        <p className="text-[10px] text-gray-400 mt-0.5 leading-none font-semibold">Área: {tk.area}</p>
                        
                        {/* Response if marked respondido (HU-08-4) */}
                        {tk.estado === 'Respondido' && tk.respuesta && (
                          <div className="mt-3 p-2.5 bg-emerald-50 rounded-lg text-[10px] text-emerald-800 border border-emerald-100 font-sans leading-relaxed">
                            <span className="font-bold block mb-1">Respuesta Personal CAM:</span>
                            <p className="italic">"{tk.respuesta}"</p>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 5: MI PERFIL (Mockup 5) */}
        {subView === 'perfil' && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-xs">
            <div className="border-b border-gray-100 pb-4 mb-6">
              <h2 className="text-xl font-black text-slate-900 tracking-tight leading-none uppercase">Mi Perfil Integrado</h2>
              <p className="text-xs text-gray-500 mt-1">Administra tus datos de contacto locales autorizados en la base municipal.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
              {/* Form editing profile (col-span-8) */}
              <form onSubmit={handleProfileSubmit} className="md:col-span-8 space-y-4">
                {profileMessage && (
                  <div className={`p-4 rounded-xl text-xs font-semibold leading-relaxed ${
                    profileMessage.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-100' : 'bg-red-50 text-red-800 border border-red-100'
                  }`}>
                    {profileMessage.text}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  {/* HU-04-1 Name and RUT are strictly read-only for safety */}
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Nombre Completo (Solo Lectura - Clave Única)</label>
                    <input
                      type="text"
                      className="w-full text-xs h-10 px-4 bg-slate-100 border border-transparent rounded-lg text-gray-500 cursor-not-allowed"
                      value={usuarioActual.nombreCompleto}
                      disabled
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">RUT Cédula (Solo Lectura - Clave Única)</label>
                    <input
                      type="text"
                      className="w-full text-xs h-10 px-4 bg-slate-100 border border-transparent rounded-lg text-gray-500 cursor-not-allowed"
                      value={usuarioActual.rut}
                      disabled
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Correo Electrónico (Modificable)</label>
                    <input
                      type="email"
                      required
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      className="w-full text-xs h-10 px-4 bg-white border border-slate-300 rounded-lg outline-none focus:border-secondary focus:ring-1 focus:ring-secondary font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Teléfono Móvil (Modificable)</label>
                    <input
                      type="text"
                      required
                      value={editTelefono}
                      onChange={(e) => setEditTelefono(e.target.value)}
                      className="w-full text-xs h-10 px-4 bg-white border border-slate-300 rounded-lg outline-none focus:border-secondary focus:ring-1 focus:ring-secondary font-semibold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Dirección Registrada (Actualizar en Registro Civil)</label>
                  <input
                    type="text"
                    className="w-full text-xs h-10 px-4 bg-slate-100 border border-transparent rounded-lg text-gray-500 cursor-not-allowed"
                    value={usuarioActual.direccion}
                    disabled
                  />
                  <span className="text-[9px] text-[#b40063] font-bold mt-1 block">
                    *Para modificar tu domicilio legal, la plataforma te guiará para coordinar con el Registro Civil.
                  </span>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-secondary hover:bg-secondary-container text-white font-bold text-xs uppercase tracking-wider rounded-lg shadow-ambient-l1 transition-all cursor-pointer"
                  >
                    Guardar Cambios
                  </button>
                </div>
              </form>

              {/* Stats / Help panel (col-span-4) */}
              <div className="md:col-span-4 bg-slate-50 border border-slate-100 rounded-2xl p-5 text-xs text-left">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-200 pb-2 mb-3">Integración de Seguridad</h4>
                <p className="text-gray-500 leading-relaxed mb-4">
                  Su cuenta está validada mediante certificado digital de Clave Única gubernamental.
                </p>
                <div className="p-3.5 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-xl flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-base">verified_user</span>
                  <span className="font-bold">Identidad Validada</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 6: NOTICIAS Y OPERATIVOS GEOLOCALIZADOS (NUEVO) */}
        {subView === 'noticias' && (
          <div className="space-y-6">
            {/* Dynamic Geolocalizer Banner Card */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-xs">
              <div className="border-b border-gray-100 pb-4 mb-6">
                <span className="bg-secondary/10 text-secondary text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider mb-2 inline-block">
                  Personalización Inteligente
                </span>
                <h2 className="text-xl font-black text-slate-900 tracking-tight leading-none uppercase">
                  Noticias de tu Barrio
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  Tu panel ciudadano detecta tu domicilio para mostrarte información del Centro de Atención Municipal (CAM) correspondiente.
                </p>
              </div>

              {/* Proximity calculation widgets */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                <div className="md:col-span-7 space-y-4 text-left">
                  <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl">
                    <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wide mb-1">Tu Domicilio Oficial Registrado:</p>
                    <div className="flex items-center gap-2 text-slate-800 font-semibold text-xs font-sans">
                      <span className="material-symbols-outlined text-secondary text-base">location_on</span>
                      <span>{simulatedAddress}</span>
                    </div>

                    {/* Presets to quickly test different locations */}
                    <div className="mt-4 pt-4 border-t border-slate-200">
                      <p className="text-[9px] uppercase font-bold text-gray-400 tracking-wider mb-2">
                        Simulador / Probar otras ubicaciones en Maipú:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => setSimulatedAddress('Av. Esquina Blanca 501, Maipú, Chile')}
                          className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all border cursor-pointer ${
                            getSimulatedCAMInfo(simulatedAddress).slug === 'poniente'
                              ? 'bg-indigo-50 border-indigo-200 text-indigo-800 shadow-xs'
                              : 'bg-white hover:bg-slate-100 text-slate-650 border-slate-200'
                          }`}
                        >
                          🏡 Villa Los Héroes (CAM Poniente)
                        </button>
                        <button
                          type="button"
                          onClick={() => setSimulatedAddress('Camino a Melipilla 15300, Ciudad Satélite, Maipú')}
                          className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all border cursor-pointer ${
                            getSimulatedCAMInfo(simulatedAddress).slug === 'satelite'
                              ? 'bg-emerald-50 border-emerald-250 text-emerald-805 shadow-xs'
                              : 'bg-white hover:bg-slate-100 text-slate-650 border-slate-200'
                          }`}
                        >
                          🏙️ Ciudad Satélite (CAM Satélite)
                        </button>
                        <button
                          type="button"
                          onClick={() => setSimulatedAddress('Av. Los Pajaritos 2150, Maipú')}
                          className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all border cursor-pointer ${
                            getSimulatedCAMInfo(simulatedAddress).slug === 'pajaritos'
                              ? 'bg-sky-50 border-sky-250 text-sky-850 shadow-xs'
                              : 'bg-white hover:bg-slate-100 text-slate-650 border-slate-200'
                          }`}
                        >
                          🚇 Av. Pajaritos (CAM Pajaritos)
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Assigned CAM Card displaying distance & metrics */}
                <div className="md:col-span-5">
                  <div className={`p-5 rounded-2xl text-white ${getSimulatedCAMInfo(simulatedAddress).bannerColor} shadow-md relative overflow-hidden text-left flex flex-col justify-between h-full min-h-[160px]`}>
                    <div className="absolute right-[-15px] bottom-[-20px] opacity-15">
                      <span className="material-symbols-outlined text-[100px] select-none font-bold">distance</span>
                    </div>
                    <div>
                      <div className="flex justify-between items-start">
                        <span className="text-[9px] uppercase tracking-wider font-extrabold bg-white/20 px-2 py-0.5 rounded">
                          Municipalidad de Maipú
                        </span>
                        <span className="flex items-center gap-1 text-[9px] font-bold bg-white/30 px-2 py-0.5 rounded animate-pulse">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                          <span>CAM Más Cercano</span>
                        </span>
                      </div>
                      <h3 className="text-base font-black uppercase tracking-tight mt-2.5">
                        {getSimulatedCAMInfo(simulatedAddress).name}
                      </h3>
                      <p className="text-[10px] opacity-90 font-mono mt-0.5">
                        📍 {getSimulatedCAMInfo(simulatedAddress).address}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-white/20 grid grid-cols-2 gap-2 text-[10px]">
                      <div>
                        <span className="opacity-75 block text-[8px] uppercase font-semibold">Distancia Estimada</span>
                        <strong className="text-white text-xs">{getSimulatedCAMInfo(simulatedAddress).distance}</strong>
                      </div>
                      <div>
                        <span className="opacity-75 block text-[8px] uppercase font-semibold">Tiempo Estimado</span>
                        <strong className="text-white text-xs">{getSimulatedCAMInfo(simulatedAddress).travelTime}</strong>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* News Content section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-base">campaign</span>
                  <span>Anuncios Destacados para {getSimulatedCAMInfo(simulatedAddress).name}</span>
                </h3>
                <span className="text-[10px] text-gray-400 bg-slate-100 px-2.5 py-0.5 rounded-full font-bold">
                  Jurisdicción Localizada
                </span>
              </div>

              {/* Displaying filtered/prioritized news */}
              {noticias.length === 0 ? (
                <div className="bg-white border p-10 text-center rounded-2xl border-dashed border-slate-200">
                  <span className="material-symbols-outlined text-4xl text-gray-300">feed</span>
                  <p className="text-xs text-gray-500 mt-2 font-semibold">No se registran noticias activas en la municipalidad en este momento.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {(() => {
                    const camSlug = getSimulatedCAMInfo(simulatedAddress).slug;
                    
                    // Custom news array simulation including specific CAM items
                    let customNoticias = [...noticias];
                    
                    // Check if we need to mock details corresponding to Pajaritos / Satelite if they select those simulation presets
                    if (camSlug === 'satelite') {
                      customNoticias = [
                        {
                          id: 'news-satelite-1',
                          titulo: 'Actualización del Registro Social de Hogares - Ciudad Satélite',
                          cuerpo: 'Esta semana el equipo del departamento social del CAM Satélite se trasladará al Parque Central Oriente para asistir de forma personalizada a los vecinos en trámites de actualización de cartolas, ingresos de nuevos integrantes del núcleo familiar y apelaciones de tramos socioeconómicos correspondientes.',
                          categoria: 'Social',
                          fecha: '2023-10-18',
                          imagen: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=800&q=80',
                          visible: true,
                          fechaPublicacion: '2023-10-15',
                          fechaExpiracion: null,
                          archivoFolleto: 'operativo_satelite_RSH.pdf'
                        },
                        {
                          id: 'news-satelite-2',
                          titulo: 'Clínica Veterinaria y Desparasitación Gratuita',
                          cuerpo: 'Estaremos aplicando vacunas triple felina, antirrábica e implantando microchips a perros y gatos del sector Satélite. Las atenciones se realizarán por orden de llegada con un tope máximo de 105 mascotas por jornada. Se solicita traer a sus perros con correa y a sus gatos dentro de contenedores seguros.',
                          categoria: 'Salud',
                          fecha: '2023-10-22',
                          imagen: 'https://images.unsplash.com/photo-1581888227599-779811939961?auto=format&fit=crop&w=800&q=80',
                          visible: true,
                          fechaPublicacion: '2023-10-17',
                          fechaExpiracion: null,
                          archivoFolleto: 'veterinaria_satelite_pet.pdf'
                        },
                        ...noticias.filter(n => n.id !== 'news-1' && n.id !== 'news-2') // filter out Poniente specific ones
                      ];
                    } else if (camSlug === 'pajaritos') {
                      customNoticias = [
                        {
                          id: 'news-pajaritos-1',
                          titulo: 'Clínica Oftalmológica Móvil en Metro Pajaritos',
                          cuerpo: 'Atención personalizada para la receta y renovación de lentes de lectura y descanso. Exclusivo para vecinos pertenecientes a Fonasa residentes de Maipú centro. Se entregará receta oficial y financiamiento subsidiado de armazones para adultos mayores inscritos en FONASA tramos A y B.',
                          categoria: 'Salud',
                          fecha: '2023-10-19',
                          imagen: 'https://images.unsplash.com/photo-1504813184591-015556c5c50c?auto=format&fit=crop&w=800&q=80',
                          visible: true,
                          fechaPublicacion: '2023-10-15',
                          fechaExpiracion: null,
                          archivoFolleto: 'oftalmologia_pajaritos.pdf'
                        },
                        {
                          id: 'news-pajaritos-2',
                          titulo: 'Taller Vial Infantil de Primavera - Av. Pajaritos',
                          cuerpo: 'Este sábado tendremos un circuito educativo móvil en el parque central del bandejón Pajaritos para enseñar normas básicas de tránsito, uso seguro de ciclovías e incentivar la convivencia vial en niños de 5 a 12 años de la comuna. Actividad abierta para toda la familia.',
                          categoria: 'Comunidad',
                          fecha: '2023-10-21',
                          imagen: 'https://images.unsplash.com/photo-1519750157634-b6d493a0f77c?auto=format&fit=crop&w=800&q=80',
                          visible: true,
                          fechaPublicacion: '2023-10-14',
                          fechaExpiracion: null,
                          archivoFolleto: 'educacion_vial_pajaritos.pdf'
                        },
                        ...noticias.filter(n => n.id !== 'news-1' && n.id !== 'news-2') // filter out Poniente specific ones
                      ];
                    }

                    return customNoticias.map((item) => {
                      // Check if the news item is highly relevant/matched to user's assigned neighborhood CAM
                      const isHighlyRelevant = 
                        (camSlug === 'poniente' && (item.id === 'news-1' || item.id === 'news-2')) ||
                        (camSlug === 'satelite' && (item.id === 'news-satelite-1' || item.id === 'news-satelite-2')) ||
                        (camSlug === 'pajaritos' && (item.id === 'news-pajaritos-1' || item.id === 'news-pajaritos-2'));

                      return (
                        <div
                          key={item.id}
                          onClick={() => setSelectedNews(item)}
                          className={`bg-white border rounded-xl overflow-hidden shadow-xs hover:shadow-md transition-all duration-200 flex flex-col group cursor-pointer text-left relative ${
                            isHighlyRelevant 
                              ? 'border-secondary ring-1 ring-secondary/20 scale-[1.01]' 
                              : 'border-slate-200'
                          }`}
                        >
                          {/* Proximity / matches badge */}
                          {isHighlyRelevant && (
                            <span className="absolute top-2.5 right-2.5 bg-emerald-500 text-white text-[8px] font-black uppercase px-2 py-0.5 rounded shadow-sm z-10 flex items-center gap-0.5">
                              <span className="material-symbols-outlined text-[10px] font-bold">radar</span>
                              <span>Cerca de Ti</span>
                            </span>
                          )}

                          <div className="h-40 overflow-hidden relative bg-slate-100">
                            <img
                              alt={item.titulo}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              referrerPolicy="no-referrer"
                              src={item.imagen}
                            />
                            <span className="absolute bottom-2 left-2 bg-slate-900/80 backdrop-blur-xs text-white text-[9px] font-black uppercase px-2 py-0.5 rounded">
                              {item.categoria}
                            </span>
                          </div>

                          <div className="p-4 flex flex-col flex-grow">
                            <div className="flex items-center gap-1 text-slate-400 text-[10px] font-medium mb-1.5">
                              <span className="material-symbols-outlined text-xs">calendar_today</span>
                              <span>{item.fecha}</span>
                            </div>
                            <h4 className="text-xs font-black text-slate-900 group-hover:text-secondary transition-colors leading-tight mb-1.5 line-clamp-2">
                              {item.titulo}
                            </h4>
                            <p className="text-[11px] text-gray-500 leading-relaxed mb-3.5 line-clamp-3">
                              {item.cuerpo}
                            </p>
                            <div className="mt-auto flex justify-between items-center pt-2 border-t border-slate-100">
                              <span className="text-[10px] font-extrabold text-secondary tracking-wider uppercase inline-flex items-center gap-0.5">
                                <span>Ver Detalles</span>
                                <span className="material-symbols-outlined text-xs transform group-hover:translate-x-0.5 transition-transform font-bold">chevron_right</span>
                              </span>
                              
                              {item.archivoFolleto && (
                                <span className="text-[9px] bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded font-bold text-slate-650 flex items-center gap-0.5">
                                  <span className="material-symbols-outlined text-[10px]">picture_as_pdf</span>
                                  <span>Folleto</span>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Dynamic News Detail Modal Popup */}
      {selectedNews && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-[110] p-4 text-left">
          <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[85vh]">
            <div className="relative h-48 bg-slate-100 flex-shrink-0">
              <img
                alt={selectedNews.titulo}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
                src={selectedNews.imagen}
              />
              <span className="absolute top-4 left-4 bg-white/95 text-xs font-bold text-slate-900 border border-slate-200 px-2.5 py-1 rounded-full shadow-xs">
                {selectedNews.categoria}
              </span>
              <button
                onClick={() => setSelectedNews(null)}
                className="absolute top-4 right-4 bg-black/60 hover:bg-black/80 text-white rounded-full p-1.5 transition-colors border border-white/20 select-none cursor-pointer flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-lg leading-none">close</span>
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-4">
              <div className="flex items-center gap-1.5 text-gray-450 text-[10px] font-medium">
                <span className="material-symbols-outlined text-sm">calendar_month</span>
                <span>Publicación: {selectedNews.fecha}</span>
              </div>
              <h3 className="text-base font-black text-slate-900 leading-snug">
                {selectedNews.titulo}
              </h3>
              <p className="text-xs text-gray-600 leading-relaxed text-justify whitespace-pre-line font-sans">
                {selectedNews.cuerpo}
              </p>

              {/* Informative Flyer pamphlet download emulator (HU-10-4) */}
              {selectedNews.archivoFolleto && (
                <div className="bg-sky-50 border border-sky-100 p-4 rounded-xl flex items-center justify-between mt-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-sky-100 border border-sky-200 flex items-center justify-center text-sky-700">
                      <span className="material-symbols-outlined text-xl">picture_as_pdf</span>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-sky-950">Folleto Municipal Informativo</p>
                      <p className="text-[10px] text-sky-700">Formato PDF • 1.4 MB • Descarga Directa</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      alert(`Iniciando descarga simulada del folleto oficial: "${selectedNews.archivoFolleto}"`);
                    }}
                    className="bg-sky-600 hover:bg-sky-500 text-white text-[10px] uppercase font-extrabold px-3 py-1.5 rounded-lg shadow-xs transition-colors pointer-events-auto cursor-pointer flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-xs">download</span>
                    <span>Descargar</span>
                  </button>
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedNews(null)}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
              >
                Cerrar Detalle
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: OTP VERIFICATION POPUP (HU-04-4) */}
      {showVerificationModal && usuarioActual?.pendienteCodigo && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-[110] p-4 text-left">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl overflow-hidden border border-gray-100 flex flex-col">
            <h3 className="text-base font-bold text-slate-900 mb-2">Código de Verificación Requerido</h3>
            <p className="text-xs text-gray-500 mb-4 leading-relaxed">
              Hemos despachado un código de seguridad de 4 dígitos para autorizar el cambio definitivo de tus datos de contacto:
            </p>
            <div className="bg-orange-50 border border-orange-100 text-orange-850 p-3 rounded-lg text-xs leading-relaxed mb-4 font-semibold text-center font-mono">
              ⚠️ CÓDIGO GENERADO DE PRUEBA: {usuarioActual.pendienteCodigo.codigo}
            </div>

            <form onSubmit={handleVerifyCodeSubmit} className="space-y-4">
              <input
                type="text"
                placeholder="Ingresar código de 4 dígitos"
                required
                maxLength={4}
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                className="w-full text-center h-12 text-sm border font-mono font-bold tracking-widest border-slate-300 rounded-lg outline-none focus:border-secondary focus:ring-1 focus:ring-secondary"
              />

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowVerificationModal(false)}
                  className="flex-1 h-10 border border-slate-200 text-slate-600 rounded-lg text-xs font-semibold hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 h-10 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-all"
                >
                  Validar Código
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: DOCUMENTATION RETRIEVAL INSTRUCTION MODAL CHECKLIST (HU-02-2) */}
      {instructiveDoc && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-[110] p-4 text-left">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl overflow-hidden border border-gray-100 flex flex-col">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-tight">Instructivo de Obtención Digital</h3>
              <button
                onClick={() => setInstructiveDoc(null)}
                className="text-gray-400 hover:text-gray-650 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <p className="text-xs font-bold text-slate-800 mb-2 font-mono">DOCUMENTO: {instructiveDoc.name}</p>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-gray-600 leading-relaxed font-sans space-y-2 text-justify">
              <span className="font-bold text-sky-800 block text-[11px] mb-1">Instrucciones paso a paso:</span>
              {instructiveDoc.text.split('. ').map((step, sIdx) => {
                if (!step.trim()) return null;
                return (
                  <div key={sIdx} className="flex gap-2 items-start py-0.5 border-b border-slate-100 last:border-b-0">
                    <span className="text-sky-700 font-bold ml-1">✓</span>
                    <span>{step}</span>
                  </div>
                );
              })}
            </div>

            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setInstructiveDoc(null)}
                className="px-4 py-2 bg-slate-905 hover:bg-slate-800 background bg-slate-900 text-white rounded-xl text-xs font-bold transition-all"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PDF Comprobante Modal launcher */}
      {customPDFData && (
        <PDFModal
          isOpen={customPDFData.isOpen}
          onClose={() => setCustomPDFData(prev => prev ? { ...prev, isOpen: false } : null)}
          title={customPDFData.title}
          subtitle={customPDFData.subtitle}
          details={customPDFData.details}
          paragraphs={customPDFData.paragraphs}
          signatureName={customPDFData.signatureName}
          signatureRole={customPDFData.signatureRole}
        />
      )}
    </div>
  );
};
