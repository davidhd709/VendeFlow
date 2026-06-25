import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterOutlet } from '@angular/router';
import { distinctUntilChanged, map, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';
import { PublicOffice } from '@core/models/catalog.model';
import {
  FooterData,
  PublishedSection,
  WebsitePageTheme,
} from '@core/models/website-builder.model';
import { WebsiteConfig } from '@core/models/website-config.model';
import { PublicService } from '@core/services/public.service';
import { WebsiteConfigService } from '@core/services/website-config.service';
import { resolvePublicSubdomain } from '@core/utils/public-subdomain.util';
import { PublicFooterComponent } from '@shared/public/public-footer/public-footer.component';
import { PublicNavbarComponent } from '@shared/public/public-navbar/public-navbar.component';

interface PublicCompany {
  id: string;
  name: string;
  slug: string;
  subdomain: string;
}

@Component({
  selector: 'app-public-layout',
  standalone: true,
  imports: [RouterOutlet, PublicNavbarComponent, PublicFooterComponent],
  template: `
    @if (subdomain()) {
      <app-public-navbar
        [company]="company()"
        [config]="config()"
        [subdomain]="subdomain()"
      />
    }

    <router-outlet />

    @if (subdomain()) {
      <app-public-footer
        [company]="company()"
        [config]="config()"
        [footerData]="footerData()"
        [theme]="pageTheme()"
        [offices]="offices()"
        [subdomain]="subdomain()"
      />
    }
  `,
})
export class PublicLayoutComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly publicService = inject(PublicService);
  private readonly configService = inject(WebsiteConfigService);
  private readonly hostname = globalThis.location?.hostname ?? '';

  subdomain = signal('');
  company = signal<PublicCompany | null>(null);
  config = signal<WebsiteConfig | null>(null);
  offices = signal<PublicOffice[]>([]);
  footerData = signal<FooterData | null>(null);
  pageTheme = signal<WebsitePageTheme>('commercial');

  /** Color de marca derivado: si la empresa configuró un primario, lo expone. */
  brandColor = computed(() => this.config()?.primaryColor || '#2563eb');

  constructor() {
    this.route.queryParamMap
      .pipe(
        map((q) => resolvePublicSubdomain(q.get('sub'), this.hostname)),
        distinctUntilChanged(),
        switchMap((sub) => {
          this.subdomain.set(sub);
          if (!sub) {
            this.company.set(null);
            this.config.set(null);
            this.offices.set([]);
            this.footerData.set(null);
            this.pageTheme.set('commercial');
            return of(null);
          }
          // Carga paralela; cualquiera que falle queda null y la UI lo tolera.
          this.publicService.getCompany(sub).subscribe({
            next: (c) => this.company.set(c),
            error: () => this.company.set(null),
          });
          this.configService.getPublic(sub).subscribe({
            next: (cfg) => this.config.set(cfg),
            error: () => this.config.set(null),
          });
          this.publicService.getOffices(sub).subscribe({
            next: (o) => this.offices.set(o),
            error: () => this.offices.set([]),
          });
          this.publicService.getWebsite(sub).subscribe({
            next: (res) => {
              this.pageTheme.set(
                this.extractPublishedTheme(res.page?.sections ?? []),
              );
              this.footerData.set(
                this.extractPublishedFooterData(res.page?.sections ?? []),
              );
            },
            error: () => {
              this.pageTheme.set('commercial');
              this.footerData.set(null);
            },
          });
          return of(null);
        }),
      )
      .subscribe();
  }

  private extractPublishedFooterData(sections: PublishedSection[]): FooterData | null {
    const footerSection = sections.find(
      (section) => section.type === 'FOOTER' && section.visible,
    );
    if (!footerSection || !footerSection.data || typeof footerSection.data !== 'object') {
      return null;
    }
    return footerSection.data as FooterData;
  }

  private extractPublishedTheme(sections: PublishedSection[]): WebsitePageTheme {
    const heroSection = sections.find(
      (section) => section.type === 'HERO' && section.visible,
    );
    const rawTheme = heroSection?.data?.['theme'];
    if (rawTheme === 'commercial' || rawTheme === 'premium' || rawTheme === 'vibrant') {
      return rawTheme;
    }
    if (rawTheme === 'comercial') return 'commercial';
    if (rawTheme === 'minimal') return 'premium';
    if (rawTheme === 'vibrante') return 'vibrant';
    return 'commercial';
  }
}
