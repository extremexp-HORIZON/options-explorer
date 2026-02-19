from flask import Flask, render_template_string , abort , send_from_directory
import os
import markdown
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from flask_swagger_ui import get_swaggerui_blueprint

from dotenv import load_dotenv

from src.config import Config
from .utils import response_handler 


#TODO: LOG table

def create_swagger(app):
    # Define the URL where Swagger UI will be accessible
    SWAGGER_URL = '/swagger'
    # URL of the main swagger.yaml file
    API_URL = '/docs/apis_doc.yaml'  # Path to your main apis_doc.yaml file

    # Set up Swagger UI blueprint
    swagger_ui_blueprint = get_swaggerui_blueprint(
        SWAGGER_URL,
        API_URL,
        config={
            'app_name': 'ExtremeXP API'
        }
    )

    # Register Swagger UI blueprint with Flask
    app.register_blueprint(swagger_ui_blueprint, url_prefix=SWAGGER_URL)

    # Serve external YAML files (referenced in your swagger.yaml)
    @app.route('/docs/<path:filename>')
    def serve_static(filename):
        return send_from_directory(os.path.join(app.root_path, 'docs'), filename)

def create_flask(config_class=Config):

    load_dotenv()
    app = Flask(__name__)
    CORS(app) 
    
    jwt = JWTManager(app)

    app.config.from_object(config_class)

    # Create Swagger UI
    create_swagger(app)

    @app.errorhandler(400)
    def handle_400(error):
        error=error.description if error.description else "Bad Request"
        return response_handler(error=error, status_code=400), 400

    @app.errorhandler(401)
    def handle_401(error):
        error=error.description if error.description else "Unauthorized"
        return response_handler(error=error, status_code=401), 401

    @app.errorhandler(404)
    def handle_404(error):
        return response_handler(
            error=error.description if error.description else "Resource not found",
            status_code=404), 404

    @app.errorhandler(405)
    def handle_405(error="Method Not Allowed"):
        error = error.description if error.description else "Method Not Allowed"
        return response_handler(error=error, status_code=405), 405

    @app.errorhandler(500)
    def handle_500(error):
        error=error.description if error.description else "Internal server error"
        return response_handler(error=error , status_code=500), 500


    @app.route('/', methods=['GET'])
    def home():
        home_directory = os.path.expanduser(".")
        readme_file = os.path.join(home_directory, "README.md")
        if os.path.exists(readme_file):
            with open(readme_file, 'r') as file:
                md_content = file.read()
            html_content = markdown.markdown(md_content)
            return render_template_string(html_content)
        else:
            abort(404, description="README.md file not found")

    from .routes import user_routes , experiment_routes
    app.register_blueprint(user_routes.bp, url_prefix="/user")
    app.register_blueprint(experiment_routes.bp, url_prefix="/experiment")
    
    return app