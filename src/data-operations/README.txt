All operations files within this folder must conform to these conventions:

- Public methods:
  - All public methods MUST be bound to 'App'

- Private methods (those that start with an underscore):
  - Private non-pure methods MUST be called on 'App':
      <whatever>Operations._privateNonPureMethod.call(this, args...)

    It MUST be the case that the method calling the private non-pure method is
    also bound to 'App', in which case 'this' would be 'App'.

  - Private pure methods SHOULD be called directly:
      <whatever>Operations._privatePureMethod(args...)
