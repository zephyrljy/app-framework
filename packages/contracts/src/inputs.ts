import { Type, type Static } from "typebox";

export const LoginSchema = Type.Object(
  { password: Type.String({ minLength: 1 }) },
  { additionalProperties: false },
);

export type LoginInput = Static<typeof LoginSchema>;
