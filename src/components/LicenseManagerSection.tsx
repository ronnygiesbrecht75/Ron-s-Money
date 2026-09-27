import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { LicenseType } from '../types';
import { generateLicenseKey } from '../services/licenseService';
import { 
  ShieldCheck, 
  KeyRound, 
  Copy, 
  Check, 
  PlusCircle, 
  RotateCcw, 
  Calendar, 
  Laptop, 
  User, 
  Share2,
  Sparkles,
  AlertTriangle
} from 'lucide-react';
import { ConfirmationModal } from './ConfirmationModal';

export const LicenseManagerSection: React.FC = () => {
  const { license, activateAppLicense, deactivateAppLicense } = useApp();

  // License Changer States
  const [showChangeModal, setShowChangeModal] = useState(false);
  const [newKey, setNewKey] = useState('');
  const [newHolder, setNewHolder] = useState('');
  const [changeError, setChangeError] = useState<string | null>(null);

  // Deactivate Modal State
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);

  // Generator States
  const [genType, setGenType] = useState<LicenseType>('LIFETIME');
  const [genClientName, setGenClientName] = useState('');
  const [genDeviceId, setGenDeviceId] = useState('');
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [copiedGenerated, setCopiedGenerated] = useState(false);
  const [copiedCurrent, setCopiedCurrent] = useState(false);

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    const key = generateLicenseKey(
      genType, 
      genClientName.trim() || 'CLIENTE', 
      genDeviceId.trim() ? genDeviceId.trim() : undefined
    );
    setGeneratedKey(key);
  };

  const handleCopyGenerated = () => {
    if (!generatedKey) return;
    navigator.clipboard.writeText(generatedKey);
    setCopiedGenerated(true);
    setTimeout(() => setCopiedGenerated(false), 2500);
  };

  const handleCopyCurrent = () => {
    navigator.clipboard.writeText(license.licenseKey);
    setCopiedCurrent(true);
    setTimeout(() => setCopiedCurrent(false), 2500);
  };

  const handleChangeLicenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setChangeError(null);
    if (!newKey.trim()) {
      setChangeError('Por favor ingresa la nueva clave.');
      return;
    }
    const res = activateAppLicense(newKey.trim(), newHolder.trim() || 'Titular');
    if (res.success) {
      setShowChangeModal(false);
      setNewKey('');
      setNewHolder('');
    } else {
      setChangeError(res.error || 'Clave inválida.');
    }
  };

  const formatExpiry = () => {
    if (!license.expiresAt) return 'Permanente / De por vida (Vitalicia)';
    try {
      const d = new Date(license.expiresAt);
      return d.toLocaleDateString('es-PY', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return license.expiresAt;
    }
  };

  const clientShareMsg = generatedKey
    ? encodeURIComponent(
        `¡Hola ${genClientName || 'estimado cliente'}! Aquí tienes tu clave de activación oficial para Ron's Money:\n\n🔑 Clave: ${generatedKey}\n\nIngrésala en la pantalla de activación de la app para desbloquear tu versión.`
      )
    : '';

  return (
    <div id="license-manager-section" className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 gap-2">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-xl bg-orange-50 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-800/60">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-black text-black dark:text-white flex items-center gap-2">
              Licencia de Software & Activación
            </h3>
            <p className="text-xs text-slate-700 dark:text-slate-300 font-medium">
              Información de la licencia activa y generador de claves para clientes.
            </p>
          </div>
        </div>

        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black self-start sm:self-auto ${
          license.isLicensed 
            ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800/60'
            : 'bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800/60'
        }`}>
          <Check className="w-3.5 h-3.5" />
          {license.isLicensed ? 'Licencia Activa' : 'No Activada / Expirada'}
        </span>
      </div>

      {/* 1. ESTADO DE LA LICENCIA ACTUAL */}
      <div className="rounded-2xl p-5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Titular */}
          <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <span className="text-[11px] font-black uppercase text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-orange-500" />
              Titular Registrado:
            </span>
            <div className="text-xs font-black text-black dark:text-white mt-1 truncate">
              {license.licensedTo || 'Usuario General'}
            </div>
          </div>

          {/* Tipo de Licencia */}
          <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <span className="text-[11px] font-black uppercase text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-orange-500" />
              Modalidad:
            </span>
            <div className="text-xs font-black text-black dark:text-white mt-1">
              {license.licenseType === 'LIFETIME' && 'Vitalicia (De por vida)'}
              {license.licenseType === 'ANNUAL' && 'Suscripción Anual'}
              {license.licenseType === 'MONTHLY' && 'Mensual'}
            </div>
          </div>

          {/* Vencimiento */}
          <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <span className="text-[11px] font-black uppercase text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-orange-500" />
              Vigencia / Vencimiento:
            </span>
            <div className="text-xs font-black text-black dark:text-white mt-1 truncate">
              {formatExpiry()}
            </div>
          </div>

          {/* Device ID */}
          <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <span className="text-[11px] font-black uppercase text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Laptop className="w-3.5 h-3.5 text-orange-500" />
              ID de Este Equipo:
            </span>
            <div className="text-xs font-mono font-black text-black dark:text-white mt-1 truncate">
              {license.deviceId}
            </div>
          </div>
        </div>

        {/* Current Key Card */}
        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-slate-700 dark:text-slate-300">
              Clave Instalada:
            </span>
            <span className="font-mono text-xs font-black text-orange-600 dark:text-orange-400 bg-white dark:bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
              {license.licenseKey || 'Sin clave'}
            </span>
            {license.licenseKey && (
              <button
                type="button"
                onClick={handleCopyCurrent}
                title="Copiar clave"
                className="p-1 text-slate-500 hover:text-black dark:hover:text-white cursor-pointer"
              >
                {copiedCurrent ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              id="btn-change-license"
              onClick={() => setShowChangeModal(true)}
              className="px-3 py-1.5 rounded-xl text-xs font-black border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-black dark:text-white hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shadow-2xs cursor-pointer flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5 text-orange-500" />
              <span>Cambiar Clave</span>
            </button>

            <button
              type="button"
              id="btn-deactivate-license"
              onClick={() => setShowDeactivateModal(true)}
              className="px-3 py-1.5 rounded-xl text-xs font-black text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 transition-colors cursor-pointer"
            >
              <span>Desactivar</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. GENERADOR DE CLAVES DE LICENCIA (ADMIN / CREADOR) */}
      <div className="rounded-2xl p-5 border border-orange-200 dark:border-orange-900/50 bg-orange-50/50 dark:bg-orange-950/20 space-y-4">
        <div className="flex items-center gap-2">
          <KeyRound className="w-4 h-4 text-orange-500" />
          <h4 className="text-xs uppercase tracking-wider font-black text-orange-950 dark:text-orange-200">
            Generador Oficial de Claves (Para tus Clientes / Compradores)
          </h4>
        </div>
        <p className="text-xs text-orange-900 dark:text-orange-300/90 font-medium">
          Como creador del software, utiliza esta herramienta para emitir claves de licencia personalizadas a quienes adquieran tu programa.
        </p>

        <form onSubmit={handleGenerate} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Tipo de Licencia */}
          <div>
            <label className="block text-[11px] font-black uppercase text-black dark:text-white mb-1">
              Tipo de Licencia
            </label>
            <select
              value={genType}
              onChange={(e) => setGenType(e.target.value as LicenseType)}
              className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-black dark:text-white focus:ring-2 focus:ring-orange-500"
            >
              <option value="LIFETIME">Vitalicia (Permanente sin vencimiento)</option>
              <option value="ANNUAL">1 Año (Anual)</option>
              <option value="MONTHLY">1 Mes (30 días)</option>
            </select>
          </div>

          {/* Nombre del Cliente */}
          <div>
            <label className="block text-[11px] font-black uppercase text-black dark:text-white mb-1">
              Nombre del Cliente / Negocio
            </label>
            <input
              type="text"
              value={genClientName}
              onChange={(e) => setGenClientName(e.target.value)}
              placeholder="Ej. Juan Pérez o Empresa X"
              className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-black dark:text-white focus:ring-2 focus:ring-orange-500"
            />
          </div>

          {/* Device ID (Opcional) */}
          <div>
            <label className="block text-[11px] font-black uppercase text-black dark:text-white mb-1">
              ID del Equipo (Opcional)
            </label>
            <input
              type="text"
              value={genDeviceId}
              onChange={(e) => setGenDeviceId(e.target.value)}
              placeholder="Dejar vacío para cualquier PC"
              className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-black dark:text-white focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div className="sm:col-span-3 flex justify-end">
            <button
              type="submit"
              className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white text-xs font-black rounded-xl shadow-md shadow-orange-500/25 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Generar Clave de Licencia</span>
            </button>
          </div>
        </form>

        {/* Clave Generada Result */}
        {generatedKey && (
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border-2 border-orange-400 dark:border-orange-600 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-orange-600 dark:text-orange-400">
                Clave Generada Lista para Enviar:
              </span>
              <div className="font-mono text-base sm:text-lg font-black text-black dark:text-white select-all tracking-wider">
                {generatedKey}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleCopyGenerated}
                className="px-3.5 py-2 rounded-xl text-xs font-black bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-black dark:text-white transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                {copiedGenerated ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    <span>¡Copiada!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-orange-500" />
                    <span>Copiar Clave</span>
                  </>
                )}
              </button>

              <a
                href={`https://wa.me/?text=${clientShareMsg}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-2 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Enviar por WhatsApp</span>
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Modal: Cambiar Clave */}
      {showChangeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl">
            <h3 className="text-base font-black text-black dark:text-white mb-2">
              Ingresar Nueva Clave de Licencia
            </h3>
            <p className="text-xs text-slate-700 dark:text-slate-300 font-medium mb-4">
              Ingresa una clave válida para actualizar tu tipo de licencia o renovar el software.
            </p>

            {changeError && (
              <div className="p-3 mb-4 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs font-black">
                {changeError}
              </div>
            )}

            <form onSubmit={handleChangeLicenseSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-black uppercase text-black dark:text-white mb-1">
                  Nombre del Titular (Opcional)
                </label>
                <input
                  type="text"
                  value={newHolder}
                  onChange={(e) => setNewHolder(e.target.value)}
                  placeholder="Tu nombre o empresa"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-black dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase text-black dark:text-white mb-1">
                  Nueva Clave *
                </label>
                <input
                  type="text"
                  value={newKey}
                  onChange={(e) => setNewKey(e.target.value.toUpperCase())}
                  placeholder="RON-XXXX-XXXX-XXXX"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono font-black text-black dark:text-white"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowChangeModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white text-xs font-black rounded-xl shadow-sm"
                >
                  Guardar y Activar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Deactivate */}
      <ConfirmationModal
        isOpen={showDeactivateModal}
        title="¿Desactivar Licencia de Software?"
        message="Si desactivas la licencia, la aplicación quedará bloqueada hasta que vuelvas a ingresar una clave de activación válida. ¿Deseas continuar?"
        confirmText="Sí, Desactivar Licencia"
        cancelText="Cancelar"
        isDestructive={true}
        onConfirm={() => {
          deactivateAppLicense();
          setShowDeactivateModal(false);
        }}
        onCancel={() => setShowDeactivateModal(false)}
      />
    </div>
  );
};
