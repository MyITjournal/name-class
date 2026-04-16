// Local development entry point
import "dotenv/config";
import app from "./src/app.js";
import { initDb } from "./src/db/index.js";

const PORT = process.env.PORT || 3000;

//Database call
initDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to initialize database:", err.message);
    process.exit(1);
  });
