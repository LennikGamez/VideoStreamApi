import os
import json


data = {}

def traverse_folder(folder_path):
    # Iteriere durch jeden Eintrag im Ordner
    for root, dirs, files in os.walk(folder_path):
        for file in files:
            # Erstelle den vollständigen Pfad zur Datei
            file_path = os.path.join(root, file)

            # Überprüfe, ob die Datei 'config.json' ist
            if file == 'config.json':
                # Lese den Inhalt der config.json-Datei aus
                with open(file_path, 'r', encoding="utf-8") as config_file:
                    try:
                        config_data = json.load(config_file)
                        data[config_data["name"].lower()] = config_data
                        data[config_data["name"].lower()]['path'] = root
                        print(config_data)
                    except json.JSONDecodeError as e:
                        print(f'Fehler beim Dekodieren der JSON-Datei {file_path}: {e}')

# Starte den Prozess mit dem Wurzelordner
root_folder = r"V:/Movielibrary"
traverse_folder(root_folder)

with open("./data/media.json", "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=4)