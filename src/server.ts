import express from "express";
import bodyParser from "body-parser";
import router from './routes';
import dotenv from "dotenv";

dotenv.config();

console.log(process.env.GEMINI_API_KEY)
const app = express();
app.use(bodyParser.json());

app.use('/v1', router)

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
