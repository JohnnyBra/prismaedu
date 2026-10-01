import React, { useEffect, useRef, useState } from 'react';
import { AlertTriangle, Database, Download, RefreshCw, Upload } from 'lucide-react';
import { BackupData, BackupInfo } from '../context/DataContext';

interface BackupManagerProps {
  createBackup: () => Promise<{ filename: string; generatedAt: string; data: BackupData }>;
  listBackups: () => Promise<BackupInfo[]>;
  restoreBackup: (payload: { filename: string } | { data: BackupData }) => Promise<void>;
}

type PendingRestore =
  | { type: 'stored'; filename: string }
  | { type: 'external'; data: BackupData; generatedAt: string };

const REQUIRED_COLLECTIONS = ['users', 'classes', 'tasks', 'rewards', 'completions', 'messages', 'redemptions'];

const isValidFullBackup = (data: any): data is BackupData => {
  if (!data || typeof data !== 'object') return false;
  return REQUIRED_COLLECTIONS.every(key => Array.isArray(data[key]));
};

const formatBytes = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const downloadJson = (data: unknown, filename: string) => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

const BackupManager: React.FC<BackupManagerProps> = ({ createBackup, listBackups, restoreBackup }) => {
  const [backups, setBackups] = useState<BackupInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [pendingRestore, setPendingRestore] = useState<PendingRestore | null>(null);
  const [restoring, setRestoring] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const refreshBackups = () => {
    setLoading(true);
    listBackups()
      .then(setBackups)
      .catch((err) => alert(`No se pudo obtener la lista de copias: ${err}`))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    refreshBackups();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreateBackup = async () => {
    setCreating(true);
    try {
      const result = await createBackup();
      downloadJson(result.data, `prisma-backup-completo-${Date.now()}.json`);
      refreshBackups();
    } catch (err) {
      alert(`No se pudo crear la copia de seguridad: ${err}`);
    } finally {
      setCreating(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      let parsed: any;
      try {
        parsed = JSON.parse(ev.target?.result as string);
      } catch {
        alert('No se ha podido leer el fichero. Asegúrate de que es un JSON de copia de seguridad válido.');
        return;
      }
      if (!isValidFullBackup(parsed)) {
        alert('El fichero no tiene el formato de una copia de seguridad completa válida.');
        return;
      }
      setPendingRestore({ type: 'external', data: parsed, generatedAt: parsed.generatedAt || 'fecha desconocida' });
    };
    reader.readAsText(file);
  };

  const confirmRestore = async () => {
    if (!pendingRestore) return;
    setRestoring(true);
    try {
      // Safety net: back up the current state before overwriting it.
      const current = await createBackup();
      downloadJson(current.data, `prisma-backup-pre-restauracion-${Date.now()}.json`);

      if (pendingRestore.type === 'stored') {
        await restoreBackup({ filename: pendingRestore.filename });
      } else {
        await restoreBackup({ data: pendingRestore.data });
      }

      alert('Restauración completada correctamente.');
      setPendingRestore(null);
      refreshBackups();
    } catch (err) {
      alert(`No se pudo restaurar la copia de seguridad: ${err}`);
    } finally {
      setRestoring(false);
    }
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex justify-between items-center flex-wrap gap-2">
        <h2 className="text-xl font-display font-bold text-white/90 flex items-center gap-2">
          <Database size={20} /> Copias de Seguridad del Sistema
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="btn-ghost flex items-center gap-2 text-sm"
          >
            <Upload size={18} /> Restaurar desde archivo externo
          </button>
          <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".json" className="hidden" />
          <button
            onClick={handleCreateBackup}
            disabled={creating}
            className="btn-primary flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Download size={18} /> {creating ? 'Creando...' : 'Crear Copia de Seguridad'}
          </button>
        </div>
      </div>

      <p className="text-xs text-white/40 font-body">
        Incluye usuarios, clases, tareas, recompensas, completados, mensajes y canjes. Cada copia se guarda en el servidor y se descarga automáticamente a este equipo.
      </p>

      <div className="glass rounded-2xl shadow-glass overflow-hidden">
        <div className="px-4 py-3 border-b border-white/10 glass-light flex justify-between items-center">
          <h3 className="font-display font-bold text-white/80">Copias Almacenadas en el Servidor</h3>
          <button onClick={refreshBackups} className="text-white/30 hover:text-white/60 transition-colors" title="Actualizar lista">
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
        <div className="divide-y divide-white/5">
          {!loading && backups.length === 0 && (
            <p className="p-8 text-center text-white/30 font-body">No hay copias de seguridad almacenadas todavía.</p>
          )}
          {backups.map(b => (
            <div key={b.filename} className="p-4 flex items-center justify-between">
              <div>
                <p className="font-bold text-white/90 font-body text-sm">{b.filename}</p>
                <p className="text-xs text-white/40">{new Date(b.createdAt).toLocaleString('es-ES')} · {formatBytes(b.size)}</p>
              </div>
              <button
                onClick={() => setPendingRestore({ type: 'stored', filename: b.filename })}
                className="btn-ghost text-sm"
              >
                Restaurar
              </button>
            </div>
          ))}
        </div>
      </div>

      {pendingRestore && (
        <div className="fixed inset-0 modal-overlay z-50 flex items-center justify-center p-4" onClick={() => !restoring && setPendingRestore(null)}>
          <div className="glass-strong rounded-3xl p-6 w-full max-w-md shadow-glass-lg modal-content" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-display font-bold text-white/90 mb-4 flex items-center gap-2">
              <AlertTriangle size={20} className="text-red-400" /> Restaurar Base de Datos
            </h3>
            <p className="text-sm text-white/70 font-body mb-2">
              {pendingRestore.type === 'stored'
                ? <>Copia almacenada: <span className="font-bold text-white/90">{pendingRestore.filename}</span></>
                : <>Copia generada el: <span className="font-bold text-white/90">{pendingRestore.generatedAt}</span></>}
            </p>
            <p className="text-sm text-white/70 font-body mb-4">
              Esto reemplazará TODOS los datos del sistema (usuarios, clases, tareas, recompensas, completados, mensajes y canjes) por los de esta copia. Antes de aplicarlo se descargará automáticamente una copia del estado actual, por si hace falta deshacerlo.
            </p>
            <p className="text-xs text-red-400/80 font-body mb-6 font-bold">
              Esta acción no se puede deshacer desde la aplicación.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setPendingRestore(null)} disabled={restoring} className="btn-ghost flex-1 disabled:opacity-40">Cancelar</button>
              <button onClick={confirmRestore} disabled={restoring} className="btn-danger flex-1 disabled:opacity-40">
                {restoring ? 'Restaurando...' : 'Confirmar Restauración'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BackupManager;
