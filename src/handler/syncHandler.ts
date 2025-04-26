import { Sync, SyncError } from '../service/sync';
import { SyncConfig, defaultConfig } from '../config/sync';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { ServerRequest } from '../lib/server';

export class SyncHandler {
  private config: SyncConfig;

  constructor() {
    // 读取配置文件
    const configPath = join(process.cwd(), 'config.json');
    if (!existsSync(configPath)) {
      throw new Error('配置文件不存在: config.json');
    }

    this.config = {
      ...defaultConfig,
      ...JSON.parse(readFileSync(configPath, 'utf-8')),
    };
  }

  /**
   * 处理同步请求
   */
  async handleSync(req: ServerRequest): Promise<Response> {
    try {
      // 获取请求参数
      const paths = req.query.paths;
      if (!paths) {
        return new Response('请指定要同步的路径，多个路径用逗号分隔', {
          status: 400,
          headers: { 'Content-Type': 'text/plain' },
        });
      }

      const pathList = paths.split(',').map(p => p.trim());

      // 创建同步实例并执行
      const sync = new Sync(this.config);
      const logs = await sync.sync(pathList);

      // 返回日志
      return new Response(logs.join('\n'), {
        status: 200,
        headers: { 'Content-Type': 'text/plain' },
      });
    } catch (error) {
      let message = '未知错误';
      if (error instanceof SyncError) {
        message = `同步失败: ${error.message}`;
      } else if (error instanceof Error) {
        message = `错误: ${error.message}`;
      }

      return new Response(message, {
        status: 500,
        headers: { 'Content-Type': 'text/plain' },
      });
    }
  }
}

export default new SyncHandler(); 