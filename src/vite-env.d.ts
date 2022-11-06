/// <reference types="vite/client" />
/// <reference types="electron" />
type WebviewTag = Electron.WebviewTag

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}
