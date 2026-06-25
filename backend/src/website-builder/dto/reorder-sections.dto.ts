import { ArrayMinSize, IsArray, IsUUID } from 'class-validator';

export class ReorderSectionsDto {
  /** Lista completa de section ids en el orden deseado. */
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('4', { each: true })
  sectionIds!: string[];
}
