import { contextBridge, ipcRenderer } from "electron";

const validChannels = ["message"];
contextBridge.exposeInMainWorld("electron", {
  invoke: (channel: string, ...args: unknown[]) =>
    validChannels.includes(channel)
      ? ipcRenderer.invoke(channel, ...args)
      : Promise.reject(new Error(`Blocked channel: ${channel}`)),
});
