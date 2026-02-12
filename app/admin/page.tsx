"use client";

import { useEffect, useState } from "react";
import {
  Box,
  Button,
  TextField,
  Typography,
  List,
  ListItem,
  IconButton,
} from "@mui/material";
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from "@mui/icons-material/Edit";


type Hymn = {
  id: number;
  title: string;
  lyrics: string[];
};

export default function AdminPage() {

  const [hymns, setHymns] = useState<Hymn[]>([]);
  const [versesText, setVersesText] = useState("");
const [chorusText, setChorusText] = useState("");
  const [title, setTitle] = useState("");
  const [lyrics, setLyrics] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);


  async function fetchHymns() {
    const res = await fetch("/api/hymns");
    const data = await res.json();
    setHymns(data);
  }
 // 🔹 جلب الترانيم
 useEffect(() => {
    fetchHymns();
  }, []);
  // 🔹 إضافة / تعديل
  async function saveHymn() {
    const payload = {
      title,
      lyrics: lyrics.split("\n").filter(Boolean),
    };

    if (editingId) {
      await fetch("/api/hymns", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editingId, ...payload }),
      });
    } else {
      await fetch("/api/hymns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    }

    setTitle("");
    setLyrics("");
    setEditingId(null);
    fetchHymns();
  }

  // 🔹 حذف
  async function deleteHymn(id: number) {
    await fetch(`/api/hymns?id=${id}`, {
      method: "DELETE",
    });

    setHymns(prev => prev.filter(h => h.id !== id));
  }

  // 🔹 تحميل بيانات للتعديل
  function startEdit(h: Hymn) {
    setEditingId(h.id);
    setTitle(h.title);
    setLyrics(h.lyrics.join("\n"));
  }

  return (
    <Box sx={{ maxWidth: 700, mx: "auto", mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        إدارة الترانيم
      </Typography>

      <TextField
        fullWidth
        label="عنوان الترنيمة"
        value={title}
        onChange={e => setTitle(e.target.value)}
        sx={{ mb: 2 }}
      />

      <TextField
        fullWidth
        multiline
        rows={6}
        label="كلمات الترنيمة (كل سطر بسطر)"
        value={lyrics}
        onChange={e => setLyrics(e.target.value)}
        sx={{ mb: 2 }}
      />

      <Button variant="contained" onClick={saveHymn}>
        {editingId ? "حفظ التعديل" : "إضافة ترنيمة"}
      </Button>


      <List sx={{ mt: 4 }}>
        {hymns.map(h => (
          <ListItem
            key={h.id}
            secondaryAction={
              <>
                <IconButton onClick={() => startEdit(h)}>
                  <EditIcon />
                </IconButton>
                <IconButton color="error" onClick={() => deleteHymn(h.id)}>
                  <DeleteIcon />
                </IconButton>
              </>
            }
          >
            <Typography>{h.title}</Typography>
          </ListItem>
        ))}
      </List>
    </Box>
  );
}