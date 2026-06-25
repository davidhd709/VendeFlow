import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import {
  WebsitePage,
  WebsiteSection,
  WebsiteSectionType,
} from '../models/website-builder.model';

@Injectable({ providedIn: 'root' })
export class WebsiteBuilderService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/website-builder`;

  // ─── Páginas ─────────────────────────────────────────────────────

  listPages(): Observable<WebsitePage[]> {
    return this.http.get<WebsitePage[]>(`${this.base}/pages`);
  }

  getPage(id: string): Observable<WebsitePage> {
    return this.http.get<WebsitePage>(`${this.base}/pages/${id}`);
  }

  createPage(dto: { slug: string; title: string }): Observable<WebsitePage> {
    return this.http.post<WebsitePage>(`${this.base}/pages`, dto);
  }

  updatePage(
    id: string,
    dto: { slug?: string; title?: string },
  ): Observable<WebsitePage> {
    return this.http.patch<WebsitePage>(`${this.base}/pages/${id}`, dto);
  }

  // ─── Secciones ───────────────────────────────────────────────────

  createSection(
    pageId: string,
    dto: { type: WebsiteSectionType; data?: Record<string, unknown> },
  ): Observable<WebsiteSection> {
    return this.http.post<WebsiteSection>(
      `${this.base}/pages/${pageId}/sections`,
      dto,
    );
  }

  updateSection(
    id: string,
    dto: { data?: Record<string, unknown>; visible?: boolean; order?: number },
  ): Observable<WebsiteSection> {
    return this.http.patch<WebsiteSection>(
      `${this.base}/sections/${id}`,
      dto,
    );
  }

  deleteSection(id: string): Observable<{ success: true }> {
    return this.http.delete<{ success: true }>(`${this.base}/sections/${id}`);
  }

  reorder(
    pageId: string,
    sectionIds: string[],
  ): Observable<WebsiteSection[]> {
    return this.http.patch<WebsiteSection[]>(
      `${this.base}/pages/${pageId}/reorder`,
      { sectionIds },
    );
  }

  // ─── Publish / Unpublish ─────────────────────────────────────────

  publish(pageId: string): Observable<WebsitePage> {
    return this.http.post<WebsitePage>(
      `${this.base}/pages/${pageId}/publish`,
      {},
    );
  }

  unpublish(pageId: string): Observable<WebsitePage> {
    return this.http.post<WebsitePage>(
      `${this.base}/pages/${pageId}/unpublish`,
      {},
    );
  }
}
