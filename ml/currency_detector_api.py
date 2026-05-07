import base64
import io
import os

import cv2
import numpy as np
import torch
import torchvision.models as models
import torchvision.transforms as T
from flask import Flask, jsonify, request
from PIL import Image

DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
MODEL_PATH = os.path.join(os.path.dirname(__file__), "currency_detector.pt")
CONF_THRESHOLD = 0.80

CLASSES = [
    "fake_50",
    "fake_10",
    "fake_20",
    "fake_200",
    "fake_500",
    "fake_2000",
    "fake_100",
    "real_50",
    "real_10",
    "real_20",
    "real_200",
    "real_500",
    "real_2000",
    "real_100",
]

transform = T.Compose([
    T.ToPILImage(),
    T.Resize((224, 224)),
    T.ToTensor(),
    T.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
])

model = models.resnet50(weights=None)
model.fc = torch.nn.Linear(model.fc.in_features, len(CLASSES))
model.load_state_dict(torch.load(MODEL_PATH, map_location=DEVICE))
model = model.to(DEVICE)
model.eval()

app = Flask(__name__)


def decode_image(image_base64):
    image_bytes = base64.b64decode(image_base64)
    pil_image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    return cv2.cvtColor(np.array(pil_image), cv2.COLOR_RGB2BGR)


def predict(frame):
    h, w, _ = frame.shape
    roi = frame[int(h * 0.2):int(h * 0.8), int(w * 0.2):int(w * 0.8)]
    rgb = cv2.cvtColor(roi, cv2.COLOR_BGR2RGB)
    img_tensor = transform(rgb).unsqueeze(0).to(DEVICE)

    with torch.no_grad():
        outputs = model(img_tensor)
        probs = torch.softmax(outputs, dim=1)
        conf, pred = torch.max(probs, 1)

    confidence = float(conf.item())
    label = CLASSES[int(pred.item())]

    if confidence < CONF_THRESHOLD:
        return {
            "detected": False,
            "label": None,
            "note": None,
            "confidence": confidence,
        }

    _, denom = label.split("_")
    return {
        "detected": True,
        "label": label,
        "note": denom,
        "confidence": confidence,
    }


@app.post("/detect")
def detect():
    payload = request.get_json(silent=True) or {}
    image_base64 = payload.get("image")

    if not image_base64:
        return jsonify({"error": "image is required"}), 400

    try:
        frame = decode_image(image_base64)
        return jsonify(predict(frame))
    except Exception as error:
        return jsonify({"error": str(error)}), 500


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
