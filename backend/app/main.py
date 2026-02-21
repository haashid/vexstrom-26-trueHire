from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from app.api.routes import router
from app.core.logging import get_logger
import uvicorn

logger = get_logger(__name__)

app = FastAPI(
    title="AI Interview Committee API",
    description="Production-quality AI system for hiring synthesis and evaluation.",
    version="1.0.0"
)

# CORS middleware for potential frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api/v1")

@app.get("/", include_in_schema=False)
async def root():
    """
    Redirects to the Swagger UI documentation.
    """
    return RedirectResponse(url="/docs")

@app.get("/health", tags=["Health"])
async def health_check():
    """
    Basic health check endpoint.
    """
    logger.info("Health check pinged.")
    return {"status": "ok", "service": "AI Interview Committee"}

@app.on_event("startup")
async def startup_event():
    logger.info("Application startup... Ready to process interviews.")

@app.on_event("shutdown")
async def shutdown_event():
    logger.info("Application shutting down...")

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
