import json
from flask import make_response
def response_handler(data=None, status_code=200, error=None, message=None):
        response = {
            "status": "success" if error is None else "error",
            "status_code": status_code
        }

        if error:
            response["error"] = error
        if message:
            response["message"] = message
        if data is not None:
            response["data"] = data

        res = make_response(json.dumps(response))
        res.mimetype = 'application/json'
        return res

def allowed_file(filename , file_type):
    return '.' in filename and \
        filename.rsplit('.', 1)[1].lower() in file_type