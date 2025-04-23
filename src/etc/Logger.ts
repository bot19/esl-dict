import { times } from "lodash";
import { Context } from "./Context";

export class Logger {
  constructor(public context: Context) {}

  getText(message: string, emoji?: string) {
    return `${this.context.path.join(" > ")} ${emoji ?? "::"} ${message}`;
  }

  log(message: string) {
    console.log(this.getText(message));
  }

  err(message: string) {
    console.error(this.getText(message, "🚨"));
  }

  debug(object: unknown) {
    console.info(this.getText(JSON.stringify(object), "🐛"));
  }

  headline(message: string) {
    const paddingSize = 6;
    const padding = times(paddingSize - 1, () => "=").join("");

    const whitespace = times(paddingSize * 2 + message.length, () => "=").join(
      "",
    );

    console.log("");
    console.log(whitespace);
    console.log(`${padding} ${message} ${padding}`);
    console.log(whitespace);
  }

  setContext(context: Context) {
    this.context = context;
  }
}
