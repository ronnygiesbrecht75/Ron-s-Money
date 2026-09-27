import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  signOut,
  User 
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Desired scopes for Google Drive backup & account indication
export const SCOPES = [
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/userinfo.email',
];

const createProvider = () => {
  const provider = new GoogleAuthProvider();
  SCOPES.forEach((scope) => provider.addScope(scope));
  // Request both account selection and consent so Google guarantees drive.file permissions
  provider.setCustomParameters({
    prompt: 'select_account consent',
    access_type: 'offline',
  });
  return provider;
};

// In-memory token caching (NOT stored in localStorage or sessionStorage as per security guidelines)
let cachedAccessToken: string | null = null;
let isSigningIn = false;

export interface DriveBackupFile {
  id: string;
  name: string;
  createdTime: string;
  modifiedTime?: string;
  size?: string;
}

export interface GoogleDriveUser {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
}

/**
 * Initializes the auth state listener
 */
export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        // Token might have expired or page reloaded, user needs to re-authorize
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export class InsufficientScopesError extends Error {
  constructor(message = 'Request had insufficient authentication scopes') {
    super(message);
    this.name = 'InsufficientScopesError';
  }
}

/**
 * Initiates Google Sign-In with popup
 * Prompts user to select an account and consent to Drive scope
 */
export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const provider = createProvider();
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('No se pudo obtener el token de acceso de Google');
    }

    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: unknown) {
    const fbErr = error as { code?: string; message?: string };
    if (
      fbErr?.code === 'auth/popup-closed-by-user' ||
      fbErr?.code === 'auth/cancelled-popup-request' ||
      fbErr?.message?.includes('popup-closed-by-user') ||
      fbErr?.message?.includes('cancelled-popup-request')
    ) {
      // Normal cancellation: user closed the window or switched tabs
      return null;
    }
    if (fbErr?.code === 'auth/popup-blocked') {
      throw new Error('La ventana emergente fue bloqueada por tu navegador. Por favor permite las ventanas emergentes en este sitio.');
    }
    console.error('Error al iniciar sesión con Google:', fbErr?.message || error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

/**
 * Returns the cached access token
 */
export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

/**
 * Logs out the Google session and clears the in-memory token
 */
export const logoutGoogle = async () => {
  await signOut(auth);
  cachedAccessToken = null;
};

/**
 * Uploads a JSON backup file to Google Drive using multipart upload
 */
export const uploadBackupToGoogleDrive = async (
  backupData: Record<string, unknown>,
  fileName?: string
): Promise<DriveBackupFile> => {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('No hay sesión activa de Google. Por favor conecta tu cuenta de Google.');
  }

  const dateStr = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const finalFileName = fileName || `rons-money-backup-${dateStr}.json`;

  const metadata = {
    name: finalFileName,
    mimeType: 'application/json',
    description: "Copia de seguridad de la aplicación Ron's Money",
  };

  const boundary = '-------rons_money_boundary_' + Date.now();
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const content = JSON.stringify(backupData, null, 2);

  const multipartRequestBody =
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    'Content-Type: application/json\r\n\r\n' +
    content +
    closeDelimiter;

  const response = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,createdTime,size',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: multipartRequestBody,
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const message = (errorData as { error?: { message?: string } })?.error?.message || response.statusText;
    throw new Error(`Error al guardar en Google Drive: ${message}`);
  }

  const createdFile = await response.json();
  return createdFile as DriveBackupFile;
};

/**
 * Lists backups in Google Drive created by this app
 */
export const listGoogleDriveBackups = async (): Promise<DriveBackupFile[]> => {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('No hay sesión activa de Google.');
  }

  const query = encodeURIComponent("name contains 'rons-money-backup' and trashed = false");
  const url = `https://www.googleapis.com/drive/v3/files?q=${query}&spaces=drive&fields=files(id,name,createdTime,modifiedTime,size)&orderBy=createdTime desc&pageSize=30`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const message = (errorData as { error?: { message?: string } })?.error?.message || response.statusText;
    if (response.status === 403 && (message.includes('insufficient authentication scopes') || message.includes('Insufficient'))) {
      throw new InsufficientScopesError(message);
    }
    throw new Error(`Error al listar archivos de Google Drive: ${message}`);
  }

  const data = await response.json();
  return (data.files || []) as DriveBackupFile[];
};

/**
 * Downloads a backup file's text content from Google Drive
 */
export const downloadBackupContentFromDrive = async (fileId: string): Promise<string> => {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('No hay sesión activa de Google.');
  }

  const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const message = (errorData as { error?: { message?: string } })?.error?.message || response.statusText;
    throw new Error(`Error al descargar de Google Drive: ${message}`);
  }

  return await response.text();
};

/**
 * Deletes a backup file from Google Drive
 */
export const deleteBackupFromDrive = async (fileId: string): Promise<void> => {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('No hay sesión activa de Google.');
  }

  const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok && response.status !== 204) {
    const errorData = await response.json().catch(() => ({}));
    const message = (errorData as { error?: { message?: string } })?.error?.message || response.statusText;
    throw new Error(`Error al eliminar archivo de Google Drive: ${message}`);
  }
};
