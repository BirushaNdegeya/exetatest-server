import { Transform } from 'class-transformer';
import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';

export const EXAM_LIMIT_ALL = 'all' as const;
export type ExamLimitParam = number | typeof EXAM_LIMIT_ALL;

export const EXAM_LIMIT_MAX = 50;

export function TransformExamLimit() {
  return Transform(({ value }: { value: unknown }) => {
    if (value === undefined || value === null || value === '') {
      return undefined;
    }
    if (typeof value === 'string' && value.toLowerCase() === EXAM_LIMIT_ALL) {
      return EXAM_LIMIT_ALL;
    }
    const parsed = Number(value);
    return Number.isNaN(parsed) ? value : parsed;
  });
}

export function IsExamLimit(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isExamLimit',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown) {
          if (value === undefined) {
            return true;
          }
          if (value === EXAM_LIMIT_ALL) {
            return true;
          }
          return (
            typeof value === 'number' &&
            Number.isInteger(value) &&
            value >= 1 &&
            value <= EXAM_LIMIT_MAX
          );
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be an integer between 1 and ${EXAM_LIMIT_MAX}, or "${EXAM_LIMIT_ALL}"`;
        },
      },
    });
  };
}

export function resolveExamLimit(
  categoryCode: string,
  limit: ExamLimitParam | undefined,
  defaultLimits: Record<string, number>,
): ExamLimitParam {
  if (limit === EXAM_LIMIT_ALL) {
    return EXAM_LIMIT_ALL;
  }
  if (limit !== undefined) {
    return limit;
  }
  return defaultLimits[categoryCode] ?? 5;
}
