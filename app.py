from flask import Flask, request, jsonify, render_template
import pickle
import os

app = Flask(__name__)

model = pickle.load(open("model.pkl","rb"))
vectorizer = pickle.load(open("vectorizer.pkl","rb"))

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/detect")
def detect():
    return render_template("detect.html")

@app.route("/contact")
def contact():
    return render_template("contact.html")

@app.route("/predict", methods=["POST"])
def predict():

    data = request.json
    text = data["news"]

    vector = vectorizer.transform([text])

    prediction = model.predict(vector)[0]

    if prediction == 1:
        result = "REAL NEWS"
    else:
        result = "FAKE NEWS"

    return jsonify({"prediction": result})

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 10000))
    app.run(host="0.0.0.0", port=port)