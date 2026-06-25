import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { PaginationDto } from './pagination.dto';

describe('PaginationDto', () => {
  it('acepta limit hasta 200', () => {
    const dto = plainToInstance(PaginationDto, { page: 1, limit: 200 });
    const errors = validateSync(dto);
    expect(errors).toHaveLength(0);
  });

  it('rechaza limit mayor a 200', () => {
    const dto = plainToInstance(PaginationDto, { page: 1, limit: 201 });
    const errors = validateSync(dto);
    expect(errors.length).toBeGreaterThan(0);
    const limitError = errors.find((e) => e.property === 'limit');
    expect(limitError).toBeDefined();
  });

  it('calcula skip y take con los valores validados', () => {
    const dto = plainToInstance(PaginationDto, { page: 3, limit: 50 });
    expect(dto.skip).toBe(100);
    expect(dto.take).toBe(50);
  });
});
