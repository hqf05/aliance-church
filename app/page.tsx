"use client"
import Image from "next/image";
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import { useEffect, useMemo, useRef, useState } from "react";
import { Typography } from "@mui/material";
import List from '@mui/material/List';
import Chip from '@mui/material/Chip';
import Container from '@mui/material/Container';
import React from "react";
import ListItemButton from '@mui/material/ListItemButton';
import Divider from '@mui/material/Divider';
import bibleRaw from "./data/bible.json";

type Hymn = {
  id: number;
  title: string;
  lyrics: string[];
  createdAt: string;
};
const BIBLE_BOOK_NAMES = [
  "متى",
  "مرقس",
  "لوقا",
  "يوحنا",
  "تكوين",
  "خروج",
  "مزامير",
];
function normalizeArabic(text: string) {
  return text
    .trim()
    .replace(/^ال/, "")
    .replace(/^إنجيل\s+/, "")
    .replace(/[ًٌٍَُِّْـ]/g, ""); // يشيل الحركات
}

function isBibleQuery(q: string) {
  const clean = normalizeArabic(q);

  return BIBLE_BOOK_NAMES.some(name =>
    clean.startsWith(name)
  );
}
function sendToScreen(text: string) {
  const channel = new BroadcastChannel("church-presenter");
  channel.postMessage({ type: "SHOW_TEXT", payload: text });
}
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
type BibleData = {
  [bookId: string]: {
    name: string;
    chapters: {
      [chapterNumber: string]: {
        [verseNumber: string]: string;
      };
    };
  };
};
type BibleVerse = {
  number: string;
  text: string;
};

type SearchResult =
  | {
      type: "book";
      bookName: string;
      chapters: string[];
    }
  | {
      type: "chapter";
      chapter: string;
      verses: BibleVerse[];
    }
  | null;
