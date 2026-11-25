import express from "express";
import authRoute from "./routes/auth.routes";
import {errorHandler} from "./middlewares/error.middleware";

const app = express();

// Trust the first proxy hop so req.ip reflects the real client IP address
// rather than the internal proxy address.  Without this, all rate-limiter
// IP keys resolve to the same loopback address, making every client share
// one counter.
//
// Set to `1` (single hop) for most Docker / nginx setups.  Adjust to the
// number of trusted proxy hops in your infrastructure, or set to a trusted
// CIDR string if you need stricter control.
app.set("trust proxy", 1);

app.use(express.json());

app.use("/api/auth",authRoute);
app.use(errorHandler);

export default app;