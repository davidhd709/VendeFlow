import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideZoneChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import {
  provideHttpClient,
  withFetch,
  withInterceptors,
} from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { providePrimeNG } from 'primeng/config';
import { ConfirmationService, MessageService } from 'primeng/api';
import Aura from '@primeng/themes/aura';
import { catchError, firstValueFrom, of } from 'rxjs';
import { routes } from './app.routes';
import { AuthService } from '@core/auth/auth.service';
import { jwtInterceptor } from '@core/interceptors/jwt.interceptor';
import { errorInterceptor } from '@core/interceptors/error.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(
      withFetch(),
      withInterceptors([jwtInterceptor, errorInterceptor]),
    ),
    provideAnimationsAsync(),
    providePrimeNG({ theme: { preset: Aura } }),
    MessageService,
    ConfirmationService,
    // Restaura la sesión al cargar usando la cookie httpOnly del refresh token.
    provideAppInitializer(() => {
      const auth = inject(AuthService);
      return firstValueFrom(auth.refresh().pipe(catchError(() => of(null))));
    }),
  ],
};
