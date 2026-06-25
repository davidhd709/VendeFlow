import { Routes } from '@angular/router';
import { authGuard } from '@core/auth/auth.guard';
import { roleGuard } from '@core/auth/role.guard';
import { mustChangePasswordGuard } from '@core/auth/must-change-password.guard';
import { Role } from '@core/constants/roles';
import { DashboardLayoutComponent } from './layouts/dashboard-layout/dashboard-layout.component';
import { PublicLayoutComponent } from './layouts/public-layout/public-layout.component';
import { LoginComponent } from './features/auth/login/login.component';
import { ChangePasswordComponent } from './features/auth/change-password/change-password.component';
import { ForbiddenComponent } from './shared/components/forbidden/forbidden.component';
import { LeadsListComponent } from './features/leads/leads-list.component';
import { LeadDetailComponent } from './features/leads/lead-detail.component';
import { SalesListComponent } from './features/sales/sales-list.component';
import { AdminProductsComponent } from './features/admin/products.component';
import { AdminOfficesComponent } from './features/admin/offices.component';
import { AdminUsersComponent } from './features/admin/users.component';
import { AdminDashboardComponent } from './features/admin/dashboard.component';
import { AdminAuditComponent } from './features/admin/audit.component';
import { AdminGoalsComponent } from './features/admin/goals.component';
import { AdminTeamComponent } from './features/admin/team.component';
import { AdminTemplatesComponent } from './features/admin/templates.component';
import { AdminCampaignsComponent } from './features/admin/campaigns.component';
import { AdminWebsiteConfigComponent } from './features/admin/website-config.component';
import { WebsiteBuilderPageComponent } from './features/admin/website-builder/website-builder-page.component';
import { PublicSiteComponent } from './features/public/site/public-site.component';
import { VendedorDashboardComponent } from './features/vendedor/dashboard.component';
import { VendedorCampaignsComponent } from './features/vendedor/campaigns.component';
import { CoordinadorDashboardComponent } from './features/coordinador/dashboard.component';
import { TasksComponent } from './features/tasks/tasks.component';
import { SuperadminCompaniesComponent } from './features/superadmin/companies.component';
import { SuperadminDashboardComponent } from './features/superadmin/dashboard.component';
import { SuperadminAuditComponent } from './features/superadmin/audit.component';
import { HomeComponent } from './features/public/home/home.component';
import { PublicCatalogComponent } from './features/public/catalog/catalog.component';
import { PublicQuoteComponent } from './features/public/quote/quote.component';
import { PublicProductDetailComponent } from './features/public/product-detail/product-detail.component';

export const routes: Routes = [
  { path: 'auth/login', component: LoginComponent },
  { path: 'auth/change-password', component: ChangePasswordComponent, canActivate: [authGuard] },
  {
    path: 'superadmin',
    component: DashboardLayoutComponent,
    canActivate: [authGuard, roleGuard([Role.SUPERADMIN]), mustChangePasswordGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: SuperadminDashboardComponent },
      { path: 'empresas', component: SuperadminCompaniesComponent },
      { path: 'auditoria', component: SuperadminAuditComponent },
    ],
  },
  {
    path: 'admin',
    component: DashboardLayoutComponent,
    canActivate: [authGuard, roleGuard([Role.ADMIN]), mustChangePasswordGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: AdminDashboardComponent },
      { path: 'leads', component: LeadsListComponent },
      { path: 'leads/:id', component: LeadDetailComponent },
      { path: 'campanas', component: AdminCampaignsComponent },
      { path: 'productos', component: AdminProductsComponent },
      { path: 'oficinas', component: AdminOfficesComponent },
      { path: 'usuarios', component: AdminUsersComponent },
      { path: 'equipo', component: AdminTeamComponent },
      { path: 'tareas', component: TasksComponent },
      { path: 'plantillas', component: AdminTemplatesComponent },
      { path: 'sitio-web', component: AdminWebsiteConfigComponent },
      { path: 'editor-web', component: WebsiteBuilderPageComponent },
      { path: 'metas', component: AdminGoalsComponent },
      { path: 'ventas', component: SalesListComponent },
      { path: 'auditoria', component: AdminAuditComponent },
    ],
  },
  {
    path: 'coordinador',
    component: DashboardLayoutComponent,
    canActivate: [authGuard, roleGuard([Role.COORDINADOR]), mustChangePasswordGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: CoordinadorDashboardComponent },
      { path: 'leads', component: LeadsListComponent },
      { path: 'leads/:id', component: LeadDetailComponent },
      { path: 'ventas', component: SalesListComponent },
      { path: 'metas', component: AdminGoalsComponent },
      { path: 'tareas', component: TasksComponent },
    ],
  },
  {
    path: 'vendedor',
    component: DashboardLayoutComponent,
    canActivate: [authGuard, roleGuard([Role.VENDEDOR]), mustChangePasswordGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: VendedorDashboardComponent },
      { path: 'leads', component: LeadsListComponent },
      { path: 'leads/:id', component: LeadDetailComponent },
      { path: 'campanas', component: VendedorCampaignsComponent },
      { path: 'ventas', component: SalesListComponent },
      { path: 'tareas', component: TasksComponent },
    ],
  },
  { path: '403', component: ForbiddenComponent },
  {
    path: '',
    component: PublicLayoutComponent,
    children: [
      { path: '', component: HomeComponent },
      { path: 'sitio', component: PublicSiteComponent },
      { path: 'catalogo', component: PublicCatalogComponent },
      { path: 'catalogo/:slug', component: PublicProductDetailComponent },
      { path: 'cotizar', component: PublicQuoteComponent },
    ],
  },
  { path: '**', redirectTo: '' },
];
