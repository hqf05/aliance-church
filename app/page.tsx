"use client"
import Image from "next/image";
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import { useEffect, useMemo, useRef, useState } from "react";
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
type ScreenInfo = {
  isPrimary: boolean;
  availLeft: number;
  availTop: number;
  availWidth: number;
  availHeight: number;
};

// نضيف getScreens للـ window (لأنها API تجريبية)
declare global {
  interface Window {
    getScreens?: () => Promise<ScreenInfo[]>;
  }
}
function buildHymnWithChorus(
  verses: string[],
  chorus: string[]
) {
  const result: { type: "verse" | "chorus"; lines: string[] }[] = [];

  verses.forEach((line) => {
    // كل سطر نعتبره مقطع
    result.push({
      type: "verse",
      lines: [line],
    });

    if (chorus.length > 0) {
      result.push({
        type: "chorus",
        lines: chorus,
      });
    }
  });

  return result;
}
export default function Home() {
  const [searchOffset, setSearchOffset] = useState(0);
const [hasMore, setHasMore] = useState(false);
  const [showBlackOverlay, setShowBlackOverlay] = useState(false);
  const blackRef = useRef<HTMLDivElement | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [playlist, setPlaylist] = useState<Hymn[]>([]);
const [activeHymnId, setActiveHymnId] = useState<number | null>(null);
  const [presentTexts, setPresentTexts] = useState<string | null>(null);
  const [nextOffset, setNextOffset] = useState(0);
const overlayRefs = useRef<HTMLDivElement | null>(null);
  const BIBLE_ID = process.env.BIBLEID!;
  const [hymns, setHymns] = useState<Hymn[]>([]);
  const [hymnResults, setHymnResults] = useState<Hymn[]>([]);
  async function loadMore() {
    const res = await fetch(`/api/hymns?q=${encodeURIComponent(q)}&limit=5&offset=${nextOffset}`);
    const data = await res.json();
  
    setHymnResults(prev => [...prev, ...(data.items ?? [])]);
    setHasMore(Boolean(data.hasMore));
    setNextOffset(Number(data.nextOffset ?? nextOffset));
  }
  async function runSearch(query: string, offset = 0, append = false) {
    try {
      const res = await fetch(
        `/api/hymns?q=${encodeURIComponent(query)}&limit=5&offset=${offset}`
      );
  
      const data = await res.json();
      const items = Array.isArray(data.items) ? data.items : [];
      // إذا API رجّع error
      if (!res.ok || !data || !Array.isArray(data.items)) {
        setHymnResults([]);
        setHasMore(false);
        setSearchOffset(0);
        return;
      }
  
      setHasMore(Boolean(data.hasMore));
      setSearchOffset(Number(data.nextOffset ?? 0));
  
      setHymnResults(prev => append ? [...prev, ...items] : items);
    } catch (e) {
      console.error(e);
      setHymnResults([]);
      setHasMore(false);
      setSearchOffset(0);
    }
  }
  
  async function openBlackScreen() {
    setShowBlackOverlay(true);
    setShowLyricsOverlay(false); // إذا تريد تطفي الكلمات
    setShowImageOverlay(false);  // إذا تريد تطفي الخلفية
  
    // نخليه فول سكرين على نفس الديف (أفضل)
    setTimeout(() => {
      blackRef.current?.requestFullscreen().catch(() => {});
    }, 0);
  }
  function toggleSelect(id: number) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }
  function selectAllPlaylist() {
    setSelectedIds(playlist.map((h) => h.id));
  }
 
  function deleteSelectedFromPlaylist() {
    if (selectedIds.length === 0) return;
  
    setPlaylist((prev) => prev.filter((h) => !selectedIds.includes(h.id)));
  
    // إذا الترنيمة الحالية انحذفت → اختار غيرها أو طفي العرض
    if (activeHymnId && selectedIds.includes(activeHymnId)) {
      const remaining = playlist.filter((h) => !selectedIds.includes(h.id));
      const next = remaining[0]?.id ?? null;
      setActiveHymnId(next);
      // إذا ماكو بقى شي:
      if (!next) {
        setSelectedHymnId(null);
        setPresentText(null);
        setShowLyricsOverlay(false);
      }
    }
  
    setSelectedIds([]);
  }
  function splitVersesAndChorus(
    verses?: string[],
    formatted?: boolean
  ) {
    if (!Array.isArray(verses)) {
      return { verses: [], chorus: [] };
    }
  
    if (!formatted) {
      // 🔴 الترنيمة مو مفورمَتة = ماكو قرار
      return {
        verses,
        chorus: [],
      };
    }
  
    // هنا فقط نحاول نطلع القرار
    const chorusIndex = verses.findIndex(v =>
      typeof v === "string" &&
      (
        v.includes("القرار") ||
        v.includes("لازمة") ||
        v.includes("Refrain")
      )
    );
  
    if (chorusIndex === -1) {
      return { verses, chorus: [] };
    }
  
    return {
      verses: verses.slice(0, chorusIndex),
      chorus: verses.slice(chorusIndex + 1),
    };
  }
