import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const criticalCss = `
@font-face{font-family:Lato;font-style:normal;font-weight:400;font-display:block;src:url('https://fonts.gstatic.com/s/lato/v25/S6uyw4BMUTPHjx4wXiWtFCc.woff2') format('woff2')}@font-face{font-family:Lato;font-style:normal;font-weight:700;font-display:block;src:url('https://fonts.gstatic.com/s/lato/v25/S6u9w4BMUTPHh6UVSwiPGQ3q5d0.woff2') format('woff2')}html{font-family:Lato,Arial,Helvetica,sans-serif}body{margin:0;cursor:auto}*,::before,::after{box-sizing:border-box}#root{min-height:100vh}.min-h-screen{min-height:100vh}.bg-neutral-100{background:#f5f5f5}.flex{display:flex}.flex-col{flex-direction:column}.flex-1{flex:1}.site-navbar{position:sticky;top:0;z-index:50;display:flex;width:100%;align-items:center;justify-content:space-between;border-bottom:1px solid #e5e7eb;background:#fff;padding:8px 12px;box-shadow:0 1px 2px rgba(0,0,0,.05)}.site-navbar-left{display:flex;align-items:center;gap:8px;flex:1;min-width:0}.site-logo-link{flex-shrink:0;display:block}.site-logo-img{display:block;width:110px;height:auto;aspect-ratio:350/100}.home-hero{position:relative;width:100%;height:70vh;min-height:520px;overflow:hidden;background:#111827}.home-hero-bg{position:absolute;inset:0;z-index:0}.home-hero-bg picture{display:block;width:100%;height:100%}.home-hero-img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:top}.home-hero-content-wrap{position:absolute;inset:0;z-index:20;display:flex;align-items:center;height:100%}.home-hero-content{width:100%;max-width:56rem;margin-left:16px;padding-left:16px;padding-right:16px;color:#fff}.home-hero-title{margin:0 0 24px;font-size:36px;line-height:1.15;font-weight:800;text-shadow:0 4px 16px rgba(0,0,0,.45)}.home-hero-subtitle{max-width:42rem;margin:0 0 40px;color:rgba(255,255,255,.95);font-size:18px;line-height:1.625;font-weight:500;text-shadow:0 3px 12px rgba(0,0,0,.45)}.home-hero-search{position:relative;width:100%}.home-hero-search-box{display:flex;align-items:center;border-radius:9999px;background:rgba(255,255,255,.98);padding:8px 12px;box-shadow:0 25px 50px -12px rgba(0,0,0,.35);backdrop-filter:blur(12px)}.home-hero-search-icon{width:20px;height:20px;flex-shrink:0;margin-right:8px;color:#c2410c}.home-hero-search-input{min-width:0;flex:1;border:0;outline:0;background:transparent;color:#000;font-size:14px}.home-hero-search-input::placeholder{color:#6b7280}.home-hero-search-button{margin-left:4px;flex-shrink:0;white-space:nowrap;border:0;border-radius:9999px;background:#c2410c;color:#fff;padding:8px 16px;font-size:14px;font-weight:700;box-shadow:0 10px 15px -3px rgba(0,0,0,.2)}.home-hero-desktop{display:none}.home-hero-mobile{display:block}.home-hero-desktop-track{display:flex;height:100%;transition:transform 1s ease-in-out}.home-hero-desktop-slide{position:relative;height:100%;overflow:hidden}.home-hero-desktop-img{width:100%;height:100%;object-fit:cover}@media (min-width:640px){.site-navbar{padding:12px 24px}.site-logo-img{width:150px}.home-hero{height:60vh}.home-hero-content{margin-left:32px;padding-left:0;padding-right:0}.home-hero-title{font-size:48px}.home-hero-subtitle{font-size:20px}.home-hero-search-box{padding:16px}.home-hero-search-icon{width:24px;height:24px;margin-right:12px}.home-hero-search-input,.home-hero-search-button{font-size:18px}.home-hero-search-button{padding:16px 40px}}@media (min-width:768px){.site-navbar{padding-left:64px;padding-right:64px}.site-logo-img{width:190px}.home-hero{height:100vh}.home-hero-mobile{display:none}.home-hero-desktop{display:block}.home-hero-content{margin-left:64px}.home-hero-title{font-size:60px}.home-hero-subtitle{font-size:24px}.home-hero-search{max-width:700px}}@media (min-width:1024px){.home-hero-content{margin-left:96px}.home-hero-title{font-size:72px}}
`;

const criticalCssPlugin = () => ({
  name: 'ajl-critical-css',
  transformIndexHtml: {
    order: 'post',
    handler(html) {
      return html
        .replace('</head>', `<style data-critical="home-above-fold">${criticalCss}</style></head>`)
        .replace(
          /<link rel="stylesheet" crossorigin href="([^"]*\/assets\/index-[^"]+\.css)">/,
          `<link rel="preload" as="style" crossorigin href="$1"><link rel="stylesheet" crossorigin href="$1" media="print" onload="this.media='all'"><noscript><link rel="stylesheet" crossorigin href="$1"></noscript>`
        )
        .replace(
          /<link rel="stylesheet" href="([^"]*\/assets\/index-[^"]+\.css)">/,
          `<link rel="preload" as="style" href="$1"><link rel="stylesheet" href="$1" media="print" onload="this.media='all'"><noscript><link rel="stylesheet" href="$1"></noscript>`
        )
    },
  },
})

// https://vite.dev/config/
export default defineConfig(({ command }) => {
  const nodeEnv = command === 'build' ? 'production' : 'development'
  process.env.NODE_ENV = nodeEnv

  return {
    plugins: [react(), criticalCssPlugin()],
    server: {
    host: true,
    port: 5174,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://localhost:3000',
        ws: true,
        changeOrigin: true,
      },
      // XAMPP Apache: expose phpMyAdmin via the same frontend origin
      '/phpmyadmin': {
        target: 'http://localhost',
        changeOrigin: true,
      },
      // Optional: expose your Apache site under /apache
      '/apache': {
        target: 'http://localhost',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/apache/, ''),
      },
    },
    },
    build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          stripe: ['@stripe/stripe-js', '@stripe/react-stripe-js']
        }
      }
    }
    },
    define: {
      'process.env.NODE_ENV': JSON.stringify(nodeEnv)
    }
  }
})
