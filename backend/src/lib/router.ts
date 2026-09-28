import { corsPreflightResponse, notFound } from "@/lib/response";

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: number;
}

export interface RequestContext {
  params: Record<string, string>;
  url: URL;
  user?: AuthenticatedUser;
}

export type RouteHandler = (
  req: Request,
  ctx: RequestContext,
) => Promise<Response | void> | Response | void;

interface RouteDefinition {
  method: string;
  path: string;
  regex: RegExp;
  paramNames: string[];
  handlers: RouteHandler[];
}

export class Router {
  private routes: RouteDefinition[] = [];
  private prefix: string;

  constructor(options?: { prefix?: string }) {
    this.prefix = options?.prefix ? this.cleanPath(options.prefix) : "";
  }

  private cleanPath(path: string): string {
    let p = path.replace(/\/+/g, "/");
    if (!p.startsWith("/")) {
      p = `/${p}`;
    }
    if (p.length > 1 && p.endsWith("/")) {
      p = p.slice(0, -1);
    }
    return p;
  }

  private pathToRegex(path: string): { regex: RegExp; paramNames: string[] } {
    const paramNames: string[] = [];
    const normalized = this.cleanPath(path);

    // Substitui :param por regex de captura e salva o nome
    const regexPattern = normalized
      .replace(/:([a-zA-Z0-9_]+)/g, (_, name) => {
        paramNames.push(name);
        return "([^/]+)";
      })
      .replace(/\//g, "\\/");

    return {
      regex: new RegExp(`^${regexPattern}$`),
      paramNames,
    };
  }

  public add(method: string, path: string, ...handlers: RouteHandler[]): this {
    const fullPath = this.cleanPath(`${this.prefix}${path}`);
    const { regex, paramNames } = this.pathToRegex(fullPath);

    this.routes.push({
      method: method.toUpperCase(),
      path: fullPath,
      regex,
      paramNames,
      handlers,
    });

    return this;
  }

  public get(path: string, ...handlers: RouteHandler[]): this {
    return this.add("GET", path, ...handlers);
  }

  public post(path: string, ...handlers: RouteHandler[]): this {
    return this.add("POST", path, ...handlers);
  }

  public put(path: string, ...handlers: RouteHandler[]): this {
    return this.add("PUT", path, ...handlers);
  }

  public patch(path: string, ...handlers: RouteHandler[]): this {
    return this.add("PATCH", path, ...handlers);
  }

  public delete(path: string, ...handlers: RouteHandler[]): this {
    return this.add("DELETE", path, ...handlers);
  }

  public use(prefix: string, router: Router): this {
    for (const route of router.routes) {
      const fullPath = this.cleanPath(`${this.prefix}${prefix}${route.path}`);
      const { regex, paramNames } = this.pathToRegex(fullPath);
      this.routes.push({
        method: route.method,
        path: fullPath,
        regex,
        paramNames,
        handlers: route.handlers,
      });
    }
    return this;
  }

  public async handle(req: Request): Promise<Response | null> {
    if (req.method === "OPTIONS") {
      return corsPreflightResponse();
    }

    const url = new URL(req.url);
    const pathname = this.cleanPath(url.pathname);
    const method = req.method.toUpperCase();

    for (const route of this.routes) {
      if (route.method !== method) {
        continue;
      }

      const match = pathname.match(route.regex);
      if (match) {
        const params: Record<string, string> = {};
        route.paramNames.forEach((name, index) => {
          params[name] = decodeURIComponent(match[index + 1]);
        });

        const ctx: RequestContext = {
          params,
          url,
        };

        for (const handler of route.handlers) {
          const res = await handler(req, ctx);
          if (res instanceof Response) {
            return res;
          }
        }

        // Se chegou ao fim dos handlers sem Response, retorna 404
        return notFound(
          `Nenhum manipulador retornou resposta para ${method} ${pathname}`,
        );
      }
    }

    return null;
  }
}
