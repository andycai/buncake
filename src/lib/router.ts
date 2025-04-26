import { Handler } from "./server";
import logger from "./logger";

interface RouteMatch {
  handler: Handler;
  params: Record<string, string>;
}

interface Route {
  method: string;
  path: string;
  pattern: RegExp;
  paramNames: string[];
  handler: Handler;
}

/**
 * 路由管理类
 */
export default class Router {
  private routes: Route[] = [];

  /**
   * 添加路由
   */
  add(method: string, path: string, handler: Handler): void {
    // 解析路径参数
    const paramNames: string[] = [];
    const pattern = this.pathToRegexp(path, paramNames);

    this.routes.push({
      method: method.toUpperCase(),
      path,
      pattern,
      paramNames,
      handler,
    });

    logger.debug(`注册路由: ${method.toUpperCase()} ${path}`);
  }

  /**
   * 将路径转换为正则表达式
   */
  private pathToRegexp(path: string, paramNames: string[]): RegExp {
    // 替换路径参数为正则表达式捕获组
    const patternStr = path
      .replace(/\//g, "\\/")  // 转义斜杠
      .replace(/:\w+/g, (match) => {
        const paramName = match.slice(1);
        paramNames.push(paramName);
        return "([^\\/]+)";
      });

    // 创建正则表达式
    return new RegExp(`^${patternStr}$`);
  }

  /**
   * 匹配路由
   */
  match(method: string, path: string): RouteMatch | null {
    method = method.toUpperCase();

    for (const route of this.routes) {
      if (route.method !== method) continue;

      const matches = path.match(route.pattern);
      if (matches) {
        const params: Record<string, string> = {};
        
        // 提取路径参数
        for (let i = 0; i < route.paramNames.length; i++) {
          params[route.paramNames[i]] = matches[i + 1];
        }

        return {
          handler: route.handler,
          params,
        };
      }
    }

    return null;
  }
}