const bible = bibleRaw as BibleData;
export default function Home() {
  
  const [bibleResult, setBibleResult] = useState<SearchResult>(null);
  const [result, setResult] = useState<SearchResult>(null);
  const [currentBookName, setCurrentBookName] = useState<string | null>(null);
  const [presentTexts, setPresentTexts] = useState<string | null>(null);
const overlayRefs = useRef<HTMLDivElement | null>(null);
  const BIBLE_ID = process.env.BIBLEID!;
  const [query, setQuery] = useState("");
  const [input, setInput] = useState("");
  const [hymns, setHymns] = useState<Hymn[]>([]);
  const [hymnResults, setHymnResults] = useState<Hymn[]>([]);
async function enterFullscreens() {
  if (!overlayRefs.current) return;

  try {
    if (!document.fullscreenElement) {
      await overlayRefs.current.requestFullscreen();
    }
  } catch (err) {
    console.error(err);
  }
}
useEffect(() => {
  fetch("/api/hymns")
    .then(res => res.json())
    .then((data: Hymn[]) => {
      console.log("🎵 HYMNS FROM DB:", data);
      setHymns(data);
    });
}, []);
function searchBibleLocal(query: string) : SearchResult {
  
  const q = query.trim();
  
  if (!q) return null;
  

  const parts = q.split(" ");

  // متى
  if (parts.length === 1) {
  
    const book = bible["MAT"];
    
    if (!book) return null;

    return {
      type: "book",
      bookName: book.name,
      chapters: Object.keys(book.chapters)
    };
    
  }

  // متى 5
  if (parts.length === 2) {
    const chapter = parts[1];
    const book = bible["MAT"];
    const verses = book.chapters[chapter];

    if (!verses) return null;

    return {
      type: "chapter",
      chapter,
      verses: Object.entries(verses).map(([num, text]) => ({
        number: num,
        text
      }))
    };
  }

  return null;
}
function handleSearch(e: React.ChangeEvent<HTMLInputElement>) {
  const v = e.target.value;
  setQ(v);

  if (!v.trim()) {
    setHymnResults([]);
    setSelectedHymnId(null);
    return;
  }

  const filtered = hymns.filter(h =>
    h.title.includes(v) ||
    h.lyrics.some(l => l.includes(v))
  );

  setHymnResults(filtered);
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
function startPresent(text: string) {
  setPresentText(text);
  setTimeout(async () => {
    if (overlayRef.current && !document.fullscreenElement) {
      await overlayRef.current.requestFullscreen();
    }
  }, 0);
}

function exitPresentation() {
  setPresentText(null);
  if (document.fullscreenElement) {
    document.exitFullscreen().catch(() => {});
  }
}
// async function searchBible(q: string) {
//   console.log("🔥 searchBible CALLED WITH:", q);

//   if (!q.trim()) return;
// }
  const [showImageOverlay, setShowImageOverlay] = useState(false);
const [showLyricsOverlay, setShowLyricsOverlay] = useState(false);
const lyricsOverlayRef = useRef<HTMLDivElement | null>(null);
  const [showImageScreen, setShowImageScreen] = useState(false);
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
async function openImageScreen() {
  setShowImageScreen(true);

  setTimeout(async () => {
    if (imageOverlayRef.current && !document.fullscreenElement) {
      try {
        await imageOverlayRef.current.requestFullscreen();
      } catch (e) {
        console.error(e);
      }
    }
  }, 0);
}
function closeImageScreen() {
  setShowImageScreen(false);

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

  const results = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return [];
    return hymns.filter((h) => {
      if (h.title.toLowerCase().includes(query)) return true;
      return h.lyrics.some((l) => l.toLowerCase().includes(query));
    });
  }, [q]);
  const selectedHymn = useMemo(() => {
    return hymns.find(h => h.id === selectedHymnId) ?? null;
  }, [hymns, selectedHymnId]);
  async function enterFullscreen() {
    const el = overlayRef.current;
    if (!el) return;

    // Fullscreen API
    try {
      if (!document.fullscreenElement) {
        await el.requestFullscreen();
      }
    } catch (e) {
      // بعض المتصفحات تحتاج user gesture قوي، بس غالباً يشتغل
      console.error(e);
    }
  }
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
  return (
    <div>
    <div className="flex justify-center items-center " >
      <Image src="/logo_transparent.png" alt="aliance church " width={100} height={100} />
      
    </div>
    <div className="flex justify-center items-center " >
      <h1>كنيسة الاتحاد المسيحي - بغداد </h1>
        
    </div>
    
    <Stack    spacing={2} direction="row" sx={{display:"flex" , justifyContent:"center", margin:"20px" ,  }}>
      
      <Button onClick={connectToScreen}   color="error" size="large" variant="contained">ربط الشاشة </Button>
      <Button onClick={openImageOverlay} color="error" size="large"  variant="outlined">شاشة خلفية </Button>
      

    </Stack>
    <Box
      component="form"
      sx={{ '& > :not(style)': { m: 1, width: '25ch' } , display:"flex" , justifyContent:"center" }}
      noValidate
      autoComplete="off"
    >
    <TextField
  value={q}
  onChange={handleSearch}
  // onKeyDown={(e) => {
  //   if (e.key === "Enter"){
  //     e.preventDefault(); // 🔥 هذا السطر مهم جدًا
  //     console.log("ENTER PRESSED, q =", q);
  //     searchBible(q);
  //   }
  // }}
  label="ابحث هنا"
  variant="standard"/>
{/* {result && result.type === "book" && (
  <Box>
    {result.chapters.map((c) => (
      <Button
        key={c.number}
        onClick={() =>{
          if (!currentBookName) return;
          searchBible(`${currentBookName} ${c.number}`)
        }
        }
      >
        الإصحاح {c.number}
      </Button>
    ))}
  </Box>
)} */}

{q.trim() &&  (
  <Typography sx={{ mt: 2, opacity: 0.7 }}>
    ماكو نتائج… جرّب كلمة ثانية
  </Typography>
)}
{hymnResults.length > 0 && (
  <Box sx={{ mt: 2 }}>
    <Typography fontWeight={700}>الترانيم:</Typography>
    <List>
      {hymnResults.map(h => (
        <ListItemButton
          key={h.id}
          onClick={() => setSelectedHymnId(h.id)}
        >
          <Typography>{h.title}</Typography>
        </ListItemButton>
      ))}
    </List>
  </Box>
)}
{bibleResult?.type === "book" && (
  <Box>
    <Typography>الإصحاحات</Typography>
    {bibleResult.chapters.map(c => (
      <Button key={c}>{c}</Button>
    ))}
  </Box>
)}

              {selectedHymn && (
        <Box sx={{ mt: 3 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
            <Chip label="اختيار السطر للعرض" />
            <Typography fontWeight={800}>{selectedHymn.title}</Typography>
          </Box>

          <List sx={{ border: "1px solid rgba(0,0,0,0.1)", borderRadius: 2 }}>
            {selectedHymn.lyrics.map((line, i) => (
              <React.Fragment key={i}>
                <ListItemButton onClick={() => openLyricsOverlay(line)}>
                  <Typography sx={{ fontSize: 18 }}>{line}</Typography>
                </ListItemButton>
                {i !== selectedHymn.lyrics.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>

          <Typography variant="body2" sx={{ mt: 1, opacity: 0.7 }}>
            * من تدخل وضع العرض: اضغط <b>ESC</b> حتى تطلع.
          </Typography>
        </Box>
      )}
      

    </Box>
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
    sx={{
      position: "fixed",
      inset: 0,
      zIndex: 10000,
      backgroundImage: "url('/background.jpeg')",
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundRepeat: "no-repeat",   
      color: "white",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      textAlign: "center",
      p: 6,
      
    }}
    onDoubleClick={closeAllOverlays}
  >
    <Box
    component="img"
    src="/logo_transparent.png"
    alt="Church Logo"
    sx={{
      width: { xs: 80, md: 140 },
      opacity: 0.9,
      position: "absolute",
    top: 24,
    left: 24, // غيرها right إذا تحب
    zIndex: 2,
    }}
    
  />
    <Typography
      sx={{
        fontSize: { xs: 32, md: 72 },
        fontWeight: 900,
        lineHeight: 1.3,
      }}
    >
      {presentText}
    </Typography>
  </Box>
)}
    {/* Overlay fullscreen */}
      {presentText  &&  (
        <Box
          ref={overlayRef}
          tabIndex={-1}
          onDoubleClick={exitPresentation}
          sx={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            color: "white",
            backgroundImage: "url('/background.jpeg')",
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            p: { xs: 3, md: 8 },
            textAlign: "center",
            cursor: "default",
          }}
        >
          <Box sx={{ maxWidth: 1200 }}>
          <Typography
  component="div"
  dir="rtl"
  sx={{
    direction: "rtl",
    unicodeBidi: "isolate",
    textAlign: "center",
    fontSize: { xs: 28, md: 64 },
    fontWeight: 800,
    lineHeight: 1.6,
    whiteSpace: "pre-wrap",
  }}
>
  {presentText}
</Typography>
            <Box
  sx={{
    position: "absolute",
    top: 24,
    left: 24, // غيرها right إذا تحب
    zIndex: 2,
  }}
>
  <Box
    component="img"
    src="/aliance.png"
    alt="Church Logo"
    sx={{
      width: { xs: 80, md: 140 },
      opacity: 0.9,
    }}
    
  />
</Box>
              </Box>
            </Box>
      )}
      {presentTexts && (
  <Box
    ref={overlayRefs}
    onDoubleClick={exitPresentation}
    sx={{
      position: "fixed",
      inset: 0,
      zIndex: 9999,
      backgroundColor: "black",
      color: "white",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      textAlign: "center",
      p: 6,
      cursor: "default",
    }}
  >
    <Typography
      sx={{
        fontSize: { xs: 28, md: 64 },
        fontWeight: 700,
        lineHeight: 1.3,
        whiteSpace: "pre-wrap",
      }}
    >
      {presentTexts}
    </Typography>
  </Box>
)}
    </div>
  );
}
