#!/usr/bin/env python3
"""
Auto-detect vendor API keys from environment variables, config files,
and common credential locations. Outputs JSON for one-click import.

Usage:
  python import_keys.py              # print detected keys as JSON
  python import_keys.py --save       # save to vendor_creds.json
  python import_keys.py --env-file .env  # also scan a .env file
"""

import os
import json
import re
import argparse

# ── Mapping: env var patterns → vendor/field ─────────────────────────
# Each entry: (env_var_name_or_pattern, vendor, field_key)
ENV_MAPPINGS = [
    # 腾讯云
    ("TENCENT_APP_ID",       "腾讯云", "appid"),
    ("TENCENT_APPID",        "腾讯云", "appid"),
    ("TENCENT_SECRET_ID",    "腾讯云", "secret_id"),
    ("TENCENTCLOUD_SECRET_ID", "腾讯云", "secret_id"),
    ("TENCENT_SECRET_KEY",   "腾讯云", "secret_key"),
    ("TENCENTCLOUD_SECRET_KEY", "腾讯云", "secret_key"),
    # 火山云 / Volcengine
    ("VOLCENGINE_APP_ID",    "火山云", "app_id"),
    ("VOLC_APP_ID",          "火山云", "app_id"),
    ("VOLCENGINE_ACCESS_TOKEN", "火山云", "access_token"),
    ("VOLC_ACCESS_TOKEN",    "火山云", "access_token"),
    ("VOLCENGINE_SECRET_KEY", "火山云", "secret_key"),
    # BytePlus (international Volcengine)
    ("BYTEPLUS_APP_ID",      "BytePlus", "app_id"),
    ("BYTEPLUS_APPID",       "BytePlus", "app_id"),
    ("BYTEPLUS_ACCESS_TOKEN", "BytePlus", "access_token"),
    ("BYTEPLUS_SECRET_KEY",  "BytePlus", "secret_key"),
    # 微软 Azure
    ("AZURE_SPEECH_KEY",     "微软-世纪互联", "key1"),
    ("AZURE_SPEECH_KEY_CN",  "微软-世纪互联", "key1"),
    ("AZURE_SPEECH_REGION",  "微软-世纪互联", "region"),
    ("AZURE_SPEECH_REGION_CN", "微软-世纪互联", "region"),
    ("AZURE_SPEECH_ENDPOINT_CN", "微软-世纪互联", "endpoint"),
    ("AZURE_SPEECH_KEY_GLOBAL", "微软-Global", "key1"),
    ("AZURE_SPEECH_REGION_GLOBAL", "微软-Global", "region"),
    ("AZURE_SPEECH_ENDPOINT", "微软-Global", "endpoint"),
    # Minimax
    ("MINIMAX_API_KEY",      "Minimax-CN", "api_key"),
    ("MINIMAX_GROUP_ID",     "Minimax-CN", "group_id"),
    ("MINIMAX_GLOBAL_API_KEY", "Minimax-Global", "api_key"),
    ("MINIMAX_GLOBAL_GROUP_ID", "Minimax-Global", "group_id"),
    # 阿里云
    ("DASHSCOPE_API_KEY",    "阿里云", "api_key"),
    ("ALIYUN_API_KEY",       "阿里云", "api_key"),
    ("ALIBABA_CLOUD_API_KEY", "阿里云", "api_key"),
    # ElevenLabs
    ("ELEVENLABS_API_KEY",   "ElevenLabs", "api_key"),
    ("ELEVEN_API_KEY",       "ElevenLabs", "api_key"),
    # Soniox
    ("SONIOX_API_KEY",       "Soniox", "api_key"),
    # Groq
    ("GROQ_API_KEY",         "Groq", "api_key"),
    # Deepgram
    ("DEEPGRAM_API_KEY",     "Deepgram", "api_key"),
    # 智谱
    ("ZHIPU_API_KEY",        "智谱", "api_key"),
    ("GLM_API_KEY",          "智谱", "api_key"),
    # 讯飞
    ("XFYUN_APPID",          "讯飞", "appid"),
    ("XFYUN_ACCESS_KEY",     "讯飞", "access_key"),
    ("XFYUN_ACCESS_SECRET",  "讯飞", "access_secret"),
    ("IFLYTEK_APPID",        "讯飞", "appid"),
    ("IFLYTEK_ACCESS_KEY",   "讯飞", "access_key"),
    ("IFLYTEK_ACCESS_SECRET", "讯飞", "access_secret"),
    # OpenAI
    ("OPENAI_API_KEY",       "OpenAI", "api_key"),
    # FishAudio
    ("FISHAUDIO_API_KEY",    "FishAudio", "api_key"),
    ("FISH_AUDIO_KEY",       "FishAudio", "api_key"),
    # 阶跃星辰 / StepFun
    ("STEPFUN_API_KEY",      "阶跃星辰", "api_key"),
    ("STEP_API_KEY",         "阶跃星辰", "api_key"),
]


