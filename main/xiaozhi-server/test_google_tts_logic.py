def test_logic(config):
    VOICE_MAPPING = {
        # ... (Same set as in google_cloud.py)
        "Mandarin (Chirp3) - Achernar (F)": "cmn-CN-Chirp3-HD-Achernar",
        "Taiwanese (WaveNet) - Male": "cmn-TW-Wavenet-B",
        "English (US) Studio - Female": "en-US-Studio-O",
        "English (UK) Neural2 - Male": "en-GB-Neural2-B",
    }
    
    # Logic from updated google_cloud.py
    raw_voice_name = config.get("private_voice")
    if not raw_voice_name:
        raw_voice_name = config.get("voice", config.get("voice_name", "en-US-Journey-F"))
        
    voice_name = VOICE_MAPPING.get(raw_voice_name, raw_voice_name)
    
    # Updated derivation logic
    parts = voice_name.split("-")
    if len(parts) >= 3 and parts[1] == "Hant":
        derived_lang = "-".join(parts[:3]) # yue-Hant-HK
    else:
        derived_lang = "-".join(parts[:2]) # en-US, cmn-CN, yue-HK, cmn-TW
        
    language_code = config.get("language_code", derived_lang)
    
    print(f"Config: {config}")
    print(f"  Raw: {raw_voice_name}")
    print(f"  Resolved: {voice_name}")
    print(f"  Language: {language_code}")

    if " " in voice_name:
        print("  -> ERROR: voice_name contains spaces (likely descriptive name)")
    else:
        print("  -> OK: voice_name looks like an ID")


if __name__ == "__main__":
    print("--- Simulating GoogleCloudTTS Logic with User Selected Voices ---")
    
    # Case 1: Mandarin Chirp3
    test_logic({"private_voice": "Mandarin (Chirp3) - Achernar (F)"})
    
    # Case 2: Taiwanese WaveNet
    test_logic({"private_voice": "Taiwanese (WaveNet) - Male"})
    
    # Case 3: English Studio
    test_logic({"private_voice": "English (US) Studio - Female"})
