import { IsEnum } from 'class-validator';
import { LeadStatus } from '@prisma/client';

export class UpdateLeadStatusDto {
  @IsEnum(LeadStatus, { message: 'Estado de lead inválido' })
  status!: LeadStatus;
}
