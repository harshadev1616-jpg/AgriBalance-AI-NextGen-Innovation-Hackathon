import mimetypes
from pathlib import Path

from django.conf import settings
from django.http import FileResponse, Http404


FRONTEND_DIST = Path(settings.BASE_DIR) / "frontend" / "dist"


def frontend_index(request, spa_path=""):
    index_file = FRONTEND_DIST / "index.html"
    if not index_file.exists():
        raise Http404("Frontend build not found")
    return FileResponse(index_file.open("rb"), content_type="text/html")


def frontend_asset(request, asset_path):
    asset_file = (FRONTEND_DIST / "assets" / asset_path).resolve()
    assets_root = (FRONTEND_DIST / "assets").resolve()
    if assets_root not in asset_file.parents or not asset_file.is_file():
        raise Http404("Frontend asset not found")

    content_type, _ = mimetypes.guess_type(str(asset_file))
    return FileResponse(asset_file.open("rb"), content_type=content_type or "application/octet-stream")
