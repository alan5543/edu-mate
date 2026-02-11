-- 添加 Google Cloud TTS 音色列表
delete from `ai_tts_voice` where tts_model_id = 'TTS_GoogleCloud';

-- English Voices
INSERT INTO `ai_tts_voice` VALUES ('TTS_GoogleCloud_0001', 'TTS_GoogleCloud', 'Journey (F)', 'en-US-Journey-F', '英文', NULL, NULL, NULL, NULL, 1, NULL, NULL, NULL, NULL);
INSERT INTO `ai_tts_voice` VALUES ('TTS_GoogleCloud_0002', 'TTS_GoogleCloud', 'Journey (M)', 'en-US-Journey-D', '英文', NULL, NULL, NULL, NULL, 2, NULL, NULL, NULL, NULL);
INSERT INTO `ai_tts_voice` VALUES ('TTS_GoogleCloud_0003', 'TTS_GoogleCloud', 'Standard (F)', 'en-US-Standard-C', '英文', NULL, NULL, NULL, NULL, 3, NULL, NULL, NULL, NULL);

-- Mandarin Voices
INSERT INTO `ai_tts_voice` VALUES ('TTS_GoogleCloud_0004', 'TTS_GoogleCloud', 'Wavenet (F)', 'cmn-CN-Wavenet-A', '中文', NULL, NULL, NULL, NULL, 4, NULL, NULL, NULL, NULL);
INSERT INTO `ai_tts_voice` VALUES ('TTS_GoogleCloud_0005', 'TTS_GoogleCloud', 'Wavenet (M)', 'cmn-CN-Wavenet-B', '中文', NULL, NULL, NULL, NULL, 5, NULL, NULL, NULL, NULL);

-- Cantonese Voices
INSERT INTO `ai_tts_voice` VALUES ('TTS_GoogleCloud_0006', 'TTS_GoogleCloud', 'Standard (F)', 'yue-HK-Standard-A', '粤语', NULL, NULL, NULL, NULL, 6, NULL, NULL, NULL, NULL);
INSERT INTO `ai_tts_voice` VALUES ('TTS_GoogleCloud_0007', 'TTS_GoogleCloud', 'Standard (M)', 'yue-HK-Standard-B', '粤语', NULL, NULL, NULL, NULL, 7, NULL, NULL, NULL, NULL);
