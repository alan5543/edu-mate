import requests
from config.logger import setup_logging
from plugins_func.register import register_function, ToolType, ActionResponse, Action

TAG = __name__
logger = setup_logging()

SEARCH_FROM_TAVILY_FUNCTION_DESC = {
    "type": "function",
    "function": {
        "name": "search_from_tavily",
        "description": (
            "搜索互联网获取最新、实时信息。适用于新闻、时事、最新动态等需要实时数据的查询。"
            "对于百科类事实性问题（人物、历史、科学概念等），请优先使用search_from_wikipedia。"
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "query": {
                    "type": "string",
                    "description": "搜索关键词，应该是简洁明确的搜索查询语句",
                },
                "lang": {
                    "type": "string",
                    "description": "返回用户使用的语言code，例如zh_CN/en_US/ja_JP等，默认zh_CN",
                },
            },
            "required": ["query"],
        },
    },
}


def _do_tavily_search(api_key, query, max_results=3, search_depth="basic", include_answer=True, include_raw_content=False):
    """调用Tavily Search API"""
    url = "https://api.tavily.com/search"
    payload = {
        "api_key": api_key,
        "query": query,
        "max_results": max_results,
        "include_answer": include_answer,
        "search_depth": search_depth,
        "include_raw_content": include_raw_content,
    }

    headers = {"Content-Type": "application/json"}
    response = requests.post(url, json=payload, headers=headers, timeout=15)
    response.raise_for_status()
    return response.json()


import re as _re

def _clean_content(text):
    """Strip HTML tags, markdown images, and excessive whitespace from content."""
    if not text:
        return ""
    # Remove HTML tags
    text = _re.sub(r'<[^>]+>', '', text)
    # Remove markdown images ![...](...) 
    text = _re.sub(r'!\[[^\]]*\]\([^)]*\)', '', text)
    # Remove markdown links but keep text [text](url) → text
    text = _re.sub(r'\[([^\]]*)\]\([^)]*\)', r'\1', text)
    # Remove markdown table separators |---|---|
    text = _re.sub(r'\|[-\s|]+\|', '', text)
    # Remove lines that are just pipes/table cells with no real content
    text = _re.sub(r'^\s*\|[\s|]*\|\s*$', '', text, flags=_re.MULTILINE)
    # Remove markdown headers ##
    text = _re.sub(r'^#+\s*', '', text, flags=_re.MULTILINE)
    # Collapse multiple newlines
    text = _re.sub(r'\n{3,}', '\n\n', text)
    # Collapse multiple spaces
    text = _re.sub(r' {2,}', ' ', text)
    return text.strip()


@register_function(
    "search_from_tavily", SEARCH_FROM_TAVILY_FUNCTION_DESC, ToolType.SYSTEM_CTL
)
def search_from_tavily(conn, query: str, lang: str = "zh_CN"):
    """使用Tavily搜索互联网信息"""
    try:
        # 从插件配置中获取API密钥
        tavily_config = conn.config.get("plugins", {}).get("search_from_tavily", {})
        api_key = tavily_config.get("api_key", "")
        
        try:
            max_results = int(tavily_config.get("max_results", 3))
        except ValueError:
            max_results = 3
            
        search_depth = str(tavily_config.get("search_depth", "basic"))
        include_answer = str(tavily_config.get("include_answer", "true")).lower() == "true"
        include_raw_content = str(tavily_config.get("include_raw_content", "false")).lower() == "true"

        if not api_key:
            return ActionResponse(
                Action.REQLLM,
                "搜索功能未配置API密钥，请在配置文件中设置search_from_tavily的api_key",
                None,
            )

        logger.bind(tag=TAG).info(f"Tavily搜索: query={query}, max_results={max_results}, depth={search_depth}, include_raw={include_raw_content}")

        # 调用Tavily API
        result = _do_tavily_search(api_key, query, max_results, search_depth, include_answer, include_raw_content)

        # 提取搜索结果
        answer = result.get("answer", "")
        search_results = result.get("results", [])

        # 构建搜索报告
        report = f"根据下列搜索数据，用{lang}回应用户的搜索请求：\n\n"
        report += f"搜索关键词: {query}\n\n"

        if answer:
            report += f"搜索摘要: {_clean_content(answer)}\n\n"

        if search_results:
            report += "详细结果:\n"
            for i, item in enumerate(search_results, 1):
                title = _clean_content(item.get("title", "无标题"))
                content = item.get("content", "")
                raw_content = item.get("raw_content", None)
                url = item.get("url", "")
                
                # 如果需要原始长文
                if include_raw_content and raw_content:
                    content = _clean_content(raw_content)
                    if len(content) > 1000:
                        content = content[:1000] + "..."
                else:
                    content = _clean_content(content)
                    if len(content) > 300:
                        content = content[:300] + "..."
                    
                report += f"\n{i}. {title}\n"
                report += f"   {content}\n"
                report += f"   来源: {url}\n"

        report += (
            "\n(请以自然、流畅的方式向用户播报搜索结果，"
            "总结关键信息，不需要列出所有来源链接)"
        )

        return ActionResponse(Action.REQLLM, report, None)

    except requests.exceptions.Timeout:
        logger.bind(tag=TAG).error("Tavily搜索超时")
        return ActionResponse(
            Action.REQLLM, "抱歉，搜索请求超时，请稍后再试。", None
        )
    except requests.exceptions.HTTPError as e:
        logger.bind(tag=TAG).error(f"Tavily搜索HTTP错误: {e}")
        return ActionResponse(
            Action.REQLLM, "抱歉，搜索服务暂时不可用，请稍后再试。", None
        )
    except Exception as e:
        logger.bind(tag=TAG).error(f"Tavily搜索出错: {e}")
        return ActionResponse(
            Action.REQLLM, "抱歉，搜索时发生错误，请稍后再试。", None
        )
