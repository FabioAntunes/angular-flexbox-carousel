import { ChangeDetectionStrategy, Component, ElementRef, Input, HostBinding } from '@angular/core';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'flexbox-carousel-item',
  template: '<ng-content></ng-content>'
})
export class FlexboxCarouselItemComponent {
  @Input() index: number;
  // @Input() order: number;
  // styleOrder is equal to order, so we can force the change detection
  // changing styleOrder directly would fire an exception
  @HostBinding('style.order') styleOrder: number;
  @HostBinding('attr.order') attrOrder = 0;

  constructor(public elem: ElementRef) { }

  setOrder(order: number) {
    this.styleOrder = order;
    this.attrOrder = order;
  }
}
