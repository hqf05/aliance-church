"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  Container,
  TextField,
  Typography,
  List,
  ListItemButton,
  Divider,
  Chip,
  Button,
} from "@mui/material";

type Hymn = {
  id: string;
  title: string;
  lines: string[];
};

const HYMNS: Hymn[] = [
  {
    id: "hymn-1",
    title: "ترنيمة: يا ربّنا الحلو",
    lines: [
      "يا ربّنا الحلو… يا يسوع",
      "باسمك نفرح… ونعيش",
      "قوّتنا بيك… يا إلهي",
      "خلّي عيونّا عليك… دوم",
      "هللويا… هللويا",
    ],
  },
];

export default function PresenterPage() {
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

  // ESC يطلعك (سواء فول سكرين أو لا)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") exitPresentation();
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
    <Container sx={{ py: 4 }}>
      <Typography variant="h4" fontWeight={800} gutterBottom>
        تجربة عرض ترنيمة (بحث + فول سكرين)
      </Typography>

      <Typography variant="body1" sx={{ opacity: 0.8, mb: 2 }}>
        ابحث بعنوان الترنيمة أو بأي سطر… بعدين اختار السطر اللي تريد تعرضه.
      </Typography>

      <TextField
        fullWidth
        label="بحث… (اكتب مثلاً: هللويا)"
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setSelectedHymnId(null);
        }}
      />

      <Box sx={{ mt: 2 }}>
        {q.trim() && results.length === 0 && (
          <Typography sx={{ mt: 2, opacity: 0.7 }}>
            ماكو نتائج… جرّب كلمة ثانية.
          </Typography>
        )}

        {results.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Typography fontWeight={700} sx={{ mb: 1 }}>
              النتائج:
            </Typography>

            <List sx={{ border: "1px solid rgba(0,0,0,0.1)", borderRadius: 2 }}>
              {results.map((h, idx) => (
                <React.Fragment key={h.id}>
                  <ListItemButton onClick={() => setSelectedHymnId(h.id)}>
                    <Box>
                      <Typography fontWeight={800}>{h.title}</Typography>
                      <Typography variant="body2" sx={{ opacity: 0.7 }}>
                        اضغط حتى تختار سطر/كلمات للعرض
                      </Typography>
                    </Box>
                  </ListItemButton>
                  {idx !== results.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </Box>
        )}
      </Box>

      {selectedHymn && (
        <Box sx={{ mt: 3 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
            <Chip label="اختيار السطر للعرض" />
            <Typography fontWeight={800}>{selectedHymn.title}</Typography>
          </Box>

          <List sx={{ border: "1px solid rgba(0,0,0,0.1)", borderRadius: 2 }}>
            {selectedHymn.lines.map((line, i) => (
              <React.Fragment key={i}>
                <ListItemButton onClick={() => startPresent(line)}>
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

      {/* Overlay fullscreen */}
      {presentText && (
        <Box
          ref={overlayRef}
          tabIndex={-1}
          onDoubleClick={exitPresentation}
          sx={{
            position: "fixed",
            inset: 0,
            bgcolor: "black",
            color: "white",
            zIndex: 9999,
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

            <Box sx={{ mt: 4, opacity: 0.7 }}>
              <Typography variant="body2">
                ESC للخروج — (دبل كلك هم يطلعك)
              </Typography>
              <Box sx={{ mt: 1 }}>
                <Button variant="outlined" onClick={exitPresentation}>
                  خروج
                </Button>
              </Box>
            </Box>
          </Box>
        </Box>
      )}
    </Container>
  );
}