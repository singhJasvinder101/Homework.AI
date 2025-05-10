// vite.config.js
import { defineConfig } from "file:///home/jasvinder-singh/Documents/Homework.AI/node_modules/vite/dist/node/index.js";
import { crx } from "file:///home/jasvinder-singh/Documents/Homework.AI/node_modules/@crxjs/vite-plugin/dist/index.mjs";
import react from "file:///home/jasvinder-singh/Documents/Homework.AI/node_modules/@vitejs/plugin-react/dist/index.mjs";

// src/manifest.js
import { defineManifest } from "file:///home/jasvinder-singh/Documents/Homework.AI/node_modules/@crxjs/vite-plugin/dist/index.mjs";

// package.json
var package_default = {
  name: "Homework AI",
  displayName: "Homework AI",
  version: "2.0.1",
  author: "Jasvinder Singh",
  description: "",
  type: "module",
  license: "MIT",
  keywords: [
    "chrome-extension",
    "react",
    "vite",
    "create-chrome-ext"
  ],
  engines: {
    node: ">=14.18.0"
  },
  scripts: {
    dev: "vite",
    build: "vite build",
    preview: "vite preview",
    fmt: "prettier --write '**/*.{jsx,js,json,css,scss,md}'",
    zip: "npm run build && node src/zip.js"
  },
  dependencies: {
    dompurify: "^3.1.7",
    html2canvas: "^1.4.1",
    "lucide-react": "^0.453.0",
    react: "^18.2.0",
    "react-dom": "^18.2.0",
    "react-image-crop": "^11.0.7",
    "react-markdown": "^9.0.1",
    "tesseract.js": "^5.1.1"
  },
  devDependencies: {
    "@crxjs/vite-plugin": "^2.0.0-beta.28",
    "@types/react": "^18.2.28",
    "@types/react-dom": "^18.2.13",
    "@vitejs/plugin-react": "^4.1.0",
    glob: "^10.3.10",
    gulp: "^4.0.2",
    "gulp-zip": "^6.0.0",
    prettier: "^3.0.3",
    vite: "^4.4.11"
  }
};

// src/manifest.js
var isDev = process.env.NODE_ENV == "development";
var manifest_default = defineManifest({
  name: `${package_default.displayName || package_default.name}${isDev ? ` Dev (Jassi)` : ""}`,
  description: package_default.description,
  version: package_default.version,
  manifest_version: 3,
  icons: {
    16: "img/logo-16.png",
    32: "img/logo-32.png",
    48: "img/logo-48.png",
    128: "img/logo-128.png"
  },
  action: {
    default_icon: "img/logo-48.png"
  },
  side_panel: {
    default_path: "sidepanel.html"
  },
  devtools_page: "devtools.html",
  background: {
    service_worker: "src/background/index.js",
    type: "module"
  },
  content_scripts: [
    {
      matches: [
        "<all_urls>"
      ],
      all_frames: true,
      js: ["src/contentScript/index.js"]
    }
  ],
  host_permissions: ["<all_urls>"],
  web_accessible_resources: [
    {
      resources: ["img/logo-16.png", "img/logo-32.png", "img/logo-48.png", "img/logo-128.png", "scripts/tesseract.min.js", "scripts/worker.min.js"],
      matches: []
    }
  ],
  permissions: ["tabs", "activeTab", "<all_urls>", "sidePanel", "storage"],
  "content_security_policy": {
    "extension_pages": "script-src 'self'; style-src 'self'; img-src 'self' data:;"
  }
});

