// financeai-project/server/src/utils/validationSchemas.js

const Joi = require("joi");

const registerSchema = Joi.object({
  username: Joi.string().alphanum().min(3).max(30).required(),
  email: Joi.string().email().required(),
  password: Joi.string()
    .min(8)
    .max(30)
    .pattern(
      new RegExp(
        "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$"
      )
    )
    .required()
    .messages({
      "string.pattern.base":
        "Password must contain at least one uppercase letter, one lowercase letter, one number and one special character",
      "string.min": "Password must be at least 8 characters long",
      "string.max": "Password must not exceed 30 characters",
    }),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

const transactionSchema = Joi.object({
  amount: Joi.number().required(),
  type: Joi.string().valid("income", "expense").required(),
  category: Joi.string().required(),
  description: Joi.string().allow(""),
  date: Joi.date().default(Date.now),
});

const budgetSchema = Joi.object({
  category: Joi.string().required(),
  amount: Joi.number().required(),
  period: Joi.string().valid("weekly", "monthly", "yearly").default("monthly"),
});

const dateRangeSchema = Joi.object({
  startDate: Joi.date().iso().required(),
  endDate: Joi.date().iso().min(Joi.ref("startDate")).required(),
});

module.exports = {
  registerSchema,
  loginSchema,
  transactionSchema,
  budgetSchema,
  dateRangeSchema,
};
