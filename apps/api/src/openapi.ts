import { OpenAPIGenerator } from "@orpc/openapi";
import { ZodToJsonSchemaConverter } from "@orpc/zod/zod4";
import { router } from "./router";

const generator = new OpenAPIGenerator({
  schemaConverters: [new ZodToJsonSchemaConverter()],
});

export async function generateOpenAPISpec() {
  return await generator.generate(router, {
    info: {
      title: "FFH API",
      version: "0.1.0",
      description: "Freya Fal Hackathon API",
    },
  });
}
