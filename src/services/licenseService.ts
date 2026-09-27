import { LicenseType, SoftwareLicense } from '../types';

const STORAGE_KEYS = {
  LICENSE: 'rons_money_license_v1',
  INSTALL_ID: 'rons_money_install_id_v1',
};

const SECRET_SALT = "RON_MONEY_SECURE_SALT_2026_KEY_GEN";

// Simple fast hash function to create 4-char hex checksum
function generateChecksum(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  const hex = Math.abs(hash).toString(16).toUpperCase();
  return hex.padStart(4, '0').slice(-4);
}

/**
 * Gets or creates a unique installation ID for this machine / device
 */
export function getOrCreateInstallationId(): string {
  let id = localStorage.getItem(STORAGE_KEYS.INSTALL_ID);
  if (!id) {
    const randomHex = Math.random().toString(16).substring(2, 6).toUpperCase();
    const timeHex = Date.now().toString(16).substring(Date.now().toString(16).length - 4).toUpperCase();
    id = `RM-${randomHex}-${timeHex}`;
    localStorage.setItem(STORAGE_KEYS.INSTALL_ID, id);
  }
  return id;
}

/**
 * Generates a valid license key
 * @param type 'LIFETIME' | 'ANNUAL' | 'MONTHLY'
 * @param clientName Name of client or company
 * @param deviceId Optional specific device ID to lock the key to
 */
export function generateLicenseKey(
  type: LicenseType,
  clientName: string,
  deviceId?: string
): string {
  const typeCode = type === 'LIFETIME' ? 'L' : type === 'ANNUAL' ? 'A' : 'M';
  const cleanClient = (clientName || 'CLIENT').trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4).padEnd(4, 'X');
  
  // Random salt block
  const randBlock = Math.random().toString(16).substring(2, 6).toUpperCase();
  
  // Compute checksum using typeCode + cleanClient + randBlock + (deviceId || 'GLOBAL') + SECRET_SALT
  const payload = `${typeCode}-${cleanClient}-${randBlock}-${(deviceId || 'GLOBAL').trim()}-${SECRET_SALT}`;
  const checksum = generateChecksum(payload);

  return `RON-${typeCode}${cleanClient.slice(0, 3)}-${randBlock}-${checksum}`;
}

/**
 * Validates a license key
 */
export function validateLicenseKey(
  key: string,
  clientName: string,
  currentDeviceId: string
): { isValid: boolean; type: LicenseType; error?: string } {
  const cleanKey = key.trim().toUpperCase();

  // 1. Check Master Override Keys for developer / testing
  if (cleanKey === 'RON-MASTER-LIFETIME' || cleanKey === 'RON-ADMIN-2026-KEY' || cleanKey === 'RON-VITALICIA-RONNY') {
    return { isValid: true, type: 'LIFETIME' };
  }

  // Key format: RON-XAAA-BBBB-CCCC
  const parts = cleanKey.split('-');
  if (parts.length !== 4 || parts[0] !== 'RON') {
    return { isValid: false, type: 'LIFETIME', error: 'Formato de clave inválido. Debe ser RON-XXXX-XXXX-XXXX' };
  }

  const [, part1, randBlock, checksum] = parts;
  if (!part1 || part1.length < 2 || !randBlock || !checksum) {
    return { isValid: false, type: 'LIFETIME', error: 'Clave de licencia incompleta o corrupta' };
  }

  const typeCode = part1.charAt(0);
  const clientPrefix = part1.substring(1);

  let type: LicenseType = 'LIFETIME';
  if (typeCode === 'A') type = 'ANNUAL';
  else if (typeCode === 'M') type = 'MONTHLY';
  else if (typeCode === 'L') type = 'LIFETIME';
  else {
    return { isValid: false, type: 'LIFETIME', error: 'Tipo de licencia inválido' };
  }

  // Verify against global device or specific current device
  const cleanClient = (clientName || 'CLIENT').trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4).padEnd(4, 'X');
  
  // Check variations (client prefix match or global)
  const candidateClients = [
    clientPrefix.padEnd(4, 'X'),
    cleanClient,
    'CLIENT',
    'USER',
  ];

  let matched = false;

  for (const c of candidateClients) {
    // Check with global device
    const payloadGlobal = `${typeCode}-${c}-${randBlock}-GLOBAL-${SECRET_SALT}`;
    if (generateChecksum(payloadGlobal) === checksum) {
      matched = true;
      break;
    }

    // Check locked to current device
    const payloadDevice = `${typeCode}-${c}-${randBlock}-${currentDeviceId.trim()}-${SECRET_SALT}`;
    if (generateChecksum(payloadDevice) === checksum) {
      matched = true;
      break;
    }
  }

  if (!matched) {
    // Secondary fallback validation check for standard algorithmic keys
    const fallbackPayload = `${typeCode}-${part1}-${randBlock}-${SECRET_SALT}`;
    if (generateChecksum(fallbackPayload) === checksum) {
      matched = true;
    }
  }

  if (!matched) {
    return { isValid: false, type, error: 'Clave de licencia inválida o no corresponde a este equipo.' };
  }

  return { isValid: true, type };
}

