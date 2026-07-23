import { BadRequestException } from '@nestjs/common';
import { z } from 'zod';
import { ZodValidationPipe } from './zod-validation.pipe';

describe('ZodValidationPipe', () => {
  const schema = z.object({
    email: z.string().email(),
    age: z.coerce.number().int().positive(),
  });
  const pipe = new ZodValidationPipe(schema);

  it('trả về dữ liệu đã transform khi hợp lệ', () => {
    const result = pipe.transform({ email: 'a@b.com', age: '20' }, {} as never);
    expect(result).toEqual({ email: 'a@b.com', age: 20 });
  });

  it('ném BadRequestException kèm danh sách lỗi khi dữ liệu không hợp lệ', () => {
    expect(() => pipe.transform({ email: 'not-an-email', age: -1 }, {} as never)).toThrow(
      BadRequestException,
    );
  });

  it('danh sách lỗi trả về đúng field bị sai', () => {
    try {
      pipe.transform({ email: 'not-an-email', age: -1 }, {} as never);
      fail('Phải throw BadRequestException');
    } catch (error) {
      expect(error).toBeInstanceOf(BadRequestException);
      const response = (error as BadRequestException).getResponse() as {
        errors: { field: string; message: string }[];
      };
      const fields = response.errors.map((e) => e.field);
      expect(fields).toContain('email');
      expect(fields).toContain('age');
    }
  });
});
