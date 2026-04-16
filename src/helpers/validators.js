import { query, body, param, validationResult } from "express-validator";

export function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);

  if (errors.isEmpty()) {
    return next();
  }

  const error = errors.array()[0];
  const statusCode = error.value ? 422 : 400;

  return res.status(statusCode).json({ status: "error", message: error.msg });
}

export const classifyQueryRules = [
  query("name")
    .notEmpty()
    .withMessage("A valid name is required")
    .bail()
    .isString()
    .withMessage("A valid name is required")
    .trim(),
];

export const profilesListRules = [
  query("gender")
    .optional()
    .isString()
    .withMessage("Invalid gender filter")
    .trim()
    .notEmpty()
    .withMessage("Invalid gender filter")
    .toLowerCase(),
  query("age_group")
    .optional()
    .trim()
    .toLowerCase()
    .isIn(["child", "teenager", "adult", "senior"])
    .withMessage("age_group must be one of: child, teenager, adult, senior"),
  query("country_id")
    .optional()
    .isString()
    .withMessage("Invalid country_id filter")
    .trim()
    .notEmpty()
    .withMessage("Invalid country_id filter")
    .toUpperCase(),
];

export const profileIdRules = [
  param("id").isUUID().withMessage("Invalid profile id"),
];

export const createProfileRules = [
  body("name")
    .exists({ values: "null" })
    .withMessage("A valid name is required")
    .bail()
    .isString()
    .withMessage("A valid name is required")
    .bail()
    .trim()
    .notEmpty()
    .withMessage("A valid name is required"),
];
