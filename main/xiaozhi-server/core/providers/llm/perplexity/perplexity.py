import httpx
import openai
import re
from openai.types import CompletionUsage
from config.logger import setup_logging
from core.utils.util import check_model_key
from core.providers.llm.base import LLMProviderBase

TAG = __name__
logger = setup_logging()


class LLMProvider(LLMProviderBase):
    def __init__(self, config):
        self.model_name = config.get("model_name", "sonar")
        self.api_key = config.get("api_key")
        
        # Option to strip citation markers like [1][2][3] from responses
        # Default to True for voice assistant use cases
        self.strip_citations = config.get("strip_citations", True)
        
        # Perplexity API base URL
        if "base_url" in config:
            self.base_url = config.get("base_url")
        elif "url" in config:
            self.base_url = config.get("url")
        else:
            self.base_url = "https://api.perplexity.ai"
            
        timeout = config.get("timeout", 300)
        self.timeout = int(timeout) if timeout else 300

        param_defaults = {
            "max_tokens": int,
            "temperature": lambda x: round(float(x), 1),
            "top_p": lambda x: round(float(x), 1),
            "frequency_penalty": lambda x: round(float(x), 1),
        }

        for param, converter in param_defaults.items():
            value = config.get(param)
            try:
                setattr(
                    self,
                    param,
                    converter(value) if value not in (None, "") else None,
                )
            except (ValueError, TypeError):
                setattr(self, param, None)

        logger.bind(tag=TAG).info(
            f"Perplexity Provider 初始化: model={self.model_name}, base_url={self.base_url}, strip_citations={self.strip_citations}"
        )

        model_key_msg = check_model_key("LLM", self.api_key)
        if model_key_msg:
            logger.bind(tag=TAG).error(model_key_msg)
        
        self.client = openai.OpenAI(
            api_key=self.api_key, 
            base_url=self.base_url, 
            timeout=httpx.Timeout(self.timeout)
        )

    def _strip_citation_markers(self, text):
        """Remove citation markers like [1], [2], [1][2][3] from text"""
        if not self.strip_citations or not text:
            return text
        # Remove patterns like [1], [12], [123] etc.
        return re.sub(r'\[\d+\]', '', text)

    @staticmethod
    def normalize_dialogue(dialogue):
        """自动修复 dialogue 中缺失 content 的消息"""
        for msg in dialogue:
            if "role" in msg and "content" not in msg:
                msg["content"] = ""
        return dialogue

    def response(self, session_id, dialogue, **kwargs):
        dialogue = self.normalize_dialogue(dialogue)

        request_params = {
            "model": self.model_name,
            "messages": dialogue,
            "stream": True,
        }

        # 添加可选参数,只有当参数不为None时才添加
        optional_params = {
            "max_tokens": kwargs.get("max_tokens", self.max_tokens),
            "temperature": kwargs.get("temperature", self.temperature),
            "top_p": kwargs.get("top_p", self.top_p),
            "frequency_penalty": kwargs.get("frequency_penalty", self.frequency_penalty),
        }

        for key, value in optional_params.items():
            if value is not None:
                request_params[key] = value

        logger.bind(tag=TAG).info(f"Perplexity request: model={self.model_name}, messages={len(dialogue)}")

        responses = self.client.chat.completions.create(**request_params)

        is_active = True
        for chunk in responses:
            try:
                delta = chunk.choices[0].delta if getattr(chunk, "choices", None) else None
                content = getattr(delta, "content", "") if delta else ""
            except IndexError:
                content = ""
            if content:
                if "<think>" in content:
                    is_active = False
                    content = content.split("<think>")[0]
                if "</think>" in content:
                    is_active = True
                    content = content.split("</think>")[-1]
                if is_active:
                    # Strip citation markers before yielding
                    yield self._strip_citation_markers(content)

    def response_with_functions(self, session_id, dialogue, functions=None, **kwargs):
        dialogue = self.normalize_dialogue(dialogue)

        request_params = {
            "model": self.model_name,
            "messages": dialogue,
            "stream": True,
            "tools": functions,
        }

        optional_params = {
            "max_tokens": kwargs.get("max_tokens", self.max_tokens),
            "temperature": kwargs.get("temperature", self.temperature),
            "top_p": kwargs.get("top_p", self.top_p),
            "frequency_penalty": kwargs.get("frequency_penalty", self.frequency_penalty),
        }

        for key, value in optional_params.items():
            if value is not None:
                request_params[key] = value

        logger.bind(tag=TAG).info(
            f"Perplexity request with functions: model={self.model_name}, functions={len(functions) if functions else 0}"
        )

        stream = self.client.chat.completions.create(**request_params)

        for chunk in stream:
            if getattr(chunk, "choices", None):
                delta = chunk.choices[0].delta
                content = getattr(delta, "content", "")
                # Strip citation markers from content
                content = self._strip_citation_markers(content) if content else content
                tool_calls = getattr(delta, "tool_calls", None)
                yield content, tool_calls
            elif isinstance(getattr(chunk, "usage", None), CompletionUsage):
                usage_info = getattr(chunk, "usage", None)
                logger.bind(tag=TAG).info(
                    f"Token 消耗：输入 {getattr(usage_info, 'prompt_tokens', '未知')}，"
                    f"输出 {getattr(usage_info, 'completion_tokens', '未知')}，"
                    f"共计 {getattr(usage_info, 'total_tokens', '未知')}"
                )
