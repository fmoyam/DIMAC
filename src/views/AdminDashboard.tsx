/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Tramite, Noticia, TicketConsulta, TramiteEstado } from '../types';

interface AdminDashboardProps {
  onLogout?: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLogout }) => {
  const {
    usuarioActual,
    tramites,
    noticias,
    tickets,
    citas,
    simulationTime,
    setSimulationTime,
    observeDocument,
    approveDocument,
    changeTramiteEstado,
    replyTicket,
    addNoticia,
    updateNoticia,
    deleteNoticia,
    triggerConcurrenciaSimulation
  } = useApp();

  const [isNavExpanded, setIsNavExpanded] = useState(false);

  // --- Analytical stats states (HU-09) ---
  const [selectedAreaFilter, setSelectedAreaFilter] = useState<'All' | 'Social' | 'Legal'>('All');

  // --- Availability Slots state ---
  const [availabilitySlots, setAvailabilitySlots] = useState([
    { id: 'av-1', fecha: 'Hoy, 24 Oct', hora: '09:00 - 13:00', blocks: 4 },
    { id: 'av-2', fecha: 'Mañana, 25 Oct', hora: '15:00 - 18:00', blocks: 3 },
  ]);
  const [newAvFecha, setNewAvFecha] = useState('');
  const [newAvHora, setNewAvHora] = useState('');

  // --- Document Evaluator States ---
  const [inspectingTramite, setInspectingTramite] = useState<Tramite | null>(null);
  const [observeCommentText, setObserveCommentText] = useState('');
  const [observeDocId, setObserveDocId] = useState<string | null>(null);
  const [integrityErrorList, setIntegrityErrorList] = useState<string[] | null>(null);

  // --- News Publisher States ---
  const [editingNewsId, setEditingNewsId] = useState<string | null>(null);
  const [newsTitle, setNewsTitle] = useState('');
  const [newsCategory, setNewsCategory] = useState<Noticia['categoria']>('Operativo');
  const [newsBody, setNewsBody] = useState('');
  const [newsSchedulePublish, setNewsSchedulePublish] = useState('');
  const [newsExpiration, setNewsExpiration] = useState('');
  const [newsBrochureName, setNewsBrochureName] = useState('');
  const [notifySubscribers, setNotifySubscribers] = useState(false);
  const [newsToDelete, setNewsToDelete] = useState<{ id: string; titulo: string } | null>(null);

  // --- Tickets support states ---
  const [replyTicketTarget, setReplyTicketTarget] = useState<TicketConsulta | null>(null);
  const [replyMessageText, setReplyMessageText] = useState('');

  // --- Calendar Date Adjuster state (helpful for testing scheduled news/operatives) ---
  const [currentDateInput, setCurrentDateInput] = useState(simulationTime.toISOString().split('T')[0]);

  // --- Analytics data generator (HU-09) ---
  // Workload calculations based on filter:
  // Social includes Asistencia Social and Subsidios.
  // Legal includes Asesoría Legal and Vivienda.
  const filterCitas = citas.filter(c => {
    if (selectedAreaFilter === 'All') return true;
    if (selectedAreaFilter === 'Social') return c.servicio === 'Asistencia Social' || c.servicio === 'Subsidios';
    if (selectedAreaFilter === 'Legal') return c.servicio === 'Asesoría Legal' || c.servicio === 'Vivienda';
    return true;
  });

  const filterTramites = tramites.filter(t => {
    if (selectedAreaFilter === 'All') return true;
    if (selectedAreaFilter === 'Social') return t.tipo === 'Subsidio Familiar' || t.tipo === 'Registro Social Hogares' || t.tipo === 'Ayuda Social Directa';
    if (selectedAreaFilter === 'Legal') return t.tipo === 'Renovación Patente Comercial' || t.tipo === 'Subsidio Habitacional';
    return true;
  });

  // Capacity calculations for alarms (HU-09-4)
  // Let's assume threshold capacity is 30 weekly spots for Social, and 12 weekly spots for Jurídico/Legal.
  const socialCitasCount = citas.filter(c => c.servicio === 'Asistencia Social' || c.servicio === 'Subsidios').length;
  const legalCitasCount = citas.filter(c => c.servicio === 'Asesoría Legal' || c.servicio === 'Vivienda').length;

  const socialCapPct = Math.min(100, Math.round((socialCitasCount / 6) * 100)); // Simulated limit threshold based on mock data totals
  const legalCapPct = Math.min(100, Math.round((legalCitasCount / 4) * 100));

  const isSocialHighDemand = socialCapPct >= 90;
  const isLegalHighDemand = legalCapPct >= 90;

  // --- Export Report to CSV logic (HU-09-2) ---
  const handleExportCsv = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "ID TRANSACION,FECHA,CIUDADANO,TIPO,DEPARTAMENTO,ESTADO\n";

    // Add procedures logs
    filterTramites.forEach(t => {
      const area = (t.tipo === 'Renovación Patente Comercial' || t.tipo === 'Subsidio Habitacional') ? 'Legal' : 'Social';
      csvContent += `${t.id},${t.ingresoFecha},${t.ciudadanoNombre},${t.tipo},${area},${t.estado}\n`;
    });

    // Add appointment logs
    filterCitas.forEach(c => {
      const area = (c.servicio === 'Asesoría Legal' || c.servicio === 'Vivienda') ? 'Legal' : 'Social';
      csvContent += `${c.id},${c.fecha},${c.ciudadanoNombre},${c.servicio},${area},${c.estado}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `reporte_municipal_maipu_${selectedAreaFilter}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- Admin Funcionario Stats Mock ---
  const mockFuncionariosStats = [
    { id: 'f1', nombre: 'Camila Rojas', area: 'Social', cargo: 'Asistente Social', tramitesResueltos: 145, ticketsAtendidos: 58, hrsSemanales: 40, evaluacion: 4.8 },
    { id: 'f2', nombre: 'Pedro Álvarez', area: 'Legal', cargo: 'Abogado', tramitesResueltos: 89, ticketsAtendidos: 22, hrsSemanales: 40, evaluacion: 4.5 },
    { id: 'f3', nombre: 'Luisa Sánchez', area: 'Social', cargo: 'Trabajadora Social', tramitesResueltos: 210, ticketsAtendidos: 73, hrsSemanales: 40, evaluacion: 4.9 },
    { id: 'f4', nombre: 'Fernando Miranda', area: 'Obras', cargo: 'Arquitecto', tramitesResueltos: 64, ticketsAtendidos: 19, hrsSemanales: 30, evaluacion: 4.7 },
    { id: 'f5', nombre: 'Gabriela Silva', area: 'Salud', cargo: 'Enfermera', tramitesResueltos: 320, ticketsAtendidos: 104, hrsSemanales: 44, evaluacion: 4.9 },
    { id: 'f6', nombre: 'Andrea Cáceres', area: 'Legal', cargo: 'Abogada Asesora', tramitesResueltos: 130, ticketsAtendidos: 45, hrsSemanales: 44, evaluacion: 4.6 }
  ];

  const handleExportExcelFuncionarios = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "NOMBRE,AREA,CARGO,TRAMITES RESUELTOS,TICKETS ATENDIDOS,HORAS SEMANALES,EVALUACION\n";

    mockFuncionariosStats.forEach(f => {
      csvContent += `${f.nombre},${f.area},${f.cargo},${f.tramitesResueltos},${f.ticketsAtendidos},${f.hrsSemanales},${f.evaluacion}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    // .xls extension is loosely supported by excel via csv format, or .csv if strictly pure data
    link.setAttribute("download", `estadisticas_funcionarios_administracion.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- Availability Editor Logic ---
  const handleAddSlot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAvFecha.trim() || !newAvHora.trim()) return;

    setAvailabilitySlots(prev => [
      ...prev,
      {
        id: `av-${Math.floor(100 + Math.random() * 900)}`,
        fecha: newAvFecha,
        hora: newAvHora,
        blocks: Math.floor(2 + Math.random() * 4)
      }
    ]);

    setNewAvFecha('');
    setNewAvHora('');
  };

  const handleDeleteSlot = (id: string) => {
    setAvailabilitySlots(prev => prev.filter(s => s.id !== id));
  };

  // --- Document integrity evaluator (HU-02) ---
  const handleReviewStatusChange = (status: TramiteEstado) => {
    if (!inspectingTramite) return;
    setIntegrityErrorList(null);

    const evaluationResult = changeTramiteEstado(inspectingTramite.id, status);
    if (evaluationResult.success) {
      alert(`Estado del expediente actualizado a "${status}" de forma exitosa.`);
      // Update inspecting reference to show modified details
      const match = tramites.find(t => t.id === inspectingTramite.id);
      if (match) setInspectingTramite(match);
    } else if (evaluationResult.errorDocs) {
      // HU-02-4 Integrity block
      setIntegrityErrorList(evaluationResult.errorDocs);
    }
  };

  // --- Create News Bulletin (HU-01 & HU-10) ---
  const handlePublishNews = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsTitle.trim() || !newsBody.trim()) {
      alert('Por favor complete el título y descripción del boletín.');
      return;
    }

    const scheduledDate = newsSchedulePublish ? newsSchedulePublish : null;
    const expirationDate = newsExpiration ? newsExpiration : null;
    const attachment = newsBrochureName.trim() ? newsBrochureName.trim() : null;

    // Check if the scheduled publish date is in the future.
    // If future, make visible false initially (HU-01-2: Programación de noticias)
    let isInitiallyVisible = true;
    if (scheduledDate && new Date(scheduledDate) > simulationTime) {
      isInitiallyVisible = false;
    }

    if (editingNewsId) {
      updateNoticia(editingNewsId, {
        titulo: newsTitle,
        cuerpo: newsBody,
        categoria: newsCategory,
        // Mantener la fecha original si no programamos una nueva
        fechaPublicacion: scheduledDate,
        fechaExpiracion: expirationDate,
        archivoFolleto: attachment
      }, notifySubscribers);
      setEditingNewsId(null);
    } else {
      addNoticia({
        titulo: newsTitle,
        cuerpo: newsBody,
        categoria: newsCategory,
        fecha: simulationTime.toISOString().split('T')[0],
        visible: isInitiallyVisible,
        fechaPublicacion: scheduledDate,
        fechaExpiracion: expirationDate,
        archivoFolleto: attachment
      });

      if (notifySubscribers) {
        // HU-10-2 simulate proactive SMTP email notifications logs
        alert(`¡Publicación completada! Se han despachado ${Math.floor(450 + Math.random() * 200)} boletines por mail debido al aviso selectivo.`);
      } else {
        alert('Noticia guardada de forma exitosa.');
      }
    }

    // Reset Form
    setNewsTitle('');
    setNewsBody('');
    setNewsBrochureName('');
    setNewsSchedulePublish('');
    setNewsExpiration('');
    setNotifySubscribers(false);
  };

  const handleEditNews = (n: Noticia) => {
    setEditingNewsId(n.id);
    setNewsTitle(n.titulo);
    setNewsCategory(n.categoria);
    setNewsBody(n.cuerpo);
    setNewsSchedulePublish(n.fechaPublicacion || '');
    setNewsExpiration(n.fechaExpiracion || '');
    setNewsBrochureName(n.archivoFolleto || '');
    setNotifySubscribers(false);
    
    // Auto-scroll to form
    const formElement = document.getElementById('sec-boletin');
    if (formElement) formElement.scrollIntoView({ behavior: 'smooth' });
  };

  const handleCancelEditNews = () => {
    setEditingNewsId(null);
    setNewsTitle('');
    setNewsBody('');
    setNewsBrochureName('');
    setNewsSchedulePublish('');
    setNewsExpiration('');
    setNotifySubscribers(false);
  };

  const handleDeleteNews = (id: string, titulo: string) => {
    setNewsToDelete({ id, titulo });
  };

  // --- Reply Citizen message ---
  const handleReplyTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyTicketTarget || !replyMessageText.trim()) return;

    replyTicket(replyTicketTarget.id, replyMessageText);
    alert(`Mensaje enviado con éxito. Ticket #${replyTicketTarget.id} marcado como Respondido.`);
    setReplyTicketTarget(null);
    setReplyMessageText('');
  };

  const handleAdjustSimulationClock = () => {
    if (!currentDateInput) return;
    const updatedDate = new Date(`${currentDateInput}T12:00:00`);
    setSimulationTime(updatedDate);
    alert(`Reloj interno reprogramado a: ${updatedDate.toLocaleDateString()}. Se revisó la vigencia y caducidad de campañas de salud.`);
  };

  const scrollToId = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-left">
      {/* Side Menu Navigation matching Citizen Dashboard style */}
      <aside className="col-span-12 lg:col-span-3 flex flex-col bg-[#0b0f59] text-white p-6 rounded-2xl shadow-lg border border-slate-700/30 h-max lg:sticky lg:top-24">
        <div className="flex justify-between items-start mb-6 border-b border-white/10 pb-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-secondary text-white flex items-center justify-center font-black text-sm border-2 border-white/20 shadow-md uppercase">
              {usuarioActual ? usuarioActual.nombreCompleto.substring(0, 2).toUpperCase() : 'FC'}
            </div>
            <div>
              <h3 className="font-bold text-sm tracking-tight truncate max-w-[150px]">
                {usuarioActual ? usuarioActual.nombreCompleto : 'Funcionario'}
              </h3>
              <p className="text-[10px] text-gray-300 font-mono mt-0.5 uppercase mb-1">
                {usuarioActual?.rol === 'funcionario_social' ? 'ASISTENTE SOCIAL' : 'ADMINISTRADOR'}
              </p>
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
          <div className="px-4 py-2 text-[10px] uppercase font-bold text-gray-400 tracking-wider">
            Consola Municipal
          </div>

          <button
            onClick={() => { scrollToId('sec-reportes'); setIsNavExpanded(false); }}
            className="w-full flex items-center gap-3 py-3 rounded-r-lg text-xs font-bold tracking-wide uppercase transition-all text-left text-gray-300 hover:text-white hover:bg-white/5 border-l-4 border-transparent pl-4 cursor-pointer"
          >
            <span className="material-symbols-outlined text-base normal-case">monitoring</span>
            <span>Estadísticas DIMAC</span>
          </button>

          {usuarioActual?.rol === 'funcionario_admin' && (
            <button
              onClick={() => { scrollToId('sec-funcionarios'); setIsNavExpanded(false); }}
              className="w-full flex items-center gap-3 py-3 rounded-r-lg text-xs font-bold tracking-wide uppercase transition-all text-left text-emerald-400 hover:text-emerald-300 hover:bg-white/5 border-l-4 border-transparent pl-4 cursor-pointer"
            >
              <span className="material-symbols-outlined text-base normal-case">badge</span>
              <span>Funcionarios (Admin)</span>
            </button>
          )}

          <button
            onClick={() => { scrollToId('sec-expedientes'); setIsNavExpanded(false); }}
            className="w-full flex items-center gap-3 py-3 rounded-r-lg text-xs font-bold tracking-wide uppercase transition-all text-left text-gray-300 hover:text-white hover:bg-white/5 border-l-4 border-transparent pl-4 cursor-pointer"
          >
            <span className="material-symbols-outlined text-base normal-case">folder_shared</span>
            <span>Bandeja Expedientes</span>
          </button>

          <button
            onClick={() => { scrollToId('sec-disponibilidad'); setIsNavExpanded(false); }}
            className="w-full flex items-center gap-3 py-3 rounded-r-lg text-xs font-bold tracking-wide uppercase transition-all text-left text-gray-300 hover:text-white hover:bg-white/5 border-l-4 border-transparent pl-4 cursor-pointer"
          >
            <span className="material-symbols-outlined text-base normal-case">edit_calendar</span>
            <span>Mi Disponibilidad</span>
          </button>

          <button
            onClick={() => { scrollToId('sec-boletin'); setIsNavExpanded(false); }}
            className="w-full flex items-center gap-3 py-3 rounded-r-lg text-xs font-bold tracking-wide uppercase transition-all text-left text-gray-300 hover:text-white hover:bg-white/5 border-l-4 border-transparent pl-4 cursor-pointer"
          >
            <span className="material-symbols-outlined text-base normal-case">newspaper</span>
            <span>Publicar Boletines</span>
          </button>

          <button
            onClick={() => { scrollToId('sec-buzon'); setIsNavExpanded(false); }}
            className="w-full flex items-center gap-3 py-3 rounded-r-lg text-xs font-bold tracking-wide uppercase transition-all text-left text-gray-300 hover:text-white hover:bg-white/5 border-l-4 border-transparent pl-4 cursor-pointer"
          >
            <span className="material-symbols-outlined text-base normal-case">chat</span>
            <span>Consultas Ciudadanas</span>
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

      {/* Main Content Area */}
      <div className="col-span-12 lg:col-span-9 space-y-8 bg-slate-50 p-4 md:p-8 rounded-3xl border border-slate-200">
      {/* Top operational banner adjust clock and simulator */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col md:flex-row shadow-xs justify-between gap-4 items-center">
        <div>
          <span className="text-[10px] bg-sky-100 text-sky-800 font-bold px-2 py-0.5 rounded uppercase">Entorno de Simulación</span>
          <h3 className="font-sans font-bold text-slate-800 text-xs mt-1">Hito Temporal del Servidor Municipal: {simulationTime.toLocaleString()}</h3>
        </div>
        <div className="flex gap-2 items-center flex-wrap">
          <input
            type="date"
            value={currentDateInput}
            onChange={(e) => setCurrentDateInput(e.target.value)}
            className="text-xs bg-slate-100 border border-slate-300 rounded-lg px-2.5 py-1 text-slate-700 outline-none"
          />
          <button
            onClick={handleAdjustSimulationClock}
            className="bg-slate-900 text-white rounded-lg px-3 py-1.5 text-xs font-bold font-mono hover:bg-slate-800 transition-colors"
          >
            Ajustar Fecha Servidor
          </button>
          
          <button
            onClick={triggerConcurrenciaSimulation}
            className="bg-amber-140 border border-amber-500 bg-amber-50 hover:bg-amber-100 text-amber-900 rounded-lg px-3 py-1.5 text-xs font-bold transition-all"
          >
            Simular Concurrencia Citas
          </button>
        </div>
      </div>

      {/* SECTION 1: REPORTES ESTADÍSTICOS DE GESTIÓN (HU-09) */}
      <div id="sec-reportes" className="bg-white border border-secondary/20 rounded-3xl p-6 md:p-8 shadow-ambient-l1 relative overflow-hidden">
        {/* Accent warning strip if any high demand triggers */}
        {(isSocialHighDemand || isLegalHighDemand) && (
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-secondary animate-pulse"></div>
        )}

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-5 mb-6">
          <div>
            <span className="text-secondary text-[10px] font-black uppercase tracking-wider">Módulo Analítico</span>
            <h2 className="text-xl font-black text-slate-900 tracking-tight leading-none uppercase mt-1">Dashboard de Gestión DIMAC</h2>
            <p className="text-xs text-gray-500 mt-1">Carga laboral semanal, atenciones filtradas de acuerdo a la dirección institucional.</p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Filter by Department area (HU-09-3) */}
            <select
              value={selectedAreaFilter}
              onChange={(e) => setSelectedAreaFilter(e.target.value as any)}
              className="text-xs bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-700 outline-none focus:border-slate-500 font-medium"
            >
              <option value="All">Ver Todas las Áreas</option>
              <option value="Social">Área Asistencia Social / DIDECO</option>
              <option value="Legal">Área Jurídico-Legal</option>
            </select>

            {/* Export mass CSV trigger (HU-09-2) */}
            <button
              onClick={handleExportCsv}
              className="bg-secondary hover:bg-secondary-container active:scale-95 text-white rounded-lg px-4 py-1.5 text-xs font-bold uppercase tracking-wider flex items-center gap-1 shadow-ambient-l1 transition-all cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Exportar Reporte CSV</span>
            </button>
          </div>
        </div>

        {/* ALERTA DE ALTA DEMANDA (HU-09-4) */}
        {selectedAreaFilter !== 'Legal' && isSocialHighDemand && (
          <div className="bg-red-50 border-2 border-dashed border-red-200 text-red-800 p-4 rounded-2xl text-xs font-semibold leading-relaxed mb-6 flex items-start gap-3 animate-pulse">
            <span className="material-symbols-outlined text-red-600 shrink-0 text-xl">gavel</span>
            <div>
              <p className="font-black text-red-900 uppercase">🚨 Alerta de Saturación Financiera: Área Asistencia Social (+90%)</p>
              <p className="text-red-700 font-medium mt-0.5">El volumen de citas y solicitudes de informes ha colapsado la agenda semanal. Se aconseja decretar reasignación presupuestaria en el centro CAM.</p>
            </div>
          </div>
        )}

        {selectedAreaFilter !== 'Social' && isLegalHighDemand && (
          <div className="bg-red-50 border-2 border-dashed border-red-200 text-red-800 p-4 rounded-2xl text-xs font-semibold leading-relaxed mb-6 flex items-start gap-3 animate-pulse">
            <span className="material-symbols-outlined text-red-600 shrink-0 text-xl">warning</span>
            <div>
              <p className="font-black text-red-900 uppercase">🚨 Alerta de Copatibilidad: Área Jurídico-Legal (+90%)</p>
              <p className="text-red-700 font-medium mt-0.5">La demanda de asesorías de patentes y subsidios de vivienda excede la capacidad laboral. Se aconseja reforzar el personal.</p>
            </div>
          </div>
        )}

        {/* Grid Statistics Mockups */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl relative">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Citas Agendadas</p>
            <p className="text-3xl font-black text-slate-900">{filterCitas.length}</p>
            <span className="text-[9px] text-gray-400 block mt-1.5 font-bold uppercase">Área: {selectedAreaFilter}</span>
          </div>
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl relative">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Expedientes Sociales Totales</p>
            <p className="text-3xl font-black text-slate-900">{filterTramites.length}</p>
            <span className="text-[9px] text-gray-400 block mt-1.5 font-bold uppercase">Área: {selectedAreaFilter}</span>
          </div>
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Carga Laboral Social</p>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-2xl font-black text-slate-900">{socialCapPct}%</span>
              <div className="flex-grow bg-gray-200 rounded-full h-2.5 relative overflow-hidden">
                <div className={`h-2.5 rounded-full ${isSocialHighDemand ? 'bg-red-500' : 'bg-emerald-500'}`} style={{ width: `${socialCapPct}%` }}></div>
              </div>
            </div>
          </div>
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Carga Laboral Jurídico</p>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-2xl font-black text-slate-900">{legalCapPct}%</span>
              <div className="flex-grow bg-gray-200 rounded-full h-2.5 relative overflow-hidden">
                <div className={`h-2.5 rounded-full ${isLegalHighDemand ? 'bg-red-500' : 'bg-emerald-500'}`} style={{ width: `${legalCapPct}%` }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Custom Visual Workload Chart designed with SVG for premium fidelity (HU-09-1) */}
        <div className="border border-slate-200 rounded-2xl p-5 bg-white">
          <p className="text-[11px] font-bold uppercase text-gray-400 tracking-wider mb-4">Carga de Trabajo Diaria Proyectada (Última quincena)</p>
          {/* Simple responsive SVG layout representing daily metrics cleanly */}
          <div className="h-48 w-full flex items-end gap-2.5 border-b border-slate-200 pb-2.5 pr-2">
            {[
              { label: '01 Oct', val: 35, color: '#f5f2ff' },
              { label: '03 Oct', val: 55, color: '#f5f2ff' },
              { label: '05 Oct', val: 40, color: '#f5f2ff' },
              { label: '07 Oct', val: 78, color: '#f5f2ff' },
              { label: '09 Oct', val: 48, color: '#f5f2ff' },
              { label: '11 Oct', val: 92, color: '#b40063' }, // Highlights heavy days
              { label: '13 Oct', val: 65, color: '#f5f2ff' },
              { label: '15 Oct', val: 84, color: '#f5f2ff' },
              { label: '17 Oct', val: 95, color: '#ef4444' }  // Highlights saturated days
            ].map((bar, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group">
                <div className="text-[9px] text-slate-600 font-bold mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {bar.val} tiques
                </div>
                <div
                  className="w-full rounded-t-lg transition-all duration-500 hover:scale-[1.04]"
                  style={{
                    height: `${bar.val}%`,
                    backgroundColor: bar.color === '#f5f2ff' ? '#bcc2ff' : bar.color
                  }}
                ></div>
                <span className="text-[9px] text-gray-400 font-mono mt-1.5 leading-none">{bar.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* SECTION ADMINISTRADOR: ESTADÍSTICAS DE FUNCIONARIOS */}
      {usuarioActual?.rol === 'funcionario_admin' && (
        <div id="sec-funcionarios" className="bg-white border border-secondary/20 rounded-3xl p-6 md:p-8 shadow-ambient-l1">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-5 mb-6">
            <div>
              <span className="text-secondary text-[10px] font-black uppercase tracking-wider">Módulo Analítico</span>
              <h2 className="text-xl font-black text-slate-900 tracking-tight leading-none uppercase mt-1">Rendimiento de Funcionarios</h2>
              <p className="text-xs text-gray-500 mt-1">Métricas de trabajo y desempeño de los especialistas del CAM por área.</p>
            </div>
            <div>
              <button
                onClick={handleExportExcelFuncionarios}
                className="bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-lg px-4 py-1.5 text-xs font-bold uppercase tracking-wider flex items-center gap-1 shadow-sm transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">download</span>
                <span>Exportar a Excel</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Funcionarios Activos</p>
              <p className="text-3xl font-black text-slate-900">{mockFuncionariosStats.length}</p>
            </div>
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Total Trámites Resueltos</p>
              <p className="text-3xl font-black text-emerald-600">
                {mockFuncionariosStats.reduce((acc, current) => acc + current.tramitesResueltos, 0)}
              </p>
            </div>
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Promedio Evaluación</p>
              <div className="flex items-center gap-1">
                <span className="material-symbols-outlined text-amber-400 text-lg">star</span>
                <p className="text-3xl font-black text-slate-900">
                  {(mockFuncionariosStats.reduce((acc, current) => acc + current.evaluacion, 0) / mockFuncionariosStats.length).toFixed(1)}
                </p>
              </div>
            </div>
          </div>

          {/* Table of Funcionarios */}
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left font-sans text-xs">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200 text-gray-600 uppercase tracking-wider">
                  <th className="py-3 px-4 font-black">Funcionario</th>
                  <th className="py-3 px-4 font-black text-center">Área</th>
                  <th className="py-3 px-4 font-black text-center">T. Resueltos</th>
                  <th className="py-3 px-4 font-black text-center">Tickets</th>
                  <th className="py-3 px-4 font-black text-center">Horas/Sem</th>
                  <th className="py-3 px-4 font-black text-center">Nota</th>
                </tr>
              </thead>
              <tbody>
                {mockFuncionariosStats.map((func) => (
                  <tr key={func.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 text-sm">{func.nombre}</div>
                      <div className="text-[10px] text-gray-500 font-medium">{func.cargo}</div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide
                        ${func.area === 'Social' ? 'bg-sky-100 text-sky-800' :
                          func.area === 'Legal' ? 'bg-indigo-100 text-indigo-800' :
                          func.area === 'Salud' ? 'bg-rose-100 text-rose-800' : 
                          'bg-amber-100 text-amber-800'}`}
                      >
                        {func.area}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-slate-700">{func.tramitesResueltos}</td>
                    <td className="py-3 px-4 text-center font-bold text-slate-700">{func.ticketsAtendidos}</td>
                    <td className="py-3 px-4 text-center text-gray-600">{func.hrsSemanales} hrs</td>
                    <td className="py-3 px-4 text-center">
                      <div className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 px-2 py-0.5 rounded-lg border border-amber-200 font-bold">
                        <span className="material-symbols-outlined text-[12px]">star</span>
                        {func.evaluacion}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SECTION 2: GRID OF FOLDERS REVIEW & AVAILABILITY / ACTIONS */}
      <div id="sec-expedientes" className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Review list matching Mockup 2 Table (col-span-8) */}
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-3xl p-5 md:p-6 shadow-xs">
          <div className="border-b border-gray-100 pb-3 mb-4">
            <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Trámite de Expedientes</span>
            <h3 className="text-base font-extrabold text-slate-900 tracking-tight leading-none uppercase mt-1">
              Bandeja de Expedientes Sociales
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left font-sans text-xs">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200 text-gray-500 uppercase tracking-wider">
                  <th className="py-2.5 px-3.5 font-bold">Folio</th>
                  <th className="py-2.5 px-3.5 font-bold">Ciudadano</th>
                  <th className="py-2.5 px-3.5 font-bold">Tipo Solicitud</th>
                  <th className="py-2.5 px-3.5 font-bold">Estado Actual</th>
                  <th className="py-2.5 px-3.5 font-bold text-right">Evaluar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tramites.map((folder) => (
                  <tr key={folder.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-3.5 font-mono font-bold text-slate-800">#{folder.id}</td>
                    <td className="py-3 px-3.5 font-medium">{folder.ciudadanoNombre}</td>
                    <td className="py-3 px-3.5">{folder.tipo}</td>
                    <td className="py-3 px-3.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border leading-none ${
                        folder.estado === 'Completado' ? 'bg-emerald-50 text-emerald-800 border-emerald-100' :
                        folder.estado === 'Observaciones' ? 'bg-amber-100 text-amber-800 border-amber-200' :
                        folder.estado === 'Rechazado' ? 'bg-red-550 border-red-200 bg-red-50 text-red-800' : 'bg-slate-100 text-slate-800 border-slate-200'
                      }`}>
                        {folder.estado}
                      </span>
                    </td>
                    <td className="py-3 px-3.5 text-right">
                      <button
                        onClick={() => setInspectingTramite(folder)}
                        className="text-xs text-secondary hover:text-secondary-container font-bold uppercase hover:underline cursor-pointer"
                      >
                        Revisar Detalle
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Availability Manager sidebar matching Mockup 2 (col-span-4) */}
        <div id="sec-disponibilidad" className="lg:col-span-4 bg-white border border-slate-200 rounded-3xl p-5 md:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="border-b border-gray-100 pb-3 mb-4">
              <span className="text-[10px] uppercase font-bold text-[#b40063]">Control Horario</span>
              <h3 className="text-base font-extrabold text-[#000116] tracking-tight leading-none uppercase mt-1">
                Mi Disponibilidad
              </h3>
            </div>

            {/* Inline list of scheduling blocks */}
            <div className="space-y-2.5">
              {availabilitySlots.map((slot) => (
                <div key={slot.id} className="p-3 border border-slate-100 rounded-xl bg-slate-50/60 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-slate-800 leading-none">{slot.fecha}</p>
                    <p className="font-mono text-[10px] text-slate-500 mt-1">{slot.hora} ({slot.blocks} bloques)</p>
                  </div>
                  <button
                    onClick={() => handleDeleteSlot(slot.id)}
                    className="p-1 text-gray-400 hover:text-red-550 hover:text-red-600 transition-colors cursor-pointer"
                    title="Remover"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>

            <hr className="border-slate-100 my-4" />

            {/* Form to submit inline slot */}
            <form onSubmit={handleAddSlot} className="space-y-3">
              <p className="text-[10px] font-black uppercase text-gray-400 tracking-wider mb-2">Añadir Nueva Disponibilidad:</p>
              <div>
                <input
                  type="text"
                  placeholder="Ej: Jueves, 26 Oct"
                  required
                  value={newAvFecha}
                  onChange={(e) => setNewAvFecha(e.target.value)}
                  className="w-full text-xs h-9 px-3 border border-slate-300 rounded-lg outline-none"
                />
              </div>
              <div>
                <input
                  type="text"
                  placeholder="Ej: 09:00 - 13:00"
                  required
                  value={newAvHora}
                  onChange={(e) => setNewAvHora(e.target.value)}
                  className="w-full text-xs h-9 px-3 id-slot border border-slate-300 rounded-lg outline-none"
                />
              </div>
              <button
                type="submit"
                className="w-full h-9 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold uppercase transition-colors flex items-center justify-center gap-1 cursor-pointer"
              >
                <span>Añadir Bloque</span>
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* SECTION 3: PUBLISH BLOCK & CITIZEN TICKETS CHAT */}
      <div id="sec-boletin" className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* News Publisher matches Mockup 2 format (col-span-8) */}
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-xs">
          <div className="border-b border-gray-100 pb-3 mb-5">
            <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Boletín Oficial</span>
            <h3 className="text-base font-extrabold text-[#000116] tracking-tight leading-none uppercase mt-1">
              Publicar Noticia o Campaña Territorial
            </h3>
          </div>

          <form onSubmit={handlePublishNews} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Título de la Actualización</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Gran Operativo Vacunatorio en Villa Costanera"
                  value={newsTitle}
                  onChange={(e) => setNewsTitle(e.target.value)}
                  className="w-full text-xs h-10 px-4 border border-slate-300 rounded-lg outline-none focus:border-secondary focus:ring-1 focus:ring-secondary"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Categoría</label>
                <select
                  value={newsCategory}
                  onChange={(e) => setNewsCategory(e.target.value as any)}
                  className="w-full text-xs h-10 px-4 border border-slate-300 rounded-lg outline-none focus:border-secondary focus:ring-1 focus:ring-secondary font-semibold text-slate-700 bg-white"
                >
                  <option value="Operativo">Operativos Territoriales</option>
                  <option value="Salud">Operativos de Salud / Vacunación</option>
                  <option value="Infraestructura">Infraestructura</option>
                  <option value="Tecnología">Tecnología Ciudadana</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Detalle del Evento y Requisitos</label>
              <textarea
                placeholder="Escribe el desglose de la noticia, horarios, requisitos (cédula, edad), etc..."
                required
                rows={4}
                value={newsBody}
                onChange={(e) => setNewsBody(e.target.value)}
                className="w-full text-xs p-4 border border-slate-300 rounded-lg outline-none focus:border-secondary focus:ring-1 focus:ring-secondary resize-none font-sans"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              {/* HU-01-2: Publish schedule */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Programar Fecha Publicación</label>
                <input
                  type="datetime-local"
                  value={newsSchedulePublish}
                  onChange={(e) => setNewsSchedulePublish(e.target.value)}
                  className="w-full text-xs h-10 px-4 border border-slate-300 rounded-lg outline-none"
                />
              </div>
              
              {/* HU-10-3: Programación de caducidad */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Fecha de Término / Caducidad</label>
                <input
                  type="datetime-local"
                  value={newsExpiration}
                  onChange={(e) => setNewsExpiration(e.target.value)}
                  className="w-full text-xs h-10 px-4 border border-slate-300 rounded-lg outline-none"
                />
              </div>

              {/* HU-10-4: Brochure name */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Nombre Folleto Adjunto (PDF)</label>
                <input
                  type="text"
                  placeholder="ej: instructivo_salud.pdf"
                  value={newsBrochureName}
                  onChange={(e) => setNewsBrochureName(e.target.value)}
                  className="w-full text-xs h-10 px-4 border border-slate-300 rounded-lg outline-none"
                />
              </div>
            </div>

            {/* Check proactive mail notification trigger (HU-10-2) */}
            <div className="flex items-center gap-2 py-2">
              <input
                type="checkbox"
                id="notify-sub-checkbox"
                checked={notifySubscribers}
                onChange={(e) => setNotifySubscribers(e.target.checked)}
                className="w-4 h-4 text-secondary bg-white border-slate-300 rounded focus:ring-secondary"
              />
              <label htmlFor="notify-sub-checkbox" className="text-xs font-semibold text-slate-700 cursor-pointer">
                📧 Notificar a Interesados por Mail (SMTP Alerta Masiva)
              </label>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              {editingNewsId && (
                <button
                  type="button"
                  onClick={handleCancelEditNews}
                  className="px-6 py-2.5 bg-slate-200 hover:bg-slate-300 duration-150 text-slate-700 font-bold text-xs uppercase tracking-wider rounded-xl cursor-pointer"
                >
                  Cancelar Edición
                </button>
              )}
              <button
                type="submit"
                className="px-6 py-2.5 bg-secondary hover:bg-secondary-container duration-150 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-ambient-l1 cursor-pointer"
              >
                {editingNewsId ? 'Guardar Cambios' : 'Publicar Noticia en Panel Público'}
              </button>
            </div>
          </form>

          {/* List of existing news / boletines */}
          <div className="mt-10 border-t border-slate-100 pt-6">
            <h4 className="text-sm font-bold text-slate-800 tracking-tight uppercase mb-4">Boletines Publicados</h4>
            {noticias.length === 0 ? (
              <p className="text-xs text-slate-500">No hay boletines publicados.</p>
            ) : (
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                {noticias.map((n) => (
                  <div key={n.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 border border-slate-200 rounded-xl bg-slate-50">
                    <div className="flex-1 mb-3 sm:mb-0 pr-4">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold py-0.5 px-2 bg-slate-200 text-slate-700 rounded-md uppercase tracking-wider">{n.categoria}</span>
                        {!n.visible && <span className="text-[10px] font-bold py-0.5 px-2 bg-amber-100 text-amber-700 rounded-md uppercase tracking-wider">Oculta (Borrador / Futuro)</span>}
                      </div>
                      <h5 className="text-sm font-bold text-slate-900 leading-tight">{n.titulo}</h5>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-1">{n.cuerpo}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleEditNews(n)}
                        className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors cursor-pointer"
                        title="Editar"
                      >
                        <span className="material-symbols-outlined text-[20px]">edit</span>
                      </button>
                      <button
                        onClick={() => handleDeleteNews(n.id, n.titulo)}
                        className="p-2 text-error hover:bg-error/10 rounded-lg transition-colors cursor-pointer"
                        title="Eliminar"
                      >
                        <span className="material-symbols-outlined text-[20px]">delete</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Tickets Box replies matches Mockup 2 format (col-span-4) */}
        <div id="sec-buzon" className="lg:col-span-4 bg-white border border-slate-200 rounded-3xl p-5 md:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="border-b border-gray-100 pb-3 mb-4">
              <span className="text-[10px] uppercase font-bold text-[#b40063]">Ayuda y Soporte</span>
              <h3 className="text-base font-extrabold text-[#000116] tracking-tight leading-none uppercase mt-1">
                Consultas Ciudadanas
              </h3>
            </div>

            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
              {tickets.filter(t => t.estado === 'Pendiente').length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-6 leading-relaxed">No hay tiques de consulta pendientes.</p>
              ) : (
                tickets.filter(t => t.estado === 'Pendiente').map((tk) => (
                  <div
                    key={tk.id}
                    className="p-3.5 border border-slate-200 rounded-xl bg-slate-50/60 flex flex-col gap-2 shadow-xs"
                  >
                    <div className="flex justify-between items-center flex-wrap">
                      <span className="text-[9px] font-mono font-bold bg-[#bcc2ff] text-[#000116] px-1.5 py-0.5 rounded leading-none">{tk.id}</span>
                      <span className="text-[9px] text-gray-400">{tk.ingresoFecha}</span>
                    </div>

                    <h5 className="font-extrabold text-xs text-slate-800 leading-snug">{tk.asunto}</h5>
                    <p className="text-[11px] text-gray-500 italic font-mono">"{tk.mensaje.substring(0, 80)}..."</p>
                    <p className="text-[9px] text-[#b40063] font-bold leading-none">Área Evaluadora: {tk.area}</p>

                    <button
                      type="button"
                      onClick={() => setReplyTicketTarget(tk)}
                      className="mt-2 w-full py-1.5 bg-[#000116] text-white text-[10px] font-bold tracking-wider uppercase rounded-lg hover:bg-slate-850 duration-150 text-center"
                    >
                      Responder Ticket
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* MODAL I: REVIEW DOSSIER FILES EVALUATOR (HU-02) */}
      {inspectingTramite && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-[110] p-4 text-left">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl p-6 md:p-8 border border-gray-100 flex flex-col">
            <div className="flex items-center justify-between border-b border-gray-150 pb-4 mb-5">
              <div>
                <span className="bg-[#bcc2ff] text-[#000116] text-[9px] font-mono px-2 py-0.5 rounded uppercase font-bold">
                  EXPEDIENTE #{inspectingTramite.id}
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-1 uppercase tracking-tight">{inspectingTramite.tipo}</h3>
              </div>
              <button
                onClick={() => setInspectingTramite(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="overflow-y-auto flex-grow space-y-6 pr-2">
              <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div>
                  <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Ciudadano Solicitante</p>
                  <p className="font-extrabold text-slate-800 mt-0.5">{inspectingTramite.ciudadanoNombre} ({inspectingTramite.ciudadanoRut})</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Fecha Recibido</p>
                  <p className="font-extrabold text-slate-800 mt-0.5">{inspectingTramite.ingresoFecha}</p>
                </div>
              </div>

              {/* Integrity error list box (HU-02-4 validation check) */}
              {integrityErrorList && (
                <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-xl text-xs font-semibold leading-relaxed">
                  <span className="font-black text-red-900 uppercase">⚠️ INTEGRIDAD DE EXPEDIENTE BLOCKED</span>
                  <p className="text-red-700 font-medium mt-1">El expediente no cumple con los documentos mínimos obligatorios verificado en el sistema. Debe solicitarle cargar:</p>
                  <ul className="list-disc pl-5 mt-1 text-red-800 font-bold space-y-0.5 font-mono text-[10px]">
                    {integrityErrorList.map((docName, idx) => (
                      <li key={idx}>{docName}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Submitted documents checklist table */}
              <div className="space-y-3">
                <p className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Evaluación de Archivos Acompañados:</p>
                
                <div className="space-y-3">
                  {inspectingTramite.documentos.map((doc) => (
                    <div key={doc.id} className="p-4 rounded-xl border border-slate-200 bg-white flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs font-sans">
                      <div>
                        <p className="font-bold text-slate-800 leading-none">{doc.nombre}</p>
                        <p className="text-[9px] font-mono text-gray-400 mt-1 font-semibold uppercase">Requerido: {doc.requerido ? 'Si' : 'No'}</p>
                        
                        {doc.cargado ? (
                          <div className="mt-2.5 inline-flex items-center gap-1 text-[10px] bg-slate-100 border border-slate-200 text-slate-700 px-2 py-0.5 rounded font-mono font-bold">
                            <span>📎 {doc.archivoUrl}</span>
                            <span className="text-gray-400 font-medium">({doc.archivoSizeMB}MB)</span>
                          </div>
                        ) : (
                          <span className="mt-2.5 inline-block text-[10px] bg-red-105 border border-red-200 bg-red-50 text-red-800 px-1.5 py-0.5 rounded font-bold uppercase leading-none">
                            FALTA ANEXAR
                          </span>
                        )}
                      </div>

                      {/* Evaluator actions */}
                      <div className="flex gap-2 items-center">
                        <span className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                          doc.estado === 'Verificado' ? 'bg-emerald-100 text-emerald-800' :
                          doc.estado === 'Observado' ? 'bg-amber-100 text-yellow-800' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {doc.estado}
                        </span>

                        {doc.cargado && (
                          <>
                            <button
                              onClick={() => approveDocument(inspectingTramite.id, doc.id)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-bold uppercase cursor-pointer"
                            >
                              ✓ Validar
                            </button>
                            <button
                              onClick={() => setObserveDocId(doc.id)}
                              className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded text-[10px] font-bold uppercase cursor-pointer"
                            >
                              ⚠ Observar
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Observe trigger input drawer inline popup */}
              {observeDocId && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl space-y-3">
                  <p className="text-xs font-bold text-yellow-850">Comentario de Observación / Rechazo Temporal (HU-02-3):</p>
                  <textarea
                    placeholder="Scribe los motivos que hacen inválido este archivo (ej: resolución ilegible, incompleto, etc)..."
                    required
                    value={observeCommentText}
                    onChange={(e) => setObserveCommentText(e.target.value)}
                    className="w-full text-xs p-3 bg-white border border-slate-300 rounded-lg outline-none focus:border-yellow-500"
                  />
                  <div className="flex justify-end gap-2 text-xs">
                    <button
                      onClick={() => {
                        setObserveDocId(null);
                        setObserveCommentText('');
                      }}
                      className="px-3 py-1.5 bg-slate-200 hover:bg-slate-350 text-slate-700 rounded-lg font-medium"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={() => {
                        if (!observeCommentText.trim()) return;
                        observeDocument(inspectingTramite.id, observeDocId, observeCommentText);
                        setObserveDocId(null);
                        setObserveCommentText('');
                        // Reload state inside popup
                        const match = tramites.find(t => t.id === inspectingTramite.id);
                        if (match) setInspectingTramite(match);
                      }}
                      className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold"
                    >
                      Enviar Observación
                    </button>
                  </div>
                </div>
              )}

              {/* Change dossier status with compliance checks */}
              <div className="border-t border-slate-150 pt-5 space-y-3">
                <p className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Avanzar Estado del Expediente:</p>
                <div className="flex gap-2 flex-wrap text-xs">
                  <button
                    onClick={() => handleReviewStatusChange('En Revisión')}
                    className="px-3.5 py-2 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-100 font-semibold cursor-pointer"
                  >
                    En Revisión
                  </button>
                  <button
                    onClick={() => handleReviewStatusChange('En Análisis')}
                    className="px-3.5 py-2 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-100 font-semibold cursor-pointer"
                  >
                    En Análisis
                  </button>
                  <button
                    onClick={() => handleReviewStatusChange('Rechazado')}
                    className="px-3.5 py-2 border border-red-200 text-red-650 text-red-650 bg-red-50 hover:bg-red-100 rounded-xl font-bold cursor-pointer"
                  >
                    Rechazar Solicitud
                  </button>
                  <button
                    onClick={() => handleReviewStatusChange('Completado')}
                    className="px-3.5 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 font-bold ml-auto cursor-pointer"
                  >
                    Marcar Completado ✓ (Sancionar Resolución)
                  </button>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-150 flex justify-end shrink-0 mt-4 rounded-b-2xl">
              <button
                onClick={() => setInspectingTramite(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl cursor-pointer"
              >
                Cerrar Expediente
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL II: REPLY CHAT CONSULTATION (HU-08) */}
      {replyTicketTarget && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-[110] p-4 text-left">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl overflow-hidden border border-gray-100 flex flex-col">
            <h3 className="text-base font-bold text-slate-900 mb-1">Responder Consulta Ciudadana</h3>
            <span className="text-[10px] font-mono text-gray-500 block mb-4">Ticket de referencia: #{replyTicketTarget.id}</span>

            <div className="bg-slate-50 p-4 rounded-xl text-xs space-y-2 mb-4 leading-relaxed max-h-40 overflow-y-auto border border-slate-150">
              <p className="font-extrabold text-[#000116]">Mensaje Ciudadano ({replyTicketTarget.ciudadanoNombre}):</p>
              <p className="italic text-gray-650 font-medium">"{replyTicketTarget.mensaje}"</p>
              {replyTicketTarget.evidenciaNombre && (
                <p className="text-[10px] font-mono text-gray-400 font-bold font-semibold mt-1">📎 Archivo Adjunto: {replyTicketTarget.evidenciaNombre} ({replyTicketTarget.evidenciaSizeMB}MB)</p>
              )}
            </div>

            <form onSubmit={handleReplyTicket} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Escribir Respuesta (Se enviará por Mail / SMTP):</label>
                <textarea
                  placeholder="Por favor describa con detalle las resoluciones técnicas adoptadas para solucionar con el tique y notificar..."
                  required
                  rows={4}
                  value={replyMessageText}
                  onChange={(e) => setReplyMessageText(e.target.value)}
                  className="w-full text-xs p-3 border border-slate-300 rounded-lg outline-none font-sans"
                />
              </div>

              <div className="flex gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setReplyTicketTarget(null);
                    setReplyMessageText('');
                  }}
                  className="flex-1 h-10 border border-slate-200 text-slate-600 rounded-lg font-semibold hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-grow h-10 bg-secondary hover:bg-secondary-container text-white font-bold rounded-lg uppercase transition-all flex items-center justify-center gap-1 shadow-sm cursor-pointer"
                >
                  <span>Enviar Respuesta</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* MODAL III: CONFIRM DELETE NEWS */}
      {newsToDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-[110] p-4 text-left">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl overflow-hidden border border-gray-100 flex flex-col items-center text-center">
            <span className="material-symbols-outlined text-4xl text-error mb-4">warning</span>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Eliminar Boletín</h3>
            <p className="text-sm text-slate-600 mb-6">
              ¿Estás seguro de que deseas eliminar el boletín <br/>
              <span className="font-bold text-slate-900">"{newsToDelete.titulo}"</span>?
            </p>
            <div className="flex gap-3 w-full">
              <button
                type="button"
                onClick={() => setNewsToDelete(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteNoticia(newsToDelete.id);
                  setNewsToDelete(null);
                }}
                className="flex-1 py-2.5 bg-error hover:bg-red-600 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-colors cursor-pointer"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};
