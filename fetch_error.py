import urllib.request
import urllib.error
import json

url = "http://localhost:8081/node_modules/expo-router/entry.bundle?platform=web&dev=true&hot=false&lazy=true"
try:
    with urllib.request.urlopen(url) as response:
        print(f"Status Code: {response.getcode()}")
except urllib.error.HTTPError as e:
    print(f"Status Code: {e.code}")
    content = e.read().decode('utf-8')
    try:
        error_json = json.loads(content)
        with open('error_log.txt', 'w') as f:
            f.write("Error Type: " + str(error_json.get('type')) + "\n")
            f.write("FULL ERROR MESSAGE:\n")
            f.write(str(error_json.get('message')) + "\n")
            f.write("Stack Trace:\n")
            f.write(str(error_json.get('stack')) + "\n")
        print("Error written to error_log.txt")
    except json.JSONDecodeError:
        with open('error_log.txt', 'w') as f:
            f.write("Raw Response Body:\n")
            f.write(content)
        print("Raw error written to error_log.txt")
except Exception as e:
    print(f"Error: {e}")
