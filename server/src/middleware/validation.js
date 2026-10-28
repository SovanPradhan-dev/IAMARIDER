import { z } from 'zod';

/**
 * Validate request body using a Zod schema.
 * Puts parsed data into req.validatedBody.
 */
export const validateBody = (schema) => (req, res, next) => {
  try {
    req.validatedBody = schema.parse(req.body);
    return next();
  } catch (err) {
    if (err instanceof z.ZodError) {
      const issues = err.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }));
      return res.status(400).json({ error: 'Validation failed', issues });
    }
    return res.status(400).json({ error: 'Validation failed' });
  }
};

/**
 * Validate request params using a Zod schema.
 * Puts parsed data into req.validatedParams.
 */
export const validateParams = (schema) => (req, res, next) => {
  try {
    req.validatedParams = schema.parse(req.params);
    return next();
  } catch (err) {
    if (err instanceof z.ZodError) {
      const issues = err.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }));
      return res.status(400).json({ error: 'Validation failed', issues });
    }
    return res.status(400).json({ error: 'Validation failed' });
  }
};

/**
 * Validate request query using a Zod schema.
 * Puts parsed data into req.validatedQuery.
 */
export const validateQuery = (schema) => (req, res, next) => {
  try {
    req.validatedQuery = schema.parse(req.query);
    return next();
  } catch (err) {
    if (err instanceof z.ZodError) {
      const issues = err.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }));
      return res.status(400).json({ error: 'Validation failed', issues });
    }
    return res.status(400).json({ error: 'Validation failed' });
  }
};
