import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'

// Self-hosted variable fonts (bundled by Vite) so the app renders correctly
// fully offline — important for locked-down machines with no font CDN access.
import '@fontsource-variable/fraunces'
import '@fontsource-variable/hanken-grotesk'
import '@fontsource-variable/geist-mono'

import './style.css'

createApp(App).use(createPinia()).mount('#app')