/**
 * Loads the current license status from storage
 */
export function loadLicense(): SoftwareLicense {
  const deviceId = getOrCreateInstallationId();
  
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.LICENSE);
    if (!raw) {
      return {
        isLicensed: false,
        licenseKey: '',
        licenseType: 'LIFETIME',
        licensedTo: '',
        activatedAt: '',
        expiresAt: null,
        deviceId,
      };
    }

    const license: SoftwareLicense = JSON.parse(raw);
    
    // Invalidate any old or trial license - Free trial is disabled
    if ((license as any).licenseType === 'TRIAL' || license.licenseKey === 'RON-TRIAL-15DAYS') {
      localStorage.removeItem(STORAGE_KEYS.LICENSE);
      return {
        isLicensed: false,
        licenseKey: '',
        licenseType: 'LIFETIME',
        licensedTo: '',
        activatedAt: '',
        expiresAt: null,
        deviceId,
      };
    }

    // Check if expired (for annual or monthly)
    if (license.isLicensed && license.expiresAt) {
      const expiry = new Date(license.expiresAt).getTime();
      const now = Date.now();
      if (now > expiry) {
        return {
          ...license,
          isLicensed: false, // Expired!
        };
      }
    }

    return license;
  } catch {
    return {
      isLicensed: false,
      licenseKey: '',
      licenseType: 'LIFETIME',
      licensedTo: '',
      activatedAt: '',
      expiresAt: null,
      deviceId,
    };
  }
}

/**
 * Saves and activates a license
 */
export function activateLicense(
  key: string,
  licensedTo: string
): { success: boolean; license?: SoftwareLicense; error?: string } {
  const deviceId = getOrCreateInstallationId();
  const validation = validateLicenseKey(key, licensedTo, deviceId);

  if (!validation.isValid) {
    return { success: false, error: validation.error || 'La clave ingresada no es válida.' };
  }

  const now = new Date();
  let expiresAt: string | null = null;

  if (validation.type === 'ANNUAL') {
    const d = new Date(now);
    d.setFullYear(d.getFullYear() + 1);
    expiresAt = d.toISOString();
  } else if (validation.type === 'MONTHLY') {
    const d = new Date(now);
    d.setDate(d.getDate() + 30);
    expiresAt = d.toISOString();
  }

  const license: SoftwareLicense = {
    isLicensed: true,
    licenseKey: key.trim().toUpperCase(),
    licenseType: validation.type,
    licensedTo: licensedTo.trim() || 'Usuario Registrado',
    activatedAt: now.toISOString(),
    expiresAt,
    deviceId,
  };

  localStorage.setItem(STORAGE_KEYS.LICENSE, JSON.stringify(license));
  return { success: true, license };
}

/**
 * Deactivates or removes the current license
 */
export function deactivateLicense(): void {
  localStorage.removeItem(STORAGE_KEYS.LICENSE);
}
