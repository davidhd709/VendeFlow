import { IsDateString, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { FollowUpChannel } from '@prisma/client';

export class CreateFollowUpDto {
  @IsOptional()
  @IsEnum(FollowUpChannel)
  channel?: FollowUpChannel;

  @IsString()
  @MinLength(1)
  notes!: string;

  @IsOptional()
  @IsDateString()
  nextActionAt?: string;
}
