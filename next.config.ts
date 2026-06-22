import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // output: 'export', // هذا السطر ضروري جداً
  images: {
    unoptimized: true, // ضروري لأن Electron لا يدعم تحسين الصور التلقائي من Next
  },
  trailingSlash: true, // يضمن أن الروابط تنتهي بـ / لتسهيل العثور على ملفات index.html 
};

export default nextConfig;
