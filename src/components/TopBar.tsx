/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

interface TopBarProps {
  onOpenClaveUnica: () => void;
  activeView: string;
  setActiveView: (view: string) => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  onOpenClaveUnica,
  activeView,
  setActiveView,
}) => {
  const { usuarioActual, loginFuncionario, logout, notifications, clearNotifications } = useApp();
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);

  const getUserInitials = () => {
    if (!usuarioActual) return 'GU';
    return usuarioActual.nombreCompleto
      .split(' ')
      .map(part => part[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  return (
    <header className="fixed top-0 w-full z-[80] bg-primary text-white border-b border-primary-container shadow-ambient-l1 flex justify-between items-center px-4 md:px-gutter h-16">
      {/* Brand & Desktop Logo */}
      <div className="flex items-center gap-3 shrink-0">
        <div 
          onClick={() => setActiveView('home')} 
          className="cursor-pointer group flex items-center gap-2.5"
        >
          <div className="shrink-0 w-9 h-9 rounded-lg bg-secondary flex items-center justify-center font-bold text-base shadow-sm ring-1 ring-white/10 group-hover:scale-105 duration-200">
            D
          </div>
          <div className="flex flex-col justify-center max-w-[120px] md:max-w-none">
            <h1 className="font-sans text-sm md:text-base font-bold tracking-tight text-white group-hover:text-secondary-fixed-dim transition-colors truncate whitespace-nowrap">
              DIMAC Maipú
            </h1>
            <p className="text-[9px] md:text-[10px] text-gray-400 font-mono tracking-wider -mt-0.5 uppercase truncate whitespace-nowrap">Portal Integrado</p>
          </div>
        </div>
      </div>


      {/* Navigation Cluster for Desktop removed in favor of Side Menu (as requested) */}


      {/* Officers / Admin top indication */}
      {usuarioActual && usuarioActual.rol !== 'ciudadano' && (
        <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/10">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
          <span className="text-xs font-bold font-mono tracking-wide">
            {usuarioActual.rol === 'funcionario_social' ? 'ASISTENTE SOCIAL' : 'ADMINISTRADOR DEL CAM'}
          </span>
        </div>
      )}

      {/* Action panel & dropdowns */}
      <div className="flex items-center gap-2 md:gap-4">
        {/* Notifications list drawer */}
        <div className="relative">
          <button
            onClick={() => setShowNotifDropdown(!showNotifDropdown)}
            className="p-2 rounded-full hover:bg-white/5 text-gray-300 hover:text-white transition-colors relative active:scale-95 cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {notifications.length > 0 && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-secondary rounded-full border-2 border-primary animate-pulse"></span>
            )}
          </button>

          {showNotifDropdown && (
            <div className="absolute right-0 mt-2 w-80 bg-[#10174a] border border-white/10 rounded-lg shadow-ambient-l2 z-[90] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="bg-primary px-4 py-3 flex justify-between items-center border-b border-white/10">
                <span className="text-xs font-bold text-white uppercase tracking-wider">Bitácora de Eventos</span>
                {notifications.length > 0 && (
                  <button
                    onClick={clearNotifications}
                    className="text-[10px] text-gray-400 hover:text-secondary-fixed uppercase font-bold cursor-pointer"
                  >
                    Limpiar
                  </button>
                )}
              </div>
              <div className="max-h-72 overflow-y-auto p-2 text-left space-y-1.5 divide-y divide-white/5">
                {notifications.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-6">No hay registros de eventos en la sesión.</p>
                ) : (
                  notifications.map((notif, idx) => (
                    <div key={idx} className="p-2 text-[11px] text-gray-350 leading-relaxed font-mono pt-1.5 first:pt-0">
                      <span className="text-secondary-fixed font-bold mr-1">▶</span> {notif}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User profile action */}
        {usuarioActual ? (
          <div className="flex items-center gap-2">
            {/* Round Avatar initials */}
            <div
              onClick={() => {
                if (usuarioActual.rol === 'ciudadano') {
                  setActiveView('citizen-perfil');
                } else {
                  setActiveView('admin');
                }
              }}
              className="w-8 h-8 rounded-full bg-secondary border border-white/20 text-white font-bold text-xs flex items-center justify-center cursor-pointer hover:brightness-110 transition-all shadow-ambient-l1"
              title={usuarioActual.nombreCompleto}
            >
              {getUserInitials()}
            </div>
            
            {/* Nickname desktop */}
            <div className="hidden lg:flex flex-col text-left leading-none">
              <span className="text-xs font-semibold text-white max-w-[120px] truncate">
                {usuarioActual.nombreCompleto}
              </span>
              <span className="text-[10px] text-gray-400 font-mono mt-0.5 uppercase tracking-wide">
                {usuarioActual.rol === 'ciudadano' ? 'Vecino' : 'Funcionario'}
              </span>
            </div>
          </div>
        ) : (
          <button
            onClick={onOpenClaveUnica}
            className="bg-secondary hover:bg-secondary-container hover:shadow-ambient-l1 text-white px-4 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 hover:-translate-y-px active:translate-y-0 active:scale-95 cursor-pointer"
          >
            <span>Clave Única</span>
          </button>
        )}
      </div>
    </header>
  );
};
