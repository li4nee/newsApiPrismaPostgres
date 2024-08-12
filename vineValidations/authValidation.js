import vine from "@vinejs/vine";
import { customErrorReporter } from "./CustomError.js";

// hamle afno custom error dekhauna rakhya
vine.errorReporter = () => new customErrorReporter();

const registrationSchema = vine.object({
  name: vine.string().minLength(2).maxLength(190),
  email: vine.string().email(),
  password: vine.string().minLength(8).maxLength(32).confirmed(), // confirmed gare chai password_confirmation ra password match huna parcha pathauda
});
const loginSchema = vine.object({
  email: vine.string().email(),
  password: vine.string(),
});
const updateSchema = vine.object({
  name: vine.string().minLength(2).maxLength(190),
  email: vine.string().email(),
});

export { registrationSchema ,loginSchema,updateSchema};
