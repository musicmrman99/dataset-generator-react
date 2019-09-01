import os
import random

# Helpers
# --------------------------------------------------

def parse_file(path, delim=None):
    """
    Parse the given file path into a list, using delim as the delimiter.

    If delim is None, this is equivilent to delim='\n'.
    """

    with open(os.path.abspath(path), 'r', encoding='utf-8') as file:
        if delim is None or delim == '\n':
            return [line[:-1] for line in file]
        else:
            return [line[:-1] for line in file].join('\n').split(delim)

# Globals (to this module)
# --------------------------------------------------

def relative(path):
    return os.path.join(os.path.abspath(os.path.dirname(__file__)), path)

FORENAMES = parse_file(relative("data/forenames.txt"))
SURNAMES = parse_file(relative("data/surnames.txt"))

# Generators
# --------------------------------------------------

# Constant Generators
# --------------------

def null():
    """Yields None (ie. null)."""

    while True:
        yield None

# Name Generators
# --------------------

def forename():
    """Yield a random forename."""

    while True:
        yield random.choice(FORENAMES)

def surname():
    """Yield a random surname."""

    while True:
        yield random.choice(SURNAMES)

# Contact Detail Generators
# --------------------

def phone_number():
    """Yield a random phone number (UK format) as a string."""

    while True:
        yield "".join(str(random.randint(0, 9)) for _ in range(11))

# Number Generators
# --------------------

def number_sequence(
        start=0,
        step=1,
        sequenceType="infinite",
        loopingSequenceParams=None):
    """
    Yield the next value in the sequence.
    
    Init is the first value in the sequence. Every subsequent value is equal to
    the previous value, plus step.
    """

    is_infinite = False
    if sequenceType == "infinite" or (sequenceType == "looping" and step == 0):
        is_infinite = True

    if is_infinite:
        # If it is infinite, this will 'catch' the function - this bit will
        # never end (as a sequence)
        while True:
            yield start
            start += step

    if sequenceType == "looping":
        while True:
            i = start
            if step < 0:
                while i >= loopingSequenceParams["loopAt"]:
                    yield i
                    i += step
            elif step > 0:
                while i <= loopingSequenceParams["loopAt"]:
                    yield i
                    i += step

round_fn = round # Keep a reference to this **BUILT-IN FUNCTION**
def random_number(start=0, end=1, round=1):
    """
    Return a random number between start and end (inclusive), rounded to the
    nearest multiple of round.
    """

    while True:
        rnd = random.uniform(start, end)
        yield round_fn(round * round_fn(rnd / round), len(str(round)))

# Public Collection
# --------------------------------------------------

generators = {
    "null": null,
    "forename": forename,
    "surname": surname,
    "phoneNumber": phone_number,
    "numberSequence": number_sequence,
    "randomNumber": random_number
}
