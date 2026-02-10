import os
import time
import json
import requests
from typing import Optional, Tuple, List

from config.logger import setup_logging
from core.providers.asr.base import ASRProviderBase
from core.providers.asr.dto.dto import InterfaceType

TAG = __name__
logger = setup_logging()


class ASRProvider(ASRProviderBase):
    """Google Cloud Speech-to-Text ASR provider.

    Uses the REST API with API key authentication.
    Supports up to 3 alternative language codes for automatic language detection
    across Chinese, English, Cantonese, etc.
    """

    def __init__(self, config: dict, delete_audio_file: bool = True):
        super().__init__()
        self.interface_type = InterfaceType.NON_STREAM

        self.api_key = config.get("api_key", "")
        if not self.api_key:
            raise ValueError("Google Cloud Speech-to-Text requires an api_key")

        # Language codes (up to 3 for auto-detection)
        self.language_codes = []
        for key in ["language_1", "language_2", "language_3"]:
            lang = config.get(key, "").strip()
            if lang:
                self.language_codes.append(lang)
        if not self.language_codes:
            self.language_codes = ["en-US"]

        # Recognition model: latest_long, latest_short, etc.
        self.model = config.get("model", "latest_long")
        self.output_dir = config.get("output_dir", "tmp/")
        self.delete_audio_file = delete_audio_file

        os.makedirs(self.output_dir, exist_ok=True)

    async def speech_to_text(
        self,
        opus_data: List[bytes],
        session_id: str,
        audio_format="opus",
        artifacts=None,
    ) -> Tuple[Optional[str], Optional[str]]:
        """Convert speech audio to text using Google Cloud Speech-to-Text REST API."""
        file_path = None
        try:
            if artifacts is None:
                return "", None
            file_path = artifacts.file_path

            if not artifacts.pcm_bytes:
                return "", file_path

            import base64

            start_time = time.time()

            # Encode audio as base64
            audio_content = base64.b64encode(artifacts.pcm_bytes).decode("utf-8")

            # Build the recognition config
            config = {
                "encoding": "LINEAR16",
                "sampleRateHertz": 16000,
                "languageCode": self.language_codes[0],
                "model": self.model,
            }

            # Add alternative languages for auto-detection (v1 supports this)
            if len(self.language_codes) > 1:
                config["alternativeLanguageCodes"] = self.language_codes[1:]

            # Build request body
            body = {
                "config": config,
                "audio": {
                    "content": audio_content,
                },
            }

            # Call Google Cloud Speech-to-Text REST API
            url = f"https://speech.googleapis.com/v1/speech:recognize?key={self.api_key}"
            response = requests.post(
                url,
                json=body,
                headers={"Content-Type": "application/json"},
                timeout=30,
            )

            elapsed = time.time() - start_time

            if response.status_code != 200:
                error_detail = response.text
                logger.bind(tag=TAG).error(
                    f"Google ASR API error {response.status_code}: {error_detail}"
                )
                return "", file_path

            result = response.json()

            # Extract recognized text
            full_text = ""
            detected_language = ""
            for res in result.get("results", []):
                alternatives = res.get("alternatives", [])
                if alternatives:
                    full_text += alternatives[0].get("transcript", "")
                lang = res.get("languageCode", "")
                if lang:
                    detected_language = lang

            logger.bind(tag=TAG).info(
                f"Google ASR completed | time: {elapsed:.3f}s | lang: {detected_language} | text: {full_text}"
            )

            return full_text, file_path

        except Exception as e:
            logger.bind(tag=TAG).error(f"Google Cloud Speech-to-Text failed: {e}")
            return "", file_path
