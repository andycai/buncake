export interface SyncConfig {
  // SVN 仓库 A 的配置
  repoA: {
    url: string;
    username?: string;
    password?: string;
    localPath: string;
  };
  // SVN 仓库 B 的配置
  repoB: {
    url: string;
    username?: string;
    password?: string;
    localPath: string;
  };
  // 日志文件路径
  logFile: string;
}

// 默认配置
export const defaultConfig: SyncConfig = {
  repoA: {
    url: '',
    localPath: '',
  },
  repoB: {
    url: '',
    localPath: '',
  },
  logFile: 'sync.log',
}; 