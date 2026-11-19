// One structured JSON line per event (AGENTS.md): level, message, path,
// method, plus safe extras like an error code or a submission id. Never names,
// emails, messages, tokens, or secrets.

export type LogLevel = "info" | "warn" | "error";
type LogFields = {
  readonly path: string;
  readonly method: string;
  readonly [key: string]: string | number | boolean | readonly string[] | undefined;
};

export const logEvent = (level: LogLevel, message: string, fields: LogFields): void => {
  const line = JSON.stringify({ level, message, ...fields });
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
};
