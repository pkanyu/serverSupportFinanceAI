// financeai-project/server/src/middleware/validate.js

const validate = (schema) => (req, res, next) => {
  if (!schema) {
    return next();
  }
  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }
  next();
};

module.exports = validate;