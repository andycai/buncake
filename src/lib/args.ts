/**
 * 解析命令行参数
 */
export function parseArgs(command: string): { actionName: string; methodName: string } {
  // 支持两种格式：
  // 1. action.method
  // 2. action.resources
  const parts = command.split('.');
  
  if (parts.length !== 2) {
    throw new Error('无效的命令格式，请使用 action.method 或 action.resources 格式');
  }
  
  const [actionName, methodName] = parts;
  
  // 如果方法是 resources，则使用 cli 方法
  if (methodName === 'resources') {
    return { actionName, methodName: 'cli' };
  }
  
  return { actionName, methodName };
}