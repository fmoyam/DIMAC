/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Noticia } from '../types';

interface HomeViewProps {
  onOpenClaveUnica: () => void;
  setActiveView: (view: string) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  onOpenClaveUnica,
  setActiveView,
}) => {
  const { noticias, usuarioActual, loginFuncionario } = useApp();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDateFilter, setSelectedDateFilter] = useState<string>('');
  const [selectedNews, setSelectedNews] = useState<Noticia | null>(null);

  // Filter noticias based on visibility, category, and date (HU-10-1)
  const filteredNoticias = noticias.filter(n => {
    if (!n.visible) return false;
    
    // Category match
    if (selectedCategory !== 'all' && n.categoria !== selectedCategory) return false;

    // Date filtering: if filter is set, show matches matching or after the filter
    if (selectedDateFilter) {
      if (new Date(n.fecha) < new Date(selectedDateFilter)) return false;
    }

    return true;
  });

  const handleAdminAccess = async () => {
    // Log into Administrator role
    await loginFuncionario('administrador@maipu.cl', 'funcionario_admin');
    setActiveView('admin');
  };

  const handleOfficialAccess = async () => {
    // Automatically log into Social Assistant as a default official access helper
    await loginFuncionario('social@maipu.cl', 'funcionario_social');
    setActiveView('admin');
  };

  const downloadFolleto = (fileName: string) => {
    // Emulated download file
    const element = document.createElement("a");
    const file = new Blob([`FOLLETO INFORMATIVO MUNICIPAL - DIMAC MAIPU\nArchivo Relacionado: ${fileName}\n\nPor favor imprima este folleto y preséntelo en la entrada del operativo de salud con sus datos correspondientes.\n\nFirma:\nIlustre Municipalidad de Maipú Chile`], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = fileName;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="flex flex-col gap-12 md:gap-16">
      {/* Hero Section Bento Grid */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-4">
        {/* Main Hero Card */}
        <div className="lg:col-span-8 rounded-2xl overflow-hidden relative shadow-xl h-[420px] md:h-[480px] bg-slate-900 group">
          <img
            alt="Plaza Maipú"
            className="absolute inset-0 w-full h-full object-cover z-0 filter brightness-[0.7] group-hover:scale-[1.02] transition-all duration-700"
            referrerPolicy="no-referrer"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuCmvkv7Lu6XHPfQ9oHR42Li7qOjME-Q6yVtg5Orzew5l1fWOpLuPQzozNwcKBcOOxfo-NR-3FovhwXQo2q_ZEvjG1Znz57KNgSzHNwiAPJESFkQoD64jAugT7azCY5eAnjJe2M6Lhn6GOl7VQMtZatj7Ry_weoyuKQHRY4W3SZQuJNlQqKkhp6ytKW2gtyxXkrEzZ6VvXQMS5Tfs9nxqLwbvdUTxF_mxQ7KMB6zeELXkfUHplfN9wnM7TjJ0wkEvPtODVT4WYOcE7Q"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#000116] via-[#000116]/40 to-transparent z-10"></div>
          <div className="absolute bottom-0 left-0 w-full p-6 md:p-10 z-20 flex flex-col justify-end h-full text-left">
            <span className="inline-block px-3 py-1 bg-secondary text-white font-mono text-xs uppercase tracking-wider font-semibold rounded-full mb-4 w-max">
              Portal Ciudadano
            </span>
            <h2 className="font-sans text-3xl md:text-4xl font-extrabold text-white mb-2 max-w-2xl tracking-tight leading-tight">
              Tu municipio, más cerca y eficiente.
            </h2>
            <p className="text-gray-300 font-sans text-sm md:text-base mb-6 max-w-xl leading-relaxed">
              Accede a todos tus trámites, citas y beneficios municipales desde un solo lugar, de forma rápida y segura.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              {usuarioActual ? (
                <button
                  onClick={() => setActiveView('citizen-tramites')}
                  className="flex items-center justify-center gap-2 bg-secondary hover:bg-secondary-container active:scale-[0.98] text-white rounded-lg px-5 py-3 text-xs font-bold uppercase tracking-wider transition-all shadow-ambient-l1 cursor-pointer"
                >
                  <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <span>Ir a Mi Panel Ciudadano</span>
                </button>
              ) : (
                <button
                  onClick={onOpenClaveUnica}
                  className="flex items-center justify-center gap-2.5 bg-secondary hover:bg-secondary-container active:scale-[0.98] text-white rounded-lg px-5 py-3 text-xs font-bold uppercase tracking-wider transition-all shadow-ambient-l1 cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                  <span>Ingresar con Clave Única</span>
                </button>
              )}
              <button
                onClick={handleOfficialAccess}
                className="flex items-center justify-center gap-2 bg-transparent text-white border border-white/30 rounded-xl px-5 py-3 text-xs font-bold hover:bg-white/15 transition-all cursor-pointer"
              >
                <span>Acceso para funcionarios</span>
              </button>
            </div>
          </div>
        </div>

        {/* Quick Stats sidepanel based on mockup */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-ambient-l1 flex flex-col justify-center h-1/2 text-left hover:shadow-ambient-l2 transition-all duration-300">
            <div className="w-12 h-12 rounded-full bg-secondary/10 text-secondary flex items-center justify-center mb-4">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <h3 className="font-sans text-lg font-bold text-slate-900 mb-1">+50 Trámites Digitales</h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              Realiza solicitudes sin moverte de tu casa, adjunta antecedentes escaneados y recibe decretos.
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col justify-center h-1/2 text-left hover:shadow-md transition-all duration-300">
            <div className="w-12 h-12 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center mb-4">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <h3 className="font-sans text-lg font-bold text-slate-900 mb-1">Asistencia Continua</h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              Soporte digital permanente a través de tiques para guiarte en cada paso administrativo.
            </p>
          </div>
        </div>
      </section>

      {/* Featured News & Operative Bulletins */}
      <section className="text-left mt-4 py-2 border-t border-slate-200/60 pt-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <h2 className="font-sans text-2xl font-black text-slate-900 tracking-tight">
              Noticias y Operativos
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Mantente informado sobre los operativos territoriales en tu barrio.
            </p>
          </div>

          {/* Filtering Actions Container (HU-10-1) */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Category selection */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="text-xs bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-700 outline-none focus:border-slate-500 font-medium"
            >
              <option value="all">Todas las Categorías</option>
              <option value="Operativo">Operativos Territoriales</option>
              <option value="Salud">Operativos de Salud / Vacunación</option>
              <option value="Infraestructura">Infraestructura</option>
              <option value="Tecnología">Tecnología Ciudadana</option>
            </select>

            {/* Date filter picker */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-gray-500 uppercase">Desde:</span>
              <input
                type="date"
                value={selectedDateFilter}
                onChange={(e) => setSelectedDateFilter(e.target.value)}
                className="text-xs bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-slate-700 outline-none focus:border-slate-500"
              />
              {selectedDateFilter && (
                <button
                  onClick={() => setSelectedDateFilter('')}
                  className="text-xs text-secondary hover:underline font-bold px-1 cursor-pointer"
                >
                  Borrar
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Noticia Grid Cards */}
        {filteredNoticias.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 border border-slate-200 rounded-2xl">
            <span className="material-symbols-outlined text-4xl text-gray-400">event_busy</span>
            <p className="text-sm text-gray-500 mt-2 font-medium">No se encontraron noticias ni operativos activos para esta selección.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {filteredNoticias.map((item) => (
              <article
                key={item.id}
                className="flex flex-col bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all duration-300 overflow-hidden group cursor-pointer"
                onClick={() => setSelectedNews(item)}
              >
                <div className="h-48 overflow-hidden relative bg-slate-100">
                  <img
                    alt={item.titulo}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                    src={item.imagen}
                  />
                  {/* Category Pill Tag */}
                  <span className="absolute top-4 left-4 bg-white/95 backdrop-blur-xs text-xs font-bold text-slate-900 border border-slate-200 px-2.5 py-1 rounded-full shadow-xs">
                    {item.categoria}
                  </span>
                </div>
                <div className="p-6 flex flex-col flex-grow">
                  <div className="flex items-center gap-1 text-gray-400 text-xs font-medium mb-2.5">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>
                      {new Date(item.fecha).toLocaleDateString('es-ES', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 group-hover:text-secondary transition-colors leading-snug mb-2 line-clamp-1">
                    {item.titulo}
                  </h3>
                  <p className="text-xs text-gray-400 mb-4 line-clamp-3 leading-relaxed flex-grow">
                    {item.cuerpo}
                  </p>
                  <span className="text-xs font-bold text-slate-800 group-hover:text-secondary transition-colors inline-flex items-center gap-1">
                    <span>Leer más</span>
                    <svg className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </span>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* News Detail Modal Popup */}
      {selectedNews && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-[110] p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150 text-left flex flex-col max-h-[85vh]">
            <div className="relative h-48 bg-slate-100 flex-shrink-0">
              <img
                alt={selectedNews.titulo}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
                src={selectedNews.imagen}
              />
              <button
                onClick={() => setSelectedNews(null)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center transition-colors shadow-md"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <span className="absolute bottom-4 left-4 bg-secondary text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm">
                Categoría: {selectedNews.categoria}
              </span>
            </div>
            
            <div className="p-6 overflow-y-auto flex-grow">
              <span className="text-xs font-mono font-bold text-[#b40063] block mb-1">
                PUBLICADO EL {new Date(selectedNews.fecha).toLocaleDateString()}
              </span>
              <h3 className="text-lg font-bold text-slate-900 leading-snug mb-3">
                {selectedNews.titulo}
              </h3>
              <p className="text-xs text-gray-600 leading-relaxed text-justify space-y-2">
                {selectedNews.cuerpo}
              </p>

              {/* Expiration date metadata (HU-10-3) */}
              {selectedNews.fechaExpiracion && (
                <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-dashed border-slate-300 text-[10px] text-gray-500 font-mono flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                  <span>Este operativo finaliza o expira obligatoriamente en la fecha: {new Date(selectedNews.fechaExpiracion).toLocaleString()}</span>
                </div>
              )}

              {/* Attached file folder block (HU-10-4) */}
              {selectedNews.archivoFolleto && (
                <div className="mt-4 p-4 bg-[#f5f2ff] border border-[#e0e0ff] rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-lg bg-pink-100 flex items-center justify-center text-pink-600">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800 leading-none">Folleto Técnico Requerido</p>
                      <p className="text-[10px] text-gray-500 mt-0.5">{selectedNews.archivoFolleto}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => downloadFolleto(selectedNews.archivoFolleto || '')}
                    className="px-3 py-1.5 bg-secondary hover:bg-secondary-container text-white rounded-lg text-[10px] font-bold tracking-wider uppercase transition-colors cursor-pointer"
                  >
                    Descargar
                  </button>
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedNews(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Cerrar Noticia
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Access Floor */}
      <div className="border-t border-slate-200 mt-8 pt-8 flex justify-center pb-8">
        <button
          onClick={handleAdminAccess}
          className="flex items-center justify-center gap-2 bg-transparent text-slate-500 border border-slate-300 rounded-xl px-5 py-3 text-xs font-bold hover:bg-slate-100 transition-all cursor-pointer shadow-ambient-l1"
        >
          <span className="material-symbols-outlined text-base">admin_panel_settings</span>
          <span>Acceso de Administrador</span>
        </button>
      </div>
    </div>
  );
};
