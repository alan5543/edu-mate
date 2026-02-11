-- Add expanded Google TTS voice options with pricing/quality hints
-- Corrected column count (14 values) and shortened IDs (<32 chars)
-- Uses REPLACE INTO to handle potential duplicates from partial runs

-- ==========================================
-- Mandarin (China) - cmn-CN
-- ==========================================

-- Standard (Low Cost)
REPLACE INTO `ai_tts_voice` VALUES ('TTS_GC_CN_Std_A', 'TTS_GoogleCloud', 'Mandarin (Standard) - Female', 'cmn-CN-Standard-A', '中文', NULL, 'Standard (Low Cost)', 10, NULL, NULL, NULL, NULL, NULL, NULL);
REPLACE INTO `ai_tts_voice` VALUES ('TTS_GC_CN_Std_B', 'TTS_GoogleCloud', 'Mandarin (Standard) - Male', 'cmn-CN-Standard-B', '中文', NULL, 'Standard (Low Cost)', 11, NULL, NULL, NULL, NULL, NULL, NULL);

-- WaveNet (High Quality)
REPLACE INTO `ai_tts_voice` VALUES ('TTS_GC_CN_Wn_A', 'TTS_GoogleCloud', 'Mandarin (WaveNet) - Female', 'cmn-CN-Wavenet-A', '中文', NULL, 'WaveNet (High Quality)', 20, NULL, NULL, NULL, NULL, NULL, NULL);
REPLACE INTO `ai_tts_voice` VALUES ('TTS_GC_CN_Wn_B', 'TTS_GoogleCloud', 'Mandarin (WaveNet) - Male', 'cmn-CN-Wavenet-B', '中文', NULL, 'WaveNet (High Quality)', 21, NULL, NULL, NULL, NULL, NULL, NULL);

-- Chirp3-HD (Best Quality - Generative)
REPLACE INTO `ai_tts_voice` VALUES ('TTS_GC_CN_Chirp_Achernar', 'TTS_GoogleCloud', 'Mandarin (Chirp3) - Achernar (F)', 'cmn-CN-Chirp3-HD-Achernar', '中文', NULL, 'Chirp3-HD (Best Quality)', 30, NULL, NULL, NULL, NULL, NULL, NULL);
REPLACE INTO `ai_tts_voice` VALUES ('TTS_GC_CN_Chirp_Achird', 'TTS_GoogleCloud', 'Mandarin (Chirp3) - Achird (M)', 'cmn-CN-Chirp3-HD-Achird', '中文', NULL, 'Chirp3-HD (Best Quality)', 31, NULL, NULL, NULL, NULL, NULL, NULL);
REPLACE INTO `ai_tts_voice` VALUES ('TTS_GC_CN_Chirp_Callirrhoe', 'TTS_GoogleCloud', 'Mandarin (Chirp3) - Callirrhoe (F)', 'cmn-CN-Chirp3-HD-Callirrhoe', '中文', NULL, 'Chirp3-HD (Best Quality)', 32, NULL, NULL, NULL, NULL, NULL, NULL);
REPLACE INTO `ai_tts_voice` VALUES ('TTS_GC_CN_Chirp_Fenrir', 'TTS_GoogleCloud', 'Mandarin (Chirp3) - Fenrir (M)', 'cmn-CN-Chirp3-HD-Fenrir', '中文', NULL, 'Chirp3-HD (Best Quality)', 33, NULL, NULL, NULL, NULL, NULL, NULL);

-- ==========================================
-- Mandarin (Taiwan) - cmn-TW
-- ==========================================

-- Standard
REPLACE INTO `ai_tts_voice` VALUES ('TTS_GC_TW_Std_A', 'TTS_GoogleCloud', 'Taiwanese (Standard) - Female', 'cmn-TW-Standard-A', '中文', NULL, 'Standard (Low Cost)', 40, NULL, NULL, NULL, NULL, NULL, NULL);
REPLACE INTO `ai_tts_voice` VALUES ('TTS_GC_TW_Std_B', 'TTS_GoogleCloud', 'Taiwanese (Standard) - Male', 'cmn-TW-Standard-B', '中文', NULL, 'Standard (Low Cost)', 41, NULL, NULL, NULL, NULL, NULL, NULL);

