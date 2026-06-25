import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AlertsModule } from './alerts/alerts.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { AuditModule } from './audit/audit.module';
import { AuthModule } from './auth/auth.module';
import { CampaignsModule } from './campaigns/campaigns.module';
import { CompaniesModule } from './companies/companies.module';
import { NotificationsModule } from './notifications/notifications.module';
import { FilesModule } from './files/files.module';
import { GoalsModule } from './goals/goals.module';
import { LeadsModule } from './leads/leads.module';
import { OfficesModule } from './offices/offices.module';
import { ProductsModule } from './products/products.module';
import { PublicModule } from './public/public.module';
import { SalesModule } from './sales/sales.module';
import { TasksModule } from './tasks/tasks.module';
import { TemplatesModule } from './templates/templates.module';
import { UsersModule } from './users/users.module';
import { WebsiteBuilderModule } from './website-builder/website-builder.module';
import { WebsiteConfigModule } from './website-config/website-config.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { HealthController } from './health/health.controller';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        throttlers: [
          {
            ttl: config.get<number>('THROTTLE_TTL', 60) * 1000, // segundos -> ms
            limit: config.get<number>('THROTTLE_LIMIT', 100),
          },
        ],
      }),
    }),
    PrismaModule,
    AuditModule,
    AlertsModule,
    AuthModule,
    CompaniesModule,
    OfficesModule,
    UsersModule,
    ProductsModule,
    LeadsModule,
    SalesModule,
    PublicModule,
    GoalsModule,
    AnalyticsModule,
    TasksModule,
    TemplatesModule,
    CampaignsModule,
    NotificationsModule,
    WebsiteConfigModule,
    WebsiteBuilderModule,
    FilesModule,
  ],
  controllers: [HealthController],
  providers: [
    // Orden de ejecución: Throttler -> JWT -> Roles. El TenantGuard se aplica por ruta.
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_FILTER, useClass: GlobalExceptionFilter },
  ],
})
export class AppModule {}
