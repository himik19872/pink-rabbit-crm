# Settings package
from .base import *

# Override with local settings for development
try:
    from .local import *
except ImportError:
    pass