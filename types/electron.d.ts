// types/electron.d.ts
export {};

type Hymn = {
  id: number;
  title: string;
  verses: string[];
  chorus?: string[] | null;
  chorusFirst?: boolean;
  formatted: boolean;
  createdAt: string;
};

declare global {
  interface Window {
    electronAPI?: {
      // شاشة العرض
      openScreenWindow: () => Promise<void>;
      closeScreenWindow: () => Promise<void>;

      // إرسال نص
      presentText: (payload: { text: string }) => Promise<void>;
      sendToScreen: (text: string) => void;

      // شاشة الشعار
      showIdle: () => Promise<void>;

      // الشاشة السوداء
      setBlack: (isBlack: boolean) => Promise<void>;

      // الخط
      changeFont: (delta: number) => void;
      resetFont: () => void;

      // استقبال أحداث
      onPresentText: (cb: (text: string) => void) => void;
      onBlack: (cb: (isBlack: boolean) => void) => void;
      onFont: (cb: (delta: number) => void) => void;
      onResetFont: (cb: () => void) => void;
      onShowIdle: (cb: () => void) => void;

      // تنظيف
      removeAllListeners: (channel: string) => void;

      // ترانيم
      getHymns: () => Promise<Hymn[]>;
    };
  }
}
