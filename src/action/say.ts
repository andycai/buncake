/**
 * Say 类示例
 */
export default class Say {
  /**
   * 打招呼方法
   */
  hello(name: string, title?: string): string {
    if (title) {
      return `你好，${title} ${name}！`;
    }
    return `你好，${name}！`;
  }
}

/**
 * 直接导出的函数示例
 */
export function hello(name: string, title?: string): string {
  if (title) {
    return `你好，${title} ${name}！`;
  }
  return `你好，${name}！`;
}