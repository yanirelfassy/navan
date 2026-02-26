import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import agentRoutes from "./routes/agent";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/agent", agentRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
