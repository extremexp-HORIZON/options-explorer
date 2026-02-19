from src.apps.api import create_flask


print("Starting Flask server...")
if __name__ == "__main__":
    app = create_flask()
    app.run(host="0.0.0.0", port=8000, debug=True, use_reloader=True)