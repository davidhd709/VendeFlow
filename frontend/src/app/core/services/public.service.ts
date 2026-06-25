import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import { Product, PublicOffice } from '../models/catalog.model';
import { PaginatedResponse } from '../models/paginated.model';
import { WebsiteConfig } from '../models/website-config.model';
import { PublishedSection } from '../models/website-builder.model';

interface PublicCompany {
  id: string;
  name: string;
  slug: string;
  subdomain: string;
}

interface PublicLeadDto {
  subdomain: string;
  officeId: string;
  name: string;
  phone: string;
  email?: string;
  notes?: string;
  productIds?: string[];
}

export interface PublicWebsitePage {
  slug: string;
  title: string;
  publishedAt: string | null;
  sections: PublishedSection[];
}

export interface PublicWebsiteResponse {
  theme: WebsiteConfig | null;
  page: PublicWebsitePage | null;
}

@Injectable({ providedIn: 'root' })
export class PublicService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/public`;

  getCompany(subdomain: string): Observable<PublicCompany> {
    return this.http.get<PublicCompany>(
      `${this.base}/companies/by-subdomain/${subdomain}`,
    );
  }

  getProducts(subdomain: string): Observable<PaginatedResponse<Product>> {
    return this.http.get<PaginatedResponse<Product>>(
      `${this.base}/${subdomain}/products`,
    );
  }

  getProductBySlug(subdomain: string, slug: string): Observable<Product> {
    return this.http.get<Product>(`${this.base}/${subdomain}/products/${slug}`);
  }

  getOffices(subdomain: string): Observable<PublicOffice[]> {
    return this.http.get<PublicOffice[]>(`${this.base}/${subdomain}/offices`);
  }

  createLead(dto: PublicLeadDto): Observable<{ id: string }> {
    return this.http.post<{ id: string }>(`${this.base}/leads`, dto);
  }

  getWebsite(
    subdomain: string,
    pageSlug?: string,
  ): Observable<PublicWebsiteResponse> {
    const suffix = pageSlug ? `/${pageSlug}` : '';
    return this.http.get<PublicWebsiteResponse>(
      `${this.base}/website/${subdomain}${suffix}`,
    );
  }
}