function addToPlaylist(hymn: Hymn) {
  setPlaylist((prev) => {
    if (prev.find((h) => h.id === hymn.id)) return prev; // منع التكرار
    return [...prev, hymn];
  });

  setActiveHymnId(hymn.id);
}
useEffect(() => {
  const handleKey = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      setShowBlackOverlay(false);

      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
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
    } catch (err) {
      console.error("Fetch hymns failed", err);
      setHymns([]);

    }
  }

  fetchHymns();
}, []);
async function handleSearch(e: React.ChangeEvent<HTMLInputElement>) {
  const v = e.target.value;
  setQ(v);

  if (!v.trim()) {
    setHymnResults([]);
    setHasMore(false);
    setSearchOffset(0);
    return;
  }
  runSearch(v, 0, false);
  try {
    const res = await fetch(`/api/hymns?q=${encodeURIComponent(v)}&limit=5&offset=0`);
    const raw = await res.text(); // 👈 اقرأ كنص أولاً
    console.log("API /api/hymns status:", res.status);
    console.log("API /api/hymns raw:", raw);

    if (!res.ok) {
      // إذا السيرفر رجّع خطأ، نعرضه واضح
      throw new Error(raw || `Request failed: ${res.status}`);
    }

    if (!raw) {
      // إذا رجّع فاضي
      setHymnResults([]);
      return;
    }

    const data = JSON.parse(raw);
    setHymnResults(data.items ?? []);
    setHasMore(Boolean(data.hasMore));
    setNextOffset(Number(data.nextOffset ?? 0));
  
  } catch (err) {
    console.error("handleSearch error:", err);
    setHymnResults([]);
  }
}
function exitPresentations() {
  setPresentTexts(null);
  if (document.fullscreenElement) {
    document.exitFullscreen().catch(() => {});
  }
}
useEffect(() => {
  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      exitPresentations();
    }
  };

  window.addEventListener("keydown", onKeyDown);
  return () => window.removeEventListener("keydown", onKeyDown);
}, []);
function exitPresentation() {
  setPresentText(null);
  if (document.fullscreenElement) {
    document.exitFullscreen().catch(() => {});
  }
}
const activeHymn = useMemo(() => {
  return playlist.find(h => h.id === activeHymnId) ?? null;
}, [playlist, activeHymnId]);
  const [showImageOverlay, setShowImageOverlay] = useState(false);
const [showLyricsOverlay, setShowLyricsOverlay] = useState(false);
const lyricsOverlayRef = useRef<HTMLDivElement | null>(null);
const imageOverlayRef = useRef<HTMLDivElement | null>(null);
async function openImageOverlay() {
  setShowLyricsOverlay(false); // طفي الكلمات
  setShowImageOverlay(true);

  setTimeout(() => {
    imageOverlayRef.current?.requestFullscreen().catch(() => {});
  }, 0);
}

