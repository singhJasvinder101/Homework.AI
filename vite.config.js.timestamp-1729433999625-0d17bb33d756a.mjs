// vite.config.js
import { defineConfig } from "file:///D:/chrome%20extensions/ocr_text/node_modules/vite/dist/node/index.js";
import { crx } from "file:///D:/chrome%20extensions/ocr_text/node_modules/@crxjs/vite-plugin/dist/index.mjs";
import react from "file:///D:/chrome%20extensions/ocr_text/node_modules/@vitejs/plugin-react/dist/index.mjs";

// src/manifest.js
import { defineManifest } from "file:///D:/chrome%20extensions/ocr_text/node_modules/@crxjs/vite-plugin/dist/index.mjs";

// package.json
var package_default = {
  name: "Homework AI",
  displayName: "Homework AI",
  version: "1.0.0",
  author: "no one",
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
    "lucide-react": "^0.451.0",
    react: "^18.2.0",
    "react-dom": "^18.2.0",
    showdown: "^2.1.0",
    "tesseract.js": "^5.1.1"
  },
  devDependencies: {
    "@crxjs/vite-plugin": "^2.0.0-beta.19",
    "@types/react": "^18.2.28",
    "@types/react-dom": "^18.2.13",
    "@types/showdown": "^2.0.6",
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
  name: `${package_default.displayName || package_default.name}${isDev ? ` \u27A1\uFE0F Dev` : ""}`,
  description: package_default.description,
  version: package_default.version,
  manifest_version: 3,
  icons: {
    16: "img/logo-16.png",
    32: "img/logo-34.png",
    48: "img/logo-48.png",
    128: "img/logo-128.png"
  },
  action: {
    default_popup: "popup.html",
    default_icon: "img/logo-48.png"
  },
  options_page: "options.html",
  devtools_page: "devtools.html",
  background: {
    service_worker: "src/background/index.js",
    type: "module"
  },
  content_scripts: [
    {
      matches: ["http://*/*", "https://*/*"],
      js: ["src/contentScript/index.js"]
    }
  ],
  side_panel: {
    default_path: "sidepanel.html"
  },
  web_accessible_resources: [
    {
      resources: ["img/logo-16.png", "img/logo-34.png", "img/logo-48.png", "img/logo-128.png", "img/pointer.png", "answerpopup.html"],
      matches: []
    }
  ],
  permissions: ["activeTab", "sidePanel", "storage"]
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiLCAic3JjL21hbmlmZXN0LmpzIiwgInBhY2thZ2UuanNvbiJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIkQ6XFxcXGNocm9tZSBleHRlbnNpb25zXFxcXG9jcl90ZXh0XCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJEOlxcXFxjaHJvbWUgZXh0ZW5zaW9uc1xcXFxvY3JfdGV4dFxcXFx2aXRlLmNvbmZpZy5qc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vRDovY2hyb21lJTIwZXh0ZW5zaW9ucy9vY3JfdGV4dC92aXRlLmNvbmZpZy5qc1wiO2ltcG9ydCB7IGRlZmluZUNvbmZpZyB9IGZyb20gJ3ZpdGUnXG5pbXBvcnQgeyBjcnggfSBmcm9tICdAY3J4anMvdml0ZS1wbHVnaW4nXG5pbXBvcnQgcmVhY3QgZnJvbSAnQHZpdGVqcy9wbHVnaW4tcmVhY3QnXG5pbXBvcnQgbWFuaWZlc3QgZnJvbSAnLi9zcmMvbWFuaWZlc3QuanMnXG5cbi8vIGh0dHBzOi8vdml0ZWpzLmRldi9jb25maWcvXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoKHsgbW9kZSB9KSA9PiB7XG4gIHJldHVybiB7XG4gICAgYnVpbGQ6IHtcbiAgICAgIGVtcHR5T3V0RGlyOiB0cnVlLFxuICAgICAgb3V0RGlyOiAnYnVpbGQnLFxuICAgICAgcm9sbHVwT3B0aW9uczoge1xuICAgICAgICBvdXRwdXQ6IHtcbiAgICAgICAgICBjaHVua0ZpbGVOYW1lczogJ2Fzc2V0cy9jaHVuay1baGFzaF0uanMnLFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICB9LFxuXG4gICAgcGx1Z2luczogW2NyeCh7IG1hbmlmZXN0IH0pLCByZWFjdCgpXSxcbiAgfVxufSlcbiIsICJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiRDpcXFxcY2hyb21lIGV4dGVuc2lvbnNcXFxcb2NyX3RleHRcXFxcc3JjXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJEOlxcXFxjaHJvbWUgZXh0ZW5zaW9uc1xcXFxvY3JfdGV4dFxcXFxzcmNcXFxcbWFuaWZlc3QuanNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0Q6L2Nocm9tZSUyMGV4dGVuc2lvbnMvb2NyX3RleHQvc3JjL21hbmlmZXN0LmpzXCI7aW1wb3J0IHsgZGVmaW5lTWFuaWZlc3QgfSBmcm9tICdAY3J4anMvdml0ZS1wbHVnaW4nXG5pbXBvcnQgcGFja2FnZURhdGEgZnJvbSAnLi4vcGFja2FnZS5qc29uJyBhc3NlcnQgeyB0eXBlOiAnanNvbicgfVxuXG5jb25zdCBpc0RldiA9IHByb2Nlc3MuZW52Lk5PREVfRU5WID09ICdkZXZlbG9wbWVudCdcblxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lTWFuaWZlc3Qoe1xuICBuYW1lOiBgJHtwYWNrYWdlRGF0YS5kaXNwbGF5TmFtZSB8fCBwYWNrYWdlRGF0YS5uYW1lfSR7aXNEZXYgPyBgIFx1MjdBMVx1RkUwRiBEZXZgIDogJyd9YCxcbiAgZGVzY3JpcHRpb246IHBhY2thZ2VEYXRhLmRlc2NyaXB0aW9uLFxuICB2ZXJzaW9uOiBwYWNrYWdlRGF0YS52ZXJzaW9uLFxuICBtYW5pZmVzdF92ZXJzaW9uOiAzLFxuICBpY29uczoge1xuICAgIDE2OiAnaW1nL2xvZ28tMTYucG5nJyxcbiAgICAzMjogJ2ltZy9sb2dvLTM0LnBuZycsXG4gICAgNDg6ICdpbWcvbG9nby00OC5wbmcnLFxuICAgIDEyODogJ2ltZy9sb2dvLTEyOC5wbmcnLFxuICB9LFxuICBhY3Rpb246IHtcbiAgICBkZWZhdWx0X3BvcHVwOiAncG9wdXAuaHRtbCcsXG4gICAgZGVmYXVsdF9pY29uOiAnaW1nL2xvZ28tNDgucG5nJyxcbiAgfSxcbiAgb3B0aW9uc19wYWdlOiAnb3B0aW9ucy5odG1sJyxcbiAgZGV2dG9vbHNfcGFnZTogJ2RldnRvb2xzLmh0bWwnLFxuICBiYWNrZ3JvdW5kOiB7XG4gICAgc2VydmljZV93b3JrZXI6ICdzcmMvYmFja2dyb3VuZC9pbmRleC5qcycsXG4gICAgdHlwZTogJ21vZHVsZScsXG4gIH0sXG4gIGNvbnRlbnRfc2NyaXB0czogW1xuICAgIHtcbiAgICAgIG1hdGNoZXM6IFsnaHR0cDovLyovKicsICdodHRwczovLyovKiddLFxuICAgICAganM6IFsnc3JjL2NvbnRlbnRTY3JpcHQvaW5kZXguanMnXSxcbiAgICB9LFxuICBdLFxuICBzaWRlX3BhbmVsOiB7XG4gICAgZGVmYXVsdF9wYXRoOiAnc2lkZXBhbmVsLmh0bWwnLFxuICB9LFxuICB3ZWJfYWNjZXNzaWJsZV9yZXNvdXJjZXM6IFtcbiAgICB7XG4gICAgICByZXNvdXJjZXM6IFsnaW1nL2xvZ28tMTYucG5nJywgJ2ltZy9sb2dvLTM0LnBuZycsICdpbWcvbG9nby00OC5wbmcnLCAnaW1nL2xvZ28tMTI4LnBuZycsICdpbWcvcG9pbnRlci5wbmcnLCBcImFuc3dlcnBvcHVwLmh0bWxcIl0sXG4gICAgICBtYXRjaGVzOiBbXSxcbiAgICB9LFxuICBdLFxuICBwZXJtaXNzaW9uczogWydhY3RpdmVUYWInLCdzaWRlUGFuZWwnLCAnc3RvcmFnZSddLFxufSlcbiIsICJ7XG4gIFwibmFtZVwiOiBcIkhvbWV3b3JrIEFJXCIsXG4gIFwiZGlzcGxheU5hbWVcIjogXCJIb21ld29yayBBSVwiLFxuICBcInZlcnNpb25cIjogXCIxLjAuMFwiLFxuICBcImF1dGhvclwiOiBcIm5vIG9uZVwiLFxuICBcImRlc2NyaXB0aW9uXCI6IFwiXCIsXG4gIFwidHlwZVwiOiBcIm1vZHVsZVwiLFxuICBcImxpY2Vuc2VcIjogXCJNSVRcIixcbiAgXCJrZXl3b3Jkc1wiOiBbXG4gICAgXCJjaHJvbWUtZXh0ZW5zaW9uXCIsXG4gICAgXCJyZWFjdFwiLFxuICAgIFwidml0ZVwiLFxuICAgIFwiY3JlYXRlLWNocm9tZS1leHRcIlxuICBdLFxuICBcImVuZ2luZXNcIjoge1xuICAgIFwibm9kZVwiOiBcIj49MTQuMTguMFwiXG4gIH0sXG4gIFwic2NyaXB0c1wiOiB7XG4gICAgXCJkZXZcIjogXCJ2aXRlXCIsXG4gICAgXCJidWlsZFwiOiBcInZpdGUgYnVpbGRcIixcbiAgICBcInByZXZpZXdcIjogXCJ2aXRlIHByZXZpZXdcIixcbiAgICBcImZtdFwiOiBcInByZXR0aWVyIC0td3JpdGUgJyoqLyoue2pzeCxqcyxqc29uLGNzcyxzY3NzLG1kfSdcIixcbiAgICBcInppcFwiOiBcIm5wbSBydW4gYnVpbGQgJiYgbm9kZSBzcmMvemlwLmpzXCJcbiAgfSxcbiAgXCJkZXBlbmRlbmNpZXNcIjoge1xuICAgIFwiZG9tcHVyaWZ5XCI6IFwiXjMuMS43XCIsXG4gICAgXCJodG1sMmNhbnZhc1wiOiBcIl4xLjQuMVwiLFxuICAgIFwibHVjaWRlLXJlYWN0XCI6IFwiXjAuNDUxLjBcIixcbiAgICBcInJlYWN0XCI6IFwiXjE4LjIuMFwiLFxuICAgIFwicmVhY3QtZG9tXCI6IFwiXjE4LjIuMFwiLFxuICAgIFwic2hvd2Rvd25cIjogXCJeMi4xLjBcIixcbiAgICBcInRlc3NlcmFjdC5qc1wiOiBcIl41LjEuMVwiXG4gIH0sXG4gIFwiZGV2RGVwZW5kZW5jaWVzXCI6IHtcbiAgICBcIkBjcnhqcy92aXRlLXBsdWdpblwiOiBcIl4yLjAuMC1iZXRhLjE5XCIsXG4gICAgXCJAdHlwZXMvcmVhY3RcIjogXCJeMTguMi4yOFwiLFxuICAgIFwiQHR5cGVzL3JlYWN0LWRvbVwiOiBcIl4xOC4yLjEzXCIsXG4gICAgXCJAdHlwZXMvc2hvd2Rvd25cIjogXCJeMi4wLjZcIixcbiAgICBcIkB2aXRlanMvcGx1Z2luLXJlYWN0XCI6IFwiXjQuMS4wXCIsXG4gICAgXCJnbG9iXCI6IFwiXjEwLjMuMTBcIixcbiAgICBcImd1bHBcIjogXCJeNC4wLjJcIixcbiAgICBcImd1bHAtemlwXCI6IFwiXjYuMC4wXCIsXG4gICAgXCJwcmV0dGllclwiOiBcIl4zLjAuM1wiLFxuICAgIFwidml0ZVwiOiBcIl40LjQuMTFcIlxuICB9XG59Il0sCiAgIm1hcHBpbmdzIjogIjtBQUFpUixTQUFTLG9CQUFvQjtBQUM5UyxTQUFTLFdBQVc7QUFDcEIsT0FBTyxXQUFXOzs7QUNGdVEsU0FBUyxzQkFBc0I7OztBQ0F4VDtBQUFBLEVBQ0UsTUFBUTtBQUFBLEVBQ1IsYUFBZTtBQUFBLEVBQ2YsU0FBVztBQUFBLEVBQ1gsUUFBVTtBQUFBLEVBQ1YsYUFBZTtBQUFBLEVBQ2YsTUFBUTtBQUFBLEVBQ1IsU0FBVztBQUFBLEVBQ1gsVUFBWTtBQUFBLElBQ1Y7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxFQUNGO0FBQUEsRUFDQSxTQUFXO0FBQUEsSUFDVCxNQUFRO0FBQUEsRUFDVjtBQUFBLEVBQ0EsU0FBVztBQUFBLElBQ1QsS0FBTztBQUFBLElBQ1AsT0FBUztBQUFBLElBQ1QsU0FBVztBQUFBLElBQ1gsS0FBTztBQUFBLElBQ1AsS0FBTztBQUFBLEVBQ1Q7QUFBQSxFQUNBLGNBQWdCO0FBQUEsSUFDZCxXQUFhO0FBQUEsSUFDYixhQUFlO0FBQUEsSUFDZixnQkFBZ0I7QUFBQSxJQUNoQixPQUFTO0FBQUEsSUFDVCxhQUFhO0FBQUEsSUFDYixVQUFZO0FBQUEsSUFDWixnQkFBZ0I7QUFBQSxFQUNsQjtBQUFBLEVBQ0EsaUJBQW1CO0FBQUEsSUFDakIsc0JBQXNCO0FBQUEsSUFDdEIsZ0JBQWdCO0FBQUEsSUFDaEIsb0JBQW9CO0FBQUEsSUFDcEIsbUJBQW1CO0FBQUEsSUFDbkIsd0JBQXdCO0FBQUEsSUFDeEIsTUFBUTtBQUFBLElBQ1IsTUFBUTtBQUFBLElBQ1IsWUFBWTtBQUFBLElBQ1osVUFBWTtBQUFBLElBQ1osTUFBUTtBQUFBLEVBQ1Y7QUFDRjs7O0FEMUNBLElBQU0sUUFBUSxRQUFRLElBQUksWUFBWTtBQUV0QyxJQUFPLG1CQUFRLGVBQWU7QUFBQSxFQUM1QixNQUFNLEdBQUcsZ0JBQVksZUFBZSxnQkFBWSxJQUFJLEdBQUcsUUFBUSxzQkFBWSxFQUFFO0FBQUEsRUFDN0UsYUFBYSxnQkFBWTtBQUFBLEVBQ3pCLFNBQVMsZ0JBQVk7QUFBQSxFQUNyQixrQkFBa0I7QUFBQSxFQUNsQixPQUFPO0FBQUEsSUFDTCxJQUFJO0FBQUEsSUFDSixJQUFJO0FBQUEsSUFDSixJQUFJO0FBQUEsSUFDSixLQUFLO0FBQUEsRUFDUDtBQUFBLEVBQ0EsUUFBUTtBQUFBLElBQ04sZUFBZTtBQUFBLElBQ2YsY0FBYztBQUFBLEVBQ2hCO0FBQUEsRUFDQSxjQUFjO0FBQUEsRUFDZCxlQUFlO0FBQUEsRUFDZixZQUFZO0FBQUEsSUFDVixnQkFBZ0I7QUFBQSxJQUNoQixNQUFNO0FBQUEsRUFDUjtBQUFBLEVBQ0EsaUJBQWlCO0FBQUEsSUFDZjtBQUFBLE1BQ0UsU0FBUyxDQUFDLGNBQWMsYUFBYTtBQUFBLE1BQ3JDLElBQUksQ0FBQyw0QkFBNEI7QUFBQSxJQUNuQztBQUFBLEVBQ0Y7QUFBQSxFQUNBLFlBQVk7QUFBQSxJQUNWLGNBQWM7QUFBQSxFQUNoQjtBQUFBLEVBQ0EsMEJBQTBCO0FBQUEsSUFDeEI7QUFBQSxNQUNFLFdBQVcsQ0FBQyxtQkFBbUIsbUJBQW1CLG1CQUFtQixvQkFBb0IsbUJBQW1CLGtCQUFrQjtBQUFBLE1BQzlILFNBQVMsQ0FBQztBQUFBLElBQ1o7QUFBQSxFQUNGO0FBQUEsRUFDQSxhQUFhLENBQUMsYUFBWSxhQUFhLFNBQVM7QUFDbEQsQ0FBQzs7O0FEcENELElBQU8sc0JBQVEsYUFBYSxDQUFDLEVBQUUsS0FBSyxNQUFNO0FBQ3hDLFNBQU87QUFBQSxJQUNMLE9BQU87QUFBQSxNQUNMLGFBQWE7QUFBQSxNQUNiLFFBQVE7QUFBQSxNQUNSLGVBQWU7QUFBQSxRQUNiLFFBQVE7QUFBQSxVQUNOLGdCQUFnQjtBQUFBLFFBQ2xCO0FBQUEsTUFDRjtBQUFBLElBQ0Y7QUFBQSxJQUVBLFNBQVMsQ0FBQyxJQUFJLEVBQUUsMkJBQVMsQ0FBQyxHQUFHLE1BQU0sQ0FBQztBQUFBLEVBQ3RDO0FBQ0YsQ0FBQzsiLAogICJuYW1lcyI6IFtdCn0K
