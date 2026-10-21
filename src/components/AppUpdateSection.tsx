import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  CURRENT_APP_VERSION, 
  checkGitHubForUpdates, 
  getSimulatedUpdateInfo,
  getAppPlatform
} from '../services/updateService';
import { AppUpdateInfo } from '../types';
import { AppUpdateModal } from './AppUpdateModal';
import { 
  DownloadCloud, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Github, 
  Smartphone, 
  Monitor, 
  Globe, 
  HelpCircle,
  ExternalLink,
  Edit3,
  Check
} from 'lucide-react';

export const AppUpdateSection: React.FC = () => {
  const { settings, updateSettings } = useApp();
  const [isChecking, setIsChecking] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [currentUpdate, setCurrentUpdate] = useState<AppUpdateInfo | null>(null);
  const [checkStatus, setCheckStatus] = useState<{
    type: 'idle' | 'up_to_date' | 'error' | 'success';
    message?: string;
  }>({ type: 'idle' });

  // Custom repo setting
  const defaultRepo = 'ronnygies22/rons-money';
  const [repoName, setRepoName] = useState(settings?.githubRepo || defaultRepo);
  const [isEditingRepo, setIsEditingRepo] = useState(false);

  const platform = getAppPlatform();

  const handleSaveRepo = () => {
    const clean = repoName.replace(/^https?:\/\/github\.com\//, '').replace(/\/$/, '').trim();
    setRepoName(clean);
    setIsEditingRepo(false);
    updateSettings({ githubRepo: clean });
  };

  const handleCheckForUpdates = async () => {
    setIsChecking(true);
    setCheckStatus({ type: 'idle' });

    try {
      const result = await checkGitHubForUpdates(repoName);

      if (result.error) {
        setCheckStatus({
          type: 'error',
          message: result.error,
        });
      } else if (result.hasUpdate && result.updateInfo) {
        setCheckStatus({
          type: 'success',
          message: `¡Nueva versión ${result.updateInfo.version} encontrada en GitHub!`,
        });
        setCurrentUpdate(result.updateInfo);
        setModalOpen(true);
      } else {
        setCheckStatus({
          type: 'up_to_date',
          message: `¡Tu aplicación está al día! Tienes la última versión (v${CURRENT_APP_VERSION}).`,
        });
      }
    } catch (err: any) {
      setCheckStatus({
        type: 'error',
        message: err?.message || 'Error de conexión al verificar actualizaciones.',
      });
    } finally {
      setIsChecking(false);
    }
  };

  const handleSimulateUpdate = () => {
    const demoUpdate = getSimulatedUpdateInfo();
    setCurrentUpdate(demoUpdate);
    setModalOpen(true);
  };

  return (
    <div id="section-app-updates" className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-6 shadow-xs space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-zinc-800">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-orange-50 dark:bg-orange-950/60 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-800/40 mb-1">
            <Sparkles className="w-3.5 h-3.5 text-orange-500" />
            Actualizaciones In-App
          </div>
          <h3 className="text-lg font-black text-slate-800 dark:text-zinc-100 flex items-center gap-2">
            <DownloadCloud className="w-5 h-5 text-orange-500" />
            Actualizaciones del Sistema
          </h3>
          <p className="text-xs text-slate-700 dark:text-zinc-300 font-medium mt-0.5">
            Busca, descarga e instala nuevas versiones directamente desde la aplicación sin perder tus datos.
          </p>
        </div>

        {/* Version Badge & Platform */}
        <div className="flex items-center gap-2">
          <div className="px-3.5 py-1.5 rounded-2xl bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs font-black text-slate-800 dark:text-zinc-200 flex items-center gap-2">
            {platform === 'android' && <Smartphone className="w-4 h-4 text-emerald-600" />}
            {platform === 'windows' && <Monitor className="w-4 h-4 text-blue-600" />}
            {platform === 'web' && <Globe className="w-4 h-4 text-purple-600" />}
            <span>v{CURRENT_APP_VERSION}</span>
          </div>
        </div>
      </div>

      {/* Repository Config Card */}
      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-black text-slate-900 dark:text-white">
            <Github className="w-4 h-4 text-slate-700 dark:text-zinc-300" />
            <span>Repositorio de Versiones en GitHub</span>
          </div>
          {!isEditingRepo ? (
            <button
              type="button"
              onClick={() => setIsEditingRepo(true)}
              className="text-xs font-bold text-orange-600 dark:text-orange-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Edit3 className="w-3 h-3" />
              <span>Cambiar</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSaveRepo}
              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-black flex items-center gap-1 cursor-pointer"
            >
              <Check className="w-3 h-3" />
              <span>Guardar</span>
            </button>
          )}
        </div>

        {isEditingRepo ? (
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={repoName}
              onChange={(e) => setRepoName(e.target.value)}
              placeholder="tu-usuario/rons-money"
              className="flex-1 px-3 py-2 text-xs font-mono font-bold bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-600 rounded-xl text-slate-800 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-orange-500"
            />
          </div>
        ) : (
          <div className="flex items-center justify-between text-xs font-mono text-slate-700 dark:text-zinc-300 bg-white dark:bg-zinc-900/80 px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700">
            <span>https://github.com/{repoName}</span>
            <a
              href={`https://github.com/${repoName}/releases`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-600 hover:text-slate-900 dark:hover:text-white"
              title="Abrir en GitHub"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        )}
      </div>

      {/* Status Notifications */}
      {checkStatus.type === 'up_to_date' && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{checkStatus.message}</span>
        </div>
      )}

      {checkStatus.type === 'error' && (
        <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs font-bold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
          <span>{checkStatus.message}</span>
        </div>
      )}

      {checkStatus.type === 'success' && (
        <div className="p-3.5 rounded-2xl bg-orange-50 dark:bg-orange-950/50 border border-orange-300 dark:border-orange-800 text-orange-900 dark:text-orange-200 text-xs font-bold flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-orange-500 shrink-0" />
          <span>{checkStatus.message}</span>
        </div>
      )}

      {/* Action Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
        <button
          type="button"
          id="btn-check-app-updates"
          onClick={handleCheckForUpdates}
          disabled={isChecking}
          className="p-3.5 rounded-2xl bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white font-black text-xs flex items-center justify-center gap-2 shadow-md shadow-orange-500/25 transition-all cursor-pointer disabled:opacity-60"
        >
          <RefreshCw className={`w-4 h-4 ${isChecking ? 'animate-spin' : ''}`} />
          <span>{isChecking ? 'Buscando en GitHub...' : 'Buscar Actualizaciones'}</span>
        </button>

        <button
          type="button"
          id="btn-simulate-update-flow"
          onClick={handleSimulateUpdate}
          className="p-3.5 rounded-2xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-700/80 text-slate-800 dark:text-zinc-200 font-black text-xs flex items-center justify-center gap-2 transition-all shadow-2xs cursor-pointer"
        >
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span>Probar Descarga & Instalación Directa</span>
        </button>
      </div>

      {/* Explanatory Help Card */}
      <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/40 text-xs space-y-2">
        <div className="font-black text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
          <HelpCircle className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
          <span>¿Cómo se realiza la actualización dentro de la App?</span>
        </div>
        <ul className="list-disc list-inside space-y-1.5 text-slate-700 dark:text-zinc-300 font-medium leading-relaxed">
          <li><strong>Elegir en Mis Archivos:</strong> Puedes seleccionar exactamente en qué carpeta de tu dispositivo (Descargas, Documentos, Tarjeta SD o almacenamiento interno) se descargará y guardará la actualización.</li>
          <li><strong>En Celular (Android):</strong> Se descarga el paquete oficial y se ejecuta directamente el instalador oficial de Android en pantalla, <em>sin necesidad de tener que ir a buscar el archivo APK manualmente</em>.</li>
          <li><strong>En Computadora (Windows):</strong> Se ejecuta directamente el instalador oficial en pantalla sin tener que buscar en tus carpetas.</li>
          <li><strong>Seguridad de Datos:</strong> Ningún gasto, ingreso, banco o ajuste se elimina al actualizar; todo tu historial se mantiene 100% intacto.</li>
        </ul>
      </div>

      {/* The In-App Update Modal with details, progress bar and install actions */}
      <AppUpdateModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        updateInfo={currentUpdate}
      />
    </div>
  );
};
