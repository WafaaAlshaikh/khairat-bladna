import Joi from 'joi';

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),

  PORT: Joi.number().default(3000),

  DATABASE_URL: Joi.string().required(),

  JWT_SECRET: Joi.string().min(10).required(),

  JWT_ACCESS_EXPIRES: Joi.string().default('15m'),

  JWT_REFRESH_EXPIRES: Joi.string().default('30d'),
});
