// app/types/global.d.ts
export {};

declare global {
  interface Window {
    __API_URL__?: string;
  }
}
