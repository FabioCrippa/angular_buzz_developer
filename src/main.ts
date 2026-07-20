import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';

// ✅ Suprimir console.log em produção
if (environment.production) {
  console.log = () => {};
  console.warn = () => {};
  console.debug = () => {};
  console.info = () => {};
  // console.error mantido para rastrear erros críticos
}


platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => console.error(err));

// ✅ Register Service Worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('✅ Service Worker registered:', registration);
        
        // Check for updates periodically
        setInterval(() => {
          registration.update();
        }, 60000); // Check every minute
      })
      .catch(error => {
        console.log('❌ Service Worker registration failed:', error);
      });
  });
}
