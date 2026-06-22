"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Box, Typography } from "@mui/material";

export default function ScreenPage() {
  const searchParams = useSearchParams();

  // ✅ ابدأ بالنص من URL مباشرة - بدون شاشة سوداء أولاً
  const [text, setText] = useState<string>(() => {
    return searchParams?.get("text") ?? "";
  });
  const [black, setBlack] = useState(false);
  const [showIdle, setShowIdle] = useState(false);
  const [fontSize, setFontSize] = useState(110);

  useEffect(() => {
    if (typeof window === "undefined" || !window.electronAPI) return;

    window.electronAPI.onPresentText?.((t: string) => {
      setText(t);
      setShowIdle(false);
    });

    window.electronAPI.onBlack?.((b: boolean) => setBlack(b));

    window.electronAPI.onFont?.((delta: number) =>
      setFontSize((s) => Math.min(200, Math.max(30, s + delta)))
    );

    window.electronAPI.onResetFont?.(() => setFontSize(110));

    window.electronAPI.onShowIdle?.(() => {
      setText("");
      setShowIdle(true);
    });

    return () => {
      window.electronAPI?.removeAllListeners?.("presentText");
      window.electronAPI?.removeAllListeners?.("black");
      window.electronAPI?.removeAllListeners?.("font:change");
      window.electronAPI?.removeAllListeners?.("font:reset");
      window.electronAPI?.removeAllListeners?.("showIdle");
    };
  }, []);

  const showLyrics = !black && text.trim().length > 0;

  return (
    <Box sx={{ position: "fixed", inset: 0, overflow: "hidden", bgcolor: "black" }}>

      {/* شاشة سوداء */}
      {black && (
        <Box sx={{ position: "absolute", inset: 0, bgcolor: "black", zIndex: 10 }} />
      )}

      {/* شاشة الشعار - عند الطلب فقط */}
      {showIdle && !black && (
        <Box
          sx={{
            position: "absolute", inset: 0, bgcolor: "black",
            display: "flex", alignItems: "center",
            justifyContent: "center", textAlign: "center",
            p: 6, zIndex: 1,
          }}
        >
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
            <Box
              component="img" src="/aliance.png" alt="Church Logo"
              sx={{ width: { xs: 220, md: 520 }, opacity: 0.95 }}
            />
            <Typography dir="rtl" sx={{
              color: "white", fontSize: { xs: 24, md: 90 },
              fontWeight: 800, textShadow: "0 2px 10px rgba(0,0,0,0.7)",
            }}>
              كنيسة الاتحاد المسيحي – بغداد
            </Typography>
          </Box>
        </Box>
      )}

      {/* ✅ كلمات الترنيمة - تظهر فوراً */}
      {showLyrics && (
        <Box sx={{ position: "absolute", inset: 0, overflow: "hidden", zIndex: 2 }}>
          {/* الخلفية */}
          <Box sx={{
            position: "absolute", inset: 0,
            backgroundImage: "url('/church1.jpeg')",
            backgroundSize: "cover", backgroundPosition: "center", zIndex: 0,
          }} />
          {/* الطبقة الشفافة */}
          <Box sx={{
            position: "absolute", inset: 0,
            background: "rgba(0,0,0,0.55)", backdropFilter: "blur(2px)", zIndex: 1,
          }} />
          {/* النص */}
          <Box sx={{
            position: "relative", zIndex: 2, height: "100%",
            display: "flex", alignItems: "center",
            justifyContent: "center", textAlign: "center",
            p: 6, color: "white",
          }}>
            {/* اللوجو أسفل اليسار */}
            <Box component="img" src="/aliance.png" alt="Church Logo"
              sx={{ width: { xs: 80, md: 140 }, opacity: 0.9,
                position: "absolute", bottom: 40, left: 24 }}
            />
            <Box sx={{ maxWidth: "90%" }}>
              <Typography dir="rtl" sx={{
                fontSize, fontWeight: 900, lineHeight: 1.5,
                textAlign: "center", whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                textShadow: "0 2px 10px rgba(0,0,0,0.7)",
              }}>
                {text}
              </Typography>
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );
}
