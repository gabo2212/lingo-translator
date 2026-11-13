"""Digits from the source have to survive unchanged."""

from __future__ import annotations

from backend.app.metrics import extract_numbers, numeric_fact_retention


def test_extracts_digits_and_times() -> None:
    assert extract_numbers("at 11:40 I spent $47") == ["11", "40", "47"]


def test_three_inside_thirty_does_not_count() -> None:
    report = numeric_fact_retention("I saw 3 people.", "I saw 30 people.")
    assert report["missing"] == ["3"]
    assert report["ratio"] == 0.0


def test_repeated_numbers_are_counted() -> None:
    report = numeric_fact_retention("Waited 20 minutes, then another 20.", "Only 20 minutes passed.")
    assert report["retained"] == 1
    assert report["missing"] == ["20"]
    assert report["total"] == 2


def test_full_retention_and_empty_source() -> None:
    kept = numeric_fact_retention("Room for 8 at 9:05.", "Room for 8 at 9:05.")
    assert kept["ratio"] == 1.0
    assert kept["missing"] == []
    empty = numeric_fact_retention("No digits here.", "Still no digits.")
    assert empty["total"] == 0
    assert empty["ratio"] == 1.0
