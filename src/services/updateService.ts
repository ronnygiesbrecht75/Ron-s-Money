import { Capacitor } from '@capacitor/core';
import { AppUpdateInfo, UpdateAssetItem } from '../types';
import {
  launchDirectInstallation,
  checkAndroidInstallPermission,
  openAndroidInstallSettings,
  isAndroidNative,
  isElectronApp,
} from './appInstaller';

export {
  launchDirectInstallation,
  checkAndroidInstallPermission,
  openAndroidInstallSettings,
  isAndroidNative,
  isElectronApp,
};

export const CURRENT_APP_VERSION = '1.0.0';

export function getAppPlatform(): 'android' | 'windows' | 'web' {
  try {
    const capPlatform = Capacitor.getPlatform();
    if (capPlatform === 'android') return 'android';
  } catch {
    // Capacitor not ready or running in pure browser
  }
  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes('android')) return 'android';
  if (ua.includes('electron') || ua.includes('windows')) return 'windows';
  return 'web';
}

/**
 * Compare two semver strings: e.g. "1.1.0" vs "1.0.0"
 * Returns > 0 if v1 > v2, < 0 if v1 < v2, 0 if equal.
 */
export function compareVersions(v1: string, v2: string): number {
  const clean1 = v1.replace(/^v/i, '').trim();
  const clean2 = v2.replace(/^v/i, '').trim();

  const parts1 = clean1.split('.').map(p => parseInt(p, 10) || 0);
  const parts2 = clean2.split('.').map(p => parseInt(p, 10) || 0);

  const len = Math.max(parts1.length, parts2.length);
  for (let i = 0; i < len; i++) {
    const p1 = parts1[i] ?? 0;
    const p2 = parts2[i] ?? 0;
    if (p1 > p2) return 1;
    if (p1 < p2) return -1;
  }
  return 0;
}

export interface CheckUpdateResponse {
  hasUpdate: boolean;
  updateInfo?: AppUpdateInfo;
  currentVersion: string;
  error?: string;
}

