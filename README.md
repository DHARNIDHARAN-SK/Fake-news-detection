# Fake News Detection

A Flask web app that labels a news article, headline, or post as **REAL NEWS** or **FAKE NEWS**. It uses a pre-trained scikit-learn model: a TF-IDF vectorizer with Logistic Regression. The web front end is branded **TruthLens**.

---

## Problem statement

False or misleading news spreads quickly on social media and messaging apps, and most readers can't check every story they see. This project offers a quick first check. You paste in some text and a machine-learning model trained on labelled news classifies it.

## What the application does

1. Serves a three-page website: **Home**, **Detect News**, and **Contact**.
2. On the **Detect News** page, you paste text and click **Detect** (or press `Ctrl + Enter`).
3. The browser sends the text to the Flask endpoint `POST /predict`.
4. The server turns the text into TF-IDF features with the saved `vectorizer.pkl`, then classifies it with the saved `model.pkl`.
5. The server returns the label and the model's probability for that label. The page shows them as a verdict badge and a confidence bar.

## Features that exist in the code

| Feature | Where |
|---|---|
| Real/Fake classification with a pre-trained TF-IDF + Logistic Regression model | `app.py`, `model.pkl`, `vectorizer.pkl` |
| JSON prediction API (`POST /predict`) that returns the label and confidence | `app.py` |
| Detect page with a text box, character and word counters, Clear button, and `Ctrl + Enter` shortcut | `templates/detect.html`, `static/script.js` |
| Three one-click sample texts (two fake-style, one real-style) | `templates/detect.html` |
| Result card with a verdict badge and an animated confidence bar | `static/script.js`, `static/style.css` |
| Responsive layout with a mobile hamburger menu, scroll fade-in, and counter animations | `static/script.js`, `static/style.css` |
| Contact page with a form and FAQ accordion (front end only, see [Limitations](#limitations)) | `templates/contact.html`, `static/script.js` |

## ML / model details

| Item | Value (read from the saved pickles) |
|---|---|
| Vectorizer | `sklearn.feature_extraction.text.TfidfVectorizer` |
| Vectorizer settings | `stop_words='english'`, `ngram_range=(1, 2)`, `min_df=5`, `max_df=0.7`, lowercase, L2 norm |
| Vocabulary size | 253,072 unigram and bigram features |
| Classifier | `sklearn.linear_model.LogisticRegression(max_iter=1000)` |
| Classes | `0` → **FAKE NEWS**, `1` → **REAL NEWS** (mapping in `app.py`) |
| Confidence | `max(model.predict_proba(x))` × 100, rounded to 1 decimal |
| Serialization | Python `pickle` |

The model is **already trained**. This repository has no training script. The app only loads the two pickle files and runs inference.

## Dataset details

The training dataset and training notebook/script are **not included** in this repository, and the code does not record which dataset was used. Only the trained artifacts (`model.pkl`, `vectorizer.pkl`) are provided. Because the vectorizer uses English stop words and an English vocabulary, the model is meant for **English** text.

## Tech stack

- **Backend:** Python, Flask
- **ML:** scikit-learn (TF-IDF + Logistic Regression), NumPy, SciPy
- **Frontend:** Jinja2 HTML templates, plain CSS, plain JavaScript (no framework)
- **Fonts:** Google Fonts (Bebas Neue, DM Sans, JetBrains Mono), loaded from `style.css`
- **Deployment config:** `Procfile` (`web: python app.py`). The app reads the `PORT` environment variable.

## Architecture / workflow

```
 Browser (detect.html + script.js)
        │  POST /predict  {"news": "<text>"}
        ▼
 Flask app (app.py)
        │  vectorizer.transform([text])      ← vectorizer.pkl (TF-IDF)
        │  model.predict(...) / predict_proba ← model.pkl (LogisticRegression)
        ▼
 JSON  {"prediction": "FAKE NEWS" | "REAL NEWS", "confidence": <0-100>}
        │
        ▼
 Result card: verdict badge + confidence bar
```

Both pickles load **once at startup**. Each request only runs the TF-IDF transform and one linear prediction.

## Project structure

```
fake news detector/
├── app.py              # Flask app: page routes + /predict inference endpoint
├── model.pkl           # Trained LogisticRegression classifier (~2 MB)  — required
├── vectorizer.pkl      # Fitted TfidfVectorizer (~7 MB)                 — required
├── requirements.txt    # Python dependencies
├── Procfile            # Process definition for PaaS deployment
├── static/
│   ├── style.css       # Site styling
│   └── script.js       # UI behaviour + call to /predict
└── templates/
    ├── index.html      # Home page
    ├── detect.html     # Detection page
    └── contact.html    # Contact / FAQ page
```

## Installation

**Requirements:** Python 3 with pip. Verified on **Python 3.14.0** (Windows 11).

```bash
git clone https://github.com/DHARNIDHARAN-SK/Fake-news-detection.git
cd Fake-news-detection

# optional but recommended: use a virtual environment
python -m venv .venv
# Windows:        .venv\Scripts\activate
# macOS / Linux:  source .venv/bin/activate

pip install -r requirements.txt
```

## Dependencies

`requirements.txt`:

```
flask
scikit-learn
pandas
numpy
```

Versions used for verification: Flask 3.1.3, scikit-learn 1.8.0, NumPy 2.4.2, SciPy 1.17.0 (installed with scikit-learn). `pandas` is listed but `app.py` does not import it.

> **Important:** The pickles are tied to scikit-learn internals. If a newer scikit-learn version fails to load them or warns about versions, install the tested version with `pip install scikit-learn==1.8.0`.

## Environment variables

| Variable | Required | Default | Purpose |
|---|---|---|---|
| `PORT` | No | `10000` | Port the Flask server listens on (host `0.0.0.0`) |

No API keys or secrets are needed.

## Run (verified command)

From the project root, the folder that contains `app.py`, `model.pkl`, and `vectorizer.pkl`:

```bash
python app.py
```

Then open **http://127.0.0.1:10000** in your browser.

> The pickles load with relative paths, so start the app **from the project root**.

## How to use

1. Open http://127.0.0.1:10000 and click **Start Detecting**, or go straight to http://127.0.0.1:10000/detect.
2. Paste a news article or headline into the text box (15–2000 characters). You can also click a sample button.
3. Click **Detect** or press `Ctrl + Enter`.
4. Read the verdict (**🚨 FAKE NEWS** or **✅ REAL NEWS**) and the model's confidence.
5. Click **✕ Clear** to start again.

## Example input / output

You can call the API directly. The outputs below come from the running app:

```bash
curl -X POST http://127.0.0.1:10000/predict \
  -H "Content-Type: application/json" \
  -d "{\"news\": \"BREAKING!!! SHOCKING TRUTH they don't want you to know!!! Scientists EXPOSED for hiding MIRACLE CURE from the public!!!\"}"
```

```json
{"confidence": 96.0, "prediction": "FAKE NEWS"}
```

```bash
curl -X POST http://127.0.0.1:10000/predict \
  -H "Content-Type: application/json" \
  -d '{"news": "WASHINGTON (Reuters) - The U.S. Senate on Tuesday passed a bill to fund the government through December, lawmakers said in a statement."}'
```

```json
{"confidence": 99.8, "prediction": "REAL NEWS"}
```

## Model / artifact requirements

- `model.pkl` and `vectorizer.pkl` **must** be in the project root. Without them the app fails at startup with `FileNotFoundError`.
- Both files are committed to this repository (about 9 MB total). No download or retraining is needed.
- Load the pickles only from a trusted source, because unpickling can run arbitrary code.

## Limitations

- **Statistical text classifier only.** The model learns word and phrase patterns from its training data. It does not fact-check claims, look up sources, or know about recent events. A confident prediction is not proof.
- **English only.** The vectorizer uses an English stop-word list and an English vocabulary.
- **Domain sensitivity.** Results depend on how close the input is to the (undocumented) training data. Short or unusual text can get low-confidence predictions (about 50%).
- **Result-card explanations are generic.** The "Reason", "Key Indicators", and "Recommendation" text is pre-written copy picked for the verdict. The model does not generate it. Only the **verdict** and **confidence** come from the model.
- **Marketing copy is placeholder text.** The Home and Contact pages mention things the code does not implement: stats such as "98% accuracy", "2.4M articles", and "47+ languages"; source verification; multi-language support; a public API; live chat; and `@truthlens.ai` email addresses.
- **Contact form does not send anything.** Submission is simulated in the browser.
- **Development server.** `python app.py` uses Flask's built-in server. For production traffic, use a WSGI server (for example gunicorn), which is not in `requirements.txt`.
- **No input validation on the API.** A `POST /predict` request without a `news` field returns HTTP 500. The web page itself always sends the field.

## Troubleshooting

| Problem | Fix |
|---|---|
| `FileNotFoundError: model.pkl` / `vectorizer.pkl` | Run `python app.py` from the project root, and make sure both `.pkl` files are there. |
| `ModuleNotFoundError: No module named 'flask'` / `'sklearn'` | Activate your virtual environment and run `pip install -r requirements.txt`. |
| `InconsistentVersionWarning` or an error while unpickling | Install the tested version: `pip install scikit-learn==1.8.0`. |
| `did not find executable at ...python.exe` when using `.venv` | The virtual environment points to a Python that no longer exists. Delete `.venv`, create it again with `python -m venv .venv`, and reinstall the requirements. |
| Port 10000 already in use | Pick another port, e.g. PowerShell: `$env:PORT=5000; python app.py`, or bash: `PORT=5000 python app.py`. |
| The page shows "Prediction failed. Is the Flask server running?" | The browser could not reach `/predict`. Check that the server is still running and look at its terminal for a traceback. |

## Author

**Dharanidharan** — GitHub: [@DHARNIDHARAN-SK](https://github.com/DHARNIDHARAN-SK)
