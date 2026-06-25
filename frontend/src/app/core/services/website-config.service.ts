import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import {
  UpdateWebsiteConfig,
  WebsiteConfig,
} from '../models/website-config.model';

@Injectable({ providedIn: 'root' })
export class WebsiteConfigService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/website-config`;

  getMine(): Observable<WebsiteConfig | null> {
    return this.http.get<WebsiteConfig | null>(this.base);
  }

  upsert(dto: UpdateWebsiteConfig): Observable<WebsiteConfig> {
    return this.http.put<WebsiteConfig>(this.base, dto);
  }

  getPublic(subdomain: string): Observable<WebsiteConfig | null> {
    return this.http.get<WebsiteConfig | null>(
      `${environment.apiUrl}/public/${subdomain}/website-config`,
    );
  }
}