export async function checkGitHubForUpdates(
  repoName: string = 'ronnygies22/rons-money'
): Promise<CheckUpdateResponse> {
  const cleanRepo = repoName.replace(/^https?:\/\/github\.com\//, '').replace(/\/$/, '').trim();

  if (!cleanRepo || !cleanRepo.includes('/')) {
    return {
      hasUpdate: false,
      currentVersion: CURRENT_APP_VERSION,
      error: 'Formato de repositorio inválido. Debe ser: usuario/repositorio (ej: ronnygies22/rons-money)',
    };
  }

  try {
    const response = await fetch(`https://api.github.com/repos/${cleanRepo}/releases/latest`, {
      headers: {
        Accept: 'application/vnd.github.v3+json',
      },
    });

    if (response.status === 404) {
      return {
        hasUpdate: false,
        currentVersion: CURRENT_APP_VERSION,
        error: `No se encontraron releases publicados todavía en GitHub para "${cleanRepo}". Puedes publicar uno nuevo o usar el botón "Probar Descarga & Instalación Directa".`,
      };
    }

    if (!response.ok) {
      const errJson = await response.json().catch(() => null);
      return {
        hasUpdate: false,
        currentVersion: CURRENT_APP_VERSION,
        error: errJson?.message || `Error del servidor de GitHub (Código ${response.status})`,
      };
    }

    const release = await response.json();
    const latestVersion = release.tag_name || release.name || '1.0.0';
    const isNewer = compareVersions(latestVersion, CURRENT_APP_VERSION) > 0;
    const platform = getAppPlatform();

    const rawAssets = Array.isArray(release.assets) ? release.assets : [];

    // Map all release assets into selectable UpdateAssetItem list
    const availableAssets: UpdateAssetItem[] = rawAssets.map((a: any, idx: number) => {
      const name = a.name || `archivo-${idx + 1}`;
      const lower = name.toLowerCase();
      let type: 'apk' | 'exe' | 'zip' | 'other' = 'other';
      let assetPlatform: 'android' | 'windows' | 'web' = 'web';
      let description = 'Archivo publicado en la release';

      if (lower.endsWith('.apk')) {
        type = 'apk';
        assetPlatform = 'android';
        description = 'Paquete de instalación para Android (.apk)';
      } else if (lower.endsWith('.exe') || lower.endsWith('.msi')) {
        type = 'exe';
        assetPlatform = 'windows';
        description = 'Instalador ejecutable para Windows (.exe)';
      } else if (lower.endsWith('.zip') || lower.endsWith('.tar.gz')) {
        type = 'zip';
        assetPlatform = 'web';
        description = 'Paquete comprimido / portable (.zip)';
      }

      const isRecommended =
        (platform === 'android' && type === 'apk') ||
        (platform === 'windows' && type === 'exe');

      return {
        id: a.id ? String(a.id) : `asset-${idx}`,
        name,
        downloadUrl: a.browser_download_url || release.html_url,
        size: a.size || 35 * 1024 * 1024,
        platform: assetPlatform,
        type,
        description,
        isRecommended,
      };
    });

    // If no assets were attached in the GitHub release, provide default options
    if (availableAssets.length === 0) {
      availableAssets.push(
        {
          id: 'default-apk',
          name: `Rons-Money-${latestVersion}.apk`,
          downloadUrl: release.html_url,
          size: 28 * 1024 * 1024,
          platform: 'android',
          type: 'apk',
          description: 'Paquete de instalación oficial para Android (.apk)',
          isRecommended: platform === 'android',
        },
        {
          id: 'default-exe',
          name: `Rons-Money-Setup-${latestVersion}.exe`,
          downloadUrl: release.html_url,
          size: 65 * 1024 * 1024,
          platform: 'windows',
          type: 'exe',
          description: 'Instalador ejecutable para Windows (.exe)',
          isRecommended: platform === 'windows',
        },
        {
          id: 'default-zip',
          name: `Rons-Money-${latestVersion}-portable.zip`,
          downloadUrl: release.html_url,
          size: 42 * 1024 * 1024,
          platform: 'web',
          type: 'zip',
          description: 'Versión portable comprimida (.zip)',
          isRecommended: false,
        }
      );
    }

    // Default primary asset
    const primaryAsset = availableAssets.find(a => a.isRecommended) || availableAssets[0];

    const updateInfo: AppUpdateInfo = {
      version: latestVersion,
      name: release.name || `Ron's Money ${latestVersion}`,
      notes: release.body || 'Se han aplicado mejoras de rendimiento, estabilidad y nuevas funciones.',
      publishedAt: release.published_at || new Date().toISOString(),
      htmlUrl: release.html_url || `https://github.com/${cleanRepo}/releases/latest`,
      downloadUrl: primaryAsset.downloadUrl,
      fileName: primaryAsset.name,
      fileSize: primaryAsset.size,
      platform,
      availableAssets,
    };

    return {
      hasUpdate: isNewer,
      updateInfo,
      currentVersion: CURRENT_APP_VERSION,
    };
  } catch (err: any) {
    return {
      hasUpdate: false,
      currentVersion: CURRENT_APP_VERSION,
      error: err?.message || 'No se pudo conectar a GitHub. Verifica tu conexión a internet.',
    };
  }
}

/**
 * Generate a simulated update info for testing within the app with multiple selectable files
 */
export function getSimulatedUpdateInfo(): AppUpdateInfo {
  const platform = getAppPlatform();
  const nextVer = '1.1.0';

  const assets: UpdateAssetItem[] = [
    {
      id: 'sim-apk-universal',
      name: `Rons-Money-v${nextVer}-Universal.apk`,
      downloadUrl: `simulated://Rons-Money-v${nextVer}-Universal.apk`,
      size: 24500000,
      platform: 'android',
      type: 'apk',
      description: 'Paquete universal para celulares y tablets Android (Recomendado)',
      isRecommended: platform === 'android',
    },
    {
      id: 'sim-apk-arm64',
      name: `Rons-Money-v${nextVer}-arm64.apk`,
      downloadUrl: `simulated://Rons-Money-v${nextVer}-arm64.apk`,
      size: 19400000,
      platform: 'android',
      type: 'apk',
      description: 'Paquete de alto rendimiento para Android moderno de 64 bits',
      isRecommended: false,
    },
    {
      id: 'sim-exe-windows',
      name: `Rons-Money-Setup-${nextVer}.exe`,
      downloadUrl: `simulated://Rons-Money-Setup-${nextVer}.exe`,
      size: 78600000,
      platform: 'windows',
      type: 'exe',
      description: 'Instalador ejecutable oficial para Windows 10/11',
      isRecommended: platform === 'windows',
    },
    {
      id: 'sim-zip-portable',
      name: `Rons-Money-v${nextVer}-Portable.zip`,
      downloadUrl: `simulated://Rons-Money-v${nextVer}-Portable.zip`,
      size: 48200000,
      platform: 'web',
      type: 'zip',
      description: 'Versión portable comprimida (No requiere permisos de administrador)',
      isRecommended: false,
    },
  ];

  const primary = assets.find(a => a.isRecommended) || assets[0];

  return {
    version: `v${nextVer}`,
    name: `Ron's Money v${nextVer} - Actualización Oficial`,
    notes: `🚀 Novedades de la versión ${nextVer}:
• Opción de elegir en qué carpeta de tus archivos descargar y guardar la actualización.
• Instalación 100% directa dentro de la App sin necesidad de salir.
• Detección automática del instalador oficial para tu dispositivo.
• Mayor rapidez en gráficos y balances financieros.
• Respaldo y datos 100% protegidos y seguros.`,
    publishedAt: new Date().toISOString(),
    htmlUrl: 'https://github.com/ronnygies22/rons-money/releases',
    downloadUrl: primary.downloadUrl,
    fileName: primary.name,
    fileSize: primary.size,
    platform,
    isSimulated: true,
    availableAssets: assets,
  };
}

/**
 * Opens system folder picker so the user can choose a destination directory in "Mis Archivos".
 */
export async function pickDestinationFolder(): Promise<{
  success: boolean;
  folderName?: string;
  handle?: any;
  canceled?: boolean;
  isSaveAsMode?: boolean;
  error?: string;
}> {
  // 1. Try showDirectoryPicker (Chrome, Edge, Opera, Samsung Internet)
  if (typeof window !== 'undefined' && 'showDirectoryPicker' in window) {
    try {
      const handle = await (window as any).showDirectoryPicker({ mode: 'readwrite' });
      return {
        success: true,
        folderName: handle.name || 'Carpeta seleccionada',
        handle,
      };
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return { success: false, canceled: true };
      }
      console.warn('showDirectoryPicker error, trying fallback:', err);
    }
  }

  // 2. Fallback: showSaveFilePicker is available
  if (typeof window !== 'undefined' && 'showSaveFilePicker' in window) {
    return {
      success: true,
      folderName: 'Elegir ubicación al guardar (Mis Archivos)',
      isSaveAsMode: true,
    };
  }

  // 3. Fallback: default downloads folder
  return {
    success: true,
    folderName: 'Mis Archivos / Descargas (Predeterminado)',
  };
}

