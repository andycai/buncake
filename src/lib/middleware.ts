import { ServerRequest } from "./server";

export type NextFunction = () => Promise<void>;
export type MiddlewareFunction = (req: ServerRequest, res: Response, next: NextFunction) => Promise<void>;

/**
 * 中间件接口
 */
export interface Middleware {
  handle(req: ServerRequest, res: Response, next: NextFunction): Promise<void>;
}

/**
 * 日志中间件
 */
export class LoggerMiddleware implements Middleware {
  async handle(req: ServerRequest, res: Response, next: NextFunction): Promise<void> {
    const start = Date.now();
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    
    await next();
    
    const duration = Date.now() - start;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} - ${duration}ms`);
  }
}

/**
 * CORS 中间件
 */
export class CorsMiddleware implements Middleware {
  private options: {
    origin: string | string[];
    methods: string[];
    allowHeaders: string[];
  };

  constructor(options: Partial<{
    origin: string | string[];
    methods: string[];
    allowHeaders: string[];
  }> = {}) {
    this.options = {
      origin: options.origin || "*",
      methods: options.methods || ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowHeaders: options.allowHeaders || ["Content-Type", "Authorization"],
    };
  }

  async handle(req: ServerRequest, res: Response, next: NextFunction): Promise<void> {
    // 设置 CORS 头
    const headers = new Headers(res.headers);
    
    // 设置允许的源
    if (Array.isArray(this.options.origin)) {
      const requestOrigin = req.headers.get("Origin");
      if (requestOrigin && this.options.origin.includes(requestOrigin)) {
        headers.set("Access-Control-Allow-Origin", requestOrigin);
      }
    } else {
      headers.set("Access-Control-Allow-Origin", this.options.origin);
    }
    
    // 设置允许的方法
    headers.set("Access-Control-Allow-Methods", this.options.methods.join(", "));
    
    // 设置允许的头
    headers.set("Access-Control-Allow-Headers", this.options.allowHeaders.join(", "));
    
    // 处理预检请求
    if (req.method === "OPTIONS") {
      return;
    }
    
    await next();
  }
}