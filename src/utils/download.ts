import { Capacitor } from '@capacitor/core';
import { Directory, Encoding, Filesystem } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

function blobToBase64(b: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).split(',')[1] ?? '');
    r.onerror = () => reject(r.error);
    r.readAsDataURL(b);
  });
}

/**
 * Enregistre un fichier pour l'utilisateur. Dans un navigateur : un
 * téléchargement. Dans l'APK (la WebView ne télécharge pas) : le fichier est
 * écrit dans le cache de l'app puis proposé au partage Android (Drive,
 * e-mail, « Enregistrer dans Fichiers »…).
 */
export async function saveFile(filename: string, content: string | Blob, mime: string): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    const res =
      typeof content === 'string'
        ? await Filesystem.writeFile({ path: filename, data: content, directory: Directory.Cache, encoding: Encoding.UTF8 })
        : await Filesystem.writeFile({ path: filename, data: await blobToBase64(content), directory: Directory.Cache });
    await Share.share({ title: filename, files: [res.uri] }).catch(() => {});
    return;
  }
  const blob = typeof content === 'string' ? new Blob([content], { type: mime }) : content;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function downloadTextFile(filename: string, content: string, mime: string) {
  void saveFile(filename, content, mime);
}

export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}
