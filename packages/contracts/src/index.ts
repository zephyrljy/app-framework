import { Type } from "typebox";

export const TokenSchema = Type.Object({ token: Type.String() });

export * from "./inputs.js";
