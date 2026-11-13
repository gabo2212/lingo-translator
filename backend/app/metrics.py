"""Digit retention. A metaphor may change words; it may not change a number."""

from __future__ import annotations

import re

# 11:40 yields 11 and 40. 1,000 stays one token. 3 must not match inside 30.
_NUMBER = re.compile(r"\d+(?:[.,]\d+)?")


def extract_numbers(text: str) -> list[str]:
    return _NUMBER.findall(text)


def _occurrences(text: str) -> dict[str, int]:
    counts: dict[str, int] = {}
    for number in extract_numbers(text):
        counts[number] = counts.get(number, 0) + 1
    return counts


def numeric_fact_retention(source: str, output: str) -> dict[str, object]:
    """Fraction of source numerals that still appear as the same digit strings.

    Word numbers such as "forty" are not counted. A row with no digits has
    ratio 1.0 and total 0; average that subset separately.
    """
    source_numbers = extract_numbers(source)
    available = _occurrences(output)
    missing: list[str] = []
    for number in source_numbers:
        left = available.get(number, 0)
        if left > 0:
            available[number] = left - 1
        else:
            missing.append(number)
    total = len(source_numbers)
    retained = total - len(missing)
    ratio = 1.0 if total == 0 else retained / total
    return {
        "source_numbers": source_numbers,
        "missing": missing,
        "retained": retained,
        "total": total,
        "ratio": ratio,
    }
