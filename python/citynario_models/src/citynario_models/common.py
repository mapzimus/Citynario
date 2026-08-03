"""Helpers shared by deterministic model modules."""

from citynario_core.engine import SimulationContext
from citynario_core.ids import content_id
from citynario_core.models import AssumptionRange, EstimateRange, TraceNode


def assumption(context: SimulationContext, assumption_id: str) -> AssumptionRange:
    try:
        return context.city_pack.assumptions[assumption_id]
    except KeyError as error:
        raise ValueError(f"City Pack is missing required assumption: {assumption_id}") from error


def multiply(*values: EstimateRange | float) -> EstimateRange:
    low = 1.0
    central = 1.0
    high = 1.0
    for value in values:
        if isinstance(value, EstimateRange):
            low *= value.low
            central *= value.central
            high *= value.high
        else:
            low *= value
            central *= value
            high *= value
    return EstimateRange(low=round(low, 2), central=round(central, 2), high=round(high, 2))


def trace(
    *,
    module: str,
    label: str,
    operation: str,
    formula: str,
    inputs: dict[str, object],
    output: EstimateRange,
    assumptions: tuple[AssumptionRange, ...] = (),
) -> TraceNode:
    payload = {"module": module, "label": label, "inputs": inputs, "output": output.model_dump()}
    source_ids = tuple(dict.fromkeys(source for item in assumptions for source in item.source_ids))
    return TraceNode(
        id=content_id("trace", payload),
        module=module,
        label=label,
        operation=operation,
        formula=formula,
        inputs=inputs,
        output=output,
        assumption_ids=tuple(item.id for item in assumptions),
        source_ids=source_ids,
    )
