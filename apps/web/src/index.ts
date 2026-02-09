import { ENV } from "@ffh/env";
import type { ApiResponse } from "@ffh/types";

const server = Bun.serve({
  port: ENV.PORT_WEB,
  fetch(req) {
    const url = new URL(req.url);

    if (url.pathname === "/") {
      return new Response(
        `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>@ffh/web</title>
</head>
<body>
  <h1>Freya Fal Hackathon 🚀</h1>
  <p>Web app is running.</p>
</body>
</html>`,
        { headers: { "Content-Type": "text/html" } }
      );
    }

    return Response.json(
      { success: false, error: "Not Found" } satisfies ApiResponse<never>,
      { status: 404 }
    );
  },
});

console.log(`🌐 Web server running at http://localhost:${server.port}`);
