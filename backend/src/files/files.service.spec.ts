import { ConfigService } from '@nestjs/config';
import { BusinessError } from '../common/errors/business-error';
import { FilesService } from './files.service';

const makeFile = (overrides: Partial<Express.Multer.File> = {}): Express.Multer.File => ({
  fieldname: 'file',
  originalname: 'logo.png',
  encoding: '7bit',
  mimetype: 'image/png',
  size: 1024 * 100, // 100 KB
  buffer: Buffer.from('fake-image'),
  stream: null as never,
  destination: '',
  filename: '',
  path: '',
  ...overrides,
});

describe('FilesService — validación de uploads', () => {
  let service: FilesService;

  beforeEach(() => {
    const configMock = {
      getOrThrow: (key: string) => {
        const vals: Record<string, string> = {
          CLOUDINARY_CLOUD_NAME: 'test-cloud',
          CLOUDINARY_API_KEY: 'test-key',
          CLOUDINARY_API_SECRET: 'test-secret',
        };
        return vals[key];
      },
    } as unknown as ConfigService;

    service = new FilesService(configMock);
  });

  it('rechaza cuando no se proporciona archivo', async () => {
    await expect(
      service.uploadImage(null as never, 'company-A'),
    ).rejects.toThrow(BusinessError);
  });

  it('rechaza mime types no permitidos', async () => {
    const file = makeFile({ mimetype: 'application/pdf' });

    await expect(
      service.uploadImage(file, 'company-A'),
    ).rejects.toThrow(BusinessError);
  });

  it('rechaza archivos que superan 5 MB', async () => {
    const file = makeFile({ size: 6 * 1024 * 1024 });

    await expect(
      service.uploadImage(file, 'company-A'),
    ).rejects.toThrow(BusinessError);
  });

  it('acepta formatos jpeg, png, webp y gif', async () => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

    for (const mimetype of allowed) {
      const file = makeFile({ mimetype });
      // Solo verificamos que NO lanza la validación de MIME; el upload a Cloudinary fallará (sin SDK real)
      await expect(
        service.uploadImage(file, 'company-A'),
      ).rejects.not.toThrow(expect.objectContaining({ message: expect.stringContaining('Formato') }));
    }
  });

  it('acepta un archivo exactamente de 5 MB (límite borde)', async () => {
    const file = makeFile({ size: 5 * 1024 * 1024 });

    await expect(
      service.uploadImage(file, 'company-A'),
    ).rejects.not.toThrow(expect.objectContaining({ message: expect.stringContaining('5 MB') }));
  });
});
