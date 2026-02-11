-- 添加 Google Cloud TTS 供应器
delete from `ai_model_provider` where id = 'SYSTEM_TTS_GoogleCloud';
INSERT INTO `ai_model_provider` (`id`, `model_type`, `provider_code`, `name`, `fields`, `sort`, `creator`, `create_date`, `updater`, `update_date`) VALUES
('SYSTEM_TTS_GoogleCloud', 'TTS', 'google_cloud', 'Google Cloud Text-to-Speech', '[{"key":"api_key","label":"API Key","type":"password"},{"key":"voice_name","label":"Voice","type":"select","options":[{"label":"English (US) - Journey - Female (Expressive)","value":"en-US-Journey-F"},{"label":"English (US) - Journey - Male (Expressive)","value":"en-US-Journey-D"},{"label":"Mandarin (CN) - Wavenet - Female","value":"cmn-CN-Wavenet-A"},{"label":"Mandarin (CN) - Wavenet - Male","value":"cmn-CN-Wavenet-B"},{"label":"Cantonese (HK) - Standard - Female","value":"yue-HK-Standard-A"},{"label":"Cantonese (HK) - Standard - Male","value":"yue-HK-Standard-B"}]},{"key":"output_dir","label":"Output Directory","type":"string"}]', 22, 1, NOW(), 1, NOW());

-- 添加 Google Cloud TTS 模型配置
delete from `ai_model_config` where id = 'TTS_GoogleCloud';
INSERT INTO `ai_model_config` VALUES ('TTS_GoogleCloud', 'TTS', 'GoogleCloudTTS', 'Google Cloud Text-to-Speech', 1, 1, '{"type": "google_cloud", "api_key": "", "voice_name": "en-US-Journey-F", "output_dir": "tmp/"}', 'https://cloud.google.com/text-to-speech/docs/voices', 'High-quality AI voices (English, Mandarin, Cantonese)', 25, NULL, NULL, NULL, NULL);

-- 更新 Google Cloud TTS 配置说明
UPDATE `ai_model_config` SET
`remark` = 'Google Cloud TTS Configuration:
1. API Key: Use the same API Key as Google ASR (if enabled for TTS API).
2. Voice Selection: Choose from English, Mandarin, or Cantonese voices.
   - Journey voices (en-US) are highly expressive and natural.
   - Wavenet voices (cmn-CN) use DeepMind/Google AI technology.
   - Standard voices (yue-HK) are standard quality.
3. Config:
   - Voice: Select from the dropdown
   - Output Directory: tmp/ (default)
Doc: https://cloud.google.com/text-to-speech/docs/voices
' WHERE `id` = 'TTS_GoogleCloud';
