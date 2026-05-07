import os

import torch
import torchvision.models as models

ROOT_DIR = os.path.dirname(os.path.dirname(__file__))
PT_PATH = os.path.join(ROOT_DIR, "ml", "currency_detector.pt")
ONNX_PATH = os.path.join(ROOT_DIR, "assets", "models", "currency_detector.onnx")


def main():
    if not os.path.exists(PT_PATH):
        raise FileNotFoundError(f"Missing model file: {PT_PATH}")

    os.makedirs(os.path.dirname(ONNX_PATH), exist_ok=True)

    model = models.resnet50(weights=None)
    model.fc = torch.nn.Linear(model.fc.in_features, 14)
    model.load_state_dict(torch.load(PT_PATH, map_location="cpu"))
    model.eval()

    dummy_input = torch.randn(1, 3, 224, 224)

    torch.onnx.export(
        model,
        dummy_input,
        ONNX_PATH,
        export_params=True,
        opset_version=17,
        do_constant_folding=True,
        input_names=["input"],
        output_names=["logits"],
        dynamic_axes=None,
    )

    print(f"ONNX model exported to: {ONNX_PATH}")


if __name__ == "__main__":
    main()
