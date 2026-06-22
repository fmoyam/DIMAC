import React, { useState, useEffect, useRef } from 'react';
import { X, Contrast, Type, Volume2, CaseSensitive, Link as LinkIcon, RotateCcw } from 'lucide-react';

export function AccessibilityWidget() {
  const [isOpen, setIsOpen] = useState(false);
  
  // Accessibility state
  const [highContrast, setHighContrast] = useState(false);
  const [underlineLinks, setUnderlineLinks] = useState(false);
  const [dyslexicFont, setDyslexicFont] = useState(false);
  const [textSize, setTextSize] = useState<'normal' | 'large' | 'extralarge'>('normal');
  const [screenReaderActive, setScreenReaderActive] = useState(false);
  
  // Custom states for screen reader feed
  const [subtitleText, setSubtitleText] = useState<string>('');
  const lastSpokenRef = useRef<string>('');
  const menuRef = useRef<HTMLDivElement>(null);

  // Initialize from LocalStorage if present, or defaults
  useEffect(() => {
    const storedContrast = localStorage.getItem('acc-contrast') === 'true';
    const storedUnderline = localStorage.getItem('acc-underline') === 'true';
    const storedDyslexia = localStorage.getItem('acc-dyslexia') === 'true';
    const storedTextSize = (localStorage.getItem('acc-textsize') as 'normal' | 'large' | 'extralarge') || 'normal';
    const storedReader = localStorage.getItem('acc-reader') === 'true';

    setHighContrast(storedContrast);
    setUnderlineLinks(storedUnderline);
    setDyslexicFont(storedDyslexia);
    setTextSize(storedTextSize);
    setScreenReaderActive(storedReader);
  }, []);

  // Sync state modifications with UI and document classes
  useEffect(() => {
    const list = document.body.classList;
    
    // 1. High contrast
    if (highContrast) {
      list.add('accessibility-high-contrast');
    } else {
      list.remove('accessibility-high-contrast');
    }
    localStorage.setItem('acc-contrast', String(highContrast));
  }, [highContrast]);

  useEffect(() => {
    const list = document.body.classList;
    
    // 2. Underline links
    if (underlineLinks) {
      list.add('accessibility-underline');
    } else {
      list.remove('accessibility-underline');
    }
    localStorage.setItem('acc-underline', String(underlineLinks));
  }, [underlineLinks]);

  useEffect(() => {
    const list = document.body.classList;
    
    // 3. Dyslexia friendly font
    if (dyslexicFont) {
      list.add('accessibility-dyslexia');
    } else {
      list.remove('accessibility-dyslexia');
    }
    localStorage.setItem('acc-dyslexia', String(dyslexicFont));
  }, [dyslexicFont]);

  useEffect(() => {
    // 4. Text scaling
    const htmlEl = document.documentElement;
    if (textSize === 'large') {
      htmlEl.style.fontSize = '115%';
    } else if (textSize === 'extralarge') {
      htmlEl.style.fontSize = '125%';
    } else {
      htmlEl.style.fontSize = '100%';
    }
    localStorage.setItem('acc-textsize', textSize);
  }, [textSize]);

  // Handle outside click to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Text-To-Speech function
  const speakTextRef = useRef<(text: string) => void>(() => {});
  speakTextRef.current = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel(); // cancel current speech
      const cleanText = text.trim();
      if (!cleanText) return;

      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = 'es-CL'; // Chilean Spanish preferred
      utterance.rate = 1.0;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn("Speech synthesis error", e);
    }
  };

  // Screen reader interactive helper
  useEffect(() => {
    localStorage.setItem('acc-reader', String(screenReaderActive));
    if (!screenReaderActive) {
      setSubtitleText('');
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      return;
    }

    // Voice announcer notification upon activation
    speakTextRef.current("Lector de pantalla activado. Mueva el cursor sobre los textos para escucharlos.");
    setSubtitleText("Lector de pantalla activo. Desplace el ratón sobre un texto...");

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target) return;

      // Extract meaningful text and target elements like buttons, cards, list-items, paragraphs
      const tag = target.tagName.toLowerCase();
      const isInteractive = ['button', 'a', 'input', 'select', 'textarea'].includes(tag) || 
                            target.closest('button') !== null || 
                            target.closest('a') !== null ||
                            target.getAttribute('role') === 'button';

      let textToRead = '';
      
      // Determine what to synthesize
      if (isInteractive) {
        const interactiveEl = target.closest('button') || target.closest('a') || target;
        const typeLabel = interactiveEl.tagName.toLowerCase() === 'a' ? 'Enlace' : 'Botón';
        const inner = interactiveEl.textContent?.trim() || '';
        const aria = interactiveEl.getAttribute('aria-label') || '';
        const title = interactiveEl.getAttribute('title') || '';
        
        textToRead = `${typeLabel}: ${aria || title || inner}`;
      } else if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'span', 'li', 'td', 'th'].includes(tag)) {
        // Only read direct text or brief text if hasn't been read
        textToRead = target.textContent?.trim() || '';
      }

      // Read out if valid and new
      if (textToRead && textToRead !== lastSpokenRef.current && textToRead.length < 250) {
        lastSpokenRef.current = textToRead;
        setSubtitleText(textToRead);
        speakTextRef.current(textToRead);
      }
    };

    document.addEventListener('mouseover', handleMouseOver);
    return () => {
      document.removeEventListener('mouseover', handleMouseOver);
    };
  }, [screenReaderActive]);

  // Reset helper
  const handleReset = () => {
    setHighContrast(false);
    setUnderlineLinks(false);
    setDyslexicFont(false);
    setTextSize('normal');
    setScreenReaderActive(false);
    setSubtitleText('');
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    speakTextRef.current("Ajustes de accesibilidad restaurados");
  };

  return (
    <>
      {/* Visual representation of current spoken content at screen footer */}
      {screenReaderActive && subtitleText && (
        <div className="fixed bottom-20 left-4 right-4 md:left-1/2 md:-translate-x-1/2 md:max-w-xl z-50 bg-black/90 backdrop-blur-md border border-yellow-400 text-yellow-300 font-bold p-3.5 rounded-xl shadow-2xl flex items-start gap-3 text-xs leading-relaxed animate-bounce">
          <Volume2 className="text-yellow-400 w-5 h-5 animate-pulse shrink-0" />
          <div className="flex-1">
            <span className="text-[9px] uppercase tracking-wider text-slate-400 block mb-0.5">Lector Activo:</span>
            <span>"{subtitleText}"</span>
          </div>
          <button 
            type="button"
            onClick={() => setSubtitleText('')}
            className="text-slate-400 hover:text-white font-black px-1 pointer-events-auto"
            title="Ocultar subtítulo"
          >
            ×
          </button>
        </div>
      )}

      {/* Main floating widget container */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end" ref={menuRef}>
        {/* Menu open/close wrapper with fade/scale effects in Tailwind */}
        {isOpen && (
          <div className="bg-white border border-slate-200 text-slate-900 rounded-2xl shadow-ambient-l2 w-80 p-5 mb-3 animate-fade-in-up flex flex-col gap-4 text-left border-t-4 border-t-[#0b0f59]">
            <div className="flex items-center justify-between border-b pb-3 border-slate-150">
              <div className="flex items-center gap-2.5">
                <svg xmlns="http://www.w3.org/2000/svg" className="text-[#0b0f59] w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2c5.52 0 10 4.48 10 10s-4.48 10-10 10S2 17.52 2 12 6.48 2 12 2zm0 2c-4.41 0-8 3.59-8 8s3.59 8 8 8 8-3.59 8-8-3.59-8-8-8zm0 2c.83 0 1.5.67 1.5 1.5S12.83 9 12 9s-1.5-.67-1.5-1.5S11.17 6 12 6zm4 4.5v1.5h-2.5v5.5h-1.5v-3h-1v3H9.5v-5.5H7v-1.5h9z" />
                </svg>
                <span className="text-sm font-black uppercase text-slate-900 tracking-tight">Opciones de Accesibilidad</span>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-slate-600 transition-colors w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center cursor-pointer"
                title="Cerrar"
                id="btn-accessibility-close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* HIGH CONTRAST CONTROL */}
            <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-150 hover:bg-slate-100/50 transition-colors">
              <div className="flex items-center gap-2.5">
                <Contrast className="text-slate-700 w-5 h-5" />
                <div>
                  <span className="font-bold text-xs text-slate-800 block">Alto Contraste</span>
                  <p className="text-[10px] text-gray-500 leading-none mt-0.5">Letra blanca sobre fondo negro</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setHighContrast(!highContrast)}
                className={`py-1.5 px-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer border ${
                  highContrast 
                    ? 'bg-[#b40063] text-white border-[#b40063]' 
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                }`}
              >
                {highContrast ? 'Activo' : 'Activar'}
              </button>
            </div>

            {/* TEXT SIZE ZOOM SLIDER */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-150">
              <div className="flex items-center gap-2.5 mb-2.5">
                <Type className="text-slate-700 w-5 h-5" />
                <div>
                  <span className="font-bold text-xs text-slate-800 block">Tamaño del Texto</span>
                  <p className="text-[10px] text-gray-500 leading-none mt-0.5">Ajustar legibilidad de la tipografía</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-1.5 bg-white p-1 rounded-lg border border-slate-200">
                <button
                  type="button"
                  onClick={() => setTextSize('normal')}
                  className={`py-1.5 text-[10px] font-bold rounded-md transition-all cursor-pointer ${
                    textSize === 'normal' 
                      ? 'bg-slate-900 text-white shadow-xs' 
                      : 'text-slate-650 hover:bg-slate-100'
                  }`}
                >
                  Normal
                </button>
                <button
                  type="button"
                  onClick={() => setTextSize('large')}
                  className={`py-1.5 text-[10px] font-bold rounded-md transition-all cursor-pointer ${
                    textSize === 'large' 
                      ? 'bg-slate-900 text-white shadow-xs' 
                      : 'text-slate-650 hover:bg-slate-100'
                  }`}
                >
                  Grande (+15%)
                </button>
                <button
                  type="button"
                  onClick={() => setTextSize('extralarge')}
                  className={`py-1.5 text-[10px] font-bold rounded-md transition-all cursor-pointer ${
                    textSize === 'extralarge' 
                      ? 'bg-slate-900 text-white shadow-xs' 
                      : 'text-slate-650 hover:bg-slate-100'
                  }`}
                >
                  Muy Grande
                </button>
              </div>
            </div>

            {/* SCREEN READER SIMULATION */}
            <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-150 hover:bg-slate-100/50 transition-colors">
              <div className="flex items-center gap-2.5">
                <Volume2 className="text-slate-700 w-5 h-5" />
                <div>
                  <span className="font-bold text-xs text-slate-800 block">Lector de Pantalla</span>
                  <p className="text-[10px] text-gray-500 leading-none mt-0.5">Lee texto al rozar con el mouse</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setScreenReaderActive(!screenReaderActive)}
                className={`py-1.5 px-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer border ${
                  screenReaderActive 
                    ? 'bg-[#b40063] text-white border-[#b40063]' 
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                }`}
              >
                {screenReaderActive ? 'Activo' : 'Activar'}
              </button>
            </div>

            {/* DYSLEXIA FONT OPTION */}
            <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-150 hover:bg-slate-100/50 transition-colors">
              <div className="flex items-center gap-2.5">
                <CaseSensitive className="text-slate-700 w-5 h-5" />
                <div>
                  <span className="font-bold text-xs text-slate-800 block">Lectura Especial (Dislexia)</span>
                  <p className="text-[10px] text-gray-500 leading-none mt-0.5">Letra de fácil acceso visual</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDyslexicFont(!dyslexicFont)}
                className={`py-1.5 px-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer border ${
                  dyslexicFont 
                    ? 'bg-[#b40063] text-white border-[#b40063]' 
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                }`}
              >
                {dyslexicFont ? 'Activo' : 'Activar'}
              </button>
            </div>

            {/* UNDERLINE LINKS OPTION */}
            <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-150 hover:bg-slate-100/50 transition-colors">
              <div className="flex items-center gap-2.5">
                <LinkIcon className="text-slate-700 w-5 h-5" />
                <div>
                  <span className="font-bold text-xs text-slate-800 block">Subrayar Enlaces</span>
                  <p className="text-[10px] text-gray-500 leading-none mt-0.5">Marca los enlaces visibles</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setUnderlineLinks(!underlineLinks)}
                className={`py-1.5 px-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer border ${
                  underlineLinks 
                    ? 'bg-[#b40063] text-white border-[#b40063]' 
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                }`}
              >
                {underlineLinks ? 'Activo' : 'Activar'}
              </button>
            </div>

            {/* RESET BUTTON */}
            <button
              type="button"
              onClick={handleReset}
              className="w-full h-9 bg-slate-800 hover:bg-slate-900 hover:scale-[1.01] text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer mt-1"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reestablecer Niveles</span>
            </button>
          </div>
        )}

        {/* The main circular floating trigger button */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`w-14 h-14 rounded-full flex items-center justify-center shadow-2xl hover:scale-105 active:scale-95 transition-all text-white border focus:outline-none focus:ring-4 focus:ring-indigo-300 pointer-events-auto cursor-pointer ${
            isOpen 
              ? 'bg-[#b40063] hover:bg-[#92004f] border-pink-400 rotate-90 duration-300' 
              : 'bg-[#0b0f59] hover:bg-indigo-950 border-indigo-700'
          }`}
          title="Menú de Accesibilidad y Lectura"
          aria-expanded={isOpen}
          aria-label="Abrir opciones de accesibilidad de la página"
          id="btn-accessibility"
        >
          {isOpen ? (
            <X className="w-6 h-6 text-white text-3xl font-bold" />
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-white animate-pulse" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2c5.52 0 10 4.48 10 10s-4.48 10-10 10S2 17.52 2 12 6.48 2 12 2zm0 2c-4.41 0-8 3.59-8 8s3.59 8 8 8 8-3.59 8-8-3.59-8-8-8zm0 2c.83 0 1.5.67 1.5 1.5S12.83 9 12 9s-1.5-.67-1.5-1.5S11.17 6 12 6zm4 4.5v1.5h-2.5v5.5h-1.5v-3h-1v3H9.5v-5.5H7v-1.5h9z" />
            </svg>
          )}
        </button>

      </div>
    </>
  );
}
