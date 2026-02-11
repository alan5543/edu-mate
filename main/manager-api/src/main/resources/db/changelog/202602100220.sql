-- Modify ai_tts_voice name column length
ALTER TABLE `ai_tts_voice` MODIFY COLUMN `name` VARCHAR(100) COMMENT '音色名称';

-- Update Google Cloud TTS Voices with descriptive names
UPDATE `ai_tts_voice` SET `name` = 'English (US) - Journey - Female (Expressive)' WHERE `tts_voice` = 'en-US-Journey-F';
UPDATE `ai_tts_voice` SET `name` = 'English (US) - Journey - Male (Expressive)' WHERE `tts_voice` = 'en-US-Journey-D';
UPDATE `ai_tts_voice` SET `name` = 'English (US) - Standard - Female' WHERE `tts_voice` = 'en-US-Standard-C';
UPDATE `ai_tts_voice` SET `name` = 'Mandarin (CN) - Wavenet - Female' WHERE `tts_voice` = 'cmn-CN-Wavenet-A';
UPDATE `ai_tts_voice` SET `name` = 'Mandarin (CN) - Wavenet - Male' WHERE `tts_voice` = 'cmn-CN-Wavenet-B';
UPDATE `ai_tts_voice` SET `name` = 'Cantonese (HK) - Standard - Female' WHERE `tts_voice` = 'yue-HK-Standard-A';
UPDATE `ai_tts_voice` SET `name` = 'Cantonese (HK) - Standard - Male' WHERE `tts_voice` = 'yue-HK-Standard-B';

-- Revert Google Cloud TTS Provider config to text input (remove dropdown)
UPDATE `ai_model_provider` 
SET `fields` = '[{"key":"api_key","label":"API Key","type":"password"},{"key":"voice_name","label":"Default Voice ID","type":"string","placeholder":"e.g. en-US-Journey-F"},{"key":"output_dir","label":"Output Directory","type":"string"}]'
WHERE `id` = 'SYSTEM_TTS_GoogleCloud';
