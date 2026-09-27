import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  KeyRound, 
  ShieldCheck, 
  Copy, 
  Check, 
  AlertCircle, 
  HelpCircle,
  MessageCircle,
  Laptop
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const LicenseActivationScreen: React.FC = () => {
  const { license, activateAppLicense } = useApp();

  const [licenseKey, setLicenseKey] = useState('');
  const [licensedTo, setLicensedTo] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState(false);
  const [isActivating, setIsActivating] = useState(false);

  const handleCopyDeviceId = () => {
    navigator.clipboard.writeText(license.deviceId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2500);
  };

  const handleActivate = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!licenseKey.trim()) {
      setErrorMessage('Por favor introduce tu clave de licencia.');
      return;
    }

    setIsActivating(true);
    setTimeout(() => {
      const res = activateAppLicense(licenseKey.trim(), licensedTo.trim() || 'Titular');
      if (res.success) {
        try {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
          });
        } catch {
          // ignore
        }
      } else {
        setErrorMessage(res.error || 'La clave ingresada es inválida o ha expirado.');
      }
      setIsActivating(false);
    }, 400);
  };

  const isExpired = license.expiresAt && new Date(license.expiresAt).getTime() < Date.now();

  const whatsappMessage = encodeURIComponent(
    `Hola, deseo activar una licencia para Ron's Money. Mi ID de equipo es: ${license.deviceId}`
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center items-center p-4 sm:p-6 transition-colors">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xl overflow-hidden">
        {/* Banner Top */}
        <div className="bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 p-6 text-white text-center relative overflow-hidden">
          <div className="absolute -right-6 -bottom-6 opacity-10">
            <ShieldCheck className="w-36 h-36" />
          </div>
          <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl mx-auto flex items-center justify-center mb-3 shadow-inner">
            <KeyRound className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-black tracking-tight">Ron´s Money</h1>
          <p className="text-xs font-semibold text-orange-100 mt-1">
            Control de Acceso & Licencia de Software
          </p>
        </div>

        {/* Form Body */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* Status Message */}
          {isExpired ? (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs font-bold flex items-center gap-2.5">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>Tu licencia anterior ha expirado. Por favor ingresa una nueva clave para continuar utilizando la aplicación.</span>
            </div>
          ) : (
            <div className="text-center">
              <h2 className="text-base font-black text-black dark:text-white">
                Activación del Producto
              </h2>
              <p className="text-xs text-slate-700 dark:text-slate-300 font-medium mt-1">
                Para utilizar este software en tu computadora o celular, introduce tu clave de licencia registrada.
              </p>
            </div>
          )}

          {/* Machine / Device ID Card */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Laptop className="w-3.5 h-3.5 text-orange-500" />
                ID de Este Dispositivo / Equipo:
              </span>
              <button
                type="button"
                onClick={handleCopyDeviceId}
                className="text-[11px] font-black text-orange-600 dark:text-orange-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                {copiedId ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-500" />
                    <span className="text-emerald-600 dark:text-emerald-400">¡Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copiar ID</span>
                  </>
                )}
              </button>
            </div>
            <div className="font-mono text-sm font-black text-black dark:text-white select-all bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-center tracking-wider">
              {license.deviceId}
            </div>
            <p className="text-[10px] text-slate-700 dark:text-slate-300 mt-1.5 text-center">
              Proporciona este código al administrador si tu licencia es personalizada para este equipo.
            </p>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs font-black flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Activation Form */}
          <form onSubmit={handleActivate} className="space-y-4">
            <div>
              <label className="block text-xs font-black text-black dark:text-white uppercase tracking-wider mb-1.5">
                Titular o Empresa (Opcional)
              </label>
              <input
                type="text"
                value={licensedTo}
                onChange={(e) => setLicensedTo(e.target.value)}
                placeholder="Ej. Comercial San José o tu nombre"
                className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-black dark:text-white focus:outline-hidden focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block text-xs font-black text-black dark:text-white uppercase tracking-wider mb-1.5">
                Clave de Licencia *
              </label>
              <input
                type="text"
                value={licenseKey}
                onChange={(e) => setLicenseKey(e.target.value.toUpperCase())}
                placeholder="RON-XXXX-XXXX-XXXX"
                className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono font-black text-black dark:text-white tracking-widest uppercase focus:outline-hidden focus:ring-2 focus:ring-orange-500"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isActivating}
              className="w-full py-3 px-4 bg-orange-500 hover:bg-orange-600 active:bg-orange-700 disabled:opacity-60 text-white text-xs font-black rounded-xl shadow-md shadow-orange-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{isActivating ? 'Verificando Licencia...' : 'Activar Software Ahora'}</span>
            </button>
          </form>

          {/* Contact / License Request Option */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3">
            <a
              href={`https://wa.me/?text=${whatsappMessage}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 px-4 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs font-black transition-colors flex items-center justify-center gap-2"
            >
              <MessageCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Solicitar Clave de Licencia</span>
            </a>
          </div>

          {/* Quick hint for master developer access */}
          <div className="text-[11px] text-center text-slate-600 dark:text-slate-400 flex items-center justify-center gap-1 font-medium">
            <HelpCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>Clave de prueba maestra: <strong className="font-mono text-black dark:text-white">RON-MASTER-LIFETIME</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
};
