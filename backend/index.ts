import express from "express";
import { initDb } from "./utils/db";
import { identRoutes } from "./routes/identRoutes";

const app = express();
const PORT = parseInt(process.env.PORT || "3000", 10);
const cors = require("cors");

app.use(cors({
  // origin: ["http://localhost:5500", "http://127.0.0.1:5500"],
  // methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  // allowedHeaders: ["Content-Type"]
}));

app.use(express.json());

// DB initialisieren (Tabellen anlegen, falls nicht vorhanden)
initDb();

app.get("/", (_req, res) => {
  res.send(`
    <style>
      * { background-color: #57b1ffff; margin: 15px; padding: 0; box-sizing: border-box; }
      h1 { color: #031521ff; font-family: Arial, sans-serif; }
      p { font-size: 18px; color: #2c3e50; }
    </style>
    <h1>Willkommen bei Rendar Systems</h1>
    <p>Imperiale Software seit der Gründung</p>
  `);
});

app.use("/api", identRoutes);

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
