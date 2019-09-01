"""
Example usage:

>>> # Some dependencies
>>> class BadSpecError(Exception):
...   \"\"\"Your spec is broken\"\"\"
... 
>>> # Our data
>>> spec = {
...   "things": [{
...     "name": "thing1",
...     "item1": 4,
...     "item2": 6
...   }]
... }
>>> 
>>> # How to use this module
>>> import validate
>>>
>>> # This is a context function (context_fn) - it gather contextual information
>>> # that is passed to a validator function. It must return an iterable. They
>>> # are commonly generator functions.
>>> def each_thing(global_context):
...   for thing in global_context["spec"]["things"]
...     # Note: You aren't obliged to include global_context in your context,
...     #       but sometimes validators may need it. This is most often the
...     #       case when you have to validate some kind of relationships
...     #       between entities, such as validating that entities that are
...     #       referenced from a 'source' exist at the reference's
...     #       'destination'. I have included global_context here, even though
...     #       I don't need it, purely to demonstrate that it can be done, and
...     #       how it can be done.
...     yield dict({"thing": thing}, **global_context)
... 
>>> # Use validate.validator_for(context_fn) to declare what 'context' your
>>> # validator is validating (usually some kind of object in your spec).
>>> # How you name your validators is up to you. Personally, I see that the
>>> # decorator says 'in each thing' without you having to state it in the
>>> # validation function's name, but that is up to you.
>>> @validate.validator_for(each_thing)
... def check_relationship_between_items(context):
...   if context["thing"]["item1"] >= context["thing"]["item2"]:
...     raise BadSpecError("bad spec: item1 must be less than item2!")
... 
>>> # Now to validate it. If you verbosely name every validation rule (which I
>>> # recommend) you are likely to end up with a very long list. This issue can
>>> # be worked around by:
>>> # - declaring a list of related validators at the end of a standalone module
>>> # - using the validate.compose_validators() function to combine validators
>>> #   that use the same context_fn
>>> # - using the validate.group_validators() function to combine validators
>>> #   that use varying context_fns into a single set of validators that each
>>> #   use a different context_fn.
>>> validate.validate([check_relationship_between_items], spec)
"""

from functools import partial
from itertools import groupby
import inspect

# A class-based composable semi-partial function
class Validator:
    """
    Validate each object provided by `context_fn` against each `valid_fn`
    (validation function) provided.

    Args:

    `context_fn` is a function that performs any iteration or value collection
    to create a `context` dictionary to be passed to each of `valid_fns`.

    All remaining arguments are `valid_fns` - functions that validate the
    context by checking for some logical requirement, such as 'key A must exist
    at location B **IF** the value of X is Y'. This is as oppose to a static
    requirement, such as 'the value of X should be of type Y', which can (and
    should) be validated using JSON Schema. There are two exceptions to this
    rule:

    1. Validating a static requirement after a logical requirement (such as
       conditional dependencies).
    2. Validating complex static requirements that cannot reasonably be
       expressed using JSON Schema.

    Validation functions raise an exception if they fail validation.
    Validation functions MUST be pure functions - they MUST NOT modify any
    objects they are passed.
    """

    def __init__(self, context_fn, validator_fn):
        """Construct the validator."""

        self.context_fn = context_fn
        self.validator_fn = validator_fn

    def __call__(self, context_fn=None):
        """Execute the validator."""

        if context_fn is None:
            context_fn = self.context_fn

        for context in context_fn():
            self.validator_fn(context)

    def __str__(self):
        """Return a string that shows the attributes of the validator."""

        return "<Validator object: "+", ".join(
            [k+"="+str(v) for (k,v) in {
                "context_fn": self.context_fn.__name__,
                "validator_fn": self.validator_fn.__name__
            }.items()]
        )+">"

def validator_for(context_fn):
    """
    Define the decorated function to be run in the context of each return value
    of context_fn.

    The general form is:
      @validator_for(context_fn)
      def validation_fn(context):
        # For what context is, see the docs of the context_fn

    For example:
      @validator_for(each_thing)
      def check_relationship_between_two_items_in_each_thing(context):
        if context["thing"]["item1"] >= context["thing"]["item2"]:
          raise BadSpecError("bad spec: item1 must be less than item2!")

    Note that context_fn can (and should) be a generator function.
    """

    def validator_for_decor(validator_fn):
        # Yes, this doesn't return a function! However, a Validator instance is
        # callable, so this is fine :)
        # See: https://stackoverflow.com/a/20791175 (and the other answers)
        return Validator(context_fn, validator_fn)
    return validator_for_decor

def compose_validators(context_fn, validators):
    """
    Construct a single validator that calls every provided validator, overriding
    their context functions with the given context_fn.
    """

    # Build a list out of the iterable, as it will have to be iterated over
    # every time the composed validator is executed (ie. for each context from
    # context_fn). Otherwise, it may exhaust the first iteration (depending on
    # the type of iterator given).
    validators = list(validators)

    @validator_for(context_fn)
    def composed_validator(context):
        for validator in validators:
            validator.validator_fn(context)

    return composed_validator

def group_validators(validators):
    """
    Return an iterable of Validators, each composed of all of the validators
    with the same context_fn from the given set of validators.
    """

    validators = list(validators)
    if len(validators) <= 1:
        return validators

    # Sort by name of context function (to eliminate repeated keys in group-by)
    # http://ls.pwd.io/2013/05/create-groups-from-lists-with-itertools-groupby/
    sorted_validators = sorted(validators, key=lambda v: v.context_fn.__name__)
    grouped_validators = groupby(sorted_validators, key=lambda v: v.context_fn)

    return list(compose_validators(context_fn, validator_group)
        for (context_fn, validator_group) in grouped_validators)

def validate(validators, spec, schema=None):
    """
    Execute the given validators against spec, passing schema along if given.

    Some validators may require spec's schema. If they do require the schema,
    but schema is not given, these functions will raise an exception (likely a
    KeyError).

    Args:
    - validators is a list of Validator objects to be executed.
    - spec as a dict representing the root of a parsed JSON tree.
    - schema is a schemas.Schema object holding the root of the JSON schema for
      the spec JSON tree.
    """

    for validator in validators:
        global_context = {"spec": spec}
        if schema is not None:
            global_context.update({"schema": schema})

        # The partial no longer takes global_context
        validator(partial(validator.context_fn, global_context))

def collect(obj):
    """
    Convenience function to collect all validators in the given object and
    return them as an iterable.

    This function is mainly useful when passed a module (even the current
    module: sys.modules[__name__]) or a class to help in organising a large
    suite of validators.
    """

    return list(map(lambda member_kv: member_kv[1], # Take values
        inspect.getmembers(obj, lambda member: isinstance(member, Validator)) ))
