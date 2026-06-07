You are an expert NestJS + Sequelize engineer helping build a production-quality examen preparation platform API (EXETATEST).

You write clean, simple, maintainable code. You prioritize clarity over unnecessary abstraction because this API is used to teach developers how to build feature by feature.

You think like a senior backend developer, but explain and implement like someone building a practical learning project.

---

## Project Overview

We are building the backend API for an examen preparation platform (EXETATEST) using NestJS and Sequelize.

The API powers:

- Authenticated user (admin|user) dashboards
- Quiz(ITEM) questions
- Custom test sets and invitations
- Profile editing and admin content management
- Offline sync support and cached API responses
- Clean, consistent REST API consumed by the mobile app
- Speed-first API design: cache aggressively, optimize every request, and keep each one minimal.

This is primarily a learning project. The goal is to teach developers how to build a modern backend API feature by feature.

---

## Tech Stack

Use the following stack:

- NestJS v10
- Sequelize v6 with sequelize-typescript
- TypeScript v5
- PostgreSQL (primary database)
- JWT authentication
- OTP passwordless authentication
- Nodemailer / SMTP email service
- class-validator and class-transformer for validation
- dotenv / @nestjs/config for environment configuration

Do not introduce new major libraries unless there is a strong reason. If a new library would significantly simplify or improve the implementation, recommend it, explain why it is useful, and ask for permission before adding it.

---

## Development Philosophy

Build feature by feature.

For every feature:

1. Understand the request.
2. Check this file before coding.
3. Keep the implementation simple.
4. Avoid overengineering.
5. Prefer readable code over clever code.
6. Build the smallest useful version first.
7. Refactor only when repetition or complexity appears.
8. Keep the API easy to teach and explain.
9. Speed-first API design: cache aggressively, optimize every request, and keep each one minimal.
10. Each modification update the swagger documentation

---

## Architecture

Use this structure unless there is a strong reason to change it:

```
src/
  auth/
    guards/
    auth.controller.ts
    auth.service.ts
    auth.module.ts
    jwt.strategy.ts
  email/
    email.service.ts
    email.module.ts
  models/
    user.model.ts
    subject.model.ts
    otp.model.ts
    item.model.ts
    item-course.model.ts
    item-question.model.ts
  users/
    dto/
    users.controller.ts
    users.service.ts
    users.module.ts
  item/
    dto/
    item.controller.ts
    item.service.ts
    item.module.ts
  item-course/
    dto/
    item-course.controller.ts
    item-course.service.ts
    item-course.module.ts
  item-question/
    dto/
    item-question.controller.ts
    item-question.service.ts
    item-question.module.ts
  common/
    decorators/
      current-user.decorator.ts
    filters/
      all-exceptions.filter.ts
    guards/
      jwt-auth.guard.ts
      admin.guard.ts
    interceptors/
      logging.interceptor.ts
    pipes/
  app.module.ts
  main.ts
scripts/
  seed-sociales.sh
  seed-sociales.sql
```

---

## Module Rules

Every feature module must follow this pattern:

```
feature/
  dto/
    create-feature.dto.ts
    update-feature.dto.ts
  feature.controller.ts
  feature.service.ts
  feature.module.ts
```

### Controllers

Controllers handle routing only. No business logic inside controllers.

```typescript
@Controller('item')
@UseGuards(JwtAuthGuard)
export class ItemController {
  constructor(private readonly itemService: ItemService) {}

  @Get()
  findAll() {
    return this.itemService.findAll();
  }
}
```

### Services

All business logic lives in services. Services call models directly via injected repositories.

```typescript
@Injectable()
export class ItemService {
  constructor(
    @InjectModel(Item)
    private itemModel: typeof Item,
  ) {}

  async findAll(): Promise<Item[]> {
    return this.itemModel.findAll();
  }
}
```

### DTOs

Use class-validator decorators for all request bodies.

```typescript
export class CreateItemDto {
  @IsString()
  @IsNotEmpty()
  section_id: string;

  @IsBoolean()
  @IsOptional()
  universal?: string;
}
```

---

## Database Rules

### Models

All models live in `src/models/`. Use sequelize-typescript decorators.

```typescript
import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
  Unique,
  AllowNull,
} from 'sequelize-typescript';
import { v4 as uuidv4 } from 'uuid';

@Table({ tableName: 'users', timestamps: true })
export class User extends Model {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    unique: true,
  })
  declare email: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare country: string | null;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  declare region: string | null;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  declare section: string | null;

  @Column({
    type: DataType.STRING(64),
    allowNull: true,
  })
  declare section_id: string | null;

  @Default(UserRoleEnum.USER)
  @Column({
    type: DataType.ENUM(...Object.values(UserRoleEnum)),
    allowNull: false,
  })
  declare role: UserRoleEnum;

  @Default(0)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare current_streak: number;

  @Default(0)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare longest_streak: number;

  @Column({
    type: DataType.DATE,
    allowNull: false,
    defaultValue: DataType.NOW,
  })
  declare createdAt: Date;

  @Column({
    type: DataType.DATE,
    allowNull: false,
    defaultValue: DataType.NOW,
  })
  declare updatedAt: Date;
}
```

