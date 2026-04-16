import { Router } from "express";
import axios from "axios";
import { handleUpstreamError } from "../helpers/helperFunctions.js";
import {
  classifyQueryRules,
  handleValidationErrors,
} from "../helpers/validators.js";

const router = Router();

router.get(
  "/",
  classifyQueryRules,
  handleValidationErrors,
  async (req, res) => {
    const { name } = req.query;

    try {
      const { data } = await axios.get("https://api.genderize.io", {
        params: { name },
        timeout: 3500,
      });

      const gender = data.gender;
      const probability = data.probability;
      const count = data.count;

      if (gender === null || count === 0) {
        return res.status(404).json({
          status: "error",
          message: "No prediction available for the provided name",
        });
      }

      const sample_size = count;
      const is_confident = probability >= 0.7 && sample_size >= 100;
      const processed_at = new Date().toISOString();

      return res.json({
        status: "success",
        data: {
          name,
          gender,
          probability,
          sample_size,
          is_confident,
          processed_at,
        },
      });
    } catch (error) {
      return handleUpstreamError(res, error);
    }
  },
);

export default router;
