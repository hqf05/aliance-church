"use client";

import { useState } from "react";
import { Box, Button, TextField, Typography } from "@mui/material";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleLogin() {
    setError("");

    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    if (res.ok) {
      router.push("/admin");
    } else {
      setError("اسم المستخدم أو كلمة المرور خطأ");
    }
  }

  return (
    <Box sx={{ maxWidth: 400, mx: "auto", mt: 8 }}>
      <Typography variant="h5" gutterBottom>
        تسجيل الدخول (Admin)
      </Typography>

      <TextField
        fullWidth
        label="اسم المستخدم"
        value={username}
        onChange={e => setUsername(e.target.value)}
        sx={{ mb: 2 }}
      />

      <TextField
        fullWidth
        type="password"
        label="كلمة المرور"
        value={password}
        onChange={e => setPassword(e.target.value)}
        sx={{ mb: 2 }}
      />

      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}

      <Button fullWidth variant="contained" onClick={handleLogin}>
        دخول
      </Button>
    </Box>
  );
}