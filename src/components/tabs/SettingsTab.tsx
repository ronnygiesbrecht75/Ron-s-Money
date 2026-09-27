import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ThemeMode } from '../../types';
import { 
  Settings, 
  Moon, 
  Sun, 
  Monitor, 
  KeyRound, 
  Fingerprint, 
  User, 
  ShieldCheck, 
  Save, 
  Download, 
  Upload, 
  RotateCcw, 
  Check, 
  Lock,
  Eye,
  EyeOff
} from 'lucide-react';
import { ConfirmationModal } from '../ConfirmationModal';
import { GoogleDriveBackupSection } from '../GoogleDriveBackupSection';
import { LicenseManagerSection } from '../LicenseManagerSection';

export const SettingsTab: React.FC = () => {
  const { 
    settings, 
    updateSettings, 
    exportDataJson, 
    importDataJson, 
    resetToFactoryDefaults, 
    logout 
  } = useApp();

  // Settings form states
  const [userName, setUserName] = useState(settings.userName);
  const [pin, setPin] = useState(settings.pin);
  const [showPin, setShowPin] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(settings.biometricEnabled);
  const [requireAuthOnLoad, setRequireAuthOnLoad] = useState(settings.requireAuthOnLoad);
  const [exchangeRate, setExchangeRate] = useState(settings.exchangeRateUsdToPyg.toString());

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Reset confirmation modal state
  const [showResetModal, setShowResetModal] = useState(false);

  const handleSaveSecurity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName.trim()) {
      setErrorMessage('El nombre de usuario no puede estar vacío.');
      return;
    }
    if (!pin || pin.length < 4) {
      setErrorMessage('La contraseña o PIN debe tener al menos 4 dígitos.');
      return;
    }

    const rateNum = parseFloat(exchangeRate) || 7550;

    updateSettings({
      userName: userName.trim(),
      pin: pin.trim(),
      biometricEnabled,
      requireAuthOnLoad,
      exchangeRateUsdToPyg: rateNum,
    });

    setErrorMessage(null);
    setToastMessage('Ajustes guardados correctamente.');
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleThemeChange = (mode: ThemeMode) => {
    updateSettings({ themeMode: mode });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result as string;
      if (content) {
        const result = importDataJson(content);
        if (result.success) {
          setToastMessage('¡Copia de seguridad restaurada con éxito!');
          setTimeout(() => setToastMessage(null), 4000);
        } else {
          setErrorMessage(result.error || 'Error al importar archivo.');
        }
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div id="tab-settings-container" className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800/40">
          <Settings className="w-3.5 h-3.5" />
          Configuración del Sistema
        </div>
        <h2 className="text-2xl font-black tracking-tight text-black dark:text-white mt-1">
          Ajustes de Ron´s Money
        </h2>
        <p className="text-xs text-slate-700 dark:text-slate-300 font-medium">
          Tema visual (Verde & Blanco), credenciales de seguridad, huella dactilar y copias de seguridad.
        </p>
      </div>

      {/* Notifications */}
      {toastMessage && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border-2 border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200 text-xs font-black flex items-center gap-2">
          <Check className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-700 text-rose-800 dark:text-rose-200 text-xs font-black flex items-center gap-2">
          <span>{errorMessage}</span>
        </div>
      )}

      {/* 1. SECCIÓN: TEMA DE COLORES DEL SISTEMA */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 gap-2">
          <h3 className="text-base font-black text-black dark:text-white flex items-center gap-2">
            <Sun className="w-5 h-5 text-orange-500" />
            Modo de Color del Sistema
          </h3>
          <span className="text-xs font-black px-3 py-1 bg-white dark:bg-slate-800 text-black dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-full shadow-2xs">
            Seleccionado: {settings.themeMode === 'light' ? 'Modo claro' : settings.themeMode === 'dark' ? 'Modo noche' : 'Modo del dispositivo'}
          </span>
        </div>
        <p className="text-xs text-black dark:text-slate-300 font-medium mt-2">
          Selecciona una sola opción de visualización para la aplicación:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
          {/* 1. Modo claro */}
          <button
            type="button"
            id="btn-theme-light"
            onClick={() => handleThemeChange('light')}
            className={`p-4 rounded-2xl border text-left transition-all relative ${
              settings.themeMode === 'light'
                ? 'border-orange-500 bg-white dark:bg-slate-800 shadow-md ring-2 ring-orange-500/20'
                : 'border-slate-200 bg-white dark:bg-slate-800/40 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-white text-orange-500 shadow-2xs border border-slate-200 shrink-0">
                <Sun className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-black text-black dark:text-white">
                  Modo claro
                </div>
                <div className="text-[11px] text-black dark:text-slate-300 font-medium truncate">
                  Fondo blanco y texto negro
                </div>
              </div>
            </div>
            {settings.themeMode === 'light' && (
              <div className="absolute top-3 right-3 text-orange-500 bg-orange-50 dark:bg-orange-950/50 p-1 rounded-full">
                <Check className="w-4 h-4" />
              </div>
            )}
          </button>

          {/* 2. Modo noche */}
          <button
            type="button"
            id="btn-theme-dark"
            onClick={() => handleThemeChange('dark')}
            className={`p-4 rounded-2xl border text-left transition-all relative ${
              settings.themeMode === 'dark'
                ? 'border-orange-500 bg-white dark:bg-slate-800 shadow-md ring-2 ring-orange-500/20'
                : 'border-slate-200 bg-white dark:bg-slate-800/40 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 text-black dark:text-slate-200 shadow-2xs border border-slate-200 dark:border-slate-700 shrink-0">
                <Moon className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-black text-black dark:text-white">
                  Modo noche
                </div>
                <div className="text-[11px] text-black dark:text-slate-300 font-medium truncate">
                  Fondo oscuro
                </div>
              </div>
            </div>
            {settings.themeMode === 'dark' && (
              <div className="absolute top-3 right-3 text-orange-500 bg-orange-50 dark:bg-orange-950/50 p-1 rounded-full">
                <Check className="w-4 h-4" />
              </div>
            )}
          </button>

          {/* 3. Modo del dispositivo */}
          <button
            type="button"
            id="btn-theme-system"
            onClick={() => handleThemeChange('system')}
            className={`p-4 rounded-2xl border text-left transition-all relative ${
              settings.themeMode === 'system'
                ? 'border-orange-500 bg-white dark:bg-slate-800 shadow-md ring-2 ring-orange-500/20'
                : 'border-slate-200 bg-white dark:bg-slate-800/40 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 text-black dark:text-slate-200 shadow-2xs border border-slate-200 shrink-0">
                <Monitor className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-black text-black dark:text-white">
                  Modo del dispositivo
                </div>
                <div className="text-[11px] text-black dark:text-slate-300 font-medium truncate">
                  Automático según tu dispositivo
                </div>
              </div>
            </div>
            {settings.themeMode === 'system' && (
              <div className="absolute top-3 right-3 text-orange-500 bg-orange-50 dark:bg-orange-950/50 p-1 rounded-full">
                <Check className="w-4 h-4" />
              </div>
            )}
          </button>
        </div>
      </div>

      {/* 2. SECCIÓN: SEGURIDAD, USUARIO, CONTRASEÑA Y HUELLA DACTILAR */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs">
        <h3 className="text-base font-black text-black dark:text-white flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
          <ShieldCheck className="w-5 h-5 text-orange-500" />
          Seguridad & Acceso
        </h3>

        <form onSubmit={handleSaveSecurity} className="mt-5 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Usuario */}
            <div>
              <label className="block text-xs font-black text-black dark:text-white uppercase tracking-wider mb-1.5">
                Nombre de Usuario *
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-black dark:text-slate-400 absolute left-3.5 top-3" />
                <input
                  id="input-settings-username"
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-black dark:text-white focus:outline-hidden focus:ring-2 focus:ring-orange-500"
                  required
                />
              </div>
            </div>

            {/* Contraseña / PIN */}
            <div>
              <label className="block text-xs font-black text-black dark:text-white uppercase tracking-wider mb-1.5">
                Contraseña / PIN (Mínimo 4 Dígitos) *
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-black dark:text-slate-400 absolute left-3.5 top-3" />
                <input
                  id="input-settings-pin"
                  type={showPin ? 'text' : 'password'}
                  inputMode="numeric"
                  maxLength={8}
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="Mínimo 4 dígitos"
                  className="w-full pl-10 pr-10 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono font-black text-black dark:text-white focus:outline-hidden focus:ring-2 focus:ring-orange-500"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-black dark:hover:text-white"
                >
                  {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* Toggle Huella Dactilar */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center justify-between shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-700 text-black dark:text-slate-200 border border-slate-200 dark:border-slate-600">
                <Fingerprint className="w-6 h-6" />
              </div>
              <div>
                <div className="text-sm font-black text-black dark:text-white">
                  Activar Huella Dactilar (Biometría)
                </div>
                <div className="text-xs text-black dark:text-slate-300 font-medium">
                  Permite iniciar sesión rápido con el sensor de huella en móviles y computadoras.
                </div>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                id="toggle-biometrics"
                type="checkbox"
                checked={biometricEnabled}
                onChange={(e) => setBiometricEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-300 dark:bg-slate-600 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
            </label>
          </div>

          {/* Toggle Require PIN on App Open */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center justify-between shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-700 text-black dark:text-slate-200 border border-slate-200 dark:border-slate-600">
                <Lock className="w-6 h-6" />
              </div>
              <div>
                <div className="text-sm font-black text-black dark:text-white">
                  Bloqueo Automático al Iniciar App
                </div>
                <div className="text-xs text-black dark:text-slate-300 font-medium">
                  Solicita siempre PIN o huella cada vez que se abra la aplicación.
                </div>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                id="toggle-require-auth"
                type="checkbox"
                checked={requireAuthOnLoad}
                onChange={(e) => setRequireAuthOnLoad(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-300 dark:bg-slate-600 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
            </label>
          </div>

          {/* Actions with Orange Button */}
          <div className="flex items-center justify-between pt-2">
            <button
              id="btn-lock-now"
              type="button"
              onClick={logout}
              className="px-4 py-2.5 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl text-xs font-black transition-colors flex items-center gap-1.5"
            >
              <Lock className="w-4 h-4" />
              <span>Bloquear Sesión Ahora</span>
            </button>

            <button
              id="btn-save-settings"
              type="submit"
              className="px-6 py-3 bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white text-xs font-black rounded-xl shadow-md shadow-orange-500/25 transition-all flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>Guardar Configuración</span>
            </button>
          </div>
        </form>
      </div>

      {/* 3. SECCIÓN: LICENCIA DE SOFTWARE & ACTIVACIÓN */}
      <LicenseManagerSection />

      {/* 4. SECCIÓN: COPIAS DE SEGURIDAD EN GOOGLE DRIVE */}
      <GoogleDriveBackupSection />

      {/* 5. SECCIÓN: COPIA LOCAL & RESTABLECER */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs">
        <h3 className="text-base font-black text-black dark:text-white flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
          <Download className="w-5 h-5 text-orange-500" />
          Copia Local & Archivos JSON
        </h3>
        <p className="text-xs text-black dark:text-slate-300 font-medium mt-2">
          Exporta o importa un archivo JSON directamente desde y hacia tu dispositivo sin requerir internet.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
          <button
            type="button"
            id="btn-export-backup-json"
            onClick={exportDataJson}
            className="p-3.5 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 font-black text-xs text-black dark:text-white flex items-center justify-center gap-2 transition-all shadow-2xs cursor-pointer"
          >
            <Download className="w-4 h-4 text-orange-500" />
            <span>Descargar Archivo JSON</span>
          </button>

          <label className="p-3.5 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 font-black text-xs text-black dark:text-white flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs">
            <Upload className="w-4 h-4 text-orange-500" />
            <span>Cargar Archivo JSON</span>
            <input
              id="input-restore-backup-file"
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>

          <button
            type="button"
            id="btn-factory-reset"
            onClick={() => setShowResetModal(true)}
            className="p-3.5 rounded-2xl border border-rose-200 dark:border-rose-900/60 bg-white dark:bg-rose-950/30 hover:bg-rose-50 dark:hover:bg-rose-900/50 font-black text-xs text-rose-600 dark:text-rose-400 flex items-center justify-center gap-2 transition-all shadow-2xs cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Restablecer Datos Demo</span>
          </button>
        </div>
      </div>

      {/* Confirmation Modal for Reset */}
      <ConfirmationModal
        isOpen={showResetModal}
        title="¿Restablecer Datos a Valores Predeterminados?"
        message="Esta acción repondrá las categorías de ingresos y gastos iniciales (Casa, Patio, Sueldos, etc.) y bancos de demostración. Los cambios no respaldados se perderán."
        confirmText="Sí, Restablecer"
        cancelText="Cancelar"
        isDestructive={true}
        onConfirm={() => {
          resetToFactoryDefaults();
          setShowResetModal(false);
          setToastMessage('Datos restablecidos a valores predeterminados.');
          setTimeout(() => setToastMessage(null), 3000);
        }}
        onCancel={() => setShowResetModal(false)}
      />
    </div>
  );
};
