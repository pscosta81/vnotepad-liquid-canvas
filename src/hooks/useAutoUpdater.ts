import { useEffect, useState } from "react";
import { toast } from "sonner";

export type UpdateStatus = "idle" | "checking" | "downloading" | "ready" | "error";

/**
 * Listens for auto-update events sent from the Electron main process
 * and shows non-intrusive toast notifications to the user.
 */
const useAutoUpdater = () => {
  const [status, setStatus] = useState<UpdateStatus>("idle");

  useEffect(() => {
    // Only works inside Electron (has ipcRenderer via preload)
    const ipc = (window as any).electron;
    if (!ipc) return;

    const onCheckingForUpdate = () => {
      setStatus("checking");
    };

    const onUpdateAvailable = (_event: any, version: string) => {
      setStatus("downloading");
      toast.info(`🔄 Nova versão v${version} disponível! Baixando em segundo plano...`, {
        duration: 6000,
      });
    };

    const onUpdateNotAvailable = () => {
      setStatus("idle");
    };

    const onUpdateError = () => {
      setStatus("error");
      setTimeout(() => setStatus("idle"), 5000);
    };

    const onUpdateDownloaded = () => {
      setStatus("ready");
      toast(`✅ Atualização baixada!`, {
        description: "Feche e reabra o VnotePad para instalar a nova versão.",
        duration: Infinity,
        action: {
          label: "Instalar Agora",
          onClick: () => ipc.invoke("install-update"),
        },
      });
    };

    ipc.on("checking-for-update", onCheckingForUpdate);
    ipc.on("update-available", onUpdateAvailable);
    ipc.on("update-not-available", onUpdateNotAvailable);
    ipc.on("update-error", onUpdateError);
    ipc.on("update-downloaded", onUpdateDownloaded);

    return () => {
      ipc.removeListener?.("checking-for-update", onCheckingForUpdate);
      ipc.removeListener?.("update-available", onUpdateAvailable);
      ipc.removeListener?.("update-not-available", onUpdateNotAvailable);
      ipc.removeListener?.("update-error", onUpdateError);
      ipc.removeListener?.("update-downloaded", onUpdateDownloaded);
    };
  }, []);

  return status;
};

export default useAutoUpdater;
