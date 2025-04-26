#!/usr/bin/env bun
import { parseArgs } from './lib/args';
import { executeAction } from './lib/executor';

async function main() {
  try {
    // 获取命令行参数
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
      console.log('用法: bun src/main.ts <action.method> [参数1] [参数2] ...');
      process.exit(1);
    }

    // 解析动作和方法
    const actionCommand = args[0];
    const params = args.slice(1);
    
    const { actionName, methodName } = parseArgs(actionCommand);
    
    // 执行对应的动作方法
    const result = await executeAction(actionName, methodName, params);
    
    // 输出结果
    if (result !== undefined) {
      console.log(result);
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error(`错误: ${error.message}`);
    } else {
      console.error(`错误: ${error}`);
    }
    process.exit(1);
  }
}

main();