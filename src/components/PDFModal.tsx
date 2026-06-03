/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useApp } from '../context/AppContext';

interface PDFModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle: string;
  details: { label: string; value: string }[];
  paragraphs: string[];
  signatureName: string;
  signatureRole: string;
}

export const PDFModal: React.FC<PDFModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  details,
  paragraphs,
  signatureName,
  signatureRole,
}) => {
  const { simulationTime } = useApp();

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    // Generate a simple text file representing the digital receipt and download it
    const dateStr = simulationTime.toLocaleDateString();
    let textContent = `=====================================================\n`;
    textContent += `         MUNICIPALIDAD DE MAIPÚ - CHILE              \n`;
    textContent += `         DIRECCIÓN DE DESARROLLO COMUNITARIO         \n`;
    textContent += `=====================================================\n\n`;
    textContent += `${title.toUpperCase()}\n`;
    textContent += `${subtitle}\n`;
    textContent += `Fecha de Emisión: ${dateStr}\n\n`;
    textContent += `-----------------------------------------------------\n`;
    textContent += `DETALLES DE REGISTRO:\n`;
    details.forEach(d => {
      textContent += `- ${d.label}: ${d.value}\n`;
    });
    textContent += `-----------------------------------------------------\n\n`;
    textContent += `GLOSA Y ANTECEDENTES:\n`;
    paragraphs.forEach(p => {
      textContent += `${p}\n\n`;
    });
    textContent += `-----------------------------------------------------\n`;
    textContent += `DOCUMENTO FIRMADO ELECTRÓNICAMENTE:\n`;
    textContent += `${signatureName}\n`;
    textContent += `${signatureRole}\n`;
    textContent += `Vericidad verificable bajo el Código: EM-${Math.floor(100000 + Math.random() * 900000)}\n`;
    textContent += `=====================================================\n`;

    const element = document.createElement("a");
    const file = new Blob([textContent], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `${title.replace(/\s+/g, '_')}_Maipu.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-[100] p-4 overflow-y-auto">
      <div className="bg-white text-gray-900 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col my-8 border border-gray-200">
        {/* Actions bar */}
        <div className="bg-gray-100 px-6 py-3 flex justify-between items-center border-b border-gray-200">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-500"></span>
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Vista Previa Oficial PDF</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handlePrint}
              className="p-1.5 hover:bg-gray-200 rounded text-gray-600 transition-colors"
              title="Imprimir"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
            </button>
            <button
              onClick={handleDownload}
              className="p-1.5 hover:bg-gray-200 rounded text-emerald-600 transition-colors flex items-center gap-1 font-medium text-xs"
              title="Descargar"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span>Descargar</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-gray-200 rounded text-gray-400 hover:text-gray-600 transition-colors ml-4"
              title="Cerrar"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Paper Container (Styled like standard A4 letterhead of Dimac / Maipu) */}
        <div className="bg-white p-8 md:p-12 font-sans overflow-y-auto max-h-[70vh] border-b border-gray-200" id="official-pdf-paper">
          {/* Header */}
          <div className="flex justify-between items-start border-b-2 border-slate-900 pb-6 mb-8">
            <div className="text-left">
              <h1 className="text-base font-bold text-gray-800 tracking-tight leading-none uppercase">Ilustre Municipalidad de Maipú</h1>
              <p className="text-xs text-gray-500 font-medium">DIMAC - Departamento de Apoyo Comunitario</p>
              <p className="text-[10px] text-gray-400">Av. Pajaritos 2077, Maipú, Santiago</p>
            </div>
            <div className="text-right flex flex-col items-end">
              <span className="text-[10px] font-mono text-gray-500 bg-gray-100 border border-gray-200 px-2 py-0.5 rounded">
                FOLIO-VERIFICADO: #{Math.floor(100000 + Math.random() * 900000)}
              </span>
              <p className="text-[10px] text-gray-400 mt-1">Fecha Emisión: {simulationTime.toLocaleDateString()}</p>
            </div>
          </div>

          {/* Doc Title */}
          <div className="text-center mb-8">
            <h2 className="text-xl font-bold text-slate-900 uppercase leading-snug tracking-wider">{title}</h2>
            <p className="text-sm font-semibold text-sky-700 mt-1">{subtitle}</p>
          </div>

          {/* Details Table */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-8">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 border-b border-slate-200 pb-1">Datos Clave</h3>
            <div className="grid grid-cols-2 gap-4 text-xs">
              {details.map((d, idx) => (
                <div key={idx} className="flex flex-col">
                  <span className="text-gray-400 uppercase font-bold tracking-wider text-[10px]">{d.label}</span>
                  <span className="font-semibold text-gray-800">{d.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Content paragraphs */}
          <div className="text-xs text-gray-700 leading-relaxed space-y-4 text-justify pr-2">
            {paragraphs.map((p, idx) => (
              <p key={idx}>{p}</p>
            ))}
          </div>

          {/* Signoff block */}
          <div className="mt-12 flex justify-between items-end">
            {/* Stamp logo simulation */}
            <div className="flex flex-col items-center">
              <div className="w-20 h-20 border-4 border-double border-cyan-800 rounded-full flex flex-col items-center justify-center text-[8px] font-bold text-cyan-800 uppercase p-2 rotate-12 bg-white/50 relative">
                <span className="leading-none text-[6px]">Municipalidad</span>
                <span className="my-0.5 select-none">MAIPÚ</span>
                <span className="leading-none text-[6px] text-cyan-600">DIMAC OFICIAL</span>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[1px] bg-cyan-800/30"></div>
              </div>
            </div>

            {/* Signature holder */}
            <div className="text-center w-64 pb-2">
              <div className="h-10 w-full mb-1 flex items-center justify-center">
                {/* Simulated signature glyph */}
                <svg className="w-24 h-12 text-slate-800/80 uppercase -rotate-2" viewBox="0 0 100 40" fill="none" stroke="currentColor">
                  <path strokeWidth="1.5" d="M10 30 Q25 5 40 25 T70 10 T90 25 Q60 35 30 15 S10 25 50 35" />
                </svg>
              </div>
              <p className="text-xs font-bold border-t border-slate-300 pt-1 text-slate-900 leading-none">{signatureName}</p>
              <span className="text-[10px] text-slate-500 font-medium">{signatureRole}</span>
            </div>
          </div>

          {/* Footer watermark */}
          <div className="mt-16 pt-4 border-t border-slate-200 text-center text-[9px] text-slate-400 font-mono">
            Este es un documento electrónico oficial perteneciente a la Ilustre Municipalidad de Maipú.
            Su validez se ratifica directamente con la firma del Registro Civil y Clave Única integrada.
          </div>
        </div>

        {/* Footer actions */}
        <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 rounded-b-2xl border-t border-gray-100">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-100 font-medium text-xs transition-colors"
          >
            Cerrar Preview
          </button>
          <button
            onClick={handleDownload}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-medium text-xs transition-colors flex items-center gap-1 shadow-sm"
          >
            Descargar Archivo PDF
          </button>
        </div>
      </div>
    </div>
  );
};
