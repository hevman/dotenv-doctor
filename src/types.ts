export interface EnvEntry {
  key: string;
  value: string;
  line: number;
  quoted: boolean;
}

export interface EnvDocument {
  entries: EnvEntry[];
  duplicates: EnvEntry[];
}

export type IssueCode =
  | "missing"
  | "extra"
  | "empty"
  | "duplicate"
  | "secret-in-example"
  | "placeholder-in-env";

export type IssueLevel = "error" | "warning";

export interface EnvIssue {
  code: IssueCode;
  level: IssueLevel;
  key: string;
  message: string;
  line?: number;
}

export interface DoctorOptions {
  allowExtra?: boolean;
  requireFilled?: boolean;
  checkExampleSecrets?: boolean;
}

export interface DoctorReport {
  ok: boolean;
  issues: EnvIssue[];
  env: {
    keys: string[];
    duplicates: string[];
  };
  example: {
    keys: string[];
    duplicates: string[];
  };
}
