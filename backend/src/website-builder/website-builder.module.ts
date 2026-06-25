import { Module } from '@nestjs/common';
import { WebsiteConfigModule } from '../website-config/website-config.module';
import { PublicWebsiteController } from './public-website.controller';
import { WebsiteBuilderController } from './website-builder.controller';
import { WebsiteBuilderService } from './website-builder.service';

@Module({
  imports: [WebsiteConfigModule],
  controllers: [WebsiteBuilderController, PublicWebsiteController],
  providers: [WebsiteBuilderService],
})
export class WebsiteBuilderModule {}
