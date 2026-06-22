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
      openScreenWindow: () => Promise<void>;
      closeScreenWindow: () => Promise<void>;
      presentText: (payload: {
        text: string;
        lines?: string[];
        index?: number;
      }) => Promise<void>;
      sendToScreen: (text: string) => void;
      navigate: (direction: "next" | "prev") => Promise<void>;
      notifyLineChanged: (index: number) => void;
      showIdle: () => Promise<void>;
      setBlack: (isBlack: boolean) => Promise<void>;
      changeFont: (delta: number) => void;
      resetFont: () => void;
      onPresentText: (cb: (text: string) => void) => void;
      onLoadLines: (cb: (data: { lines: string[]; index: number }) => void) => void;
      onNavigate: (cb: (dir: "next" | "prev") => void) => void;
      onBlack: (cb: (isBlack: boolean) => void) => void;
      onFont: (cb: (delta: number) => void) => void;
      onResetFont: (cb: () => void) => void;
      onShowIdle: (cb: () => void) => void;
      onLineChanged: (cb: (index: number) => void) => void;
      removeAllListeners: (channel: string) => void;
      getHymns: () => Promise<Hymn[]>;
    };
  }
}
