import { Router } from "@/lib/router";
import { uploadsController } from "@/modules/uploads/uploads.controller";

// Leitura pública dos arquivos de imagem, montada em /uploads. A profundidade é
// fixa (escopo/dono/arquivo) e cada segmento passa por lista branca no controller.
export const uploadsRoutes = new Router();

uploadsRoutes.get("/:scope/:ownerId/:file", (req, ctx) =>
  uploadsController.serve(req, ctx),
);

export default uploadsRoutes;
