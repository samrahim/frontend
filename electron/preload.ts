import { contextBridge } from "electron";

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld("electron", {
  invoke: (channel: string, ...args: any[]) => {
    // Restrict the channels
    const validChannels = ["message"];
    if (validChannels.includes(channel)) {
      // ipcMain.invoke implementation would go here
    }
  },
});
