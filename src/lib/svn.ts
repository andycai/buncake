import { exec } from 'child_process';
import { promisify } from 'util';
import { existsSync } from 'fs';
import { join } from 'path';

const execAsync = promisify(exec);

export interface SvnOptions {
  username?: string;
  password?: string;
  cwd?: string;
}

export interface SvnInfo {
  url: string;
  revision: string;
  lastChangedAuthor: string;
  lastChangedRev: string;
  lastChangedDate: string;
}

export interface SvnStatus {
  path: string;
  status: string;
  workingCopyRev?: string;
}

export class SvnError extends Error {
  constructor(message: string, public code: number) {
    super(message);
    this.name = 'SvnError';
  }
}

/**
 * SVN 操作类
 */
export class Svn {
  private options: SvnOptions;

  constructor(options: SvnOptions = {}) {
    this.options = options;
  }

  /**
   * 检查 SVN 是否可用
   */
  private async checkSvn(): Promise<void> {
    try {
      await execAsync('svn --version');
    } catch (error) {
      throw new SvnError('SVN 未安装或未在 PATH 中', 1);
    }
  }

  /**
   * 构建 SVN 命令
   */
  private buildCommand(command: string, args: string[] = []): string {
    const cmd = ['svn', command, ...args];
    
    if (this.options.username) {
      cmd.push('--username', this.options.username);
    }
    
    if (this.options.password) {
      cmd.push('--password', this.options.password);
    }
    
    return cmd.join(' ');
  }

  /**
   * 执行 SVN 命令
   */
  private async execute(command: string, args: string[] = []): Promise<string> {
    await this.checkSvn();
    
    const cmd = this.buildCommand(command, args);
    const cwd = this.options.cwd || process.cwd();
    
    try {
      const { stdout } = await execAsync(cmd, { cwd });
      return stdout.trim();
    } catch (error) {
      if (error instanceof Error) {
        throw new SvnError(error.message, 1);
      }
      throw new SvnError('未知错误', 1);
    }
  }

  /**
   * 检出代码
   */
  async checkout(url: string, path: string): Promise<void> {
    await this.execute('checkout', [url, path]);
  }

  /**
   * 更新代码
   */
  async update(path: string = '.'): Promise<void> {
    await this.execute('update', [path]);
  }

  /**
   * 提交更改
   */
  async commit(path: string, message: string): Promise<void> {
    await this.execute('commit', ['-m', `"${message}"`, path]);
  }

  /**
   * 添加文件
   */
  async add(path: string): Promise<void> {
    await this.execute('add', [path]);
  }

  /**
   * 删除文件
   */
  async delete(path: string): Promise<void> {
    await this.execute('delete', [path]);
  }

  /**
   * 获取文件状态
   */
  async status(path: string = '.'): Promise<SvnStatus[]> {
    const output = await this.execute('status', ['-v', path]);
    return output.split('\n')
      .filter(line => line.trim())
      .map(line => {
        const status = line[0];
        const workingCopyRev = line.slice(1, 8).trim();
        const path = line.slice(8).trim();
        return { path, status, workingCopyRev };
      });
  }

  /**
   * 获取仓库信息
   */
  async info(path: string = '.'): Promise<SvnInfo> {
    const output = await this.execute('info', [path]);
    const info: Partial<SvnInfo> = {};
    
    output.split('\n').forEach(line => {
      const [key, value] = line.split(':').map(s => s.trim());
      switch (key) {
        case 'URL':
          info.url = value;
          break;
        case 'Revision':
          info.revision = value;
          break;
        case 'Last Changed Author':
          info.lastChangedAuthor = value;
          break;
        case 'Last Changed Rev':
          info.lastChangedRev = value;
          break;
        case 'Last Changed Date':
          info.lastChangedDate = value;
          break;
      }
    });
    
    return info as SvnInfo;
  }

  /**
   * 创建分支
   */
  async branch(url: string, path: string, message: string): Promise<void> {
    await this.execute('copy', ['-m', `"${message}"`, url, path]);
  }

  /**
   * 合并分支
   */
  async merge(source: string, target: string): Promise<void> {
    await this.execute('merge', [source, target]);
  }

  /**
   * 还原更改
   */
  async revert(path: string): Promise<void> {
    await this.execute('revert', [path]);
  }

  /**
   * 清理工作副本
   */
  async cleanup(path: string = '.'): Promise<void> {
    await this.execute('cleanup', [path]);
  }
} 

/*
const svn = new Svn({
  username: 'your-username',
  password: 'your-password',
  cwd: '/path/to/working/copy'
});

// 检出代码
await svn.checkout('https://svn.example.com/repo', './local-path');

// 更新代码
await svn.update();

// 提交更改
await svn.commit('./path/to/file', '提交信息');

// 查看状态
const status = await svn.status();
console.log(status);

// 获取仓库信息
const info = await svn.info();
console.log(info);
*/