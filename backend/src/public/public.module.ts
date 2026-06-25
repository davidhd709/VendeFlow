import { Module } from '@nestjs/common';
import { LeadsModule } from '../leads/leads.module';
import { WebsiteConfigModule } from '../website-config/website-config.module';
import { PublicController } from './public.controller';
import { PublicService } from './public.service';

@Module({
  imports: [LeadsModule, WebsiteConfigModule],
  controllers: [PublicController],
  providers: [PublicService],
})
export class PublicModule {}
