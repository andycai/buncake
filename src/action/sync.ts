import { Sync, SyncError } from '../service/sync';
import { SyncConfig, defaultConfig } from '../config/sync';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import logger from '../lib/logger';

export class SyncAction {
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
   * 执行同步操作
   */
  async sync(paths: string[]): Promise<string[]> {
    try {
      const sync = new Sync(this.config);
      return await sync.sync(paths);
    } catch (error) {
      if (error instanceof SyncError) {
        logger.error(`同步失败: ${error.message}`);
        throw error;
      }
      if (error instanceof Error) {
        logger.error(`错误: ${error.message}`);
        throw new SyncError(error.message);
      }
      throw new SyncError('未知错误');
    }
  }

  /**
   * 命令行入口
   */
  async cli(paths: string[]): Promise<void> {
    try {
      const logs = await this.sync(paths);
      console.log(logs.join('\n'));
    } catch (error) {
      if (error instanceof SyncError) {
        console.error(`同步失败: ${error.message}`);
      } else if (error instanceof Error) {
        console.error(`错误: ${error.message}`);
      } else {
        console.error('未知错误');
      }
      process.exit(1);
    }
  }
}

export default new SyncAction(); 