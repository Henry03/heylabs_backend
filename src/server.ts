import express from "express";
import bodyParser from "body-parser";
import router from './routes';
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import "../src/services/courier/report.scheduler";

dotenv.config();

const app = express();

const allowedOrigins = [
  "http://localhost:7000",
  "https://heylabs.id",
  "http://heylabs.id"
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

app.use(bodyParser.json());

app.use('/api/v1', router)

app.use(
    "/generatedReport",
    express.static(
        path.join(__dirname, "../public/generatedReport")
    )
);

const PORT = process.env.PORT;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