-- WaveNet
REPLACE INTO `ai_tts_voice` VALUES ('TTS_GC_TW_Wn_A', 'TTS_GoogleCloud', 'Taiwanese (WaveNet) - Female', 'cmn-TW-Wavenet-A', '中文', NULL, 'WaveNet (High Quality)', 42, NULL, NULL, NULL, NULL, NULL, NULL);
REPLACE INTO `ai_tts_voice` VALUES ('TTS_GC_TW_Wn_B', 'TTS_GoogleCloud', 'Taiwanese (WaveNet) - Male', 'cmn-TW-Wavenet-B', '中文', NULL, 'WaveNet (High Quality)', 43, NULL, NULL, NULL, NULL, NULL, NULL);

-- ==========================================
-- Cantonese (Hong Kong) - yue-HK
-- ==========================================

-- Standard
REPLACE INTO `ai_tts_voice` VALUES ('TTS_GC_HK_Std_A', 'TTS_GoogleCloud', 'Cantonese (Standard) - Female', 'yue-HK-Standard-A', '粤语', NULL, 'Standard (Low Cost)', 50, NULL, NULL, NULL, NULL, NULL, NULL);
REPLACE INTO `ai_tts_voice` VALUES ('TTS_GC_HK_Std_B', 'TTS_GoogleCloud', 'Cantonese (Standard) - Male', 'yue-HK-Standard-B', '粤语', NULL, 'Standard (Low Cost)', 51, NULL, NULL, NULL, NULL, NULL, NULL);
REPLACE INTO `ai_tts_voice` VALUES ('TTS_GC_HK_Std_C', 'TTS_GoogleCloud', 'Cantonese (Standard) - Female (2)', 'yue-HK-Standard-C', '粤语', NULL, 'Standard (Low Cost)', 52, NULL, NULL, NULL, NULL, NULL, NULL);
REPLACE INTO `ai_tts_voice` VALUES ('TTS_GC_HK_Std_D', 'TTS_GoogleCloud', 'Cantonese (Standard) - Male (2)', 'yue-HK-Standard-D', '粤语', NULL, 'Standard (Low Cost)', 53, NULL, NULL, NULL, NULL, NULL, NULL);

-- Chirp3-HD
REPLACE INTO `ai_tts_voice` VALUES ('TTS_GC_HK_Chirp_Callirrhoe', 'TTS_GoogleCloud', 'Cantonese (Chirp3) - Callirrhoe (F)', 'yue-HK-Chirp3-HD-Callirrhoe', '粤语', NULL, 'Chirp3-HD (Best Quality)', 60, NULL, NULL, NULL, NULL, NULL, NULL);
REPLACE INTO `ai_tts_voice` VALUES ('TTS_GC_HK_Chirp_Alnilam', 'TTS_GoogleCloud', 'Cantonese (Chirp3) - Alnilam (M)', 'yue-HK-Chirp3-HD-Alnilam', '粤语', NULL, 'Chirp3-HD (Best Quality)', 61, NULL, NULL, NULL, NULL, NULL, NULL);

-- ==========================================
-- English (US) - en-US
-- ==========================================

-- Standard
REPLACE INTO `ai_tts_voice` VALUES ('TTS_GC_US_Std_C', 'TTS_GoogleCloud', 'English (US) Standard - Female', 'en-US-Standard-C', '英文', NULL, 'Standard (Low Cost)', 70, NULL, NULL, NULL, NULL, NULL, NULL);
REPLACE INTO `ai_tts_voice` VALUES ('TTS_GC_US_Std_D', 'TTS_GoogleCloud', 'English (US) Standard - Male', 'en-US-Standard-D', '英文', NULL, 'Standard (Low Cost)', 71, NULL, NULL, NULL, NULL, NULL, NULL);

