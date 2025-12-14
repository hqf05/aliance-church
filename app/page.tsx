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

type Hymn = {
  id: string;
  title: string;
  lines: string[];
};
const HYMNS: Hymn[] = [
  {
    id: "hymn-1",
    title: "فمي يحدث بحبك",
    lines: [
     "    ١- فمي يحدث بحبك اليوم كله بمجدك لساني يلهج بحمدك افرح افرح دوما بك",
      "القرار - (هللويا للرب الاله هللويا فدانا بدماه هللويا محا صكنا صار برنا ",
      
    ],
  },
];
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

type BibleBook = {
  id: string;
  name: string;
};
export default function Home() {
  const [query, setQuery] = useState("");
  const [books, setBooks] = useState<BibleBook[]>([]);
  const [resultss, setResultss] = useState<BibleBook[]>([]);
  const [input, setInput] = useState("");
  const [hymnResults, setHymnResults] = useState<Hymn[]>([]);
const [bookResults, setBookResults] = useState<BibleBook[]>([]);
function handleSearch(e: React.ChangeEvent<HTMLInputElement>) {
  const v = e.target.value;
  setQ(v);

  if (!v.trim()) {
    setHymnResults([]);
    setBookResults([]);
    setSelectedHymnId(null);
    return;
  }

  // 🔹 بحث الترانيم
  const hymnFiltered = HYMNS.filter(h =>
    h.title.includes(v) ||
    h.lines.some(l => l.includes(v))
  );

  // 🔹 بحث أسفار الكتاب المقدس
  const bookFiltered = books.filter(b =>
    b.name.includes(v)
  );

  setHymnResults(hymnFiltered);
  setBookResults(bookFiltered);
}
  
useEffect(() => {
  async function loadBooks() {
    const res = await fetch("/api/bible/verses");
    const data = await res.json();

    // 🔥 التحويل المهم
    const booksArray: BibleBook[] = Object.entries(data).map(
      ([id, name]) => ({
        id,
        name: name as string,
      })
    );

    console.log("BOOKS ARRAY 👉", booksArray);

    setBooks(booksArray);
  }

  loadBooks();
}, []);



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
  const [selectedHymnId, setSelectedHymnId] = useState<string | null>(null);
  // النص اللي راح ينعرض فول سكرين
  const [presentText, setPresentText] = useState<string | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);

  const results = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return [];
    return HYMNS.filter((h) => {
      if (h.title.toLowerCase().includes(query)) return true;
      return h.lines.some((l) => l.toLowerCase().includes(query));
    });
  }, [q]);
  const selectedHymn = useMemo(() => {
    return HYMNS.find((h) => h.id === selectedHymnId) ?? null;
  }, [selectedHymnId]);
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
  function exitPresentation() {
    setPresentText(null);
    // نطلع من الفول سكرين إذا بعده شغال
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
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

function startPresent(text: string) {
  setPresentText(text);
  // ندخله fullscreen بعد ما تنرسم الـ overlay
  setTimeout(() => enterFullscreen(), 0);
}
  return (
    <div>
      <Typography>
  عدد الأسفار: {books.length}
</Typography>
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
  onChange={(e) => {
    const v = e.target.value;
    setQ(v);

    if (!v.trim()) {
      setHymnResults([]);
      setBookResults([]);
      setSelectedHymnId(null);
      return;
    }

    setHymnResults(
      HYMNS.filter(h =>
        h.title.includes(v) ||
        h.lines.some(l => l.includes(v))
      )
    );

    setBookResults(
      books.filter(b => b.name.includes(v))
    );
  }}
  label="ابحث هنا"
  variant="standard"
/>
{q.trim() && bookResults.length === 0 && (
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
{bookResults.length > 0 && (
  <Box sx={{ mt: 2 }}>
    <Typography fontWeight={700} sx={{ mb: 1 }}>
      نتائج الكتاب المقدس:
    </Typography>

    <List sx={{ border: "1px solid rgba(0,0,0,0.1)", borderRadius: 2 }}>
      {bookResults.map((book) => (
        <ListItemButton
          key={book.id}
          onClick={() => {
            // هسه بس نخلي الاسم بالحقل
            setQ(book.name + " ");
            setBookResults([]);
          }}
        >
          <Typography>{book.name}</Typography>
        </ListItemButton>
      ))}
    </List>
  </Box>
)}
              {selectedHymn && (
        <Box sx={{ mt: 3 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
            <Chip label="اختيار السطر للعرض" />
            <Typography fontWeight={800}>{selectedHymn.title}</Typography>
          </Box>

          <List sx={{ border: "1px solid rgba(0,0,0,0.1)", borderRadius: 2 }}>
            {selectedHymn.lines.map((line, i) => (
              <React.Fragment key={i}>
                <ListItemButton onClick={() => openLyricsOverlay(line)}>
                  <Typography sx={{ fontSize: 18 }}>{line}</Typography>
                </ListItemButton>
                {i !== selectedHymn.lines.length - 1 && <Divider />}
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
              sx={{
                fontSize: { xs: 34, md: 72 },
                fontWeight: 900,
                lineHeight: 1.2,
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
      
    </div>
  );
}
