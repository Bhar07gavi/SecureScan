import torch
import torch.nn as nn
import pickle
import os
import re
from typing import Optional, Dict, Any
import random


class VulnDetector(nn.Module):
    def __init__(self, input_size: int):
        super(VulnDetector, self).__init__()
        self.model = nn.Sequential(
            nn.Linear(input_size, 512), nn.ReLU(), nn.BatchNorm1d(512), nn.Dropout(0.3),
            nn.Linear(512, 256), nn.ReLU(), nn.BatchNorm1d(256), nn.Dropout(0.3),
            nn.Linear(256, 128), nn.ReLU(), nn.BatchNorm1d(128), nn.Dropout(0.3),
            nn.Linear(128, 1), nn.Sigmoid()
        )

    def forward(self, x):
        return self.model(x)


class ModelService:
    def __init__(self):
        self.base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        self.model_path = os.path.join(self.base_dir, "models", "my_trained_model.pt")
        self.vectorizer_path = os.path.join(self.base_dir, "models", "vectorizer.pkl")
        self.metadata_path = os.path.join(self.base_dir, "models", "model_metadata.pkl")
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.model: Optional[nn.Module] = None
        self.vectorizer = None
        self.metadata: Optional[Dict[str, Any]] = None
        self.is_loaded = False
        self._load_model()

    def _load_model(self):
        print(f"\n{'='*70}")
        print("🔧 MODEL SERVICE INITIALIZATION")
        print(f"{'='*70}")

        model_exists = os.path.exists(self.model_path)
        vectorizer_exists = os.path.exists(self.vectorizer_path)
        metadata_exists = os.path.exists(self.metadata_path)

        print(f"📦 Model: {'✅' if model_exists else '❌'}")
        print(f"📦 Vectorizer: {'✅' if vectorizer_exists else '❌'}")
        print(f"📦 Metadata: {'✅' if metadata_exists else '❌'}")

        if not model_exists or not vectorizer_exists:
            print("⚠️ Model files not found! Using mock predictions.")
            return

        try:
            with open(self.vectorizer_path, 'rb') as f:
                self.vectorizer = pickle.load(f)
            print("   ✅ Vectorizer loaded!")

            input_size = 371
            if metadata_exists:
                with open(self.metadata_path, 'rb') as f:
                    self.metadata = pickle.load(f)
                input_size = self.metadata.get('input_size', 371)
                print(f"   📊 Accuracy: {self.metadata.get('accuracy', 0):.4f}")

            self.model = VulnDetector(input_size)
            self.model.load_state_dict(torch.load(self.model_path, map_location=self.device))
            self.model.to(self.device)
            self.model.eval()
            self.is_loaded = True
            print("   ✅ Model loaded!")
            print(f"\n🎉 MODEL SERVICE READY!")
            print(f"{'='*70}\n")

        except Exception as e:
            print(f"❌ Error: {e}")
            self.model = None
            self.vectorizer = None

    def preprocess_code(self, code: str) -> str:
        code = str(code)
        code = re.sub(r'#.*$', '', code, flags=re.MULTILINE)
        code = re.sub(r'//.*$', '', code, flags=re.MULTILINE)
        code = re.sub(r'/\*.*?\*/', '', code, flags=re.DOTALL)
        code = re.sub(r'\s+', ' ', code)
        return code.lower().strip()

    async def predict_risk(self, code: str) -> float:
        if self.model is not None and self.vectorizer is not None:
            try:
                clean_code = self.preprocess_code(code)
                features = self.vectorizer.transform([clean_code]).toarray()
                tensor = torch.FloatTensor(features).to(self.device)
                self.model.eval()
                with torch.no_grad():
                    prediction = self.model(tensor)
                return float(prediction.item())
            except Exception as e:
                print(f"❌ Prediction error: {e}")
                return self._mock_prediction(code)
        return self._mock_prediction(code)

    def _mock_prediction(self, code: str) -> float:
        risk = 0.0
        code_lower = code.lower()
        patterns = {
            "password = '": 0.35, 'password = "': 0.35,
            "api_key = '": 0.30, 'eval(': 0.25,
            'exec(': 0.25, 'os.system(': 0.25,
            'shell=true': 0.20, 'pickle.loads': 0.20,
            'md5(': 0.15, 'innerhtml': 0.15,
        }
        for pattern, weight in patterns.items():
            if pattern in code_lower:
                risk += weight
        risk += random.uniform(0, 0.05)
        return min(max(risk, 0.0), 1.0)

    def get_model_info(self) -> Dict[str, Any]:
        info = {
            "model_loaded": self.is_loaded,
            "device": str(self.device),
            "model_path": self.model_path,
            "vectorizer_loaded": self.vectorizer is not None,
        }
        if self.metadata:
            info.update({
                "accuracy": self.metadata.get('accuracy', 0),
                "f1_score": self.metadata.get('f1', 0),
                "precision": self.metadata.get('precision', 0),
                "recall": self.metadata.get('recall', 0),
                "total_parameters": self.metadata.get('total_params', 0)
            })
        return info


model_service = ModelService()