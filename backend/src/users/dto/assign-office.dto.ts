import { IsUUID } from 'class-validator';

export class AssignOfficeDto {
  @IsUUID()
  officeId!: string;
}
