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
      logger.error(`处理数据请求失败: ${error.message}`);
      throw error;
    }
  }
}

export default new ExampleHandler();