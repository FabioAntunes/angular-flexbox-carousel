export class FlexboxCarouselEvent {
  index: number;
  next: boolean;
  previous: boolean;
  type: string;

  constructor(index: number, type: string, next = false, previous = false) {
    this.index = index;
    this.next = next;
    this.previous = previous;
    this.type = type;
  }
}

export class OnChangesEvent extends FlexboxCarouselEvent {
  constructor(index = 0, next = false, previous = false) {
    super (index, 'ON_CHANGES_EVENT', next, previous);
  }
}

export class NextEvent extends FlexboxCarouselEvent {
  constructor(index: number, next = false, previous = false) {
    super (index, 'NEXT_EVENT', next, previous);
  }
}

export class PreviousEvent extends FlexboxCarouselEvent {
  constructor(index: number, next = false, previous = false) {
    super(index, 'PREVIOUS_EVENT', next, previous);
  }
}

