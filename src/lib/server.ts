import { Server as BunServer } from "bun";
import Router from "./router";
import { Middleware, MiddlewareFunction } from "./middleware";
import logger from "./logger";

export interface ServerOptions {
  port: number;
  hostname: string;
}

export interface Request extends Request {
  params: Record<string, string>;
  query: Record<string, string>;
}

// 修复 Request 接口定义
export type ServerRequest = Request & {
  params: Record<string, string>;
  query: Record<string, string>;
};

export type Handler = (req: ServerRequest, res: Response) => Promise<Response | void> | Response | void;

/**
 * HTTP 服务器类
 */
export default class Server {
  private server: BunServer | null = null;
  private router: Router;
  private middlewares: MiddlewareFunction[] = [];
  private options: ServerOptions;

  constructor(options: Partial<ServerOptions> = {}) {
    this.options = {
      port: options.port || 3000,
      hostname: options.hostname || "localhost"
    };
    this.router = new Router();
  }

  /**
   * 添加中间件
   */
  use(middleware: MiddlewareFunction | Middleware): Server {
    if (typeof middleware === "function") {
      this.middlewares.push(middleware);
    } else if (middleware.handle && typeof middleware.handle === "function") {
      this.middlewares.push(middleware.handle.bind(middleware));
    }
    return this;
  }

  /**
   * 注册 GET 路由
   */
  get(path: string, handler: Handler): Server {
    this.router.add("GET", path, handler);
    return this;
  }

  /**
   * 注册 POST 路由
   */
  post(path: string, handler: Handler): Server {
    this.router.add("POST", path, handler);
    return this;
  }

  /**
   * 注册 PUT 路由
   */
  put(path: string, handler: Handler): Server {
    this.router.add("PUT", path, handler);
    return this;
  }

  /**
   * 注册 DELETE 路由
   */
  delete(path: string, handler: Handler): Server {
    this.router.add("DELETE", path, handler);
    return this;
  }

  /**
   * 处理请求
   */
  private async handleRequest(req: Request): Promise<Response> {
    // 扩展请求对象
    const serverReq = req as ServerRequest;
    
    // 解析请求参数
    const url = new URL(req.url);
    const path = url.pathname;
    const method = req.method;

    // 解析查询参数
    const query: Record<string, string> = {};
    url.searchParams.forEach((value, key) => {
      query[key] = value;
    });
    serverReq.query = query;
    serverReq.params = {};

    // 默认响应为 404
    let response = new Response("Not Found", { status: 404 });

    try {
      // 查找匹配的路由
      const match = this.router.match(method, path);
      
      if (match) {
        const { handler, params } = match;
        serverReq.params = params;

        // 创建中间件链
        let index = 0;
        const next = async (): Promise<void> => {
          if (index < this.middlewares.length) {
            const middleware = this.middlewares[index++];
            await middleware(serverReq, response, next);
          } else {
            // 执行路由处理程序
            const result = await handler(serverReq, response);
            if (result instanceof Response) {
              response = result;
            }
          }
        };

        // 开始执行中间件链
        await next();
      }
    } catch (error) {
      logger.error(`请求处理错误: ${error.message}`);
      response = new Response(`Internal Server Error: ${error.message}`, { status: 500 });
    }

    return response;
  }

  /**
   * 启动服务器
   */
  start(): Promise<void> {
    return new Promise((resolve) => {
      this.server = Bun.serve({
        port: this.options.port,
        hostname: this.options.hostname,
        fetch: this.handleRequest.bind(this),
      });

      logger.info(`服务器已启动: http://${this.options.hostname}:${this.options.port}`);
      resolve();
    });
  }

  /**
   * 停止服务器
   */
  stop(): void {
    if (this.server) {
      this.server.stop();
      this.server = null;
      logger.info("服务器已停止");
    }
  }
}