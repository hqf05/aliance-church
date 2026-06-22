"use client"
import Image from "next/image";
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Typography } from "@mui/material";
import List from '@mui/material/List';
import React from "react";
import ListItemButton from '@mui/material/ListItemButton';
import Checkbox from '@mui/material/Checkbox';
import DeleteIcon from '@mui/icons-material/Delete';

type Hymn = {
  id: number;
  title: string;
  verses: string[];
  chorus?: string[] | null;
  chorusFirst?: boolean;
  formatted: boolean;
  createdAt: string;
};

function buildHymnWithChorus(verses: string[], chorus: string[]) {
  const result: { type: "verse" | "chorus"; lines: string[] }[] = [];
  verses.forEach((line) => {
    result.push({ type: "verse", lines: [line] });
    if (chorus.length > 0) result.push({ type: "chorus", lines: chorus });
  });
  return result;
}

function flattenHymnView(hymnView: { type: "verse" | "chorus"; lines: string[] }[]): string[] {
  const flat: string[] = [];
  hymnView.forEach((block) => {
    block.lines.forEach((line) => {
      flat.push(Array.isArray(line) ? (line as string[]).join("\n") : line);
    });
  });
  return flat;
}

const btnStyle: React.CSSProperties = {
  width: 44, height: 38, borderRadius: 10,
  border: "1px solid rgba(255,255,255,0.25)",
  background: "rgba(0,0,0,0.35)", color: "white", fontSize: 20, cursor: "pointer",
};

