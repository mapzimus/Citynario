"""Command-line entry points for City Pack maintainers."""

import json
from pathlib import Path

import typer

from citynario_data.validation import validate_pack

app = typer.Typer(no_args_is_help=True, help="Build and validate Citynario City Packs.")


@app.callback()
def main() -> None:
    """Build and validate Citynario City Packs."""


@app.command("validate-pack")
def validate_pack_command(
    path: Path = typer.Argument(..., exists=True, file_okay=False, resolve_path=True),
) -> None:
    """Validate manifest, provenance, and assumptions for one City Pack."""
    report = validate_pack(path)
    typer.echo(json.dumps(report.model_dump(mode="json"), indent=2))
    if not report.valid:
        raise typer.Exit(code=1)


if __name__ == "__main__":
    app()
