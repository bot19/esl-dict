import { existsSync, rmSync } from "fs";
import path from "path";

export const clearLogs = () => {
  const logFilePath = path.join(__dirname, "../logs.txt");
  if (existsSync(logFilePath)) rmSync(logFilePath);
};
