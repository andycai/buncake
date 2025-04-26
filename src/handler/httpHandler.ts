import { ServerRequest } from "../lib/server";
import logger from "../lib/logger";

/**
 * HTTP 处理程序
 */
class HttpHandler {
  /**
   * 首页处理
   */
  async home(req: ServerRequest): Promise<Response> {
    return new Response("欢迎使用 BunCake 框架!", {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
      },
    });
  }

  /**
   * 获取用户信息
   */
  async getUser(req: ServerRequest): Promise<Response> {
    const userId = req.params.id;
    
    // 模拟用户数据
    const user = {
      id: userId,
      name: `用户${userId}`,
      email: `user${userId}@example.com`,
      createdAt: new Date().toISOString(),
    };
    
    return new Response(JSON.stringify(user), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  /**
   * 创建用户
   */
  async createUser(req: ServerRequest): Promise<Response> {
    try {
      // 解析请求体
      const userData = await req.json();
      
      // 模拟创建用户
      const user = {
        id: Math.floor(Math.random() * 1000),
        ...userData,
        createdAt: new Date().toISOString(),
      };
      
      logger.info(`创建用户: ${JSON.stringify(user)}`);
      
      return new Response(JSON.stringify(user), {
        status: 201,
        headers: {
          "Content-Type": "application/json",
        },
      });
    } catch (error) {
      logger.error(`创建用户失败: ${error.message}`);
      
      return new Response(JSON.stringify({ error: "无效的请求数据" }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }
  }

  /**
   * API 404 处理
   */
  async notFound(): Promise<Response> {
    return new Response(JSON.stringify({ error: "API 端点不存在" }), {
      status: 404,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
}

export default new HttpHandler();