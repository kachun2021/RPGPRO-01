import os
import json
import zhconv

def convert_to_cht(data):
    if isinstance(data, dict):
        return {k: convert_to_cht(v) for k, v in data.items()}
    elif isinstance(data, list):
        return [convert_to_cht(i) for i in data]
    elif isinstance(data, str):
        return zhconv.convert(data, 'zh-tw')
    else:
        return data

def process_directory(directory="."):
    for filename in os.listdir(directory):
        if filename.endswith(".json"):
            filepath = os.path.join(directory, filename)
            print(f"Processing {filename}...")
            try:
                with open(filepath, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                
                converted_data = convert_to_cht(data)
                
                with open(filepath, 'w', encoding='utf-8') as f:
                    json.dump(converted_data, f, ensure_ascii=False, indent=2)
                print(f"  -> Successfully converted {filename}")
            except Exception as e:
                print(f"  -> Error processing {filename}: {e}")

if __name__ == "__main__":
    process_directory()
