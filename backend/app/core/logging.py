import logging
import sys

def get_logger(name: str) -> logging.Logger:
    """
    Returns a configured logger with standard formatting.
    No raw print statements should be used in the application.
    """
    logger = logging.getLogger(name)
    
    if not logger.handlers:
        logger.setLevel(logging.INFO)
        handler = logging.StreamHandler(sys.stdout)
        
        formatter = logging.Formatter(
            fmt="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S"
        )
        handler.setFormatter(formatter)
        logger.addHandler(handler)
        
        # Prevent log propagation to avoid duplicate logs in case the root logger is also configured
        logger.propagate = False

    return logger
