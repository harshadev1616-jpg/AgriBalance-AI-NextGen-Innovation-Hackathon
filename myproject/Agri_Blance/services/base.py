import logging
from urllib.parse import urlencode

import requests
from django.conf import settings
from rest_framework.exceptions import APIException, ValidationError

logger = logging.getLogger(__name__)


class ExternalServiceError(APIException):
    status_code = 502
    default_detail = "External data provider is currently unavailable."
    default_code = "external_service_error"


class ApiClient:
    base_url = ""
    timeout = 12

    def __init__(self, api_key=None):
        self.api_key = api_key

    def require_key(self, service_name):
        if not self.api_key:
            raise ValidationError({"detail": f"{service_name} API key is not configured."})

    def get(self, path="", params=None, headers=None):
        url = self.build_url(path)
        try:
            response = requests.get(url, params=params or {}, headers=headers or {}, timeout=self.timeout)
            response.raise_for_status()
            return response.json()
        except requests.Timeout as exc:
            logger.warning("Timeout from %s?%s", url, urlencode(params or {}))
            raise ExternalServiceError("External service timed out.") from exc
        except requests.HTTPError as exc:
            status_code = exc.response.status_code if exc.response is not None else "unknown"
            logger.warning("HTTP error from %s: %s", url, status_code)
            raise ExternalServiceError(f"External service returned status {status_code}.") from exc
        except requests.RequestException as exc:
            logger.warning("Request error from %s: %s", url, exc)
            raise ExternalServiceError() from exc
        except ValueError as exc:
            logger.warning("Invalid JSON from %s", url)
            raise ExternalServiceError("External service returned invalid JSON.") from exc

    def build_url(self, path):
        return f"{self.base_url.rstrip('/')}/{path.lstrip('/')}" if path else self.base_url


def get_float(value, field_name):
    try:
        return float(value)
    except (TypeError, ValueError) as exc:
        raise ValidationError({field_name: "A valid number is required."}) from exc
