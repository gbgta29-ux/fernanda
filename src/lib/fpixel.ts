
'use client'

declare global {
  interface Window {
    fbq: (...args: any[]) => void;
  }
}

export const track = (name: string, options = {}) => {
  if (typeof window.fbq === 'function') {
    window.fbq('track', name, options);
  }
};
