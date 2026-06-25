import 'reflect-metadata';
import { Role } from '@prisma/client';
import { ROLES_KEY } from '../common/decorators/roles.decorator';
import { AuthUser } from '../common/types/auth-user';
import { OfficesController } from './offices.controller';
import { OfficesService } from './offices.service';

const admin: AuthUser = {
  id: 'admin-1',
  username: 'admin',
  role: Role.ADMIN,
  companyId: 'company-A',
  officeId: null,
};

describe('OfficesController', () => {
  let controller: OfficesController;
  let service: {
    findAll: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
  };

  beforeEach(() => {
    service = {
      findAll: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    };
    controller = new OfficesController(service as unknown as OfficesService);
  });

  it('PATCH /offices/:id delega update con address y phone', async () => {
    service.update.mockResolvedValue({
      id: 'office-1',
      name: 'Sede Centro',
      address: 'Calle 45',
      phone: '3009991122',
    });

    const result = await controller.update(admin, 'office-1', {
      address: 'Calle 45',
      phone: '3009991122',
    });

    expect(service.update).toHaveBeenCalledWith(admin, 'office-1', {
      address: 'Calle 45',
      phone: '3009991122',
    });
    expect(result).toMatchObject({
      address: 'Calle 45',
      phone: '3009991122',
    });
  });

  it('define Roles ADMIN en PATCH /offices/:id', () => {
    const roles = Reflect.getMetadata(ROLES_KEY, OfficesController.prototype.update);
    expect(roles).toEqual([Role.ADMIN]);
  });
});
