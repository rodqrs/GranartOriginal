import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

/**
 * Configuración principal de la aplicación Angular.
 * Registra providers globales: HttpClient (con withFetch), animaciones async,
 * y el listener global de errores del navegador.
 */
export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideHttpClient(withFetch()),
    provideAnimationsAsync()
  ]
};
