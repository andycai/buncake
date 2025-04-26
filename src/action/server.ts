import Server from "../lib/server";
import { LoggerMiddleware, CorsMiddleware } from "../lib/middleware";
import httpHandler from "../handler/httpHandler";
import logger from "../lib/logger";

/**
 * 服务器管理类
 */
class ServerAction {
  private server: Server | null = null;

  /**
   * 启动服务器
   */
  async start(port?: string): Promise<string> {
    try {
      const serverPort = port ? parseInt(port, 10) : 3000;
      
      // 创建服务器实例
      this.server = new Server({
        port: serverPort,
        hostname: "0.0.0.0",
      });
      
      // 添加中间件
      this.server.use(new LoggerMiddleware());
      this.server.use(new CorsMiddleware());
      
      // 注册路由
      this.server.get("/", httpHandler.home.bind(httpHandler));
      this.server.get("/api/users/:id", httpHandler.getUser.bind(httpHandler));
      this.server.post("/api/users", httpHandler.createUser.bind(httpHandler));
      
      // 启动服务器
      await this.server.start();
      
      return `服务器已启动，监听端口: ${serverPort}`;
    } catch (error) {
      logger.error(`启动服务器失败: ${error.message}`);
      return `启动服务器失败: ${error.message}`;
    }
  }

  /**
   * 停止服务器
   */
  stop(): string {
    if (this.server) {
      this.server.stop();
      this.server = null;
      return "服务器已停止";
    }
    return "服务器未运行";
  }
}

export default new ServerAction();