-- WaveNet
REPLACE INTO `ai_tts_voice` VALUES ('TTS_GC_US_Wn_C', 'TTS_GoogleCloud', 'English (US) WaveNet - Female', 'en-US-Wavenet-C', '英文', NULL, 'WaveNet (High Quality)', 72, NULL, NULL, NULL, NULL, NULL, NULL);
REPLACE INTO `ai_tts_voice` VALUES ('TTS_GC_US_Wn_D', 'TTS_GoogleCloud', 'English (US) WaveNet - Male', 'en-US-Wavenet-D', '英文', NULL, 'WaveNet (High Quality)', 73, NULL, NULL, NULL, NULL, NULL, NULL);

-- Neural2
REPLACE INTO `ai_tts_voice` VALUES ('TTS_GC_US_Neu2_C', 'TTS_GoogleCloud', 'English (US) Neural2 - Female', 'en-US-Neural2-C', '英文', NULL, 'Neural2 (Better Quality)', 74, NULL, NULL, NULL, NULL, NULL, NULL);
REPLACE INTO `ai_tts_voice` VALUES ('TTS_GC_US_Neu2_D', 'TTS_GoogleCloud', 'English (US) Neural2 - Male', 'en-US-Neural2-D', '英文', NULL, 'Neural2 (Better Quality)', 75, NULL, NULL, NULL, NULL, NULL, NULL);

-- Studio (Professional)
REPLACE INTO `ai_tts_voice` VALUES ('TTS_GC_US_Stu_O', 'TTS_GoogleCloud', 'English (US) Studio - Female', 'en-US-Studio-O', '英文', NULL, 'Studio (Professional)', 76, NULL, NULL, NULL, NULL, NULL, NULL);
REPLACE INTO `ai_tts_voice` VALUES ('TTS_GC_US_Stu_Q', 'TTS_GoogleCloud', 'English (US) Studio - Male', 'en-US-Studio-Q', '英文', NULL, 'Studio (Professional)', 77, NULL, NULL, NULL, NULL, NULL, NULL);

-- Chirp3-HD
REPLACE INTO `ai_tts_voice` VALUES ('TTS_GC_US_Chirp_Puck', 'TTS_GoogleCloud', 'English (US) Chirp3 - Puck (M)', 'en-US-Chirp3-HD-Puck', '英文', NULL, 'Chirp3-HD (Best Quality)', 80, NULL, NULL, NULL, NULL, NULL, NULL);
REPLACE INTO `ai_tts_voice` VALUES ('TTS_GC_US_Chirp_Kore', 'TTS_GoogleCloud', 'English (US) Chirp3 - Kore (F)', 'en-US-Chirp3-HD-Kore', '英文', NULL, 'Chirp3-HD (Best Quality)', 81, NULL, NULL, NULL, NULL, NULL, NULL);

-- ==========================================
-- English (GB) - en-GB
-- ==========================================

-- Neural2
REPLACE INTO `ai_tts_voice` VALUES ('TTS_GC_GB_Neu2_A', 'TTS_GoogleCloud', 'English (UK) Neural2 - Female', 'en-GB-Neural2-A', '英文', NULL, 'Neural2 (Better Quality)', 90, NULL, NULL, NULL, NULL, NULL, NULL);
REPLACE INTO `ai_tts_voice` VALUES ('TTS_GC_GB_Neu2_B', 'TTS_GoogleCloud', 'English (UK) Neural2 - Male', 'en-GB-Neural2-B', '英文', NULL, 'Neural2 (Better Quality)', 91, NULL, NULL, NULL, NULL, NULL, NULL);

-- Studio
REPLACE INTO `ai_tts_voice` VALUES ('TTS_GC_GB_Stu_C', 'TTS_GoogleCloud', 'English (UK) Studio - Female', 'en-GB-Studio-C', '英文', NULL, 'Studio (Professional)', 92, NULL, NULL, NULL, NULL, NULL, NULL);
REPLACE INTO `ai_tts_voice` VALUES ('TTS_GC_GB_Stu_B', 'TTS_GoogleCloud', 'English (UK) Studio - Male', 'en-GB-Studio-B', '英文', NULL, 'Studio (Professional)', 93, NULL, NULL, NULL, NULL, NULL, NULL);
