import { notFound } from "@/lib/response";
import { errorHandler } from "@/middlewares/error";
import { apiRouter } from "@/routes";

export async function handleRequest(req: Request): Promise<Response> {
  try {
    const res = await apiRouter.handle(req);
    if (res) {
      return res;
    }

    const url = new URL(req.url);
    return notFound(
      `Rota '${url.pathname}' com método '${req.method}' não encontrada.`,
    );
  } catch (error) {
    return errorHandler(error);
  }
}

export default handleRequest;
