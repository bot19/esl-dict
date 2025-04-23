import crypto from "crypto";

export const hashJson = (json: unknown, length = 30) =>
  crypto
    .createHash("sha256")
    .update(JSON.stringify(json))
    .digest("hex")
    .slice(0, length);
