import { Module } from '@nestjs/common';
import { WebsiteConfigController } from './website-config.controller';
import { WebsiteConfigService } from './website-config.service';

@Module({
  controllers: [WebsiteConfigController],
  providers: [WebsiteConfigService],
  exports: [WebsiteConfigService],
})
export class WebsiteConfigModule {}
