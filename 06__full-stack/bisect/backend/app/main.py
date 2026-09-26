from contextlib import asynccontextmanager
from typing import AsyncGenerator
from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi import status

from app.api.router import api_router
from app.api.v1.health import router as health_router
from app.core.config import settings
from app.core.errors import BisectError
from app.core.logging import LoggingMiddleware, logger


INTERNAL_ERROR_DETAIL = "An internal server error occurred"
INTERNAL_ERROR_CODE = "InternalServerError"


async def bisect_error_handler(request: Request, exc: Exception) -> JSONResponse:
    """Map a domain error to its own status code.

    The status lives on the error class, so no route has to re-map error types
    to status codes. The message is safe to return: domain errors carry
    developer-authored text, not raw upstream payloads.
    """
    assert isinstance(exc, BisectError)
    logger.exception(
        f"Unhandled domain error on {request.method} {request.url.path}: {exc.__class__.__name__}"
    )
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.message, "code": exc.__class__.__name__},
    )


async def request_validation_error_handler(
    request: Request, exc: RequestValidationError
) -> JSONResponse:
    """Normalize schema validation failures to the same error envelope.

    FastAPI's built-in handler returns ``{"detail": [...]}`` with no ``code``, so
    a client that switches on ``code`` to tell a bad request from a domain
    failure would find nothing to switch on. The message is flattened to a
    single human-readable line because the raw list is a list of internal
    loc/type structures, not something to hand a user.
    """
    problems = [
        f"{'.'.join(str(part) for part in error.get('loc', []) if part != 'body')}: {error.get('msg', 'invalid')}"
        for error in exc.errors()
    ]
    return JSONResponse(
        status_code=422,
        content={
            "detail": "; ".join(problems) or "Request validation failed",
            "code": "ValidationError",
        },
    )


async def http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
    """Give framework-raised HTTPException the same envelope as domain errors.

    FastAPI's own handler returns ``{"detail": ...}`` with no ``code``. Adding
    the code lets a client treat an auth rejection, a 404, and a domain failure
    uniformly instead of special-casing whichever ones happen to carry a code.
    ``detail`` is passed through untouched: it is either a string the route
    authored or a structure the framework built, both already client-facing.
    """
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail, "code": "HTTPError"},
        headers=getattr(exc, "headers", None),
    )


async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Contain any exception that no route or specific handler intercepted.

    The response is a fixed generic body: nothing from the exception is
    interpolated into it, so a stack trace or internal message cannot leak. The
    full traceback goes to the log instead, where developers can read it.
    """
    logger.exception(
        f"Unhandled exception on {request.method} {request.url.path}: {exc.__class__.__name__}"
    )
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": INTERNAL_ERROR_DETAIL, "code": INTERNAL_ERROR_CODE},
    )


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Application lifespan context manager for startup and shutdown hooks."""
    logger.info(f"Starting {settings.PROJECT_NAME} in [{settings.ENVIRONMENT}] environment")
    yield
    logger.info(f"Shutting down {settings.PROJECT_NAME}")


def create_app() -> FastAPI:
    """FastAPI application factory."""
    application = FastAPI(
        title=settings.PROJECT_NAME,
        version="0.1.0",
        description="FastAPI backend for Bisect AI coding agent",
        openapi_url=f"{settings.API_V1_STR}/openapi.json",
        docs_url=f"{settings.API_V1_STR}/docs",
        redoc_url=f"{settings.API_V1_STR}/redoc",
        lifespan=lifespan,
    )

    # Middleware: Request Logging
    application.add_middleware(LoggingMiddleware)

    # Middleware: CORS
    application.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Mount API routes
    application.include_router(api_router, prefix=settings.API_V1_STR)
    # Also mount top-level health probe routes
    application.include_router(health_router)

    # Exception handlers. BisectError is registered first so a domain error is
    # never caught by the generic Exception handler below.
    application.add_exception_handler(BisectError, bisect_error_handler)
    application.add_exception_handler(RequestValidationError, request_validation_error_handler)
    application.add_exception_handler(HTTPException, http_exception_handler)
    application.add_exception_handler(Exception, unhandled_exception_handler)

    return application


app = create_app()