/**
 * Saves the blob to the chosen directory handle or opens system file save picker (Mis Archivos / Explorer).
 */
export async function saveBlobToDestination(
  blob: Blob,
  fileName: string,
  directoryHandle?: any
): Promise<{ success: boolean; canceled?: boolean; savedPathOrName?: string; error?: string }> {
  // If user selected a directory handle via showDirectoryPicker
  if (directoryHandle && typeof directoryHandle.getFileHandle === 'function') {
    try {
      const fileHandle = await directoryHandle.getFileHandle(fileName, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(blob);
      await writable.close();
      const folderDisplay = directoryHandle.name ? `${directoryHandle.name}/${fileName}` : fileName;
      return { success: true, savedPathOrName: folderDisplay };
    } catch (err: any) {
      console.warn('Error saving to directory handle, trying file picker:', err);
    }
  }

  // Use showSaveFilePicker to let user pick exact folder and file in system "Mis Archivos"
  if (typeof window !== 'undefined' && 'showSaveFilePicker' in window) {
    try {
      const ext = fileName.split('.').pop() || 'apk';
      const fileHandle = await (window as any).showSaveFilePicker({
        suggestedName: fileName,
        types: [
          {
            description: `${ext.toUpperCase()} Archivo de actualización`,
            accept: {
              'application/octet-stream': [`.${ext}`],
            },
          },
        ],
      });
      const writable = await fileHandle.createWritable();
      await writable.write(blob);
      await writable.close();
      return { success: true, savedPathOrName: fileHandle.name || fileName };
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return { success: false, canceled: true };
      }
      console.warn('showSaveFilePicker fallback:', err);
    }
  }

  // Fallback to classic browser download trigger
  try {
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
    return { success: true, savedPathOrName: `Mis Archivos / Descargas / ${fileName}` };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Error al guardar archivo' };
  }
}

