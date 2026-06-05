/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { TopBar } from './components/TopBar';
import { ClaveUnicaModal } from './components/ClaveUnicaModal';
import { HomeView } from './views/HomeView';
import { CitizenDashboard } from './views/CitizenDashboard';
import { AdminDashboard } from './views/AdminDashboard';

function AppContent() {
  const { usuarioActual, logout } = useApp();
  const [activeView, setActiveView] = useState<string>('home');
  const [isClaveUnicaOpen, setIsClaveUnicaOpen] = useState(false);

  // Helper to map parent view navigation to citizen subviews
  const getSubViewName = () => {
    if (activeView.startsWith('citizen-')) {
      return activeView.replace('citizen-', '');
    }
    return 'tramites';
  };

  const handleSetSubView = (sub: string) => {
    setActiveView(`citizen-${sub}`);
  };

  const isAdmin = activeView === 'admin';

  useEffect(() => {
    let title = 'Portal DIMAC Maipú';
    switch (activeView) {
      case 'home':
        title = 'Inicio | DIMAC Maipú';
        break;
      case 'admin':
        title = 'Panel Administrativo | DIMAC Maipú';
        break;
      case 'citizen-tramites':
        title = 'Mis Trámites | DIMAC Maipú';
        break;
      case 'citizen-boletin':
        title = 'Boletín Informativo | DIMAC Maipú';
        break;
      case 'citizen-talleres':
        title = 'Talleres CAM | DIMAC Maipú';
        break;
      case 'citizen-buzon':
        title = 'Buzón Ciudadano | DIMAC Maipú';
        break;
      case 'citizen-perfil':
        title = 'Mi Perfil | DIMAC Maipú';
        break;
      case 'citizen-noticias':
        title = 'Noticias de tu Barrio | DIMAC Maipú';
        break;
    }
    document.title = title;
  }, [activeView]);

  return (
    <div className={`min-h-screen ${isAdmin ? 'bg-admin-bg' : 'bg-background'} text-on-background flex flex-col font-sans transition-colors duration-200`}>
      {/* Premium Top navigation bar */}
      <TopBar
        activeView={activeView}
        setActiveView={setActiveView}
        onOpenClaveUnica={() => setIsClaveUnicaOpen(true)}
      />

      {/* Main Container framed with generous margins and beautiful layout */}
      <main className="flex-grow pt-24 pb-16 px-4 md:px-12 max-w-7xl w-full mx-auto">
        {activeView === 'home' && (
          <HomeView
            onOpenClaveUnica={() => setIsClaveUnicaOpen(true)}
            setActiveView={setActiveView}
          />
        )}

        {activeView === 'admin' && (
          <AdminDashboard onLogout={() => { logout(); setActiveView('home'); }} />
        )}

        {activeView.startsWith('citizen-') && (
          <CitizenDashboard
            onOpenClaveUnica={() => setIsClaveUnicaOpen(true)}
            subView={getSubViewName()}
            setSubView={handleSetSubView}
            onLogout={() => { logout(); setActiveView('home'); }}
          />
        )}
      </main>

      {/* Sticky Quick-Access Indicator on Bottom Left to assist reviewers */}
      <div className="fixed bottom-4 left-4 z-40 bg-primary/90 text-white border border-white/10 backdrop-blur-md px-3 py-1.5 rounded-full text-[10px] uppercase font-bold tracking-wide shadow-lg flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-secondary animate-ping"></span>
        <span>
          Modo Actual: {usuarioActual ? `${usuarioActual.rol.toUpperCase()} (${usuarioActual.nombreCompleto})` : 'PÚBLICO / VISITANTE'}
        </span>
      </div>

      {/* Clave Unica Dialog Sign-On Emulation (HU-03) */}
      <ClaveUnicaModal
        isOpen={isClaveUnicaOpen}
        onClose={() => setIsClaveUnicaOpen(false)}
        onSuccess={() => {
          setActiveView('citizen-tramites');
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
