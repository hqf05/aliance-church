"use client";
import { useEffect, useState } from "react";
import { Box, Typography } from "@mui/material";
export default function ScreenPage() {
  const [text, setText] = useState<string>(""); // النص القادم من النافذة الرئيسية
  const [black, setBlack] = useState(false);

  useEffect(() => {
    window.electronAPI?.onPresentText?.((incoming) => {
      setText(incoming ?? "");
    });

    window.electronAPI?.onBlack?.((b) => setBlack(Boolean(b)));
  }, []);

  const showLyrics = !black && text.trim().length > 0; // إذا اكو نص => عرض كلمات
  const showIdle = !black && !showLyrics;              // إذا ماكو نص => شاشة شعار

  return (
    <Box sx={{ position: "fixed", inset: 0, overflow: "hidden" }}>
      {/* شاشة سوداء */}
      {black && <Box sx={{ position: "absolute", inset: 0, bgcolor: "black" }} />}

      {/* ✅ 1) وضع ربط الشاشة: شعار بالنص + كتابة تحت */}
      {showIdle && (
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            bgcolor: "black", // خليها اسود، إذا تحب غيرها لصورة ثابتة
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            p: 6,
          }}
        >
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
            <Box
              component="img"
              src="/aliance.png"
              alt="Church Logo"
              sx={{ width: { xs: 220, md: 520 }, opacity: 0.95 }}
            />
            <Typography
              dir="rtl"
              sx={{
                color: "white",
                fontSize: { xs: 24, md: 90 },
                fontWeight: 800,
                letterSpacing: 1,
                textShadow: "0 2px 10px rgba(0,0,0,0.7)",
              }}
            >
              كنيسة الاتحاد المسيحي – بغداد
            </Typography>
          </Box>
        </Box>
      )}

      {/* ✅ 2) وضع كلمات الترنيمة: نفس كودك بالضبط */}
      {showLyrics && (
        <Box
          sx={{
            position: "absolute",
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
              backgroundImage: "url('/church1.jpeg')",
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
              background: "rgba(0,0,0,0.55)",
              backdropFilter: "blur(2px)",
              zIndex: 1,
            }}
          />

          {/* 3️⃣ المحتوى */}
          <Box
            sx={{
              position: "relative",
              zIndex: 2,
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              p: 6,
              color: "white",
            }}
          >
            {/* اللوجو (يسار تحت) */}
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
            <Box sx={{ maxWidth: "90%" }}>
              <Typography
                dir="rtl"
                sx={{
                  fontSize: { xs: 28, md: 150 },
                  fontWeight: 900,
                  lineHeight: 1.5,
                  textAlign: "center",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  textShadow: "0 2px 10px rgba(0,0,0,0.7)",
                }}
              >
                {text}
              </Typography>
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );
}