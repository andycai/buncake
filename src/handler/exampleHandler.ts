import exampleService from '../service/exampleService';
import logger from '../lib/logger';

/**
 * 示例处理器
 */
class ExampleHandler {
  /**
   * 处理数据请求
   */
  async handleDataRequest(id: string): Promise<any> {
    logger.info(`处理数据请求，ID: ${id}`);
    
    try {
      const data = await exampleService.getData(id);
      return data;
    } catch (error) {
      if (error instanceof Error) {
        logger.error(`处理数据请求失败: ${error.message}`);
        throw error;
      }
    }
  }

  /**
   * HTTP 示例处理方法
   */
  async handleHttpRequest(req: any, res: any): Promise<any> {
    const id = req.params.id || "default";
    try {
      const data = await this.handleDataRequest(id);
      return new Response(JSON.stringify(data), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      });
    } catch (error) {
      if (error instanceof Error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: {
            "Content-Type": "application/json",
          },
        });
      }
    }
  }
}

export default new ExampleHandler();