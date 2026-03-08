import type { PipeTransform } from '@nestjs/common'
import { Injectable, BadRequestException } from '@nestjs/common'
import type { ZodSchema } from 'zod'
import { ZodError } from 'zod'

@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(private schema: ZodSchema) {}

  transform(value: unknown) {
    try {
      return this.schema.parse(value)
    } catch (error) {
      if (error instanceof ZodError) {
        throw new BadRequestException({
          message: 'Validation failed',
          errors: error.errors.map((e) => ({
            path: e.path.join('.'),
            message: e.message,
          })),
        })
      }
      throw error
    }
  }
}
