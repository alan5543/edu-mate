-- Upgrade to Neural2 Voices for better quality
-- Mandarin Voices (Neural2)
UPDATE `ai_tts_voice` 
SET `tts_voice` = 'cmn-CN-Neural2-C', `name` = 'Mandarin (CN) - Neural2 - Female' 
WHERE `id` = 'TTS_GoogleCloud_0004'; -- Was cmn-CN-Wavenet-A (Female)

UPDATE `ai_tts_voice` 
SET `tts_voice` = 'cmn-CN-Neural2-B', `name` = 'Mandarin (CN) - Neural2 - Male' 
WHERE `id` = 'TTS_GoogleCloud_0005'; -- Was cmn-CN-Wavenet-B (Male)

-- Cantonese Voices (Neural2)
UPDATE `ai_tts_voice` 
SET `tts_voice` = 'yue-Hant-HK-Neural2-A', `name` = 'Cantonese (HK) - Neural2 - Female'
WHERE `id` = 'TTS_GoogleCloud_0006'; -- Was yue-HK-Standard-A (Female)

UPDATE `ai_tts_voice` 
SET `tts_voice` = 'yue-Hant-HK-Neural2-B', `name` = 'Cantonese (HK) - Neural2 - Male'
WHERE `id` = 'TTS_GoogleCloud_0007'; -- Was yue-HK-Standard-B (Male)
