import express from "express";
import cors from "cors";
import userRoutes from "./routes/userRoutes.js";
const app = express();

const allowedOrigins = [
  "http://localhost:5173", // for local dev
  "https://flow-board-blxr4X6hf-jatin-4291s-projects.vercel.app", // your Vercel frontend
];

app.use(
  cors({
    origin: allowedOrigins,
    methods: "GET,POST,PUT,PATCH,DELETE",
    credentials: true,
  })
);

// app.use(bodyParser.raw({ type: "application/json" }));

app.use((req, res, next) => {
  next();
});

app.get("/", (req, res, next) => {
  return res.status(200).json({
    status: "ok",
  });
});
app.use(`/api/v1/users`, userRoutes);

export default app;
