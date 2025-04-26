import { existsSync } from 'fs';
import { join } from 'path';

/**
 * 执行指定的动作方法
 */
export async function executeAction(
  actionName: string,
  methodName: string,
  params: string[]
): Promise<any> {
  // 构建动作文件路径
  const actionFilePath = join(process.cwd(), 'src', 'action', `${actionName}.ts`);
  
  // 检查文件是否存在
  if (!existsSync(actionFilePath)) {
    throw new Error(`动作文件不存在: ${actionName}.ts`);
  }
  
  try {
    // 动态导入动作模块
    const actionModule = await import(`../action/${actionName}.ts`);
    
    // 检查是否存在指定的方法或类
    if (typeof actionModule[methodName] === 'function') {
      // 直接调用函数
      return await actionModule[methodName](...params);
    } else if (typeof actionModule.default === 'function') {
      // 检查默认导出是否为类构造函数
      const ActionClass = actionModule.default;
      const instance = new ActionClass();
      
      if (typeof instance[methodName] === 'function') {
        // 调用类实例方法
        return await instance[methodName](...params);
      }
    } else if (actionModule.default && typeof actionModule.default[methodName] === 'function') {
      // 检查默认导出对象上的方法
      return await actionModule.default[methodName](...params);
    }
    
    throw new Error(`在 ${actionName}.ts 中找不到方法: ${methodName}`);
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'MODULE_NOT_FOUND') {
      throw new Error(`无法加载动作模块: ${actionName}`);
    }
    throw error;
  }
}