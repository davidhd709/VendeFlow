import { IsUUID } from 'class-validator';

export class AssignSellerDto {
  @IsUUID('4')
  sellerId!: string;
}