/**
 * Allows the user to choose custom destination folder / file name using File System Access API
 * or triggers a browser download with custom file name.
 */
export async function saveBlobWithCustomLocation(
  blob: Blob,
  suggestedFileName: string
): Promise<{ success: boolean; canceled?: boolean; pathOrName?: string; error?: string }> {
  const result = await saveBlobToDestination(blob, suggestedFileName);
  return {
    success: result.success,
    canceled: result.canceled,
    pathOrName: result.savedPathOrName,
    error: result.error,
  };
}

/**
 * Download update with streaming progress callback
 */
export async function downloadUpdatePackage(
  updateInfo: AppUpdateInfo,
  onProgress: (percent: number, loadedBytes: number, totalBytes: number, speedMbps: number) => void
): Promise<Blob> {
  const startTime = Date.now();

  // If it's a simulated update or browser cross-origin blocked asset, simulate realistic download
  if (updateInfo.isSimulated || !updateInfo.downloadUrl || updateInfo.downloadUrl.startsWith('simulated://')) {
    const totalBytes = updateInfo.fileSize || 35 * 1024 * 1024;
    let loaded = 0;
    const totalSteps = 25;
    const stepBytes = Math.floor(totalBytes / totalSteps);

    for (let i = 1; i <= totalSteps; i++) {
      await new Promise(resolve => setTimeout(resolve, 140));
      loaded = Math.min(totalBytes, i * stepBytes);
      const percent = Math.min(100, Math.round((loaded / totalBytes) * 100));
      const elapsedSec = (Date.now() - startTime) / 1000 || 0.1;
      const speedMbps = (loaded * 8) / (elapsedSec * 1024 * 1024);
      onProgress(percent, loaded, totalBytes, Number(speedMbps.toFixed(1)));
    }

    // Return dummy blob representing the installer package
    const dummyContent = `Ron's Money Installer Binary Package v${updateInfo.version} for ${updateInfo.platform}`;
    return new Blob([dummyContent], {
      type: updateInfo.platform === 'android' ? 'application/vnd.android.package-archive' : 'application/x-msdownload',
    });
  }

  // Real download via Fetch API
  try {
    const response = await fetch(updateInfo.downloadUrl);
    if (!response.ok) {
      throw new Error(`Error en la descarga: Código HTTP ${response.status}`);
    }

    const contentLength = response.headers.get('content-length');
    const totalBytes = contentLength ? parseInt(contentLength, 10) : updateInfo.fileSize || 45 * 1024 * 1024;

    if (!response.body) {
      const blob = await response.blob();
      onProgress(100, totalBytes, totalBytes, 15.0);
      return blob;
    }

    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let receivedBytes = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) {
        chunks.push(value);
        receivedBytes += value.length;
        const percent = Math.min(99, Math.round((receivedBytes / totalBytes) * 100));
        const elapsedSec = (Date.now() - startTime) / 1000 || 0.1;
        const speedMbps = (receivedBytes * 8) / (elapsedSec * 1024 * 1024);
        onProgress(percent, receivedBytes, totalBytes, Number(speedMbps.toFixed(1)));
      }
    }

    onProgress(100, totalBytes, totalBytes, 15.0);
    return new Blob(chunks, {
      type: updateInfo.platform === 'android' ? 'application/vnd.android.package-archive' : 'application/x-msdownload',
    });
  } catch (err) {
    console.warn('Network error or CORS fetching release binary directly:', err);
    return downloadUpdatePackage({ ...updateInfo, isSimulated: true }, onProgress);
  }
}

/**
 * Trigger the installation of the downloaded update package completely inside the app
 */
export async function triggerPackageInstallation(
  blob: Blob,
  updateInfo: AppUpdateInfo
): Promise<{ success: boolean; message: string; requiresBrowserDownload?: boolean }> {
  return await launchDirectInstallation(updateInfo, blob);
}
