import fs from "fs";
import path from "path";

const logData = (data: unknown, label = "unknown") => {
  fs.writeFileSync(
    path.join(".", "logs.txt"),
    `${label} ${JSON.stringify(data)}\n`,
    { flag: "a" },
  );
};

export default logData;
