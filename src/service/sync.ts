import { existsSync, mkdirSync, readdirSync, statSync, unlinkSync, rmdirSync, writeFileSync, appendFileSync } from 'fs';
import { join, relative, resolve } from 'path';
import { Svn, SvnOptions } from '../lib/svn';
import { SyncConfig } from '../config/sync';
import logger from '../lib/logger';

export class SyncError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SyncError';
  }
}

export class Sync {
  private svnA: Svn;
  private svnB: Svn;
  private config: SyncConfig;
  private logs: string[] = [];

  constructor(config: SyncConfig) {
    this.config = config;
    
    // 初始化 SVN 客户端
    const svnOptionsA: SvnOptions = {
      username: config.repoA.username,
      password: config.repoA.password,
      cwd: config.repoA.localPath,
    };
    
    const svnOptionsB: SvnOptions = {
      username: config.repoB.username,
      password: config.repoB.password,
      cwd: config.repoB.localPath,
    };
    
    this.svnA = new Svn(svnOptionsA);
    this.svnB = new Svn(svnOptionsB);
  }

  /**
   * 添加日志
   */
  private log(message: string): void {
    const logMessage = `[${new Date().toISOString()}] ${message}`;
    this.logs.push(logMessage);
    logger.info(message);
  }

  /**
   * 保存日志到文件
   */
  private saveLogs(): void {
    const logContent = this.logs.join('\n') + '\n';
    appendFileSync(this.config.logFile, logContent);
  }

  /**
   * 获取目录下的所有文件和文件夹
   */
  private getAllFiles(dir: string): string[] {
    const files: string[] = [];
    
    const walk = (currentDir: string) => {
      const items = readdirSync(currentDir);
      
      for (const item of items) {
        const fullPath = join(currentDir, item);
        const stat = statSync(fullPath);
        
        if (stat.isDirectory()) {
          files.push(fullPath);
          walk(fullPath);
        } else {
          files.push(fullPath);
        }
      }
    };
    
    walk(dir);
    return files;
  }

  /**
   * 同步文件
   */
  private async syncFile(sourcePath: string, targetPath: string): Promise<void> {
    const relativePath = relative(this.config.repoA.localPath, sourcePath);
    const targetFullPath = join(this.config.repoB.localPath, relativePath);
    
    // 如果目标文件不存在，需要添加
    if (!existsSync(targetFullPath)) {
      this.log(`添加文件: ${relativePath}`);
      await this.svnB.add(targetFullPath);
    }
  }

  /**
   * 同步目录
   */
  private async syncDirectory(sourcePath: string, targetPath: string): Promise<void> {
    const relativePath = relative(this.config.repoA.localPath, sourcePath);
    const targetFullPath = join(this.config.repoB.localPath, relativePath);
    
    // 如果目标目录不存在，创建并添加
    if (!existsSync(targetFullPath)) {
      mkdirSync(targetFullPath, { recursive: true });
      this.log(`添加目录: ${relativePath}`);
      await this.svnB.add(targetFullPath);
    }
  }

  /**
   * 检查并删除多余的文件和目录
   */
  private async checkAndRemoveExtraFiles(sourceFiles: string[], targetFiles: string[]): Promise<void> {
    const sourceSet = new Set(sourceFiles.map(f => relative(this.config.repoA.localPath, f)));
    const targetSet = new Set(targetFiles.map(f => relative(this.config.repoB.localPath, f)));
    
    for (const targetFile of targetSet) {
      if (!sourceSet.has(targetFile)) {
        const fullPath = join(this.config.repoB.localPath, targetFile);
        this.log(`删除: ${targetFile}`);
        await this.svnB.delete(fullPath);
      }
    }
  }

  /**
   * 执行同步
   */
  async sync(paths: string[]): Promise<string[]> {
    try {
      this.log('开始同步操作');
      
      // 1. 还原两个仓库
      this.log('还原仓库 A');
      await this.svnA.revert('.');
      
      this.log('还原仓库 B');
      await this.svnB.revert('.');
      
      // 2. 更新两个仓库
      this.log('更新仓库 A');
      await this.svnA.update();
      
      this.log('更新仓库 B');
      await this.svnB.update();
      
      // 3. 遍历并同步指定路径
      for (const path of paths) {
        const sourcePath = join(this.config.repoA.localPath, path);
        const targetPath = join(this.config.repoB.localPath, path);
        
        if (!existsSync(sourcePath)) {
          throw new SyncError(`源路径不存在: ${sourcePath}`);
        }
        
        // 获取源目录下的所有文件和目录
        const sourceFiles = this.getAllFiles(sourcePath);
        const targetFiles = this.getAllFiles(targetPath);
        
        // 同步文件和目录
        for (const file of sourceFiles) {
          const stat = statSync(file);
          if (stat.isDirectory()) {
            await this.syncDirectory(file, targetPath);
          } else {
            await this.syncFile(file, targetPath);
          }
        }
        
        // 检查并删除多余的文件
        await this.checkAndRemoveExtraFiles(sourceFiles, targetFiles);
      }
      
      // 4. 提交更改
      this.log('提交更改到仓库 B');
      await this.svnB.commit('.', 'Sync from repository A');
      
      this.log('同步完成');
      this.saveLogs();
      
      return this.logs;
    } catch (error) {
      if (error instanceof Error) {
        this.log(`同步失败: ${error.message}`);
        this.saveLogs();
        throw new SyncError(error.message);
      }
      throw new SyncError('未知错误');
    }
  }
} 