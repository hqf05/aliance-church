export {};

declare global {
  interface Window {
    electronAPI?: {
      sendToScreen: (text: string) => void;
      onPresentText: (callback: (text: string) => void) => void;
      presentText: (payload: { text: string }) => Promise<void>;

      // إذا عندك أسود/تشغيل لاحقاً:
      setBlack?: (isBlack: boolean) => void;
      onBlack: (callback: (isBlack: boolean) => void) => void;
    };
  }
}