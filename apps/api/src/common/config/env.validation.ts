import * as Joi from 'joi';

interface EnvConfig {
  NODE_ENV: string;
  PORT: number;
  DATABASE_URL: string;
  JWT_SECRET: string;
  JWT_ACCESS_EXPIRES: string;
  JWT_REFRESH_EXPIRES: string;
}

export function validateEnv(config: Record<string, unknown>): EnvConfig {
  const schema = Joi.object<EnvConfig>({
    NODE_ENV: Joi.string()
      .valid('development', 'production', 'test')
      .default('development'),

    PORT: Joi.number().default(3000),

    DATABASE_URL: Joi.string().required(),

    JWT_SECRET: Joi.string().min(10).required(),

    JWT_ACCESS_EXPIRES: Joi.string().default('15m'),

    JWT_REFRESH_EXPIRES: Joi.string().default('30d'),
  });

  const result = schema.validate(config, {
    abortEarly: false,
    allowUnknown: true,
  });

  if (result.error) {
    throw new Error(`Environment validation failed: ${result.error.message}`);
  }

  return result.value;
}