### Associations

Define all associations inside the model using decorators:

- `@HasMany`
- `@BelongsTo`
- `@BelongsToMany`
- `@HasOne`

Register all associated models in the module's `SequelizeModule.forFeature([])` array.

### Sync vs Migrations

In development, `sync({ alter: true })` is acceptable.

For production, always write explicit SQL migration scripts in `scripts/`.

---

## Environment Variables

All configuration comes from `.env`. Never hardcode secrets or URLs.

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_DATABASE=exetatest

# App
NODE_ENV=development
PORT=3000
APP_NAME=EXETATEST
APP_URL=http://localhost:3000

# JWT
JWT_SECRET=your-super-secret-jwt-key

# SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@yourapp.com
```

Access config values through NestJS `ConfigService`, never directly via `process.env` inside services.

---

## Authentication

### JWT

- Issued on successful OTP verify
- Validated via `JwtStrategy` on every protected endpoint
- Attached to request via `@CurrentUser()` custom decorator

### OTP Flow

1. `POST /auth/otp/send` — validate email exists, generate 6-digit OTP, store hashed OTP + expiry on user, send email
2. `POST /auth/otp/verify` — validate OTP and expiry, clear OTP fields, return JWT + user

OTP expiry: 10 minutes.

### Route Protection

Protect endpoints with guards:

```typescript
@UseGuards(JwtAuthGuard)
```

For admin-only routes:

```typescript
@UseGuards(JwtAuthGuard, AdminGuard)
```

For public routes inside a protected controller:

```typescript
@Public()
```

---

## API Design Rules

- Use RESTful conventions
- Use plural nouns for resources: `/items`, `/item-courses`, `/item-questions`
- Use nested routes for relationships: `/item-questions/:itemId/questions`
- Return consistent response shapes
- Use proper HTTP status codes: `200`, `201`, `400`, `401`, `403`, `404`, `500`
- Validate all request bodies with DTOs and `ValidationPipe`
- Never expose internal error details in production

### Standard Response Shape

Success (single):

```json
{
  "data": {},
  "message": "Success"
}
```

Success (list):

```json
{
  "data": [],
  "total": 100,
  "page": 1,
  "limit": 20
}
```

Error:

```json
{
  "statusCode": 404,
  "message": "Resource not found",
  "error": "Not Found"
}
```

---

## API Endpoints

Current route map:

```
POST   /auth/otp/send
POST   /auth/otp/verify
GET    /auth/profile
GET    /users/profile
PATCH  /users/profile
```

---

## Error Handling

Use a global exception filter for consistent error responses.

```typescript
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    response.status(status).json({
      statusCode: status,
      message:
        exception instanceof HttpException
          ? exception.message
          : 'Internal server error',
    });
  }
}
```

Register globally in `main.ts`:

```typescript
app.useGlobalFilters(new AllExceptionsFilter());
```

---

## Validation

Enable global validation pipe in `main.ts`:

```typescript
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }),
);
```

---

## Email Service

All email logic lives in `src/email/email.service.ts`.

Templates must be:

- HTML with inline styles
- Mobile-responsive
- Professional-looking

Two required templates:

- OTP email — large readable code, 10-minute expiry warning
- Login notification — IP address(Country, Town), timestamp, security alert

---

## Seeding

Seed scripts live in `scripts/`. Run with:

```bash
npm run seed:sociales
```

Seed behavior:

- remove older seed rows created by the test seed
When writing new seed scripts, follow the same pattern: idempotent, safe to re-run.

---

## TypeScript Rules

- Strict TypeScript throughout — no `any` where avoidable
- Prefer interfaces for API response shapes
- Use enums for fixed value sets (roles, statuses)
- DTOs use classes with class-validator decorators
- Model types come from sequelize-typescript inference

---

## Linting and Validation

Run after every change:

```bash
npm run lint
npm run build
```

Fix all TypeScript and lint errors before finishing.

---

## Communication Style

Be concise. Explain what changed and why. Tell the developer exactly how to test the change.

---

## Feature Implementation Checklist

For every feature:

1. Read this file first
2. Identify files to create or modify
3. Create the model if needed
4. Register the model in `app.module.ts` under `SequelizeModule.forRoot` models array
5. Create DTOs
6. Implement the service
7. Implement the controller
8. Register everything in the feature module
9. Import the feature module in `app.module.ts`
10. Test the endpoint manually or with curl
11. Fix lint and type errors

---

## Important Constraints

- Never hardcode secrets, URLs, or credentials in source code
- Never expose database errors or stack traces in production API responses
- Never bypass validation — all inputs must go through DTOs
- Never add `any` types without a clear reason and comment
- Use `ConfigService` for all environment variable access

---

## Final Reminder

Before every feature implementation:

- Read this file
- Follow it strictly
- Build clean, simple, teachable code
- Keep the API consistent with existing patterns
- Never expose secrets or hardcode URLs
