import { ChangeDetectionStrategy, Component, ElementRef, Input, HostBinding, HostListener } from '@angular/core';
import { Subject } from 'rxjs/Subject';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'flexbox-carousel-item',
  template: '<ng-content></ng-content>'
})
export class FlexboxCarouselItemComponent {
  @Input() index: number;
  @Input() subject: Subject<any>;
  @Input() active: boolean;
  // @Input() order: number;
  // styleOrder is equal to order, so we can force the change detection
  // changing styleOrder directly would fire an exception
  @HostBinding('style.order') styleOrder: number;
  @HostBinding('attr.order') attrOrder = 0;
  @HostBinding('class.active') get isActive() { return this.active; } 
  @HostListener('pan') onPan() {
    this.subject.next(this.elem);
  }

  constructor(public elem: ElementRef) { }

  setOrder(order: number) {
    this.styleOrder = order;
    this.attrOrder = order;
  }
}
