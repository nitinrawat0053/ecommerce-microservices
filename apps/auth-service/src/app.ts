import express from "express";
import authRoute from "./routes/auth.routes";
import {errorHandler} from "./middlewares/error.middleware";

const app = express();

app.use(express.json());

app.use("/api/auth",authRoute);
app.use(errorHandler);

export default app;