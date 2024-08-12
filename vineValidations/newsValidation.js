import vine from "@vinejs/vine";
import { customErrorReporter } from "./CustomError.js";

vine.errorReporter = () => new customErrorReporter();
const newsSchema = vine.object({
  title: vine.string().minLength(5).maxLength(290),
  content: vine.string().minLength(5),
});

export default newsSchema;