async function openLyricsOverlay(text: string) {
  setShowImageOverlay(false); // طفي الخلفية
  setShowLyricsOverlay(true);
  setPresentText(text);

  setTimeout(() => {
    lyricsOverlayRef.current?.requestFullscreen().catch(() => {});
  }, 0);
}
function closeAllOverlays() {
  setShowImageOverlay(false);
  setShowLyricsOverlay(false);
  setPresentText(null);

  if (document.fullscreenElement) {
    document.exitFullscreen().catch(() => {});
  }
}
async function connectToScreen(): Promise<void> {
  if (!window.getScreens) {
    alert("المتصفح لا يدعم اختيار الشاشات (جرّب Chrome)");
    return;
  }

  try {
    const screens = await window.getScreens();

    const externalScreen = screens.find(
      (screen) => !screen.isPrimary
    );

    if (!externalScreen) {
      alert("ماكو شاشة ثانية (HDMI)");
      return;
    }

    const win = window.open(
      "/screen",
      "_blank",
      `
      left=${externalScreen.availLeft},
      top=${externalScreen.availTop},
      width=${externalScreen.availWidth},
      height=${externalScreen.availHeight}
      `
    );

    if (!win) {
      alert("الرجاء السماح بفتح النوافذ المنبثقة");
      return;
    }

    setTimeout(() => {
      win.moveTo(
        externalScreen.availLeft,
        externalScreen.availTop
      );
      win.resizeTo(
        externalScreen.availWidth,
        externalScreen.availHeight
      );
    }, 300);

  } catch (err) {
    console.error(err);
    alert("فشل الاتصال بالشاشة");
  }
}
  const [q, setQ] = useState("");
  const [selectedHymnId, setSelectedHymnId] = useState<number | null>(null);
  // النص اللي راح ينعرض فول سكرين
  const [presentText, setPresentText] = useState<string | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const selectedHymn = useMemo<Hymn | null>(() => {
    return hymns.find((h) => h.id === selectedHymnId) ?? null;
  }, [selectedHymnId, hymns]);  
  const hymnView = activeHymn
  ? buildHymnWithChorus(
      activeHymn.verses,
      activeHymn.chorus ?? []
    )
  : [];
useEffect(() => {
  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      closeAllOverlays();
    }
  };
  window.addEventListener("keydown", onKeyDown);
  return () => window.removeEventListener("keydown", onKeyDown);
}, []);
 // إذا المستخدم ضغط ESC وطلع من fullscreen من المتصفح نفسه
 useEffect(() => {
  const onFsChange = () => {
    // إذا طلع من fullscreen وهو بوضع العرض، نخلي الوضع ينسد
    if (!document.fullscreenElement && presentText) {
      setPresentText(null);
    }
  };
  document.addEventListener("fullscreenchange", onFsChange);
  return () => document.removeEventListener("fullscreenchange", onFsChange);
}, [presentText]);
const hymnLines: string[] = [];

