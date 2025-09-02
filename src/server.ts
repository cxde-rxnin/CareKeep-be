import { connectDB } from "./config/db";
import { PORT } from "./config/env";
import app from "./app";

connectDB();

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
