import express from "express";
import axios from "axios";

const app = express();

app.use((_req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  next();
});

app.get("/api/classify", async (req, res) => {
  const { name } = req.query;

  if (name === undefined || name === "") {
    return res
      .status(400)
      .json({ status: "error", message: "A valid name is required" });
  }

  if (typeof name !== "string") {
    return res
      .status(422)
      .json({ status: "error", message: "Unprocessable Entity" });
  }

  try {
    const { data } = await axios.get("https://api.genderize.io", {
      params: { name },
      timeout: 3500,
    });

    const { gender, probability, count } = data;

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
    const isUpstreamError =
      error.code === "ECONNABORTED" ||
      (error.response && error.response.status >= 500);
    return res.status(isUpstreamError ? 502 : 500).json({
      status: "error",
      message: isUpstreamError
        ? "Failed to reach gender prediction service"
        : "Internal server error",
    });
  }
});

export default app;
