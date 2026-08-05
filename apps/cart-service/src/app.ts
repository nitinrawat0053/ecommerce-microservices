import express from "express";
import cartRoutes from "./routes/cart.routes";

const app = express();

app.use(express.json());

app.use("/api/cart", cartRoutes);

export default app;