"""One in-flight generation. A second request is rejected instead of queued."""

from __future__ import annotations

import threading

from backend.app.errors import BusyError


class SingleFlight:
    """A lock that fails immediately when the GPU is already busy."""

    def __init__(self) -> None:
        self._guard = threading.Lock()
        self._busy = False

    @property
    def busy(self) -> bool:
        with self._guard:
            return self._busy

    def acquire(self) -> None:
        with self._guard:
            if self._busy:
                raise BusyError()
            self._busy = True

    def release(self) -> None:
        with self._guard:
            self._busy = False
