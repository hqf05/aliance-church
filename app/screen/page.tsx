"use client";

import { useEffect, useState } from "react";
import { Box, Typography } from "@mui/material";

export default function ScreenPage() {
  const [text, setText] = useState("بانتظار المحتوى…");

  useEffect(() => {
    const channel = new BroadcastChannel("church-presenter");

    channel.onmessage = (event) => {
      if (event.data?.type === "SHOW_TEXT") {
        setText(event.data.payload);
      }
    };

    return () => channel.close();
  }, []);

  return (
    <Box
      sx={{
        position: "fixed",
        inset: 0,
        background: "black",
        color: "white",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        p: 4,
      }}
    >
      <Typography
        sx={{
          fontSize: { xs: 36, md: 80 },
          fontWeight: 900,
          lineHeight: 1.2,
        }}
      >
        {text}
      </Typography>
    </Box>
  );
}