import spaces
import gradio as gr
import uvicorn

from app.main import app as fastapi_app
from app.services.emotion_analyzer import emotion_analyzer

SPACE_PORT = 7860


@spaces.GPU
def zero_gpu_placeholder() -> None:
    return None


def analyze_demo(text: str) -> dict[str, float]:
    result = emotion_analyzer.analyze(text=text, context=[])
    return {score.name: score.probability for score in result.emotions.top_emotions}


demo = gr.Interface(
    fn=analyze_demo,
    inputs=gr.Textbox(label="Dialogue line", lines=3),
    outputs=gr.Label(label="Top emotions"),
    title="Dialogue Emotion NLP Service",
    description="REST API lives at /api/v1 (see /docs). This form is a quick manual check.",
)

app = gr.mount_gradio_app(fastapi_app, demo, path="/ui")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=SPACE_PORT)