if (selectedHymn?.chorus?.length) {
  hymnLines.push("— القرار —");
  hymnLines.push(...selectedHymn.chorus);
}
console.log("CHORUS:", selectedHymn?.chorus);
console.log(selectedHymn);
console.log(
  selectedHymn?.title,
  selectedHymn?.chorus
);
const hymnParts = selectedHymn
  ? splitVersesAndChorus(
      selectedHymn.verses,
      selectedHymn.formatted
    )
  : { verses: [], chorus: [] };
  
  return (
    <div>
    <div className="flex justify-center items-center " >
      <Image src="/logo_transparent.png" alt="aliance church " width={100} height={100} />
      
    </div>
    <div className="flex justify-center items-center " >
      <h1>كنيسة الاتحاد المسيحي - بغداد </h1>
        
    </div>
    
    <Stack    spacing={2} direction="row" sx={{display:"flex" , justifyContent:"center", margin:"20px" ,  }}>
    <Button
  onClick={openBlackScreen}
  color="error"
  size="large"
  variant="contained"
>
  شاشة سوداء
</Button>
      <Button onClick={connectToScreen}   color="error" size="large" variant="contained">ربط الشاشة </Button>
      
      <Button onClick={openImageOverlay} color="error" size="large"  variant="outlined">شاشة خلفية </Button>
      

    </Stack>
    
    <Box
      component="form"
      sx={{ '& > :not(style)': { m: 1, maxWidth:400, mt:3 ,  height:"auto" } , display:"flex" , justifyContent:"center" , alignSelf:"flex-start" }}
      noValidate
      autoComplete="off"
    >
      
    <TextField
    fullWidth
  value={q}
  onChange={handleSearch}
  label="ابحث هنا"
  variant="standard"/>

{q.trim() &&  (
  <Typography sx={{ mt: 2, opacity: 0.7 }}>
    ماكو نتائج… جرّب كلمة ثانية
  </Typography>
)}

{(hymnResults?.length ?? 0) > 0 && (
  <Box sx={{ mt: 2 }}>
    <Typography fontWeight={700}>الترانيم:</Typography>
  </Box>
)}

<Box
  sx={{
    display: "flex",
    gap: 2,
    mt: 3,
    height: "70vh",
  }}
>

<List>
      {hymnResults.map(h => (
        <ListItemButton
          key={h.id}
          onClick={() => {setSelectedHymnId(h.id);
            setHymnResults([]);
            setQ("");  
            addToPlaylist(h);
          }}
        >
          <Typography>{h.title}</Typography>
        </ListItemButton>
      ))}
    </List>
    

</Box>

    </Box>
    {hasMore && (
  <Box sx={{ display: "flex", justifyContent: "center", mt: 1 , marginLeft:"750px" }}>
    <Button
      variant="text"
      size="medium"
      color="error"
      onClick={loadMore}
      sx={{
        textTransform: "none",
       
      }}
    >
      إظهار المزيد من النتائج
    </Button>
  </Box>
)}
    <Box
  sx={{
    display: "flex",
    gap: 3,
    mt: 3,
    alignItems: "flex-start",
  }}
>
  {/* اليسار: كلمات الترنيمة */}
  <Box
    sx={{
      flex: 3,
      border: "1px solid rgba(0,0,0,0.1)",
      borderRadius: 2,
      p: 2,
      minHeight: 200,
    }}
  >
{hymnView.map((block, i) => (
  <Box key={i} sx={{ mb: 2 }}>
    {block.lines.map((line, j) => (
      <ListItemButton
        key={j}
        onClick={() => openLyricsOverlay(line)}
      >
        <Typography
          sx={{
            fontSize: 18,
            fontWeight: block.type === "chorus" ? "bold" : "normal",
            color: block.type === "chorus" ? "primary.main" : "text.primary",
            textAlign: "center",
          }}
        >
          {line}
        </Typography>
      </ListItemButton>
    ))}
   
  </Box>
))}
  </Box>

  {/* اليمين: اختر ترنيمة */}
  <Box
    sx={{
      flex: 1,
      border: "1px solid rgba(0,0,0,0.1)",
      borderRadius: 2,
      p: 2,
      minHeight: 200,
    }}
  >
    <Typography fontWeight={700} mb={1}>
      اختر ترنيمة
    </Typography>
    <Box sx={{ display: "flex", gap: 1, mb: 1 }}>
  <Checkbox  onClick={selectAllPlaylist} />
   <DeleteIcon color="error" sx={{cursor:"pointer"}} onClick={deleteSelectedFromPlaylist} />

</Box>
<List dense>
  {playlist.map((h, index) => {
    const checked = selectedIds.includes(h.id);

    return (
      <ListItemButton
        key={h.id}
        selected={h.id === activeHymnId}
        onClick={() => {
          setActiveHymnId(h.id);
          setSelectedHymnId(h.id); // حتى كلماتها تتحدث
        }}
        sx={{ display: "flex", gap: 1 }}
      >
        <Checkbox
          checked={checked}
          onClick={(e) => {
            e.stopPropagation(); // مهم حتى لا يعتبره click على الترنيمة
            toggleSelect(h.id);
          }}
    
        />
        <Typography sx={{ fontSize: 14 }}>
          {index + 1}. {h.title}
        </Typography>
      </ListItemButton>
    );
  })}
</List>

    <List dense>
      {hymnResults.map((h) => (
        <ListItemButton
          key={h.id}
          onClick={() => setSelectedHymnId(h.id)}
        >
          <Typography>{h.title}</Typography>
        </ListItemButton>
      ))}
    </List>
  </Box>
</Box>
    <List sx={{ border: "1px solid #ddd", borderRadius: 2 }}>

</List>

    {showImageOverlay && (
  <Box
    ref={imageOverlayRef}
    sx={{
      position: "fixed",
      inset: 0,
      zIndex: 9999,
     
    }}
    onDoubleClick={closeAllOverlays}
  >
    <Box sx={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)" }} />

    <Box
      sx={{
        position: "relative",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Box  sx={{
    position: "relative",
    zIndex: 1,
    display: "flex",
    flexDirection: "column", // 👈 يخليهم تحت بعض
    alignItems: "center",    // 👈 بالنص أفقيًا
    gap: 0.5,                  // مسافة بين اللوجو والكتابة
    
  }}
>
      <Box
        component="img"
        src="/aliance.png"
        sx={{ width: 500, opacity: 0.9 }}
      />
      <Typography
    sx={{
      color: "white",
      fontSize: { xs: 18, md: 100 },
      fontWeight: 600,
      letterSpacing: 1,
      opacity: 0.9,
      textAlign: "center",
      textShadow: "0 2px 10px rgba(0,0,0,0.7)", // وضوح أكثر

    }}
  >
    كنيسة الاتحاد المسيحي – بغداد
  </Typography>
  </Box>
    </Box>
    
  </Box>
)}


{showLyricsOverlay && presentText && (
  <Box
    ref={lyricsOverlayRef}
    onDoubleClick={closeAllOverlays}
    sx={{
      position: "fixed",
      inset: 0,
      zIndex: 10000,
      overflow: "hidden",
    }}
  >
    {/* 1️⃣ الخلفية */}
    <Box
      sx={{
        position: "absolute",
        inset: 0,
        backgroundImage: "url('/chirstmas.jpeg')", // GIF / صورة / فيديو
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        zIndex: 0,
      }}
    />

    {/* 2️⃣ الطبقة الشفافة */}
    <Box
      sx={{
        position: "absolute",
        inset: 0,
        background: "rgba(0,0,0,0.55)", // 👈 نسبة الشفافية
       backdropFilter: "blur(2px)",    // 👈 اختياري (حلو)
        zIndex: 1,
      }}
    />

    {/* 3️⃣ المحتوى */}
    <Box
      sx={{
        position: "relative",
        zIndex: 2,height: "100%",
        display: "flex",alignItems: "center",
        justifyContent: "center",textAlign: "center",
        p: 6,color: "white",
      }}
    >
      {/* اللوجو */}
      <Box
        component="img"
        src="/aliance.png"
        alt="Church Logo"
        sx={{
          width: { xs: 80, md: 140 },
          opacity: 0.9,
          position: "absolute",
          bottom: 40,
          left: 24,
        }}
      />

   {/* صندوق النص */}
<Box
  sx={{
    maxWidth: "90%", }}>
  <Typography
    dir="rtl"
    sx={{
      fontSize: { xs: 28, md: 150 },
      fontWeight: 900,
      lineHeight: 1.5,
      textAlign: "center",
      whiteSpace: "pre-wrap",  // 👈 يكسر السطور
      wordBreak: "break-word",
    }}
  >
    {presentText}
  </Typography>
</Box>
    </Box>
    
  </Box>
  
)}
{showBlackOverlay && (
  <Box
    ref={blackRef}
    onDoubleClick={() => {
      setShowBlackOverlay(false);
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    }}
    sx={{
      position: "fixed",
      inset: 0,
      zIndex: 10000,
      backgroundColor: "black",
      cursor: "default",
    }}
  />
)}
<p>عدد الترانيم: {hymns.length}</p>
    </div>);
}
