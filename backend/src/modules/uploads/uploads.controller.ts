import { CORS_HEADERS, notFound } from "@/lib/response";
import { RequestContext } from "@/lib/router";
import { resolveUploadPath } from "@/lib/uploads";

// Os nomes nunca mudam (UUID novo a cada arquivo), então o cache pode ser imutável.
export const UPLOAD_CACHE_CONTROL = "public, max-age=31536000, immutable";
export const UPLOAD_CONTENT_TYPE = "image/webp";

const FILE_NOT_FOUND_MESSAGE = "Arquivo não encontrado.";

export class UploadsController {
  // GET /uploads/:scope/:ownerId/:file — público, sem consultar o banco. Serve
  // o arquivo enquanto ele existir no volume, inclusive de foto, variação ou
  // produto excluídos logicamente (PRD).
  async serve(_req: Request, ctx: RequestContext): Promise<Response> {
    const { scope, ownerId, file } = ctx.params;
    const absolutePath = resolveUploadPath(scope ?? "", ownerId ?? "", file ?? "");
    if (!absolutePath) {
      return notFound(FILE_NOT_FOUND_MESSAGE);
    }

    const bunFile = Bun.file(absolutePath);
    if (!(await bunFile.exists())) {
      return notFound(FILE_NOT_FOUND_MESSAGE);
    }

    return new Response(bunFile, {
      status: 200,
      headers: {
        ...CORS_HEADERS,
        "Content-Type": UPLOAD_CONTENT_TYPE,
        "Cache-Control": UPLOAD_CACHE_CONTROL,
        "X-Content-Type-Options": "nosniff",
      },
    });
  }
}

export const uploadsController = new UploadsController();
export default uploadsController;