// vite.config.js
var vite_config_default = defineConfig(({ mode }) => {
  return {
    build: {
      emptyOutDir: true,
      outDir: "build",
      rollupOptions: {
        output: {
          chunkFileNames: "assets/chunk-[hash].js"
        }
      }
    },
    plugins: [crx({ manifest: manifest_default }), react()]
  };
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiLCAic3JjL21hbmlmZXN0LmpzIiwgInBhY2thZ2UuanNvbiJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIi9ob21lL2phc3ZpbmRlci1zaW5naC9Eb2N1bWVudHMvSG9tZXdvcmsuQUlcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIi9ob21lL2phc3ZpbmRlci1zaW5naC9Eb2N1bWVudHMvSG9tZXdvcmsuQUkvdml0ZS5jb25maWcuanNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL2hvbWUvamFzdmluZGVyLXNpbmdoL0RvY3VtZW50cy9Ib21ld29yay5BSS92aXRlLmNvbmZpZy5qc1wiO2ltcG9ydCB7IGRlZmluZUNvbmZpZyB9IGZyb20gJ3ZpdGUnXG5pbXBvcnQgeyBjcnggfSBmcm9tICdAY3J4anMvdml0ZS1wbHVnaW4nXG5pbXBvcnQgcmVhY3QgZnJvbSAnQHZpdGVqcy9wbHVnaW4tcmVhY3QnXG5pbXBvcnQgbWFuaWZlc3QgZnJvbSAnLi9zcmMvbWFuaWZlc3QuanMnXG5cbi8vIGh0dHBzOi8vdml0ZWpzLmRldi9jb25maWcvXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoKHsgbW9kZSB9KSA9PiB7XG4gIHJldHVybiB7XG4gICAgYnVpbGQ6IHtcbiAgICAgIGVtcHR5T3V0RGlyOiB0cnVlLFxuICAgICAgb3V0RGlyOiAnYnVpbGQnLFxuICAgICAgcm9sbHVwT3B0aW9uczoge1xuICAgICAgICBvdXRwdXQ6IHtcbiAgICAgICAgICBjaHVua0ZpbGVOYW1lczogJ2Fzc2V0cy9jaHVuay1baGFzaF0uanMnLFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICB9LFxuXG4gICAgcGx1Z2luczogW2NyeCh7IG1hbmlmZXN0IH0pLCByZWFjdCgpXSxcbiAgfVxufSlcbiIsICJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiL2hvbWUvamFzdmluZGVyLXNpbmdoL0RvY3VtZW50cy9Ib21ld29yay5BSS9zcmNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIi9ob21lL2phc3ZpbmRlci1zaW5naC9Eb2N1bWVudHMvSG9tZXdvcmsuQUkvc3JjL21hbmlmZXN0LmpzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9ob21lL2phc3ZpbmRlci1zaW5naC9Eb2N1bWVudHMvSG9tZXdvcmsuQUkvc3JjL21hbmlmZXN0LmpzXCI7aW1wb3J0IHsgZGVmaW5lTWFuaWZlc3QgfSBmcm9tICdAY3J4anMvdml0ZS1wbHVnaW4nXG5pbXBvcnQgcGFja2FnZURhdGEgZnJvbSAnLi4vcGFja2FnZS5qc29uJyBhc3NlcnQgeyB0eXBlOiAnanNvbicgfVxuXG5jb25zdCBpc0RldiA9IHByb2Nlc3MuZW52Lk5PREVfRU5WID09ICdkZXZlbG9wbWVudCdcblxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lTWFuaWZlc3Qoe1xuICBuYW1lOiBgJHtwYWNrYWdlRGF0YS5kaXNwbGF5TmFtZSB8fCBwYWNrYWdlRGF0YS5uYW1lfSR7aXNEZXYgPyBgIERldiAoSmFzc2kpYCA6ICcnfWAsXG4gIGRlc2NyaXB0aW9uOiBwYWNrYWdlRGF0YS5kZXNjcmlwdGlvbixcbiAgdmVyc2lvbjogcGFja2FnZURhdGEudmVyc2lvbixcbiAgbWFuaWZlc3RfdmVyc2lvbjogMyxcbiAgaWNvbnM6IHtcbiAgICAxNjogJ2ltZy9sb2dvLTE2LnBuZycsXG4gICAgMzI6ICdpbWcvbG9nby0zMi5wbmcnLFxuICAgIDQ4OiAnaW1nL2xvZ28tNDgucG5nJyxcbiAgICAxMjg6ICdpbWcvbG9nby0xMjgucG5nJyxcbiAgfSxcbiAgYWN0aW9uOiB7XG4gICAgZGVmYXVsdF9pY29uOiAnaW1nL2xvZ28tNDgucG5nJyxcbiAgfSxcbiAgc2lkZV9wYW5lbDoge1xuICAgIGRlZmF1bHRfcGF0aDogJ3NpZGVwYW5lbC5odG1sJyxcbiAgfSxcbiAgZGV2dG9vbHNfcGFnZTogJ2RldnRvb2xzLmh0bWwnLFxuICBiYWNrZ3JvdW5kOiB7XG4gICAgc2VydmljZV93b3JrZXI6ICdzcmMvYmFja2dyb3VuZC9pbmRleC5qcycsXG4gICAgdHlwZTogJ21vZHVsZScsXG4gIH0sXG4gIGNvbnRlbnRfc2NyaXB0czogW1xuICAgIHtcbiAgICAgIG1hdGNoZXM6IFtcbiAgICAgICAgXCI8YWxsX3VybHM+XCJcbiAgICAgIF0sXG4gICAgICBhbGxfZnJhbWVzOiB0cnVlLFxuICAgICAganM6IFsnc3JjL2NvbnRlbnRTY3JpcHQvaW5kZXguanMnXSxcbiAgICB9LFxuICBdLFxuICBob3N0X3Blcm1pc3Npb25zOiBbXCI8YWxsX3VybHM+XCJdLFxuICB3ZWJfYWNjZXNzaWJsZV9yZXNvdXJjZXM6IFtcbiAgICB7XG4gICAgICByZXNvdXJjZXM6IFsnaW1nL2xvZ28tMTYucG5nJywgJ2ltZy9sb2dvLTMyLnBuZycsICdpbWcvbG9nby00OC5wbmcnLCAnaW1nL2xvZ28tMTI4LnBuZycsICdzY3JpcHRzL3Rlc3NlcmFjdC5taW4uanMnLCAnc2NyaXB0cy93b3JrZXIubWluLmpzJ10sXG4gICAgICBtYXRjaGVzOiBbXSxcbiAgICB9LFxuICBdLFxuICBwZXJtaXNzaW9uczogW1widGFic1wiLCBcImFjdGl2ZVRhYlwiLCBcIjxhbGxfdXJscz5cIiwgXCJzaWRlUGFuZWxcIiwgXCJzdG9yYWdlXCJdLFxuICBcImNvbnRlbnRfc2VjdXJpdHlfcG9saWN5XCI6IHtcbiAgICBcImV4dGVuc2lvbl9wYWdlc1wiOiBcInNjcmlwdC1zcmMgJ3NlbGYnOyBzdHlsZS1zcmMgJ3NlbGYnOyBpbWctc3JjICdzZWxmJyBkYXRhOjtcIlxuICB9XG5cblxufSlcbiIsICJ7XG4gIFwibmFtZVwiOiBcIkhvbWV3b3JrIEFJXCIsXG4gIFwiZGlzcGxheU5hbWVcIjogXCJIb21ld29yayBBSVwiLFxuICBcInZlcnNpb25cIjogXCIyLjAuMVwiLFxuICBcImF1dGhvclwiOiBcIkphc3ZpbmRlciBTaW5naFwiLFxuICBcImRlc2NyaXB0aW9uXCI6IFwiXCIsXG4gIFwidHlwZVwiOiBcIm1vZHVsZVwiLFxuICBcImxpY2Vuc2VcIjogXCJNSVRcIixcbiAgXCJrZXl3b3Jkc1wiOiBbXG4gICAgXCJjaHJvbWUtZXh0ZW5zaW9uXCIsXG4gICAgXCJyZWFjdFwiLFxuICAgIFwidml0ZVwiLFxuICAgIFwiY3JlYXRlLWNocm9tZS1leHRcIlxuICBdLFxuICBcImVuZ2luZXNcIjoge1xuICAgIFwibm9kZVwiOiBcIj49MTQuMTguMFwiXG4gIH0sXG4gIFwic2NyaXB0c1wiOiB7XG4gICAgXCJkZXZcIjogXCJ2aXRlXCIsXG4gICAgXCJidWlsZFwiOiBcInZpdGUgYnVpbGRcIixcbiAgICBcInByZXZpZXdcIjogXCJ2aXRlIHByZXZpZXdcIixcbiAgICBcImZtdFwiOiBcInByZXR0aWVyIC0td3JpdGUgJyoqLyoue2pzeCxqcyxqc29uLGNzcyxzY3NzLG1kfSdcIixcbiAgICBcInppcFwiOiBcIm5wbSBydW4gYnVpbGQgJiYgbm9kZSBzcmMvemlwLmpzXCJcbiAgfSxcbiAgXCJkZXBlbmRlbmNpZXNcIjoge1xuICAgIFwiZG9tcHVyaWZ5XCI6IFwiXjMuMS43XCIsXG4gICAgXCJodG1sMmNhbnZhc1wiOiBcIl4xLjQuMVwiLFxuICAgIFwibHVjaWRlLXJlYWN0XCI6IFwiXjAuNDUzLjBcIixcbiAgICBcInJlYWN0XCI6IFwiXjE4LjIuMFwiLFxuICAgIFwicmVhY3QtZG9tXCI6IFwiXjE4LjIuMFwiLFxuICAgIFwicmVhY3QtaW1hZ2UtY3JvcFwiOiBcIl4xMS4wLjdcIixcbiAgICBcInJlYWN0LW1hcmtkb3duXCI6IFwiXjkuMC4xXCIsXG4gICAgXCJ0ZXNzZXJhY3QuanNcIjogXCJeNS4xLjFcIlxuICB9LFxuICBcImRldkRlcGVuZGVuY2llc1wiOiB7XG4gICAgXCJAY3J4anMvdml0ZS1wbHVnaW5cIjogXCJeMi4wLjAtYmV0YS4yOFwiLFxuICAgIFwiQHR5cGVzL3JlYWN0XCI6IFwiXjE4LjIuMjhcIixcbiAgICBcIkB0eXBlcy9yZWFjdC1kb21cIjogXCJeMTguMi4xM1wiLFxuICAgIFwiQHZpdGVqcy9wbHVnaW4tcmVhY3RcIjogXCJeNC4xLjBcIixcbiAgICBcImdsb2JcIjogXCJeMTAuMy4xMFwiLFxuICAgIFwiZ3VscFwiOiBcIl40LjAuMlwiLFxuICAgIFwiZ3VscC16aXBcIjogXCJeNi4wLjBcIixcbiAgICBcInByZXR0aWVyXCI6IFwiXjMuMC4zXCIsXG4gICAgXCJ2aXRlXCI6IFwiXjQuNC4xMVwiXG4gIH1cbn1cbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBbVQsU0FBUyxvQkFBb0I7QUFDaFYsU0FBUyxXQUFXO0FBQ3BCLE9BQU8sV0FBVzs7O0FDRnVTLFNBQVMsc0JBQXNCOzs7QUNBeFY7QUFBQSxFQUNFLE1BQVE7QUFBQSxFQUNSLGFBQWU7QUFBQSxFQUNmLFNBQVc7QUFBQSxFQUNYLFFBQVU7QUFBQSxFQUNWLGFBQWU7QUFBQSxFQUNmLE1BQVE7QUFBQSxFQUNSLFNBQVc7QUFBQSxFQUNYLFVBQVk7QUFBQSxJQUNWO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsRUFDRjtBQUFBLEVBQ0EsU0FBVztBQUFBLElBQ1QsTUFBUTtBQUFBLEVBQ1Y7QUFBQSxFQUNBLFNBQVc7QUFBQSxJQUNULEtBQU87QUFBQSxJQUNQLE9BQVM7QUFBQSxJQUNULFNBQVc7QUFBQSxJQUNYLEtBQU87QUFBQSxJQUNQLEtBQU87QUFBQSxFQUNUO0FBQUEsRUFDQSxjQUFnQjtBQUFBLElBQ2QsV0FBYTtBQUFBLElBQ2IsYUFBZTtBQUFBLElBQ2YsZ0JBQWdCO0FBQUEsSUFDaEIsT0FBUztBQUFBLElBQ1QsYUFBYTtBQUFBLElBQ2Isb0JBQW9CO0FBQUEsSUFDcEIsa0JBQWtCO0FBQUEsSUFDbEIsZ0JBQWdCO0FBQUEsRUFDbEI7QUFBQSxFQUNBLGlCQUFtQjtBQUFBLElBQ2pCLHNCQUFzQjtBQUFBLElBQ3RCLGdCQUFnQjtBQUFBLElBQ2hCLG9CQUFvQjtBQUFBLElBQ3BCLHdCQUF3QjtBQUFBLElBQ3hCLE1BQVE7QUFBQSxJQUNSLE1BQVE7QUFBQSxJQUNSLFlBQVk7QUFBQSxJQUNaLFVBQVk7QUFBQSxJQUNaLE1BQVE7QUFBQSxFQUNWO0FBQ0Y7OztBRDFDQSxJQUFNLFFBQVEsUUFBUSxJQUFJLFlBQVk7QUFFdEMsSUFBTyxtQkFBUSxlQUFlO0FBQUEsRUFDNUIsTUFBTSxHQUFHLGdCQUFZLGVBQWUsZ0JBQVksSUFBSSxHQUFHLFFBQVEsaUJBQWlCLEVBQUU7QUFBQSxFQUNsRixhQUFhLGdCQUFZO0FBQUEsRUFDekIsU0FBUyxnQkFBWTtBQUFBLEVBQ3JCLGtCQUFrQjtBQUFBLEVBQ2xCLE9BQU87QUFBQSxJQUNMLElBQUk7QUFBQSxJQUNKLElBQUk7QUFBQSxJQUNKLElBQUk7QUFBQSxJQUNKLEtBQUs7QUFBQSxFQUNQO0FBQUEsRUFDQSxRQUFRO0FBQUEsSUFDTixjQUFjO0FBQUEsRUFDaEI7QUFBQSxFQUNBLFlBQVk7QUFBQSxJQUNWLGNBQWM7QUFBQSxFQUNoQjtBQUFBLEVBQ0EsZUFBZTtBQUFBLEVBQ2YsWUFBWTtBQUFBLElBQ1YsZ0JBQWdCO0FBQUEsSUFDaEIsTUFBTTtBQUFBLEVBQ1I7QUFBQSxFQUNBLGlCQUFpQjtBQUFBLElBQ2Y7QUFBQSxNQUNFLFNBQVM7QUFBQSxRQUNQO0FBQUEsTUFDRjtBQUFBLE1BQ0EsWUFBWTtBQUFBLE1BQ1osSUFBSSxDQUFDLDRCQUE0QjtBQUFBLElBQ25DO0FBQUEsRUFDRjtBQUFBLEVBQ0Esa0JBQWtCLENBQUMsWUFBWTtBQUFBLEVBQy9CLDBCQUEwQjtBQUFBLElBQ3hCO0FBQUEsTUFDRSxXQUFXLENBQUMsbUJBQW1CLG1CQUFtQixtQkFBbUIsb0JBQW9CLDRCQUE0Qix1QkFBdUI7QUFBQSxNQUM1SSxTQUFTLENBQUM7QUFBQSxJQUNaO0FBQUEsRUFDRjtBQUFBLEVBQ0EsYUFBYSxDQUFDLFFBQVEsYUFBYSxjQUFjLGFBQWEsU0FBUztBQUFBLEVBQ3ZFLDJCQUEyQjtBQUFBLElBQ3pCLG1CQUFtQjtBQUFBLEVBQ3JCO0FBR0YsQ0FBQzs7O0FEM0NELElBQU8sc0JBQVEsYUFBYSxDQUFDLEVBQUUsS0FBSyxNQUFNO0FBQ3hDLFNBQU87QUFBQSxJQUNMLE9BQU87QUFBQSxNQUNMLGFBQWE7QUFBQSxNQUNiLFFBQVE7QUFBQSxNQUNSLGVBQWU7QUFBQSxRQUNiLFFBQVE7QUFBQSxVQUNOLGdCQUFnQjtBQUFBLFFBQ2xCO0FBQUEsTUFDRjtBQUFBLElBQ0Y7QUFBQSxJQUVBLFNBQVMsQ0FBQyxJQUFJLEVBQUUsMkJBQVMsQ0FBQyxHQUFHLE1BQU0sQ0FBQztBQUFBLEVBQ3RDO0FBQ0YsQ0FBQzsiLAogICJuYW1lcyI6IFtdCn0K
