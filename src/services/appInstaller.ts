import { Capacitor, registerPlugin } from '@capacitor/core';
import { AppUpdateInfo } from '../types';

declare global {
  interface Window {
    electronAPI?: {
      isElectron: boolean;
      installUpdateExe: (data: { url?: string; base64?: string; fileName?: string }) => Promise<{ success: boolean; error?: string }>;
    };
  }
}

export interface AppInstallerPlugin {
  canRequestPackageInstalls(): Promise<{ canInstall: boolean }>;
  openInstallPermissionSettings(): Promise<void>;
  installApkFromUrl(options: { url: string }): Promise<{ success: boolean }>;
  installApkFromBase64(options: { base64: string }): Promise<{ success: boolean }>;
}

export const AppInstaller = registerPlugin<AppInstallerPlugin>('AppInstaller');

export function isAndroidNative(): boolean {
  try {
    return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';
  } catch {
    return false;
  }
}

export function isElectronApp(): boolean {
  return typeof window !== 'undefined' && Boolean(window.electronAPI?.isElectron);
}

export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const res = reader.result as string;
      resolve(res);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Check if the app has Android permission to install unknown apps
 */
export async function checkAndroidInstallPermission(): Promise<boolean> {
  if (!isAndroidNative()) return true;
  try {
    const res = await AppInstaller.canRequestPackageInstalls();
    return res.canInstall !== false;
  } catch (err) {
    console.warn('Could not check install permission via plugin:', err);
    return true;
  }
}

/**
 * Open the Android system setting to allow installation from this app
 */
export async function openAndroidInstallSettings(): Promise<void> {
  if (!isAndroidNative()) return;
  try {
    await AppInstaller.openInstallPermissionSettings();
  } catch (err) {
    console.warn('Could not open install settings:', err);
  }
}

/**
 * Directly launch the installation of the update package completely within the app
 */
export async function launchDirectInstallation(
  updateInfo: AppUpdateInfo,
  downloadedBlob?: Blob
): Promise<{ success: boolean; message: string; requiresBrowserDownload?: boolean }> {
  // 1. ANDROID NATIVE APP (Capacitor)
  if (isAndroidNative()) {
    try {
      // Check permission first
      const hasPermission = await checkAndroidInstallPermission();
      if (!hasPermission) {
        return {
          success: false,
          message: 'permission_required',
        };
      }

      // If we have a downloaded blob
      if (downloadedBlob) {
        const base64 = await blobToBase64(downloadedBlob);
        await AppInstaller.installApkFromBase64({ base64 });
        return {
          success: true,
          message: 'Instalador de Android iniciado directamente en pantalla. Confirma "Instalar" para actualizar.',
        };
      }

      // If we have a direct download URL
      if (updateInfo.downloadUrl && !updateInfo.downloadUrl.startsWith('simulated://')) {
        await AppInstaller.installApkFromUrl({ url: updateInfo.downloadUrl });
        return {
          success: true,
          message: 'Descargando e iniciando instalador directamente en pantalla...',
        };
      }

      // Fallback for simulation on native Android
      return {
        success: true,
        message: 'Modo simulación completado con éxito en Android.',
      };
    } catch (err: any) {
      console.error('Error invoking AppInstaller plugin on Android:', err);
      return {
        success: false,
        message: err?.message || 'Error al invocar el instalador automático en Android.',
      };
    }
  }

  // 2. WINDOWS DESKTOP APP (Electron)
  if (isElectronApp() && window.electronAPI) {
    try {
      let base64: string | undefined;
      if (downloadedBlob) {
        base64 = await blobToBase64(downloadedBlob);
      }

      const res = await window.electronAPI.installUpdateExe({
        url: updateInfo.downloadUrl?.startsWith('simulated://') ? undefined : updateInfo.downloadUrl,
        base64,
        fileName: updateInfo.fileName,
      });

      if (res.success) {
        return {
          success: true,
          message: 'El instalador de Windows se ha iniciado en tu pantalla.',
        };
      } else {
        return {
          success: false,
          message: res.error || 'No se pudo iniciar el instalador de Windows automáticamente.',
        };
      }
    } catch (err: any) {
      return {
        success: false,
        message: err?.message || 'Error en Electron al iniciar el instalador.',
      };
    }
  }

  // 3. WEB BROWSER / PWA
  if (updateInfo.platform === 'web' && 'serviceWorker' in navigator) {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const reg of registrations) {
        await reg.update();
      }
      setTimeout(() => {
        window.location.reload();
      }, 500);
      return {
        success: true,
        message: 'Versión web actualizada con éxito. Recargando la aplicación...',
      };
    } catch (err) {
      console.warn('Service worker refresh error:', err);
    }
  }

  // Web download trigger
  if (downloadedBlob) {
    const fileName = updateInfo.fileName || (updateInfo.platform === 'android' ? 'Rons-Money.apk' : 'Rons-Money-Setup.exe');
    const blobUrl = URL.createObjectURL(downloadedBlob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
  }

  return {
    success: true,
    requiresBrowserDownload: true,
    message: 'Descarga iniciada desde el navegador.',
  };
}
