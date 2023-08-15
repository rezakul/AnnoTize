from flask import Flask, render_template

def ui():
    """
    Flask UI. Starts Flask app and matches requests to correct method.
    """
    app = Flask(__name__)

    @app.route("/", methods=["GET"])
    def index() -> str:
        return render_template("index.html")

    app.run(debug=True)