import re
import requests
from config.logger import setup_logging
from plugins_func.register import register_function, ToolType, ActionResponse, Action

TAG = __name__
logger = setup_logging()

FETCH_URL_CONTENT_FUNCTION_DESC = {
    "type": "function",
    "function": {
        "name": "fetch_url_content",
        "description": (
            "获取指定URL网页的文字内容。用于用户要求阅读、总结某个网页链接的内容时。"
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "url": {
                    "type": "string",
                    "description": "要获取内容的完整URL地址",
                },
                "lang": {
                    "type": "string",
                    "description": "用户使用的语言，如zh_CN/en_US，默认zh_CN",
                },
            },
            "required": ["url"],
        },
    },
}


def _extract_text(html):
    """Extract readable text from HTML without BeautifulSoup."""
    if not html:
        return ""
    # Remove script and style blocks
    text = re.sub(r'<script[^>]*>.*?</script>', '', html, flags=re.DOTALL | re.IGNORECASE)
    text = re.sub(r'<style[^>]*>.*?</style>', '', text, flags=re.DOTALL | re.IGNORECASE)
    text = re.sub(r'<nav[^>]*>.*?</nav>', '', text, flags=re.DOTALL | re.IGNORECASE)
    text = re.sub(r'<footer[^>]*>.*?</footer>', '', text, flags=re.DOTALL | re.IGNORECASE)
    text = re.sub(r'<header[^>]*>.*?</header>', '', text, flags=re.DOTALL | re.IGNORECASE)
    # Convert common block elements to newlines
    text = re.sub(r'<(?:p|div|br|h[1-6]|li|tr)[^>]*>', '\n', text, flags=re.IGNORECASE)
    # Remove all remaining HTML tags
    text = re.sub(r'<[^>]+>', '', text)
    # Decode common HTML entities
    text = text.replace('&amp;', '&').replace('&lt;', '<').replace('&gt;', '>')
    text = text.replace('&quot;', '"').replace('&#39;', "'").replace('&nbsp;', ' ')
    # Collapse whitespace
    text = re.sub(r'[ \t]+', ' ', text)
    text = re.sub(r'\n{3,}', '\n\n', text)
    # Remove lines that are too short (likely navigation/menu items)
    lines = text.split('\n')
    meaningful_lines = [line.strip() for line in lines if len(line.strip()) > 10]
    return '\n'.join(meaningful_lines).strip()


@register_function(
    "fetch_url_content", FETCH_URL_CONTENT_FUNCTION_DESC, ToolType.SYSTEM_CTL
)
def fetch_url_content(conn, url: str, lang: str = "zh_CN"):
    """Fetch and extract readable text from a URL."""
    try:
        # Validate URL
        if not url.startswith(("http://", "https://")):
            url = "https://" + url

        logger.bind(tag=TAG).info(f"获取URL内容: {url}")

        headers = {
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
        }
        resp = requests.get(url, headers=headers, timeout=10, allow_redirects=True)
        resp.raise_for_status()

        # Try to detect encoding
        resp.encoding = resp.apparent_encoding or 'utf-8'
        html = resp.text

        # Extract title
        title_match = re.search(r'<title[^>]*>(.*?)</title>', html, re.DOTALL | re.IGNORECASE)
        title = re.sub(r'<[^>]+>', '', title_match.group(1)).strip() if title_match else url

        # Extract readable text
        content = _extract_text(html)

        if not content or len(content) < 50:
            return ActionResponse(
                Action.REQLLM,
                f"无法从URL提取有效内容（可能是动态加载页面）: {url}",
                None,
            )

        # Truncate if too long (keep it manageable for LLM context)
        if len(content) > 2000:
            content = content[:2000] + "\n\n...(内容已截断)"

        report = f"根据下列网页内容，用{lang}回应用户的请求：\n\n"
        report += f"标题: {title}\n"
        report += f"网址: {url}\n\n"
        report += f"内容:\n{content}\n"
        report += "\n(请以自然、流畅的方式向用户总结网页的关键内容)"

        return ActionResponse(Action.REQLLM, report, None)

    except requests.exceptions.Timeout:
        logger.bind(tag=TAG).error(f"获取URL超时: {url}")
        return ActionResponse(
            Action.REQLLM, f"获取网页内容超时: {url}", None
        )
    except requests.exceptions.HTTPError as e:
        logger.bind(tag=TAG).error(f"获取URL HTTP错误: {e}")
        return ActionResponse(
            Action.REQLLM, f"无法访问网页 {url}: HTTP {e.response.status_code}", None
        )
    except Exception as e:
        logger.bind(tag=TAG).error(f"获取URL出错: {e}")
        return ActionResponse(
            Action.REQLLM, f"获取网页内容出错: {e}", None
        )
