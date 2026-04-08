import { useEffect } from "react";
import { toast } from "sonner";

/**
 * Listens for auto-update events sent from the Electron main process
 * and shows non-intrusive toast notifications to the user.
 */
const useAutoUpdater = () => {
  useEffect(() => {
    // Only works inside Electron (has ipcRenderer via preload)
    const ipc = (window as any).electron;
    if (!ipc) return;

    const onUpdateAvailable = (_event: any, version: string) => {
      toast.info(`🔄 Nova versão v${version} disponível! Baixando em segundo plano...`, {
        duration: 6000,
      });
    };

    const onUpdateDownloaded = () => {
      toast(`✅ Atualização baixada!`, {
        description: "Feche e reabra o VnotePad para instalar a nova versão.",
        duration: Infinity,
        action: {
          label: "Instalar Agora",
          onClick: () => ipc.invoke("install-update"),
        },
      });
    };

    ipc.on("update-available", onUpdateAvailable);
    ipc.on("update-downloaded", onUpdateDownloaded);

    return () => {
      ipc.removeListener?.("update-available", onUpdateAvailable);
      ipc.removeListener?.("update-downloaded", onUpdateDownloaded);
    };
  }, []);
};

export default useAutoUpdater;
