import re

from app.config import Settings


def test_cors_allows_the_app_and_previews():
    pattern = re.compile(Settings().cors_origin_regex)
    assert pattern.fullmatch("https://forma-train-one.vercel.app")
    assert pattern.fullmatch("https://forma-train.vercel.app")
    assert pattern.fullmatch("https://forma-train-git-x-edoardo-damicos-projects.vercel.app")
    assert not pattern.fullmatch("https://forma-train-evil.vercel.app")
