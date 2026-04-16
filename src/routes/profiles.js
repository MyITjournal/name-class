import { Router } from "express";
import axios from "axios";
import { v7 as uuidv7 } from "uuid";
import pool from "../db/index.js";
import {
  determineAgeGroup,
  formatProfile,
  handleUpstreamError,
} from "../helpers/helperFunctions.js";
import {
  profilesListRules,
  profileIdRules,
  createProfileRules,
  handleValidationErrors,
} from "../helpers/validators.js";

const router = Router();

router.get("/", profilesListRules, handleValidationErrors, async (req, res) => {
  const gender = req.query.gender;
  const age_group = req.query.age_group;
  const country_id = req.query.country_id;

  const conditions = [];
  const values = [];

  if (gender !== undefined) {
    values.push(gender);
    conditions.push(`LOWER(gender) = $${values.length}`);
  }

  if (age_group !== undefined) {
    values.push(age_group);
    conditions.push(`age_group = $${values.length}`);
  }

  if (country_id !== undefined) {
    values.push(country_id);
    conditions.push(`country_id = $${values.length}`);
  }

  const where =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  try {
    const { rows } = await pool.query(
      `SELECT id, name, gender, age, age_group, country_id
       FROM db_profiles ${where} ORDER BY created_at DESC`,
      values,
    );

    return res.status(200).json({
      status: "success",
      count: rows.length,
      data: rows,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ status: "error", message: "Internal server error" });
  }
});

router.get("/:id", profileIdRules, handleValidationErrors, async (req, res) => {
  const id = req.params.id;

  try {
    const { rows } = await pool.query(
      `SELECT id, name, gender, gender_probability, sample_size,
              age, age_group, country_id, country_probability, created_at
       FROM db_profiles WHERE id = $1 LIMIT 1`,
      [id],
    );

    if (rows.length === 0) {
      return res
        .status(404)
        .json({ status: "error", message: "Profile not found" });
    }

    return res.status(200).json({
      status: "success",
      data: formatProfile(rows[0]),
    });
  } catch (error) {
    return res
      .status(500)
      .json({ status: "error", message: "Internal server error" });
  }
});

router.delete(
  "/:id",
  profileIdRules,
  handleValidationErrors,
  async (req, res) => {
    const id = req.params.id;

    try {
      const { rowCount } = await pool.query(
        "DELETE FROM db_profiles WHERE id = $1",
        [id],
      );

      if (rowCount === 0) {
        return res
          .status(404)
          .json({ status: "error", message: "Profile not found" });
      }

      return res.status(204).send();
    } catch (error) {
      return res
        .status(500)
        .json({ status: "error", message: "Internal server error" });
    }
  },
);

router.post(
  "/",
  createProfileRules,
  handleValidationErrors,
  async (req, res) => {
    const { name } = req.body;

    try {
      //*Idempotency*
      const existing = await pool.query(
        `SELECT id, name, gender, gender_probability, sample_size,
              age, age_group, age_sample_size, country_id, country_probability, created_at
       FROM db_profiles WHERE LOWER(name) = LOWER($1)`,
        [name],
      );

      if (existing.rows.length > 0) {
        return res.status(200).json({
          status: "success",
          message: "Profile already exists",
          data: formatProfile(existing.rows[0]),
        });
      }

      const fetchGender = axios.get("https://api.genderize.io", {
        params: { name },
        timeout: 3500,
      });
      const fetchAge = axios.get("https://api.agify.io", {
        params: { name },
        timeout: 3500,
      });
      const fetchNationality = axios.get("https://api.nationalize.io", {
        params: { name },
        timeout: 3500,
      });

      const [genderRes, ageRes, countryRes] = await Promise.allSettled([
        fetchGender,
        fetchAge,
        fetchNationality,
      ]);

      // Get the gender
      let gender = null;
      let genderProb = null;
      let genderSampleSize = null;

      if (genderRes.status === "fulfilled") {
        const genderData = genderRes.value.data;
        gender = genderData.gender;
        genderProb = genderData.probability;
        genderSampleSize = genderData.count;
      }

      if (gender === null || genderSampleSize === 0) {
        return res.status(502).json({
          status: "error",
          message: "Genderize returned an invalid response",
        });
      }

      // Get the age
      let estimatedAge = null;
      let ageSampleSize = null;

      if (ageRes.status === "fulfilled") {
        const ageData = ageRes.value.data;
        estimatedAge = ageData.age;
        ageSampleSize = ageData.count;
      }

      if (estimatedAge === null) {
        return res.status(502).json({
          status: "error",
          message: "Agify returned an invalid response",
        });
      }

      const age_group = determineAgeGroup(estimatedAge);

      // Get the nationality
      let countries = [];

      if (countryRes.status === "fulfilled") {
        countries = countryRes.value.data.country;
      }

      if (countries.length === 0) {
        return res.status(502).json({
          status: "error",
          message: "Nationalize returned an invalid response",
        });
      }

      const topCountry = countries.reduce((a, b) =>
        b.probability > a.probability ? b : a,
      );
      const countryId = topCountry.country_id;
      const countryProb = topCountry.probability;

      const id = uuidv7();
      const created_at = new Date().toISOString();

      await pool.query(
        `INSERT INTO db_profiles
         (id, name, gender, gender_probability, sample_size,
          age, age_group, age_sample_size, country_id, country_probability, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
        [
          id,
          name,
          gender,
          genderProb,
          genderSampleSize,
          estimatedAge,
          age_group,
          ageSampleSize,
          countryId,
          countryProb,
          created_at,
        ],
      );

      return res.status(201).json({
        status: "success",
        data: formatProfile({
          id,
          name,
          gender,
          gender_probability: genderProb,
          sample_size: genderSampleSize,
          age: estimatedAge,
          age_group,
          country_id: countryId,
          country_probability: countryProb,
          created_at,
        }),
      });
    } catch (error) {
      return handleUpstreamError(res, error);
    }
  },
);

export default router;
