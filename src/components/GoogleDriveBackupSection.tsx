import React, { useState, useEffect, useCallback } from 'react';
import { User } from 'firebase/auth';
import { 
  Cloud, 
  CloudUpload, 
  RefreshCw, 
  Trash2, 
  Download, 
  RotateCcw, 
  Check, 
  AlertCircle, 
  HardDrive, 
  LogOut, 
  UserCheck, 
  FileJson,
  Calendar,
  Layers,
  Sparkles,
  AlertTriangle
} from 'lucide-react';
import { 
  initAuth, 
  googleSignIn, 
  logoutGoogle, 
  uploadBackupToGoogleDrive, 
  listGoogleDriveBackups, 
  downloadBackupContentFromDrive, 
  deleteBackupFromDrive,
  DriveBackupFile,
  InsufficientScopesError
} from '../services/googleDriveService';
import { useApp } from '../context/AppContext';
import { ConfirmationModal } from './ConfirmationModal';

export const GoogleDriveBackupSection: React.FC = () => {
  const { getBackupData, importDataJson } = useApp();

  const [googleUser, setGoogleUser] = useState<User | null>(null);
  const [hasToken, setHasToken] = useState<boolean>(false);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isLoadingBackups, setIsLoadingBackups] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [backupFiles, setBackupFiles] = useState<DriveBackupFile[]>([]);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [needsScopeConsent, setNeedsScopeConsent] = useState(false);

  // Modals for destructive actions
  const [fileToRestore, setFileToRestore] = useState<DriveBackupFile | null>(null);
  const [fileToDelete, setFileToDelete] = useState<DriveBackupFile | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Helper to load backups
  const loadBackups = useCallback(async () => {
    setIsLoadingBackups(true);
    setNeedsScopeConsent(false);
    try {
      const files = await listGoogleDriveBackups();
      setBackupFiles(files);
      setNeedsScopeConsent(false);
    } catch (err: unknown) {
      if (
        err instanceof InsufficientScopesError ||
        (err as Error)?.message?.includes('insufficient authentication scopes') ||
        (err as Error)?.message?.includes('Insufficient')
      ) {
        setNeedsScopeConsent(true);
        // Clear files since token lacks Drive access
        setBackupFiles([]);
      } else {
        // Only log unexpected network issues, not permission rejections
        const msg = (err as Error)?.message || 'Error al obtener copias';
        setFeedback({ type: 'error', message: msg });
      }
    } finally {
      setIsLoadingBackups(false);
    }
  }, []);

  // Listen to auth state
  useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => {
        setGoogleUser(user);
        setHasToken(Boolean(token));
        loadBackups();
      },
      () => {
        setGoogleUser(null);
        setHasToken(false);
        setBackupFiles([]);
        setNeedsScopeConsent(false);
      }
    );
    return () => unsubscribe();
  }, [loadBackups]);

  const showToast = (message: string, type: 'success' | 'error') => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 5000);
  };

  const handleSignIn = async () => {
    setIsSigningIn(true);
    setFeedback(null);
    try {
      const res = await googleSignIn();
      if (res) {
        setGoogleUser(res.user);
        setHasToken(true);
        setNeedsScopeConsent(false);
        showToast(`Conectado exitosamente con: ${res.user.email || 'Google'}`, 'success');
        await loadBackups();
      }
    } catch (err: unknown) {
      const fbErr = err as { code?: string; message?: string };
      if (
        fbErr?.code === 'auth/popup-closed-by-user' ||
        fbErr?.code === 'auth/cancelled-popup-request' ||
        fbErr?.message?.includes('popup-closed-by-user') ||
        fbErr?.message?.includes('cancelled-popup-request')
      ) {
        // User closed the popup, do not show any error toast
        return;
      }

      if (fbErr?.message?.includes('access_denied') || fbErr?.message?.includes('403')) {
        showToast(
          'Acceso denegado (Error 403): Tu correo debe estar agregado como Usuario de Prueba en Google Cloud Console para poder acceder.',
          'error'
        );
        return;
      }

      const errMessage = fbErr?.message || 'No se pudo iniciar sesión con Google';
      showToast(errMessage, 'error');
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await logoutGoogle();
      setGoogleUser(null);
      setHasToken(false);
      setBackupFiles([]);
      setNeedsScopeConsent(false);
      showToast('Sesión de Google cerrada correctamente.', 'success');
    } catch (err: unknown) {
      const errMessage = (err as Error)?.message || 'Error al desconectar.';
      showToast(errMessage, 'error');
    }
  };

  const handleSaveToDrive = async () => {
    if (!googleUser || !hasToken) {
      showToast('Por favor inicia sesión con Google primero.', 'error');
      return;
    }

    setIsSaving(true);
    setFeedback(null);
    try {
      const backupData = getBackupData();
      const now = new Date();
      const pad = (n: number) => n.toString().padStart(2, '0');
      const formattedTimestamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}h${pad(now.getMinutes())}m`;
      const fileName = `rons-money-backup-${formattedTimestamp}.json`;

      const result = await uploadBackupToGoogleDrive(backupData, fileName);
      showToast(`¡Copia de seguridad guardada con éxito en Google Drive (${result.name})!`, 'success');
      await loadBackups();
    } catch (err: unknown) {
      const errMessage = (err as Error)?.message || 'Error al guardar copia en Google Drive.';
      showToast(errMessage, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Perform Restore (after user confirms in modal)
  const confirmRestore = async () => {
    if (!fileToRestore) return;
    setIsRestoring(true);
    try {
      const content = await downloadBackupContentFromDrive(fileToRestore.id);
      const res = importDataJson(content);
      if (res.success) {
        showToast(`¡Copia "${fileToRestore.name}" restaurada con éxito! Tus datos han sido actualizados.`, 'success');
      } else {
        showToast(res.error || 'No se pudo restaurar el archivo de copia.', 'error');
      }
    } catch (err: unknown) {
      const errMessage = (err as Error)?.message || 'Error al descargar copia de Google Drive.';
      showToast(errMessage, 'error');
    } finally {
      setIsRestoring(false);
      setFileToRestore(null);
    }
  };

  // Perform Delete (after user confirms in modal)
  const confirmDelete = async () => {
    if (!fileToDelete) return;
    setIsDeleting(true);
    try {
      await deleteBackupFromDrive(fileToDelete.id);
      showToast(`Copia de seguridad eliminada de Google Drive.`, 'success');
      await loadBackups();
    } catch (err: unknown) {
      const errMessage = (err as Error)?.message || 'Error al eliminar copia de Google Drive.';
      showToast(errMessage, 'error');
    } finally {
      setIsDeleting(false);
      setFileToDelete(null);
    }
  };

  // Download a Drive file to local machine
  const handleDownloadFileLocally = async (file: DriveBackupFile) => {
    try {
      const content = await downloadBackupContentFromDrive(file.id);
      const blob = new Blob([content], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showToast(`Archivo "${file.name}" descargado en tu dispositivo.`, 'success');
    } catch (err: unknown) {
      const errMessage = (err as Error)?.message || 'Error al descargar archivo.';
      showToast(errMessage, 'error');
    }
  };

  // Format file size
  const formatSize = (bytesStr?: string) => {
    if (!bytesStr) return '—';
    const bytes = parseInt(bytesStr, 10);
    if (isNaN(bytes)) return '—';
    if (bytes < 1024) return `${bytes} B`;
    return `${(bytes / 1024).toFixed(1)} KB`;
  };

  // Format dates
  const formatDate = (isoString?: string) => {
    if (!isoString) return '—';
    try {
      const d = new Date(isoString);
      return d.toLocaleString('es-PY', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div id="google-drive-backup-section" className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 gap-2">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-xl bg-orange-50 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-800/60">
            <Cloud className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-black text-black dark:text-white flex items-center gap-2">
              Copias de Seguridad en Google Drive
            </h3>
            <p className="text-xs text-slate-700 dark:text-slate-300 font-medium">
              Guarda tus datos en la nube y selecciona en qué cuenta de Google deseas respaldar.
            </p>
          </div>
        </div>

        {googleUser && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800/60 self-start sm:self-auto">
            <UserCheck className="w-3.5 h-3.5" />
            Conectado a Google Drive
          </span>
        )}
      </div>

      {/* Notifications */}
      {feedback && (
        <div
          className={`p-3.5 rounded-2xl text-xs font-black flex items-center gap-2 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200'
              : 'bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-700 text-rose-800 dark:text-rose-200'
          }`}
        >
          {feedback.type === 'success' ? (
            <Check className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* SECTION 1: GOOGLE ACCOUNT SELECTION / STATUS */}
      <div className="rounded-2xl p-5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {googleUser ? (
            <div className="flex items-center gap-3.5">
              {googleUser.photoURL ? (
                <img
                  src={googleUser.photoURL}
                  alt={googleUser.displayName || 'Google Account'}
                  className="w-12 h-12 rounded-full border-2 border-orange-500 shadow-xs object-cover"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-orange-500 text-white font-black text-lg flex items-center justify-center shadow-xs">
                  {(googleUser.displayName || googleUser.email || 'G').charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs uppercase tracking-wider font-black text-orange-600 dark:text-orange-400">
                    Cuenta de Google Seleccionada
                  </span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                </div>
                <div className="text-sm font-black text-black dark:text-white">
                  {googleUser.displayName || 'Usuario de Google'}
                </div>
                <div className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                  {googleUser.email}
                </div>
                <div className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                  Todas las copias en la nube se guardarán directamente en el Google Drive de esta cuenta.
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3.5">
              <div className="p-3 rounded-2xl bg-white dark:bg-slate-700 text-slate-500 dark:text-slate-300 border border-slate-200 dark:border-slate-600 shrink-0">
                <HardDrive className="w-6 h-6" />
              </div>
              <div>
                <div className="text-sm font-black text-black dark:text-white">
                  Conectar cuenta de Google
                </div>
                <div className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                  Inicia sesión para seleccionar en qué cuenta de Google Drive deseas guardar y recuperar tus copias de seguridad.
                </div>
              </div>
            </div>
          )}

          {/* Account Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {googleUser ? (
              <>
                <button
                  type="button"
                  id="btn-switch-google-account"
                  onClick={handleSignIn}
                  disabled={isSigningIn}
                  className="px-3.5 py-2 rounded-xl text-xs font-black border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-black dark:text-white hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex items-center gap-1.5 shadow-2xs"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-orange-500 ${isSigningIn ? 'animate-spin' : ''}`} />
                  <span>Cambiar de Cuenta</span>
                </button>

                <button
                  type="button"
                  id="btn-disconnect-google"
                  onClick={handleSignOut}
                  className="px-3 py-2 rounded-xl text-xs font-black text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 transition-colors flex items-center gap-1.5"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Desconectar</span>
                </button>
              </>
            ) : (
              <button
                type="button"
                id="btn-google-drive-signin"
                onClick={handleSignIn}
                disabled={isSigningIn}
                className="inline-flex items-center gap-3 px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl shadow-xs hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-black text-slate-800 dark:text-white transition-all active:scale-[0.98]"
              >
                <div className="w-5 h-5 shrink-0">
                  <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-5 h-5 block">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                    <path fill="none" d="M0 0h48v48H0z"></path>
                  </svg>
                </div>
                <span>{isSigningIn ? 'Conectando con Google...' : 'Elegir Cuenta de Google'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Scope Consent Banner when user token lacks Drive permissions */}
      {needsScopeConsent && googleUser && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-900 dark:text-amber-200">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-black">Permiso de Google Drive pendiente</div>
              <div className="text-xs text-amber-800 dark:text-amber-300/90 font-medium mt-0.5">
                Tu cuenta está conectada pero necesita autorización para ver y crear copias de seguridad en Google Drive. Haz clic en el botón para conceder los permisos.
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={handleSignIn}
            disabled={isSigningIn}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-black shrink-0 transition-colors shadow-xs cursor-pointer"
          >
            {isSigningIn ? 'Concediendo...' : 'Conceder Permisos a Drive'}
          </button>
        </div>
      )}

      {/* SECTION 2: ACTIONS WHEN CONNECTED */}
      {googleUser && (
        <div className="space-y-4">
          {/* Quick Save Card */}
          <div className="p-4 rounded-2xl bg-orange-50/70 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="text-xs font-black text-orange-900 dark:text-orange-200 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-orange-500" />
                Nueva Copia de Seguridad Inmediata
              </div>
              <div className="text-xs text-orange-800 dark:text-orange-300/90 font-medium mt-0.5">
                Genera un respaldo completo de bancos, categorías y transacciones en el Google Drive de <strong className="font-mono">{googleUser.email}</strong>.
              </div>
            </div>

            <button
              type="button"
              id="btn-save-to-google-drive"
              onClick={handleSaveToDrive}
              disabled={isSaving}
              className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 active:bg-orange-700 disabled:opacity-60 text-white text-xs font-black rounded-xl shadow-md shadow-orange-500/25 transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer"
            >
              <CloudUpload className={`w-4 h-4 ${isSaving ? 'animate-bounce' : ''}`} />
              <span>{isSaving ? 'Guardando en Drive...' : 'Guardar Copia en Drive'}</span>
            </button>
          </div>

          {/* Backups List */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-orange-500" />
                <h4 className="text-xs uppercase tracking-wider font-black text-black dark:text-white">
                  Copias de Seguridad Guardadas en Google Drive ({backupFiles.length})
                </h4>
              </div>

              <button
                type="button"
                id="btn-refresh-drive-backups"
                onClick={loadBackups}
                disabled={isLoadingBackups}
                className="text-xs font-black text-orange-600 dark:text-orange-400 hover:underline flex items-center gap-1"
              >
                <RefreshCw className={`w-3 h-3 ${isLoadingBackups ? 'animate-spin' : ''}`} />
                <span>Actualizar</span>
              </button>
            </div>

            {isLoadingBackups ? (
              <div className="p-8 text-center border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-800/40">
                <RefreshCw className="w-6 h-6 animate-spin text-orange-500 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-600 dark:text-slate-400">
                  Consultando archivos en Google Drive...
                </p>
              </div>
            ) : backupFiles.length === 0 ? (
              <div className="p-8 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-800/30">
                <Cloud className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                <p className="text-xs font-black text-slate-700 dark:text-slate-300">
                  Aún no tienes copias de seguridad de Ron´s Money en esta cuenta de Google Drive.
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  Haz clic en &quot;Guardar Copia en Drive&quot; para crear tu primera copia de seguridad en la nube.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {backupFiles.map((file) => (
                  <div
                    key={file.id}
                    className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/50 hover:border-slate-300 dark:hover:border-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-3 transition-colors shadow-2xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2.5 rounded-xl bg-orange-50 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400 shrink-0">
                        <FileJson className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-black text-black dark:text-white truncate">
                          {file.name}
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-slate-600 dark:text-slate-400 font-medium mt-0.5">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(file.createdTime)}
                          </span>
                          <span>•</span>
                          <span>{formatSize(file.size)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
                      {/* Restore */}
                      <button
                        type="button"
                        onClick={() => setFileToRestore(file)}
                        title="Restaurar esta copia de seguridad en la aplicación"
                        className="px-3 py-1.5 rounded-xl text-xs font-black bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 transition-colors flex items-center gap-1.5"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Restaurar</span>
                      </button>

                      {/* Download */}
                      <button
                        type="button"
                        onClick={() => handleDownloadFileLocally(file)}
                        title="Descargar archivo JSON a tu computadora"
                        className="p-1.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors"
                      >
                        <Download className="w-4 h-4" />
                      </button>

                      {/* Delete */}
                      <button
                        type="button"
                        onClick={() => setFileToDelete(file)}
                        title="Eliminar esta copia de Google Drive"
                        className="p-1.5 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/60 border border-rose-200 dark:border-rose-900/60 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Confirmation Modal for RESTORE from Drive (MANDATORY per workspace integration rules) */}
      <ConfirmationModal
        isOpen={Boolean(fileToRestore)}
        title="¿Restaurar copia de seguridad desde Google Drive?"
        message={`Esta acción reemplazará todos tus datos actuales de Ron´s Money (bancos, categorías y transacciones) con los de la copia de seguridad "${fileToRestore?.name}" de tu Google Drive. Cualquier cambio no guardado se perderá.`}
        confirmText={isRestoring ? 'Restaurando...' : 'Sí, Restaurar Datos'}
        cancelText="Cancelar"
        isDestructive={true}
        onConfirm={confirmRestore}
        onCancel={() => setFileToRestore(null)}
      />

      {/* Confirmation Modal for DELETE from Drive (MANDATORY per workspace integration rules) */}
      <ConfirmationModal
        isOpen={Boolean(fileToDelete)}
        title="¿Eliminar copia de seguridad de Google Drive?"
        message={`¿Estás seguro de que deseas eliminar permanentemente el archivo "${fileToDelete?.name}" de tu cuenta de Google Drive (${googleUser?.email || ''})? Esta acción no se puede deshacer.`}
        confirmText={isDeleting ? 'Eliminando...' : 'Sí, Eliminar de Drive'}
        cancelText="Cancelar"
        isDestructive={true}
        onConfirm={confirmDelete}
        onCancel={() => setFileToDelete(null)}
      />
    </div>
  );
};
