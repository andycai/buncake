/**
 * 解析命令行参数，将 action.method 格式解析为 actionName 和 methodName
 */
export function parseArgs(actionCommand: string): { actionName: string; methodName: string } {
  const parts = actionCommand.split('.');
  
  if (parts.length !== 2) {
    throw new Error('命令格式错误，应为 "action.method"');
  }
  
  const [actionName, methodName] = parts;
  
  if (!actionName || !methodName) {
    throw new Error('动作名和方法名不能为空');
  }
  
  return { actionName, methodName };
}