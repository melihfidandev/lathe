import { copyFileSync } from "node:fs";
import { resolve } from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

/**
 * dist/404.html = index.html kopyası. Vercel, Netlify, Cloudflare Pages ve GitHub Pages bilinmeyen
 * adreslerde bu dosyayı gerçek 404 durum koduyla sunar; uygulama da adresi görüp "Not on this pressing"
 * sayfasını çizer. Platforma özel yönlendirme kuralı gerekmez ve "soft 404" (200 dönen hata) oluşmaz.
 */
const notFoundPage = () => ({
  name: "lathe-404",
  apply: "build",
  closeBundle() {
    copyFileSync(resolve("dist/index.html"), resolve("dist/404.html"));
  },
});

// Not: elle manualChunks tanımlanmıyor. Three.js'i ayrı chunk'a zorlamak React gibi ortak
// bağımlılıkları da o chunk'a çekiyor ve 3D paketini ilk yüklemeye bağlıyordu.
// Scene zaten React.lazy ile yükleniyor; Vite onu kendiliğinden ayırır.
export default defineConfig({
  plugins: [react(), tailwindcss(), notFoundPage()],
  build: { chunkSizeWarningLimit: 1200 },
});
