"""HTTP API. The browser talks to this process; generation stays on the local GPU."""

from __future__ import annotations

import asyncio
import logging
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from starlette.datastructures import MutableHeaders
from starlette.types import ASGIApp, Message, Receive, Scope, Send

from backend.app.errors import (
    BusyError,
    GenerationFailedError,
    InputError,
    ModelNotReadyError,
    UnknownStyleError,
)
from backend.app.prompts import build_prompt, load_catalog, public_styles
from backend.app.schemas import HealthOut, HostOut, StylesOut, TranslateIn, TranslateJob, TranslateOut

log = logging.getLogger(__name__)

ALLOWED_ORIGINS = (
    "http://localhost:5173",
    "http://127.0.0.1:5173",
)


class PrivateNetworkHeader:
    """Echo Access-Control-Allow-Private-Network on every API response."""

    def __init__(self, app: ASGIApp) -> None:
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        async def send_with_header(message: Message) -> None:
            if message["type"] == "http.response.start":
                message.setdefault("headers", [])
                headers = MutableHeaders(scope=message)
                headers["Access-Control-Allow-Private-Network"] = "true"
            await send(message)

        await self.app(scope, receive, send_with_header)


class PlaceholderService:
    """Used only when LINGO_TESTING=1 so importing the app does not touch CUDA."""

    autoload = False
    status = "loading"
    timeout_seconds = 120.0

    def health(self) -> dict[str, object]:
        from backend.app.inference import MODEL_ID

        return {
            "status": "loading",
            "model": MODEL_ID,
            "device": "cuda",
            "gpu_name": None,
            "dtype": "bfloat16",
            "detail": "Test process: model load is disabled.",
        }

    def translate(self, job: TranslateJob) -> dict[str, object]:
        raise ModelNotReadyError("Test process: model load is disabled.")


def _payload(result: object) -> dict[str, object]:
    if isinstance(result, dict):
        return result
    return {
        "translation": result.translation,
        "style": result.style,
        "linkedin_tone": result.linkedin_tone,
        "model": result.model,
        "device": result.device,
        "elapsed_ms": result.elapsed_ms,
        "prompt_id": result.prompt_id,
    }


async def _load_in_background(service: object) -> None:
    try:
        await asyncio.to_thread(service.load)
    except Exception:
        log.exception("background CUDA load failed")


@asynccontextmanager
async def lifespan(app: FastAPI):
    service = app.state.service
    if getattr(service, "autoload", False) and getattr(service, "status", None) != "ready":
        app.state.loader = asyncio.create_task(_load_in_background(service))
    yield


def build_app(service: object | None = None) -> FastAPI:
    app = FastAPI(title="Local lingo translator", lifespan=lifespan)
    if service is None:
        from backend.app.inference import InferenceService

        service = InferenceService()
    app.state.service = service
    app.add_middleware(
        CORSMiddleware,
        allow_origins=list(ALLOWED_ORIGINS),
        allow_origin_regex=r"https?://.+",
        allow_credentials=False,
        allow_methods=["GET", "POST", "OPTIONS"],
        allow_headers=["*"],
        allow_private_network=True,
    )
    app.add_middleware(PrivateNetworkHeader)

    @app.get("/api/health", response_model=HealthOut)
    def health(request: Request) -> dict[str, object]:
        return request.app.state.service.health()

    @app.get("/api/host", response_model=HostOut)
    def host(request: Request) -> dict[str, str]:
        body = request.app.state.service.health()
        model = body.get("model") if isinstance(body, dict) else None
        device = body.get("device") if isinstance(body, dict) else None
        return {
            "role": "translator",
            "model": str(model) if isinstance(model, str) else "",
            "device": str(device) if isinstance(device, str) else "",
        }

    @app.get("/api/styles", response_model=StylesOut)
    def styles() -> dict[str, object]:
        return {"styles": public_styles()}

    @app.post("/api/translate", response_model=TranslateOut)
    async def translate(body: TranslateIn, request: Request) -> dict[str, object]:
        service = request.app.state.service
        if getattr(service, "status", "ready") != "ready":
            detail = "Model is not ready."
            health_body = service.health()
            if isinstance(health_body, dict) and health_body.get("detail"):
                detail = str(health_body["detail"])
            raise HTTPException(status_code=503, detail=detail)
        try:
            # Validate style and tone before taking the GPU. The user text stays in the user turn.
            build_prompt(body.text, body.style, body.linkedin_tone)
        except UnknownStyleError as exc:
            raise HTTPException(status_code=422, detail=str(exc)) from exc
        except InputError as exc:
            raise HTTPException(status_code=422, detail=str(exc)) from exc
        catalog = load_catalog()
        max_new_tokens = body.max_new_tokens
        if max_new_tokens is not None:
            max_new_tokens = min(max_new_tokens, catalog.sampling.max_new_tokens_cap)
        job = TranslateJob(
            text=body.text,
            style=body.style,
            linkedin_tone=body.linkedin_tone,
            temperature=body.temperature,
            max_new_tokens=max_new_tokens,
            seed=body.seed,
        )
        timeout = float(getattr(service, "timeout_seconds", None) or catalog.sampling.timeout_seconds)
        try:
            result = await asyncio.wait_for(asyncio.to_thread(service.translate, job), timeout=timeout)
        except TimeoutError as exc:
            raise HTTPException(
                status_code=504,
                detail=f"Generation timed out after {int(timeout)} seconds.",
            ) from exc
        except BusyError as exc:
            raise HTTPException(status_code=429, detail=str(exc)) from exc
        except ModelNotReadyError as exc:
            raise HTTPException(status_code=503, detail=str(exc)) from exc
        except UnknownStyleError as exc:
            raise HTTPException(status_code=422, detail=str(exc)) from exc
        except InputError as exc:
            raise HTTPException(status_code=422, detail=str(exc)) from exc
        except GenerationFailedError as exc:
            raise HTTPException(status_code=500, detail=str(exc)) from exc
        return _payload(result)

    return app


if os.environ.get("LINGO_TESTING") == "1":
    app = build_app(service=PlaceholderService())
else:
    app = build_app()