# ── JSON field name mapping (for importing from JSON files) ──────────
# Maps JSON field names to internal field keys
JSON_FIELD_MAPPINGS = {
    "FishAudio": {"Key": "api_key"},
    "BytePlus": {"APPID": "app_id", "AccessToken": "access_token", "Secret Key": "secret_key"},
    "阶跃星辰": {"tts_stepfun_key": "api_key"},
    "微软-世纪互联": {"key1": "key1", "key2": "key2", "region": "region", "endpoint": "endpoint"},
    "微软-Global": {"key1": "key1", "key2": "key2", "region": "region", "endpoint": "endpoint"},
    "火山云": {"app_id": "app_id", "access_token": "access_token", "secret_key": "secret_key"},
    "讯飞方言": {"appid": "appid", "access_key": "access_key", "access_secret": "access_secret", "language": "language"},
}


def scan_env_vars(extra_env=None):
    """Scan environment variables for known API key patterns."""
    env = dict(os.environ)
    if extra_env:
        env.update(extra_env)

    found = {}
    for env_key, vendor, field_key in ENV_MAPPINGS:
        val = env.get(env_key, "").strip()
        if val:
            if vendor not in found:
                found[vendor] = {}
            found[vendor][field_key] = val
    return found


def parse_env_file(filepath):
    """Parse a .env file into a dict."""
    result = {}
    if not os.path.isfile(filepath):
        return result
    with open(filepath, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            if "=" in line:
                k, v = line.split("=", 1)
                k = k.strip()
                v = v.strip().strip("'\"")
                if v:
                    result[k] = v
    return result


def parse_json_creds_file(filepath):
    """Parse a JSON credentials file and normalize field names."""
    found = {}
    if not os.path.isfile(filepath):
        return found
    
    with open(filepath, "r", encoding="utf-8") as f:
        try:
            data = json.load(f)
        except json.JSONDecodeError:
            return found
    
    for vendor, fields in data.items():
        if not isinstance(fields, dict):
            continue
        
        # Normalize vendor name (handle aliases like "讯飞方言" -> "讯飞")
        normalized_vendor = vendor
        if vendor == "讯飞方言":
            normalized_vendor = "讯飞"
        
        # Get field mappings for this vendor
        field_map = JSON_FIELD_MAPPINGS.get(vendor, {})
        
        normalized_fields = {}
        for field_key, field_value in fields.items():
            if not field_value or field_value == "-":  # Skip empty or placeholder values
                continue
            # Map field name if mapping exists, otherwise use original
            internal_key = field_map.get(field_key, field_key)
            normalized_fields[internal_key] = field_value
        
        if normalized_fields:
            found[normalized_vendor] = normalized_fields
    
    return found


def scan_vendor_keys_csv(filepath="vendor_keys.csv"):
    """Parse vendor_keys.csv for any pre-filled credential values."""
    found = {}
    if not os.path.isfile(filepath):
        return found

    # Field label → (vendor, field_key) mapping
    LABEL_TO_FIELD = {
        "腾讯云": {"appid": "appid", "SecretId": "secret_id", "SecretKey": "secret_key"},
        "火山云": {"APP ID": "app_id", "Access Token": "access_token", "Secret Key": "secret_key"},
        "微软-世纪互联": {"密钥1": "key1", "密钥2": "key2", "位置/区域": "region", "终结点": "endpoint"},
        "Minimax-CN": {"接口密钥": "api_key", "Key": "api_key", "Group ID": "group_id"},
        "阿里云": {"api_key": "api_key", "url": "url"},
        "Minimax-Global": {"Group ID": "group_id", "Key": "api_key"},
        "ElevenLabs": {"Key": "api_key"},
        "Soniox": {"Key": "api_key"},
        "微软-Global": {"Key": "key1", "Region": "region"},
        "Groq": {"API Key": "api_key"},
        "Deepgram": {"API Key": "api_key"},
        "智谱": {"API Key": "api_key"},
        "讯飞": {"APPID": "appid", "accessKey": "access_key", "accessSecret": "access_secret"},
        "OpenAI": {"API Key": "api_key"},
        # New vendors
        "FishAudio": {"Key": "api_key"},
        "BytePlus": {"APPID": "app_id", "AccessToken": "access_token", "Secret Key": "secret_key"},
        "阶跃星辰": {"API Key": "api_key", "tts_stepfun_key": "api_key"},
    }

    with open(filepath, "r", encoding="utf-8") as f:
        import csv
        reader = csv.reader(f)
        for row in reader:
            if len(row) < 3 or row[0].strip() == "供应商":
                continue
            vendor = row[0].strip()
            key_str = row[2].strip()
            if not key_str or vendor not in LABEL_TO_FIELD:
                continue

            label_map = LABEL_TO_FIELD[vendor]
            # Parse "label: value; label: value" or "label：value; label：value"
            # Also handle "label: 'value', label: 'value'" format
            entries = re.split(r"[;；]", key_str)
            # If no semicolons found but has comma-separated key-value pairs, try comma split
            if len(entries) == 1 and ", " in key_str and ": " in key_str:
                # Handle format like "url: 'https://...', api_key: ''"
                entries = re.split(r"',\s*", key_str)
            for entry in entries:
                entry = entry.strip()
                if not entry:
                    continue
                # Split on first : or ：
                m = re.match(r"(.+?)\s*[:：]\s*(.*)", entry)
                if not m:
                    continue
                label = m.group(1).strip()
                value = m.group(2).strip().strip("'\"")
                if not value:
                    continue
                # Match label to field key
                field_key = label_map.get(label)
                if field_key:
                    if vendor not in found:
                        found[vendor] = {}
                    found[vendor][field_key] = value

    return found


def detect_all(env_file=None, csv_file="vendor_keys.csv", json_file=None):
    """Detect keys from all sources. Later sources override earlier ones."""
    result = {}

    # 1. Scan JSON file if provided (lowest priority for file sources)
    if json_file:
        json_keys = parse_json_creds_file(json_file)
        for vendor, fields in json_keys.items():
            if vendor not in result:
                result[vendor] = {}
            result[vendor].update(fields)
    
    # Also check for common JSON files in current/data directory
    for json_path in ["vendor_creds.json", "data/vendor_creds.json", 
                      "20260323vendor_creds_format.json", "data/20260323vendor_creds_format.json"]:
        if os.path.isfile(json_path) and json_path != json_file:
            json_keys = parse_json_creds_file(json_path)
            for vendor, fields in json_keys.items():
                if vendor not in result:
                    result[vendor] = {}
                result[vendor].update(fields)

    # 2. Scan vendor_keys.csv
    csv_keys = scan_vendor_keys_csv(csv_file)
    for vendor, fields in csv_keys.items():
        if vendor not in result:
            result[vendor] = {}
        result[vendor].update(fields)

    # 3. Scan .env file if provided
    extra_env = {}
    if env_file:
        extra_env = parse_env_file(env_file)

    # 4. Also check for .env in current directory
    if not env_file and os.path.isfile(".env"):
        extra_env = parse_env_file(".env")

    # 5. Scan environment variables (highest priority)
    env_keys = scan_env_vars(extra_env)
    for vendor, fields in env_keys.items():
        if vendor not in result:
            result[vendor] = {}
        result[vendor].update(fields)

    # Filter out empty vendors
    return {v: f for v, f in result.items() if f}


def main():
    parser = argparse.ArgumentParser(description="Auto-detect vendor API keys")
    parser.add_argument("--save", action="store_true", help="Save to vendor_creds.json")
    parser.add_argument("--env-file", type=str, help="Path to .env file to scan")
    parser.add_argument("--csv", type=str, default="vendor_keys.csv", help="Path to vendor_keys.csv")
    parser.add_argument("--json", type=str, help="Path to JSON credentials file to import")
    args = parser.parse_args()

    creds = detect_all(env_file=args.env_file, csv_file=args.csv, json_file=args.json)

    if not creds:
        print("未检测到任何凭证 / No credentials detected.")
        print("\n可通过以下方式配置 / Configure via:")
        print("  1. 环境变量 (e.g. OPENAI_API_KEY=sk-xxx)")
        print("  2. .env 文件")
        print("  3. vendor_keys.csv 中填写值")
        return

    print(json.dumps(creds, ensure_ascii=False, indent=2))

    # Summary
    total_fields = sum(len(f) for f in creds.values())
    print(f"\n检测到 {len(creds)} 个供应商, {total_fields} 个凭证字段")
    for vendor, fields in creds.items():
        keys = ", ".join(fields.keys())
        print(f"  ✅ {vendor}: {keys}")

    if args.save:
        out_path = "vendor_creds.json"
        with open(out_path, "w", encoding="utf-8") as f:
            json.dump(creds, f, ensure_ascii=False, indent=2)
        print(f"\n已保存到 {out_path}")


if __name__ == "__main__":
    main()
