import express from "express";
import classifyRouter from "./routes/classify.js";
import profilesRouter from "./routes/profiles.js";

const app = express();

app.use(express.json());

app.use((_req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  next();
});

app.get("/", (_req, res) => {
  res.json({ status: "OK", message: "Name Classification API is running" });
});

app.use("/api/classify", classifyRouter);
app.use("/api/profiles", profilesRouter);

export default app;
