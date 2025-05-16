import express from "express";
import cors from "cors";
import userRoutes from "./Routes/userRoutes.js";
const app = express();

const allowedOrigins = [
  "http://localhost:5173", // for local dev
  "https://flow-board-q4kyrhp5e-jatin-4291s-projects.vercel.app", // your Vercel frontend
  // /^https:\/\/flow-board-.*\.vercel\.app$/, // for any Vercel deployment
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
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
