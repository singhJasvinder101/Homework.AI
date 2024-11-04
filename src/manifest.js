import { defineManifest } from '@crxjs/vite-plugin'
import packageData from '../package.json' assert { type: 'json' }

const isDev = process.env.NODE_ENV == 'development'

export default defineManifest({
  name: `${packageData.displayName || packageData.name}${isDev ? ` Dev (Jassi)` : ''}`,
  description: packageData.description,
  version: packageData.version,
  manifest_version: 3,
  icons: {
    16: 'img/logo-16.png',
    32: 'img/logo-32.png',
    48: 'img/logo-48.png',
    128: 'img/logo-128.png',
  },
  action: {
    default_icon: 'img/logo-48.png',
  },
  side_panel: {
    default_path: 'sidepanel.html',
  },
  devtools_page: 'devtools.html',
  background: {
    service_worker: 'src/background/index.js',
    type: 'module',
  },
  content_scripts: [
    {
      matches: [
        "<all_urls>"
      ],
      all_frames: true,
      js: ['src/contentScript/index.js'],
    },
  ],
  host_permissions: ["<all_urls>"],
  web_accessible_resources: [
    {
      resources: ['img/logo-16.png', 'img/logo-32.png', 'img/logo-48.png', 'img/logo-128.png', 'scripts/tesseract.min.js', 'scripts/worker.min.js'],
      matches: [],
    },
  ],
  permissions: ["tabs", "activeTab", "<all_urls>", "sidePanel", "storage"],
  "content_security_policy": {
    "extension_pages": "script-src 'self'; style-src 'self'; img-src 'self' data:;"
  }


})
