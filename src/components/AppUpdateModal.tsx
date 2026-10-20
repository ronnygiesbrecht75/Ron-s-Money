import React, { useState, useEffect } from 'react';
import { AppUpdateInfo } from '../types';
import { 
  CURRENT_APP_VERSION, 
  downloadUpdatePackage, 
  triggerPackageInstallation, 
  getAppPlatform,
  checkAndroidInstallPermission,
  openAndroidInstallSettings,
  isAndroidNative,
  isElectronApp,
  pickDestinationFolder,
  saveBlobToDestination
} from '../services/updateService';
import { 
  DownloadCloud, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  X, 
  RefreshCw, 
  Smartphone, 
  Monitor, 
  Globe, 
  FileCheck, 
  HardDriveDownload,
  ShieldCheck,
  Settings,
  Folder,
  FolderOpen,
  FolderCheck,
  Check
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface AppUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  updateInfo: AppUpdateInfo | null;
  initialStep?: 'details' | 'downloading';
}

export const AppUpdateModal: React.FC<AppUpdateModalProps> = ({
  isOpen,
  onClose,
  updateInfo,
  initialStep = 'details',
}) => {
  const [step, setStep] = useState<'details' | 'downloading' | 'ready' | 'installing' | 'error'>(initialStep);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadedBytes, setDownloadedBytes] = useState(0);
  const [totalBytes, setTotalBytes] = useState(0);
  const [speedMbps, setSpeedMbps] = useState(0);
  const [downloadedBlob, setDownloadedBlob] = useState<Blob | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [installStatusMessage, setInstallStatusMessage] = useState<string | null>(null);
  const [hasInstallPermission, setHasInstallPermission] = useState<boolean>(true);
  const [isCheckingPermission, setIsCheckingPermission] = useState<boolean>(false);

  // Storage destination in "Mis Archivos"
  const [selectedFolderName, setSelectedFolderName] = useState<string | null>(null);
  const [directoryHandle, setDirectoryHandle] = useState<any>(null);
  const [askLocationOnSave, setAskLocationOnSave] = useState<boolean>(true);
  const [savedLocationFeedback, setSavedLocationFeedback] = useState<string | null>(null);
  const [isPickingFolder, setIsPickingFolder] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen && updateInfo) {
      setStep(initialStep);
      setDownloadProgress(0);
      setDownloadedBytes(0);
      setDownloadedBlob(null);
      setErrorMessage(null);
      setInstallStatusMessage(null);
      setSavedLocationFeedback(null);
      verifyInstallPermission();
    }
  }, [isOpen, initialStep, updateInfo]);

  const verifyInstallPermission = async () => {
    if (isAndroidNative()) {
      setIsCheckingPermission(true);
      try {
        const canInstall = await checkAndroidInstallPermission();
        setHasInstallPermission(canInstall);
      } catch (e) {
        setHasInstallPermission(true);
      } finally {
        setIsCheckingPermission(false);
      }
    } else {
      setHasInstallPermission(true);
    }
  };

  if (!isOpen || !updateInfo) return null;

  const platform = updateInfo.platform || getAppPlatform();
  const isNative = isAndroidNative();
  const isElectron = isElectronApp();

  // Official default filename determined automatically for their system
  const defaultFileName = updateInfo.fileName || (
    platform === 'android' ? `Rons-Money-${updateInfo.version}.apk` :
    platform === 'windows' ? `Rons-Money-Setup-${updateInfo.version}.exe` :
    `Rons-Money-${updateInfo.version}.zip`
  );
  const fileSize = updateInfo.fileSize || 25000000;

  // Let user pick destination folder in "Mis Archivos"
  const handleChooseFolder = async () => {
    setIsPickingFolder(true);
    try {
      const res = await pickDestinationFolder();
      if (res.success) {
        if (res.folderName) {
          setSelectedFolderName(res.folderName);
        }
        if (res.handle) {
          setDirectoryHandle(res.handle);
        }
        if (res.isSaveAsMode) {
          setAskLocationOnSave(true);
        }
      }
    } catch (e) {
      console.warn('Folder selection dismissed or failed:', e);
    } finally {
      setIsPickingFolder(false);
    }
  };

  const handleStartDownload = async () => {
    setStep('downloading');
    setDownloadProgress(0);
    setErrorMessage(null);
    setInstallStatusMessage(null);
    setSavedLocationFeedback(null);

    const effectiveUpdateInfo: AppUpdateInfo = {
      ...updateInfo,
      fileName: defaultFileName,
      fileSize,
      platform,
    };

    try {
      const blob = await downloadUpdatePackage(
        effectiveUpdateInfo,
        (percent, loaded, total, speed) => {
          setDownloadProgress(percent);
          setDownloadedBytes(loaded);
          setTotalBytes(total);
          setSpeedMbps(speed);
        }
      );

      setDownloadedBlob(blob);
      setStep('ready');
      verifyInstallPermission();

      // Automatically save to the chosen folder/location in "Mis Archivos"
      try {
        const saveRes = await saveBlobToDestination(
          blob, 
          defaultFileName, 
          directoryHandle
        );
        if (saveRes.success && saveRes.savedPathOrName) {
          setSavedLocationFeedback(`Guardado en: "${saveRes.savedPathOrName}"`);
        }
      } catch (saveErr) {
        console.warn('Error saving to destination:', saveErr);
      }

      // Confetti celebration
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#f97316', '#10b981', '#047857', '#3b82f6'],
      });
    } catch (err: any) {
      setErrorMessage(err?.message || 'Ocurrió un error durante la descarga del paquete.');
      setStep('error');
    }
  };

  const handleOpenSettings = async () => {
    await openAndroidInstallSettings();
    setTimeout(() => {
      verifyInstallPermission();
    }, 1500);
  };

  const handleInstallNow = async () => {
    if (!downloadedBlob && !updateInfo.downloadUrl) {
      setErrorMessage('No hay paquete descargado para instalar.');
      setStep('error');
      return;
    }

    setStep('installing');
    setInstallStatusMessage('Preparando el instalador oficial del sistema...');

    const effectiveUpdateInfo: AppUpdateInfo = {
      ...updateInfo,
      fileName: defaultFileName,
      fileSize,
      platform,
    };

    try {
      const result = await triggerPackageInstallation(downloadedBlob || new Blob(), effectiveUpdateInfo);

      if (result.message === 'permission_required') {
        setHasInstallPermission(false);
        setStep('ready');
        return;
      }

      setInstallStatusMessage(result.message || 'Instalador abierto con éxito.');

      if (result.requiresBrowserDownload) {
        setTimeout(() => {
          setStep('ready');
        }, 3000);
      } else {
        setTimeout(() => {
          onClose();
        }, 4000);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'No se pudo iniciar el instalador automáticamente.');
      setStep('error');
    }
  };

  const handleSaveToAnotherFolder = async () => {
    if (!downloadedBlob) return;
    try {
      const res = await saveBlobToDestination(downloadedBlob, defaultFileName);
      if (res.success && res.savedPathOrName) {
        setSavedLocationFeedback(`Copia guardada en: "${res.savedPathOrName}"`);
      }
    } catch (err: any) {
      console.warn('Error saving to another location:', err);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes <= 0) return '0 MB';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  return (
    <div 
      id="modal-app-update-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in"
    >
      <div 
        id="modal-app-update-card"
        className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col text-black dark:text-white transition-all transform animate-scale-up"
      >
        {/* Top Header Banner */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-emerald-500/10 dark:from-orange-950/30 dark:via-amber-950/20 dark:to-emerald-950/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-500 flex items-center justify-center text-white shadow-md shadow-orange-500/30">
              <DownloadCloud className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-black uppercase tracking-wider text-orange-600 dark:text-orange-400">
                  Actualización Directa In-App
                </span>
                {updateInfo.isSimulated && (
                  <span className="text-[10px] font-black bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 px-2 py-0.5 rounded-full border border-amber-300 dark:border-amber-700">
                    Modo Prueba
                  </span>
                )}
              </div>
              <h2 className="text-base font-black text-black dark:text-white">
                {updateInfo.name || `Versión ${updateInfo.version}`}
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-700 dark:text-slate-300 hover:text-black dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body Content */}
        <div className="p-6 overflow-y-auto max-h-[75vh] space-y-5">
          {/* STEP 1: DETAILS & DESTINATION FOLDER SELECTION */}
          {step === 'details' && (
            <div className="space-y-5">
              {/* Version Comparison Card */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <div className="text-center sm:text-left">
                  <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Versión actual</div>
                  <div className="text-sm font-black text-slate-800 dark:text-slate-200 font-mono">
                    v{CURRENT_APP_VERSION}
                  </div>
                </div>
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400">
                  <ArrowRight className="w-4 h-4" />
                </div>
                <div className="text-center sm:text-right">
                  <div className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400">Nueva versión</div>
                  <div className="text-sm font-black text-emerald-600 dark:text-emerald-400 font-mono">
                    {updateInfo.version}
                  </div>
                </div>
              </div>

              {/* Package Info Badge */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400">
                    {platform === 'android' ? (
                      <Smartphone className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    ) : platform === 'windows' ? (
                      <Monitor className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    ) : (
                      <Globe className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    )}
                  </div>
                  <div>
                    <div className="text-xs font-black font-mono text-slate-900 dark:text-white truncate">
                      {defaultFileName}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                      Paquete oficial • {formatBytes(fileSize)}
                    </div>
                  </div>
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 px-2.5 py-1 rounded-full border border-emerald-300 dark:border-emerald-700">
                  Detectado
                </span>
              </div>

              {/* SECTION: ELEGIR EN MIS ARCHIVOS DÓNDE DESCARGAR Y GUARDAR */}
              <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border-2 border-amber-300/80 dark:border-amber-700/80 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <FolderOpen className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                    <span>¿Dónde se va a descargar y guardar la actualización?</span>
                  </label>
                </div>

                <p className="text-[11px] text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
                  Puedes elegir la carpeta exacta entre tus archivos (Descargas, Documentos, Tarjeta SD o cualquier carpeta de tu dispositivo).
                </p>

                {/* Current Selected Folder Display */}
                <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-800/80 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0">
                      {selectedFolderName ? <FolderCheck className="w-4 h-4 text-emerald-600" /> : <Folder className="w-4 h-4" />}
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                        Ubicación seleccionada
                      </span>
                      <span className="text-xs font-black text-slate-900 dark:text-white truncate block">
                        {selectedFolderName ? (
                          <span className="text-emerald-700 dark:text-emerald-400 font-mono">
                            📁 {selectedFolderName}
                          </span>
                        ) : (
                          'Mis Archivos / Descargas (Predeterminado)'
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Pick Folder Button */}
                  <button
                    type="button"
                    onClick={handleChooseFolder}
                    disabled={isPickingFolder}
                    className="px-3.5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white text-xs font-black shrink-0 transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <FolderOpen className="w-3.5 h-3.5" />
                    <span>{selectedFolderName ? 'Cambiar Carpeta' : 'Elegir en Mis Archivos'}</span>
                  </button>
                </div>

                {/* Always ask toggle / preference */}
                <label className="flex items-start gap-2.5 pt-1 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={askLocationOnSave}
                    onChange={(e) => setAskLocationOnSave(e.target.checked)}
                    className="mt-0.5 rounded-sm border-slate-300 text-orange-500 focus:ring-orange-500 cursor-pointer"
                  />
                  <div className="text-xs">
                    <span className="font-bold text-slate-900 dark:text-white block">
                      Abrir selector de Mis Archivos para confirmar la carpeta al guardar
                    </span>
                    <span className="text-[10px] text-slate-600 dark:text-slate-400 leading-snug block">
                      Abre el explorador de archivos oficial de tu sistema para elegir la carpeta o memoria de almacenamiento.
                    </span>
                  </div>
                </label>
              </div>

              {/* Seamless In-App Feature Callout */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-blue-500/10 border border-emerald-300 dark:border-emerald-800 text-xs space-y-1.5">
                <div className="flex items-center gap-1.5 font-black text-emerald-800 dark:text-emerald-300">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <span>Instalación Automática dentro de la App</span>
                </div>
                <p className="text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
                  Todo el proceso se realiza aquí: se descarga en la carpeta que elegiste de tus archivos y al presionar <strong>Instalar</strong>, tu teléfono o computadora iniciará la instalación directamente en tu pantalla sin tener que ir a buscar a la carpeta <em>Mis Archivos</em>.
                </p>
              </div>

              {/* Release Notes */}
              <div className="space-y-2">
                <div className="text-xs font-black text-slate-900 dark:text-slate-200 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>¿Qué hay de nuevo en esta versión?</span>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 text-xs text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed font-mono">
                  {updateInfo.notes}
                </div>
              </div>

              {/* Safe Guard notice */}
              <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-[11px] text-emerald-800 dark:text-emerald-300 font-bold">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Tus datos financieros, monedas y bancos permanecerán seguros y respaldados.</span>
              </div>
            </div>
          )}

          {/* STEP 2: DOWNLOADING PROGRESS BAR */}
          {step === 'downloading' && (
            <div className="py-6 space-y-6 text-center">
              <div className="w-20 h-20 mx-auto rounded-3xl bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800/60 flex items-center justify-center text-orange-500 shadow-inner">
                <HardDriveDownload className="w-10 h-10 animate-bounce" />
              </div>

              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  Descargando {defaultFileName}
                </h3>
                <p className="text-xs text-slate-700 dark:text-slate-300 font-medium mt-1">
                  Guardando en: <strong className="text-orange-600 dark:text-orange-400">{selectedFolderName || 'Mis Archivos / Descargas'}</strong>
                </p>
              </div>

              {/* Progress Bar Container */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-black">
                  <span className="text-slate-900 dark:text-white font-mono">{downloadProgress}%</span>
                  <span className="text-slate-700 dark:text-slate-300 font-mono">
                    {formatBytes(downloadedBytes)} / {formatBytes(totalBytes || fileSize)}
                  </span>
                </div>
                <div className="w-full h-4 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden p-0.5 border border-slate-300 dark:border-slate-700">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-orange-500 via-amber-500 to-emerald-500 transition-all duration-300 ease-out shadow-sm"
                    style={{ width: `${downloadProgress}%` }}
                  />
                </div>
                {speedMbps > 0 && (
                  <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300 text-right font-mono">
                    Velocidad: ~{speedMbps} MB/s
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 3: READY TO INSTALL */}
          {step === 'ready' && (
            <div className="py-4 space-y-5 text-center">
              <div className="w-20 h-20 mx-auto rounded-3xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-md">
                <CheckCircle2 className="w-10 h-10 animate-pulse" />
              </div>

              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white">
                  ¡Descarga Completada!
                </h3>
                <p className="text-xs text-slate-700 dark:text-slate-300 font-medium mt-1.5 max-w-sm mx-auto">
                  El archivo <strong className="text-black dark:text-white font-black">{defaultFileName}</strong> ({formatBytes(fileSize)}) se descargó con éxito y está listo para instalarse directamente.
                </p>
              </div>

              {/* Saved location notification */}
              <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 text-xs font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-2 text-left">
                <FolderCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>
                  {savedLocationFeedback || `Guardado en tus archivos: "${selectedFolderName || 'Mis Archivos / Descargas'}"`}
                </span>
              </div>

              {/* Action to save another copy in another folder in Mis Archivos */}
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-left">
                <div>
                  <div className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Folder className="w-3.5 h-3.5 text-orange-500" />
                    <span>Guardar copia en otra carpeta</span>
                  </div>
                  <span className="text-[11px] text-slate-600 dark:text-slate-400 block mt-0.5">
                    ¿Quieres respaldar una copia en otra carpeta de tus archivos o memoria externa?
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleSaveToAnotherFolder}
                  className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-600 text-xs font-black text-slate-800 dark:text-slate-200 shrink-0 cursor-pointer transition-colors shadow-2xs"
                >
                  Elegir carpeta...
                </button>
              </div>

              {/* Permission Check Warning for Android if not granted */}
              {isNative && !hasInstallPermission && (
                <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 text-left text-xs space-y-2">
                  <div className="flex items-center gap-2 font-black text-amber-900 dark:text-amber-200">
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                    <span>Permiso de Android requerido para instalar sin salir</span>
                  </div>
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                    Para que Ron's Money pueda abrir la instalación directamente en tu pantalla sin que tengas que ir a <em>Mis Archivos</em>, activa el interruptor <strong>"Permitir desde esta fuente"</strong> en los ajustes de Android.
                  </p>
                  <button
                    type="button"
                    onClick={handleOpenSettings}
                    className="mt-1 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-black text-xs flex items-center gap-2 transition-all cursor-pointer"
                  >
                    <Settings className="w-3.5 h-3.5" />
                    <span>Abrir Ajustes y Activar Permiso</span>
                  </button>
                </div>
              )}

              {/* Installation helper instructions */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-left text-xs space-y-2">
                <div className="font-black text-slate-900 dark:text-slate-200 flex items-center gap-1.5">
                  <FileCheck className="w-4 h-4 text-emerald-600" />
                  <span>¿Cómo funciona la instalación directa?</span>
                </div>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                  {isNative || platform === 'android'
                    ? 'Al presionar el botón verde abajo, se abrirá de inmediato la ventana oficial de Android "¿Quieres instalar una actualización para esta aplicación?". Solo presionas "Instalar" y la app se actualiza manteniendo todos tus datos.'
                    : isElectron || platform === 'windows'
                    ? 'Se ejecutará inmediatamente el instalador oficial de Windows en tu pantalla. No necesitas abrir el explorador de archivos.'
                    : 'En navegador Web, el archivo seleccionado se ha guardado en tu dispositivo y puedes instalarlo o continuar utilizando la app.'}
                </p>
              </div>
            </div>
          )}

          {/* STEP 4: INSTALLING / SYSTEM POPUP TRIGGERED */}
          {step === 'installing' && (
            <div className="py-8 space-y-5 text-center">
              <div className="w-20 h-20 mx-auto rounded-3xl bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-md">
                <Sparkles className="w-10 h-10 animate-spin" />
              </div>

              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  Iniciando el Instalador en tu Pantalla...
                </h3>
                <p className="text-xs text-emerald-700 dark:text-emerald-300 font-bold mt-2 max-w-sm mx-auto">
                  {installStatusMessage || 'El instalador del sistema se ha activado directamente en la aplicación.'}
                </p>
                <p className="text-[11px] text-slate-700 dark:text-slate-300 mt-2">
                  Confirma <strong>"Instalar"</strong> en el mensaje del sistema para completar la actualización.
                </p>
              </div>
            </div>
          )}

          {/* STEP 5: ERROR */}
          {step === 'error' && (
            <div className="py-4 space-y-4 text-center">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 flex items-center justify-center text-rose-600">
                <AlertCircle className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  No se pudo completar el proceso
                </h3>
                <p className="text-xs text-rose-600 dark:text-rose-400 font-medium mt-1">
                  {errorMessage || 'Ocurrió un error inesperado al procesar el archivo.'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="p-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex items-center justify-end gap-3">
          {step === 'details' && (
            <>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-black text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleStartDownload}
                className="px-6 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white text-xs font-black shadow-md shadow-orange-500/30 transition-all flex items-center gap-2 cursor-pointer"
              >
                <DownloadCloud className="w-4 h-4" />
                <span>Descargar y Guardar en Mis Archivos</span>
              </button>
            </>
          )}

          {step === 'downloading' && (
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-black text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
            >
              Cancelar Descarga
            </button>
          )}

          {step === 'ready' && (
            <>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-black text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
              >
                Más tarde
              </button>
              <button
                type="button"
                onClick={handleInstallNow}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-black shadow-lg shadow-emerald-600/30 transition-all flex items-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>🚀 Instalar Actualización Ahora</span>
              </button>
            </>
          )}

          {step === 'installing' && (
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-black cursor-pointer"
            >
              Cerrar
            </button>
          )}

          {step === 'error' && (
            <>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-black text-slate-700 dark:text-slate-300 cursor-pointer"
              >
                Cerrar
              </button>
              <button
                type="button"
                onClick={handleStartDownload}
                className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-black transition-all flex items-center gap-2 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Reintentar</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
