"""The GPU accepts one generation and rejects the next until it finishes."""

from __future__ import annotations

import threading

import pytest

from backend.app.errors import BusyError
from backend.app.single_flight import SingleFlight


def test_second_acquire_raises_until_release() -> None:
    flight = SingleFlight()
    flight.acquire()
    assert flight.busy
    with pytest.raises(BusyError):
        flight.acquire()
    flight.release()
    flight.acquire()
    flight.release()
    assert not flight.busy


def test_overlapping_thread_is_rejected() -> None:
    flight = SingleFlight()
    started = threading.Event()
    release = threading.Event()
    errors: list[BaseException] = []

    def hold() -> None:
        flight.acquire()
        started.set()
        release.wait(2)
        flight.release()

    def collide() -> None:
        started.wait(2)
        try:
            flight.acquire()
        except BusyError as exc:
            errors.append(exc)

    first = threading.Thread(target=hold)
    second = threading.Thread(target=collide)
    first.start()
    second.start()
    second.join(2)
    release.set()
    first.join(2)
    assert errors
    assert "already running" in str(errors[0])
