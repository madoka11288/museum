import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
  signOut,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { BeautyItem } from '../types/museum';

// Ensure Firebase is initialized only once
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

export const SCOPES = ['https://www.googleapis.com/auth/drive.file'];

const provider = new GoogleAuthProvider();
SCOPES.forEach((scope) => provider.addScope(scope));

// In-memory access token cache (NEVER store in localStorage or sessionStorage)
let cachedAccessToken: string | null = null;
let isSigningIn = false;

export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        // Attempt silent re-auth or prompt
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Google Driveの認証トークン取得に失敗しました');
    }

    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Google Sign In error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const logout = async () => {
  await signOut(auth);
  cachedAccessToken = null;
};

const DRIVE_FILE_NAME = 'museum_of_beauty_vault.json';

interface DriveFileRecord {
  id: string;
  name: string;
  modifiedTime?: string;
}

// Search for the existing vault file on user's Google Drive
async function findVaultFileId(accessToken: string): Promise<string | null> {
  const query = encodeURIComponent(`name = '${DRIVE_FILE_NAME}' and trashed = false`);
  const url = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,modifiedTime)&spaces=drive`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    const errText = await res.text();
    console.error('Drive query error:', res.status, errText);
    return null;
  }
  const data = await res.json();
  const files: DriveFileRecord[] = data.files || [];
  return files.length > 0 ? files[0].id : null;
}

// Load beauty items from Google Drive
export async function loadMuseumFromDrive(): Promise<{ items: BeautyItem[]; lastSynced: string } | null> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('Google Driveにログインしていません');
  }

  const fileId = await findVaultFileId(token);
  if (!fileId) {
    // File does not exist yet on Drive
    return null;
  }

  const downloadUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
  const res = await fetch(downloadUrl, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    throw new Error(`Google Driveからのデータ読み込みに失敗しました (${res.status})`);
  }

  const data = await res.json();
  return {
    items: data.items || [],
    lastSynced: data.updatedAt || new Date().toISOString(),
  };
}

// Save or sync museum items to private Google Drive
export async function saveMuseumToDrive(items: BeautyItem[]): Promise<{ fileId: string; updatedAt: string }> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('Google Driveにログインしていません');
  }

  const payload = {
    appName: "Museum of Fleeting Beauty",
    description: "Personal Private Vault for Preserved Beautiful Moments",
    updatedAt: new Date().toISOString(),
    totalItems: items.length,
    items,
  };

  const fileId = await findVaultFileId(token);
  const updatedAt = payload.updatedAt;

  if (fileId) {
    // Update existing file content
    const uploadUrl = `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`;
    const res = await fetch(uploadUrl, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload, null, 2),
    });

    if (!res.ok) {
      throw new Error(`Google Driveの更新に失敗しました (${res.status})`);
    }

    return { fileId, updatedAt };
  } else {
    // Create new file with multipart body
    const boundary = '-------314159265358979323846';
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;

    const metadata = {
      name: DRIVE_FILE_NAME,
      mimeType: 'application/json',
      description: '今日見つけた美しいもの美術館 - あなただけの個人収蔵庫',
    };

    const multipartRequestBody =
      delimiter +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      JSON.stringify(metadata) +
      delimiter +
      'Content-Type: application/json\r\n\r\n' +
      JSON.stringify(payload, null, 2) +
      closeDelimiter;

    const createUrl = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';
    const res = await fetch(createUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: multipartRequestBody,
    });

    if (!res.ok) {
      throw new Error(`Google Driveへの新規保管ファイルの作成に失敗しました (${res.status})`);
    }

    const createdData = await res.json();
    return { fileId: createdData.id, updatedAt };
  }
}
