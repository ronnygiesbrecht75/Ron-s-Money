import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Fingerprint, Lock, User, Eye, EyeOff, ShieldCheck, ArrowRight, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';

export const LoginScreen: React.FC = () => {
  const { settings, loginWithPin, loginWithBiometrics } = useApp();
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isScanningBiometric, setIsScanningBiometric] = useState(false);
  const [biometricSuccess, setBiometricSuccess] = useState(false);

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin || pin.length < 4) {
      setErrorMsg('La contraseña o PIN debe tener al menos 4 dígitos.');
      return;
    }
    const result = loginWithPin(pin);
    if (!result.success) {
      setErrorMsg(result.error || 'Contraseña incorrecta');
      setPin('');
    } else {
      setErrorMsg('');
    }
  };

  const handleBiometricClick = async () => {
    if (!settings.biometricEnabled) {
      setErrorMsg('La huella dactilar está desactivada en Ajustes.');
      return;
    }
    setErrorMsg('');
    setIsScanningBiometric(true);
    try {
      const success = await loginWithBiometrics();
      if (success) {
        setBiometricSuccess(true);
      }
    } catch {
      setErrorMsg('Error en el sensor biométrico.');
    } finally {
      setIsScanningBiometric(false);
    }
  };

  const handleQuickKeypad = (digit: string) => {
    if (pin.length < 8) {
      const newPin = pin + digit;
      setPin(newPin);
      setErrorMsg('');
      if (newPin.length >= 4 && newPin === settings.pin) {
        loginWithPin(newPin);
      }
    }
  };

  const handleBackspace = () => {
    setPin(prev => prev.slice(0, -1));
    setErrorMsg('');
  };

  return (
    <div 
      id="login-screen-container"
      className="min-h-screen flex items-center justify-center p-4 bg-white dark:bg-slate-950 text-black dark:text-white transition-colors duration-300 relative overflow-hidden"
    >
      <motion.div
        id="login-card"
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md rounded-3xl p-8 sm:p-10 relative z-10"
      >
        {/* App Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-orange-500 text-white shadow-md shadow-orange-500/20 mb-4">
            <span className="text-2xl font-black tracking-tight">R$</span>
          </div>
          <h1 id="app-login-title" className="text-2xl sm:text-3xl font-black tracking-tight text-black dark:text-white">
            Ron´s Money
          </h1>
          <p className="text-sm text-black dark:text-slate-400 mt-1.5 font-bold">
            Gestión de Dinero & Control Financiero
          </p>
        </div>

        {/* User Info Badge */}
        <div className="flex items-center justify-between p-3.5 mb-6 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500 text-white flex items-center justify-center font-black text-sm shadow-xs">
              <User className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-black text-black dark:text-slate-400 uppercase tracking-wider">
                Usuario
              </div>
              <div className="text-sm font-black text-black dark:text-white">
                {settings.userName || 'Ron'}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs font-black text-black dark:text-slate-300 bg-white dark:bg-slate-700 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-600">
            <ShieldCheck className="w-3.5 h-3.5 text-black dark:text-white" />
            Protegido
          </div>
        </div>

        {/* Error message */}
        {errorMsg && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-5 p-3 rounded-xl bg-white dark:bg-rose-950/50 border border-rose-400 text-rose-700 dark:text-rose-300 text-xs font-bold text-center"
          >
            {errorMsg}
          </motion.div>
        )}

        {/* PIN Form */}
        <form onSubmit={handlePinSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-black text-black dark:text-white uppercase tracking-wider mb-2">
              Contraseña o PIN (Mínimo 4 dígitos)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-black dark:text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                id="input-login-pin"
                type={showPin ? 'text' : 'password'}
                inputMode="numeric"
                maxLength={8}
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value);
                  setErrorMsg('');
                }}
                placeholder="••••"
                className="w-full pl-10 pr-12 py-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-center text-lg tracking-widest font-mono font-black text-black dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                autoFocus
              />
              <button
                type="button"
                id="btn-toggle-pin-visibility"
                onClick={() => setShowPin(!showPin)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-black hover:text-black dark:text-slate-400 dark:hover:text-white"
              >
                {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Quick Keypad for Touch / Mobile */}
          <div className="grid grid-cols-3 gap-2 pt-1">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
              <button
                key={digit}
                type="button"
                onClick={() => handleQuickKeypad(digit)}
                className="py-2.5 text-base font-black text-black dark:text-white bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 active:scale-95 rounded-xl border border-slate-200 dark:border-slate-700 transition-all font-mono"
              >
                {digit}
              </button>
            ))}
            <button
              type="button"
              onClick={handleBackspace}
              className="py-2.5 text-xs font-black text-black dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-700 transition-all"
            >
              Borrar
            </button>
            <button
              key="0"
              type="button"
              onClick={() => handleQuickKeypad('0')}
              className="py-2.5 text-base font-black text-black dark:text-white bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 active:scale-95 rounded-xl border border-slate-200 dark:border-slate-700 transition-all font-mono"
            >
              0
            </button>
            <button
              type="submit"
              className="py-2.5 text-xs font-bold text-white bg-orange-500 hover:bg-orange-600 active:scale-95 rounded-xl shadow-xs transition-all flex items-center justify-center"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Orange Submit Button */}
          <button
            id="btn-login-submit"
            type="submit"
            className="w-full py-3.5 px-4 bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white font-black rounded-xl shadow-md shadow-orange-500/25 active:scale-[0.99] transition-all flex items-center justify-center gap-2"
          >
            <span>Desbloquear Sesión</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </form>

        {/* Biometric Button (Huella Dactilar) */}
        {settings.biometricEnabled && (
          <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-800 text-center">
            <div className="text-xs text-black dark:text-slate-300 mb-3 font-bold">
              O accede con Huella Dactilar
            </div>
            
            <button
              id="btn-biometric-auth"
              type="button"
              onClick={handleBiometricClick}
              disabled={isScanningBiometric}
              className={`relative inline-flex flex-col items-center justify-center p-4 rounded-2xl border transition-all ${
                isScanningBiometric 
                  ? 'bg-white dark:bg-slate-800 border-orange-500 text-orange-600 scale-105'
                  : biometricSuccess
                  ? 'bg-white dark:bg-slate-800 border-emerald-500 text-emerald-600'
                  : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-black dark:text-white hover:border-orange-500 hover:shadow-xs'
              }`}
            >
              <div className="relative">
                <Fingerprint className={`w-10 h-10 ${isScanningBiometric ? 'animate-pulse text-orange-500' : 'text-black dark:text-slate-300'}`} />
                {isScanningBiometric && (
                  <motion.div
                    className="absolute inset-0 border-2 border-orange-500 rounded-full"
                    animate={{ scale: [1, 1.4, 1], opacity: [0.8, 0, 0.8] }}
                    transition={{ repeat: Infinity, duration: 1.2 }}
                  />
                )}
              </div>
              <span className="text-xs font-black mt-2 text-black dark:text-white">
                {isScanningBiometric ? 'Escaneando Huella...' : 'Tocar Sensor de Huella'}
              </span>
            </button>
          </div>
        )}

        <div className="mt-6 text-center">
          <p className="text-xs text-black dark:text-slate-400 font-medium">
            PIN predeterminado: <span className="font-mono font-black text-orange-600 dark:text-orange-400">1234</span>
          </p>
        </div>
      </motion.div>
    </div>
  );
};
