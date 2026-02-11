import requests
import json
import os
import uuid
import asyncio
from core.providers.tts.base import TTSProviderBase
from config.logger import setup_logging
from core.utils.util import check_model_key

TAG = __name__
logger = setup_logging()

class TTSProvider(TTSProviderBase):
    def __init__(self, config, delete_audio_file):
        super().__init__(config, delete_audio_file)
        self.api_key = config.get("api_key")

        # Mapping descriptive names to Google API Voice IDs
        # This handles cases where the system passes the descriptive name instead of the ID
        self.VOICE_MAPPING = {
            "English (US) - Journey - Female (Expressive)": "en-US-Journey-F",
            "English (US) - Journey - Male (Expressive)": "en-US-Journey-D",
            "English (US) - Standard - Female": "en-US-Standard-C",
            "Mandarin (CN) - Neural2 - Female": "cmn-CN-Neural2-C",
            "Mandarin (CN) - Neural2 - Male": "cmn-CN-Neural2-B",
            "Cantonese (HK) - Neural2 - Female": "yue-Hant-HK-Neural2-A",
            "Cantonese (HK) - Neural2 - Male": "yue-Hant-HK-Neural2-B",
            
            # Expanded Options - Mandarin (CN)
            "Mandarin (Standard) - Female": "cmn-CN-Standard-A",
            "Mandarin (Standard) - Male": "cmn-CN-Standard-B",
            "Mandarin (WaveNet) - Female": "cmn-CN-Wavenet-A",
            "Mandarin (WaveNet) - Male": "cmn-CN-Wavenet-B",
            "Mandarin (Chirp3) - Achernar (F)": "cmn-CN-Chirp3-HD-Achernar",
            "Mandarin (Chirp3) - Achird (M)": "cmn-CN-Chirp3-HD-Achird",    
            "Mandarin (Chirp3) - Callirrhoe (F)": "cmn-CN-Chirp3-HD-Callirrhoe",    
            "Mandarin (Chirp3) - Fenrir (M)": "cmn-CN-Chirp3-HD-Fenrir",    

            # Expanded Options - Mandarin (TW)
            "Taiwanese (Standard) - Female": "cmn-TW-Standard-A",
            "Taiwanese (Standard) - Male": "cmn-TW-Standard-B",
            "Taiwanese (WaveNet) - Female": "cmn-TW-Wavenet-A",
            "Taiwanese (WaveNet) - Male": "cmn-TW-Wavenet-B",

            # Expanded Options - Cantonese (HK)
            "Cantonese (Standard) - Female": "yue-HK-Standard-A",
            "Cantonese (Standard) - Male": "yue-HK-Standard-B",
            "Cantonese (Standard) - Female (2)": "yue-HK-Standard-C",
            "Cantonese (Standard) - Male (2)": "yue-HK-Standard-D",
            "Cantonese (Chirp3) - Callirrhoe (F)": "yue-HK-Chirp3-HD-Callirrhoe",
            "Cantonese (Chirp3) - Alnilam (M)": "yue-HK-Chirp3-HD-Alnilam",

            # Expanded Options - English (US)
            "English (US) Standard - Female": "en-US-Standard-C",
            "English (US) Standard - Male": "en-US-Standard-D",
            "English (US) WaveNet - Female": "en-US-Wavenet-C",
            "English (US) WaveNet - Male": "en-US-Wavenet-D",
            "English (US) Neural2 - Female": "en-US-Neural2-C",
            "English (US) Neural2 - Male": "en-US-Neural2-D",
            "English (US) Studio - Female": "en-US-Studio-O",
            "English (US) Studio - Male": "en-US-Studio-Q",
            "English (US) Chirp3 - Puck (M)": "en-US-Chirp3-HD-Puck",
            "English (US) Chirp3 - Kore (F)": "en-US-Chirp3-HD-Kore",

            # Expanded Options - English (GB)
            "English (UK) Neural2 - Female": "en-GB-Neural2-A",
            "English (UK) Neural2 - Male": "en-GB-Neural2-B",
            "English (UK) Studio - Female": "en-GB-Studio-C",
            "English (UK) Studio - Male": "en-GB-Studio-B",

            # Legacy Mappings (keep for backward compatibility if needed)
            "Mandarin (CN) - Wavenet - Female": "cmn-CN-Wavenet-A",
            "Mandarin (CN) - Wavenet - Male": "cmn-CN-Wavenet-B",
            "Cantonese (HK) - Standard - Female": "yue-HK-Standard-A",
            "Cantonese (HK) - Standard - Male": "yue-HK-Standard-B"
        }

        # Support 'private_voice' (agent specific), 'voice' (system standard), and 'voice_name' (specific config)
        # private_voice > voice > voice_name > default
        raw_voice_name = config.get("private_voice")
        if not raw_voice_name:
            raw_voice_name = config.get("voice", config.get("voice_name", "en-US-Journey-F"))
            
        logger.bind(tag=TAG).info(f"Google TTS DEBUG: Received raw config: {config}")
        logger.bind(tag=TAG).info(f"Google TTS DEBUG: Extracted raw_voice_name: '{raw_voice_name}' (Type: {type(raw_voice_name)})")

        # Resolve voice name using mapping, or use raw value if not found
        self.voice_name = self.VOICE_MAPPING.get(raw_voice_name, raw_voice_name)
        
        if self.voice_name != raw_voice_name:
             logger.bind(tag=TAG).info(f"Google TTS DEBUG: Mapped '{raw_voice_name}' -> '{self.voice_name}'")
        else:
             logger.bind(tag=TAG).info(f"Google TTS DEBUG: No mapping found for '{raw_voice_name}', using as-is.")

        # Extract language code from voice name
        # Handle 3-part language codes like "yue-Hant-HK"
        parts = self.voice_name.split("-")
        if len(parts) >= 3 and parts[1] == "Hant":
            derived_lang = "-".join(parts[:3]) # yue-Hant-HK
        else:
            derived_lang = "-".join(parts[:2]) # en-US, cmn-CN

        self.language_code = config.get("language_code", derived_lang)
        logger.bind(tag=TAG).info(f"Google TTS DEBUG: Derived language_code: '{self.language_code}' for voice '{self.voice_name}'")
        
        self.api_url = "https://texttospeech.googleapis.com/v1/text:synthesize"
        self.audio_file_type = "wav"
        
        # Check API key
        if not self.api_key:
            logger.bind(tag=TAG).error("Google TTS: API Key is missing")

    async def text_to_speak(self, text, output_file):
        try:
            url = f"{self.api_url}?key={self.api_key}"
            
            headers = {
                "Content-Type": "application/json; charset=utf-8",
            }
            
            data = {
                "input": {"text": text},
                "voice": {
                    "languageCode": self.language_code,
                    "name": self.voice_name,
                },
                "audioConfig": {
                    "audioEncoding": "LINEAR16",
                    "sampleRateHertz": 24000
                }
            }
            
            response = requests.post(url, headers=headers, json=data, timeout=30)
            
            if response.status_code == 200:
                response_json = response.json()
                audio_content = response_json.get("audioContent")
                
                if audio_content:
                    import base64
                    audio_data = base64.b64decode(audio_content)
                    
                    if output_file:
                        with open(output_file, "wb") as f:
                            f.write(audio_data)
                        return None
                    else:
                        return audio_data
                else:
                    logger.bind(tag=TAG).error(f"Google TTS response missing audioContent: {response.text}")
                    return None
            else:
                logger.bind(tag=TAG).error(f"Google TTS request failed: {response.status_code} - {response.text}")
                raise Exception(f"Google TTS request failed: {response.status_code}")
                
        except Exception as e:
            logger.bind(tag=TAG).error(f"Google TTS error: {e}")
            raise e
