import re
import requests
from urllib.parse import quote
from config.logger import setup_logging
from plugins_func.register import register_function, ToolType, ActionResponse, Action

TAG = __name__
logger = setup_logging()

SEARCH_FROM_WIKIPEDIA_FUNCTION_DESC = {
    "type": "function",
    "function": {
        "name": "search_from_wikipedia",
        "description": (
            "查询百科知识，如人物、地点、历史事件、科学概念等事实性问题。"
            "免费且快速，优先用于百科类问题。不适合查询实时新闻或最新动态。"
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "query": {
                    "type": "string",
                    "description": "要查询的关键词或主题，如人名、地名、概念等",
                },
                "lang": {
                    "type": "string",
                    "description": "Wikipedia语言版本，如zh(中文)、en(英文)、ja(日文)，默认zh",
                },
            },
            "required": ["query"],
        },
    },
}


def _clean_wiki_text(text):
    """Clean Wikipedia text content."""
    if not text:
        return ""
    # Remove HTML tags
    text = re.sub(r'<[^>]+>', '', text)
    # Remove wiki markup residue
    text = re.sub(r'\[\[([^|\]]*?\|)?([^\]]*?)\]\]', r'\2', text)
    text = re.sub(r'\{\{[^}]*\}\}', '', text)
    # Remove reference markers [1] [2] etc.
    text = re.sub(r'\[\d+\]', '', text)
    # Collapse whitespace
    text = re.sub(r'\n{3,}', '\n\n', text)
    text = re.sub(r' {2,}', ' ', text)
    return text.strip()


def _wiki_summary(title, lang="zh"):
    """Get Wikipedia page summary via REST API (free, no key)."""
    url = f"https://{lang}.wikipedia.org/api/rest_v1/page/summary/{quote(title)}"
    headers = {"User-Agent": "XiaozhiAssistant/1.0 (voice assistant)"}
    resp = requests.get(url, headers=headers, timeout=8)
    if resp.status_code == 200:
        return resp.json()
    return None


def _wiki_search(query, lang="zh", limit=3):
    """Search Wikipedia articles via MediaWiki API (free, no key)."""
    url = f"https://{lang}.wikipedia.org/w/api.php"
    params = {
        "action": "query",
        "list": "search",
        "srsearch": query,
        "srlimit": limit,
        "format": "json",
        "utf8": 1,
    }
    headers = {"User-Agent": "XiaozhiAssistant/1.0 (voice assistant)"}
    resp = requests.get(url, params=params, headers=headers, timeout=8)
    resp.raise_for_status()
    data = resp.json()
    return data.get("query", {}).get("search", [])


@register_function(
    "search_from_wikipedia", SEARCH_FROM_WIKIPEDIA_FUNCTION_DESC, ToolType.SYSTEM_CTL
)
def search_from_wikipedia(conn, query: str, lang: str = "zh"):
    """Search Wikipedia for encyclopedic knowledge."""
    try:
        logger.bind(tag=TAG).info(f"Wikipedia查询: query={query}, lang={lang}")

        # Step 1: Try direct summary lookup (fastest)
        summary = _wiki_summary(query, lang)
        if summary and summary.get("extract"):
            title = summary.get("title", query)
            extract = _clean_wiki_text(summary["extract"])
            page_url = summary.get("content_urls", {}).get("desktop", {}).get("page", "")
            description = summary.get("description", "")

            report = f"根据Wikipedia百科的信息回答用户的问题：\n\n"
            report += f"词条: {title}\n"
            if description:
                report += f"简介: {description}\n"
            report += f"\n{extract}\n"
            if page_url:
                report += f"\n来源: {page_url}\n"
            report += "\n(请以自然、流畅的方式向用户介绍这个百科知识，总结关键信息)"

            return ActionResponse(Action.REQLLM, report, None)

        # Step 2: If direct lookup fails, search for related articles
        results = _wiki_search(query, lang, limit=3)
        if not results:
            # Try English Wikipedia as fallback
            if lang != "en":
                logger.bind(tag=TAG).info(f"中文Wikipedia未找到，尝试英文Wikipedia")
                results = _wiki_search(query, "en", limit=3)
                lang = "en"

        if not results:
            return ActionResponse(
                Action.REQLLM,
                f"Wikipedia中未找到关于「{query}」的相关词条。建议使用search_from_tavily搜索互联网获取更多信息。",
                None,
            )

        # Get summaries for top results
        report = f"根据Wikipedia百科的搜索结果回答用户的问题：\n\n"
        report += f"搜索词: {query}\n\n"

        for i, item in enumerate(results, 1):
            title = item.get("title", "")
            snippet = _clean_wiki_text(item.get("snippet", ""))

            # Try to get full summary for the first result
            if i == 1:
                full_summary = _wiki_summary(title, lang)
                if full_summary and full_summary.get("extract"):
                    extract = _clean_wiki_text(full_summary["extract"])
                    page_url = full_summary.get("content_urls", {}).get("desktop", {}).get("page", "")
                    report += f"{i}. {title}\n"
                    report += f"   {extract}\n"
                    if page_url:
                        report += f"   来源: {page_url}\n"
                    continue

            report += f"{i}. {title}\n"
            report += f"   {snippet}\n"

        report += "\n(请以自然、流畅的方式向用户介绍百科知识，总结关键信息)"

        return ActionResponse(Action.REQLLM, report, None)

    except requests.exceptions.Timeout:
        logger.bind(tag=TAG).error("Wikipedia查询超时")
        return ActionResponse(
            Action.REQLLM, "Wikipedia查询超时，建议使用search_from_tavily搜索。", None
        )
    except Exception as e:
        logger.bind(tag=TAG).error(f"Wikipedia查询出错: {e}")
        return ActionResponse(
            Action.REQLLM, f"Wikipedia查询出错: {e}", None
        )
