import spaces
import gradio as gr

from app.api.routes import router
from app.services.emotion_analyzer import emotion_analyzer
from app.services.vad_converter import load_vad_mappings

SPACE_HOST = "0.0.0.0"
SPACE_PORT = 7860


@spaces.GPU
def zero_gpu_placeholder() -> None:
    return None


def analyze_demo(text: str) -> dict[str, float]:
    result = emotion_analyzer.analyze(text=text, context=[])
    return {score.name: score.probability for score in result.emotions.top_emotions}


load_vad_mappings()
emotion_analyzer.load_model()

demo = gr.Interface(
    fn=analyze_demo,
    inputs=gr.Textbox(label="Dialogue line", lines=3),
    outputs=gr.Label(label="Top emotions"),
    title="Dialogue Emotion NLP Service",
    description="REST API lives at /api/v1. This form is a quick manual check.",
)

demo.launch(server_name=SPACE_HOST, server_port=SPACE_PORT, ssr_mode=False, prevent_thread_lock=True)
server_routes = demo.server_app.router.routes
gradio_route_count = len(server_routes)
demo.server_app.include_router(router)
api_routes = server_routes[gradio_route_count:]
del server_routes[gradio_route_count:]
server_routes[0:0] = api_routes
demo.block_thread()