export default function Home() {
  const [fontScale, setFontScale] = useState(1);
  const MIN = 0.6; const MAX = 1.8; const STEP = 0.1;
  const zoomIn = () => setFontScale(s => Math.min(MAX, +(s + STEP).toFixed(2)));
  const zoomOut = () => setFontScale(s => Math.max(MIN, +(s - STEP).toFixed(2)));
  const zoomReset = () => setFontScale(1);

  const [showImageOverlay, setShowImageOverlay] = useState(false);
  const [text, setText] = useState<string>("");
  const [hasMore, setHasMore] = useState(false);
  const [showBlackOverlay, setShowBlackOverlay] = useState(false);
  const blackRef = useRef<HTMLDivElement | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [playlist, setPlaylist] = useState<Hymn[]>([]);
  const [activeHymnId, setActiveHymnId] = useState<number | null>(null);
  const [presentTexts, setPresentTexts] = useState<string | null>(null);
  const [nextOffset, setNextOffset] = useState(0);
  const [hymns, setHymns] = useState<Hymn[]>([]);
  const [hymnResults, setHymnResults] = useState<Hymn[]>([]);
  const [q, setQ] = useState("");
  const [selectedHymnId, setSelectedHymnId] = useState<number | null>(null);
  const [presentText, setPresentText] = useState<string | null>(null);
  const [showLyricsOverlay, setShowLyricsOverlay] = useState(false);
  const lyricsOverlayRef = useRef<HTMLDivElement | null>(null);
  const imageOverlayRef = useRef<HTMLDivElement | null>(null);

  // ✅ تتبع السطر الحالي
  const [currentLineIndex, setCurrentLineIndex] = useState<number>(-1);

  const activeHymn = useMemo(() => playlist.find(h => h.id === activeHymnId) ?? null, [playlist, activeHymnId]);
  const hymnView = activeHymn ? buildHymnWithChorus(activeHymn.verses, activeHymn.chorus ?? []) : [];
  const flatLines = useMemo(() => flattenHymnView(hymnView), [hymnView]);

  const selectedHymn = useMemo<Hymn | null>(
    () => hymns.find((h) => h.id === selectedHymnId) ?? null,
    [selectedHymnId, hymns]
  );

  // إعادة تعيين الفهرس عند تغيير الترنيمة
  useEffect(() => { setCurrentLineIndex(-1); }, [activeHymnId]);

  // استقبال تغيير الفهرس من الشاشة الثانية
  useEffect(() => {
    if (typeof window === "undefined" || !window.electronAPI) return;
    window.electronAPI.onLineChanged?.((index: number) => setCurrentLineIndex(index));
    return () => window.electronAPI?.removeAllListeners?.("lineChanged");
  }, []);

  // ✅ دالة العرض - ترسل النص + كل السطور + الفهرس
  const openLyricsOverlay = useCallback(async (lineText: string, lineIndex: number) => {
    setShowImageOverlay(false);
    setShowLyricsOverlay(false);
    setCurrentLineIndex(lineIndex);

    if (typeof window !== "undefined" && window.electronAPI?.presentText) {
      await window.electronAPI.presentText({
        text: lineText,
        lines: flatLines,  // ✅ كل السطور
        index: lineIndex,  // ✅ الفهرس الحالي
      });
      return;
    }
    // Browser fallback
    setPresentText(lineText);
    setShowLyricsOverlay(true);
    setTimeout(() => { lyricsOverlayRef.current?.requestFullscreen().catch(() => {}); }, 0);
  }, [flatLines]);

  // ✅ اختصارات لوحة المفاتيح - ترسل أوامر navigate للشاشة الثانية
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;

      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        if (typeof window !== "undefined" && window.electronAPI?.navigate) {
          // إذا Electron: أرسل أمر navigate للشاشة الثانية
          window.electronAPI.navigate("next");
        } else {
          // Browser fallback: تنقل محلي
          setCurrentLineIndex(prev => {
            const next = Math.min(flatLines.length - 1, prev + 1);
            if (flatLines[next]) openLyricsOverlay(flatLines[next], next);
            return next;
          });
        }
      }

      if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        if (typeof window !== "undefined" && window.electronAPI?.navigate) {
          window.electronAPI.navigate("prev");
        } else {
          setCurrentLineIndex(prev => {
            const next = Math.max(0, prev - 1);
            if (flatLines[next]) openLyricsOverlay(flatLines[next], next);
            return next;
          });
        }
      }

      if (e.key === "+" || e.key === "=") zoomIn();
      if (e.key === "-" || e.key === "_") zoomOut();
      if (e.key.toLowerCase() === "r") zoomReset();
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [flatLines, openLyricsOverlay]);

  async function addToPlaylistById(id: number) {
    const res = await fetch(`/api/hymns/${id}`);
    const raw = await res.text();
    if (!res.ok) return;
    let full = hymns.find(x => x.id === id) ?? null;
    if (!full) {
      const res2 = await fetch(`/api/hymns/${id}`);
      if (!res2.ok) return;
      full = await res2.json();
    }
    if (!full) return;
    setPlaylist(prev => prev.some(p => p.id === full!.id) ? prev : [...prev, full!]);
    setActiveHymnId(full.id);
    setSelectedHymnId(full.id);
  }

  async function loadMore() {
    const res = await fetch(`/api/hymns?q=${encodeURIComponent(q)}&limit=5&offset=${nextOffset}`);
    const data = await res.json();
    setHymnResults(prev => [...prev, ...(data.items ?? [])]);
    setHasMore(Boolean(data.hasMore));
    setNextOffset(Number(data.nextOffset ?? nextOffset));
  }

  async function openBlackScreen() {
    setShowBlackOverlay(true);
    setShowLyricsOverlay(false);
    setShowImageOverlay(false);
    setTimeout(() => { blackRef.current?.requestFullscreen().catch(() => {}); }, 0);
  }

  function toggleSelect(id: number) {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }

  function selectAllPlaylist() { setSelectedIds(playlist.map(h => h.id)); }

  function deleteSelectedFromPlaylist() {
    if (selectedIds.length === 0) return;
    setPlaylist(prev => prev.filter(h => !selectedIds.includes(h.id)));
    if (activeHymnId && selectedIds.includes(activeHymnId)) {
      const remaining = playlist.filter(h => !selectedIds.includes(h.id));
      const next = remaining[0]?.id ?? null;
      setActiveHymnId(next);
      if (!next) { setSelectedHymnId(null); setPresentText(null); setShowLyricsOverlay(false); }
    }
    setSelectedIds([]);
  }

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowBlackOverlay(false);
        if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  useEffect(() => {
    async function fetchHymns() {
      try {
        const res = await fetch("/api/hymns?limit=5&offset=0");
        const data: { items: Hymn[] } = await res.json();
        setHymns(Array.isArray(data.items) ? data.items : []);
      } catch { setHymns([]); }
    }
    fetchHymns();
  }, []);

  async function handleSearch(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value;
    setQ(v);
    if (!v.trim()) { setHymnResults([]); setHasMore(false); setNextOffset(0); return; }
    try {
      const res = await fetch(`/api/hymns?q=${encodeURIComponent(v)}&limit=5&offset=0`);
      const data = await res.json();
      setHymnResults(data.items ?? []);
      setHasMore(Boolean(data.hasMore));
      setNextOffset(Number(data.nextOffset ?? 0));
    } catch { setHymnResults([]); }
  }

  function closeAllOverlays() {
    setShowImageOverlay(false);
    setShowLyricsOverlay(false);
    setPresentText(null);
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
  }

  async function openImageOverlay() {
    setShowLyricsOverlay(false);
    setShowImageOverlay(true);
    setTimeout(() => { imageOverlayRef.current?.requestFullscreen().catch(() => {}); }, 0);
  }

  async function connectToScreen() {
    if (window.electronAPI?.sendToScreen) { window.electronAPI.sendToScreen(text); return; }
    alert("هذي الميزة تشتغل بتطبيق Electron مو بالمتصفح");
  }

  useEffect(() => {
    const onFsChange = () => {
      if (!document.fullscreenElement && presentText) setPresentText(null);
    };
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, [presentText]);

  return (
    <div>
      <div className="flex justify-center items-center">
        <Image src="/logo_transparent.png" alt="aliance church" width={100} height={100} />
      </div>
      <div className="flex justify-center items-center">
        <h1>كنيسة الاتحاد المسيحي - بغداد</h1>
      </div>

      <Stack spacing={2} direction="row" sx={{ display: "flex", justifyContent: "center", margin: "20px" }}>
        <Button onClick={openBlackScreen} color="error" size="large" variant="contained">شاشة سوداء</Button>
        <Button onClick={connectToScreen} color="error" size="large" variant="contained">ربط الشاشة</Button>
        <Button onClick={openImageOverlay} color="error" size="large" variant="outlined">شاشة خلفية</Button>
      </Stack>

      {/* ✅ شرح الاختصارات + عداد السطر */}
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", mb: 1, gap: 3 }}>
        <Typography variant="caption" sx={{ opacity: 0.55 }}>
          ← → للتنقل بين السطور على شاشة العرض
        </Typography>
        {currentLineIndex >= 0 && flatLines.length > 0 && (
          <Typography variant="caption" sx={{ fontWeight: 700, color: "primary.main" }}>
            {currentLineIndex + 1} / {flatLines.length}
          </Typography>
        )}
      </Box>

      <Box component="form"
        sx={{ '& > :not(style)': { m: 1, maxWidth: 400, mt: 3, height: "auto" }, display: "flex", justifyContent: "center", alignSelf: "flex-start" }}
        noValidate autoComplete="off"
      >
        <TextField fullWidth value={q} onChange={handleSearch} label="ابحث هنا" variant="standard" />
        {q.trim() && <Typography sx={{ mt: 2, opacity: 0.7 }}>ماكو نتائج… جرّب كلمة ثانية</Typography>}
        {(hymnResults?.length ?? 0) > 0 && <Box sx={{ mt: 2 }}><Typography fontWeight={700}>الترانيم:</Typography></Box>}
        <Box sx={{ display: "flex", gap: 2, mt: 3, height: "70vh" }}>
          <List>
            {hymnResults.map(h => (
              <ListItemButton key={h.id} onClick={() => { setHymnResults([]); setQ(""); addToPlaylistById(h.id); }}>
                <Typography>{h.title}</Typography>
              </ListItemButton>
            ))}
          </List>
        </Box>
      </Box>

      {hasMore && (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 1, marginLeft: "750px" }}>
          <Button variant="text" size="medium" color="error" onClick={loadMore} sx={{ textTransform: "none" }}>
            إظهار المزيد من النتائج
          </Button>
        </Box>
      )}

      <Box sx={{ display: "flex", gap: 3, mt: 3, alignItems: "flex-start" }}>
        {/* كلمات الترنيمة */}
        <Box sx={{ flex: 3, border: "1px solid rgba(0,0,0,0.1)", borderRadius: 2, p: 2, minHeight: 200 }}>
          {hymnView.map((block, i) => (
            <Box key={i} sx={{ mb: 2 }}>
              {block.lines.map((line, j) => {
                const globalIndex = hymnView.slice(0, i).reduce((acc, b) => acc + b.lines.length, 0) + j;
                const isActive = globalIndex === currentLineIndex;
                return (
                  <ListItemButton
                    key={j}
                    onClick={() => openLyricsOverlay(Array.isArray(line) ? line.join("\n") : line, globalIndex)}
                    sx={{
                      backgroundColor: isActive ? "rgba(25, 118, 210, 0.15)" : "transparent",
                      borderRadius: 1,
                      border: isActive ? "1px solid rgba(25, 118, 210, 0.4)" : "1px solid transparent",
                    }}
                  >
                    <Typography sx={{
                      fontSize: { xs: `${28 * fontScale}px`, md: `${28 * fontScale}px` },
                      fontWeight: block.type === "chorus" ? "bold" : "normal",
                      color: block.type === "chorus" ? "primary.main" : "text.primary",
                      textAlign: "right", width: "100%",
                    }}>
                      {line}
                    </Typography>
                  </ListItemButton>
                );
              })}
            </Box>
          ))}
        </Box>

        {/* قائمة الترانيم */}
        <Box sx={{ flex: 1, border: "1px solid rgba(0,0,0,0.1)", borderRadius: 2, p: 2, minHeight: 200 }}>
          <Typography fontWeight={700} mb={1}>اختر ترنيمة</Typography>
          <Box sx={{ display: "flex", gap: 1, mb: 1 }}>
            <Checkbox onClick={selectAllPlaylist} />
            <DeleteIcon color="error" sx={{ cursor: "pointer" }} onClick={deleteSelectedFromPlaylist} />
          </Box>
          <List dense>
            {playlist.map((h, index) => {
              const checked = selectedIds.includes(h.id);
              return (
                <ListItemButton key={h.id} selected={h.id === activeHymnId}
                  onClick={() => { setActiveHymnId(h.id); setSelectedHymnId(h.id); }}
                  sx={{ display: "flex", gap: 1 }}
                >
                  <Checkbox checked={checked} onClick={e => { e.stopPropagation(); toggleSelect(h.id); }} />
                  <Typography sx={{ fontSize: 14 }}>{index + 1}. {h.title}</Typography>
                </ListItemButton>
              );
            })}
          </List>
        </Box>
      </Box>

      {/* شاشة خلفية */}
      {showImageOverlay && !showLyricsOverlay && (
        <Box ref={imageOverlayRef} sx={{ position: "fixed", inset: 0, zIndex: 9999 }} onDoubleClick={closeAllOverlays}>
          <Box sx={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)" }} />
          <Box sx={{ position: "relative", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Box sx={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 0.5 }}>
              <Box component="img" src="/aliance.png" sx={{ width: 500, opacity: 0.9 }} />
              <Typography sx={{ color: "white", fontSize: { xs: 18, md: 100 }, fontWeight: 600, textAlign: "center", textShadow: "0 2px 10px rgba(0,0,0,0.7)" }}>
                كنيسة الاتحاد المسيحي – بغداد
              </Typography>
            </Box>
          </Box>
        </Box>
      )}

      {/* Browser fallback كلمات */}
      {showLyricsOverlay && presentText && (
        <Box ref={lyricsOverlayRef} onDoubleClick={closeAllOverlays} sx={{ position: "fixed", inset: 0, zIndex: 10000, overflow: "hidden" }}>
          <Box sx={{ position: "absolute", inset: 0, backgroundImage: "url('/church1.jpeg')", backgroundSize: "cover", backgroundPosition: "center", zIndex: 0 }} />
          <Box sx={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(2px)", zIndex: 1 }} />
          <Box sx={{ position: "relative", zIndex: 2, height: "100%", display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", p: 6, color: "white" }}>
            <Box sx={{ maxWidth: "90%" }}>
              <Typography dir="rtl" sx={{ fontSize: { xs: 28, md: 150 }, fontWeight: 900, lineHeight: 1.5, textAlign: "center", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                {presentText}
              </Typography>
            </Box>
          </Box>
        </Box>
      )}

      {/* أزرار الخط */}
      <Box sx={{ position: "absolute", top: 20, right: 20, zIndex: 5, display: "flex", gap: 1, background: "rgba(0,0,0,0.35)", borderRadius: 2, p: 1, backdropFilter: "blur(4px)" }}>
        <button onClick={() => window.electronAPI?.changeFont?.(+8)} style={btnStyle}>−</button>
        <button onClick={() => window.electronAPI?.changeFont?.(-8)} style={btnStyle}>⟲</button>
        <button onClick={() => window.electronAPI?.resetFont?.()} style={btnStyle}>+</button>
      </Box>

      {/* شاشة سوداء */}
      {showBlackOverlay && (
        <Box ref={blackRef}
          onDoubleClick={() => { setShowBlackOverlay(false); if (document.fullscreenElement) document.exitFullscreen().catch(() => {}); }}
          sx={{ position: "fixed", inset: 0, zIndex: 10000, backgroundColor: "black", cursor: "default" }}
        />
      )}
    </div>
  );
}
