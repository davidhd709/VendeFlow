import { HttpClient, HttpParams } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { UsersService } from './users.service';

describe('UsersService', () => {
  let http: { get: jest.Mock; post: jest.Mock; patch: jest.Mock; delete: jest.Mock };
  let service: UsersService;

  beforeEach(() => {
    http = {
      get: jest.fn().mockReturnValue(of({ items: [], total: 0 })),
      post: jest.fn().mockReturnValue(of({})),
      patch: jest.fn().mockReturnValue(of({})),
      delete: jest.fn().mockReturnValue(of({})),
    };

    TestBed.configureTestingModule({
      providers: [
        UsersService,
        { provide: HttpClient, useValue: http },
      ],
    });

    service = TestBed.inject(UsersService);
  });

  it('normaliza limit al máximo permitido (200)', () => {
    service.getAll(1, 999).subscribe();
    const options = http.get.mock.calls[0][1] as { params: HttpParams };
    expect(options.params.get('limit')).toBe('200');
  });

  it('normaliza limit mínimo a 1', () => {
    service.getAll(1, 0).subscribe();
    const options = http.get.mock.calls[0][1] as { params: HttpParams };
    expect(options.params.get('limit')).toBe('1');
  });
});
