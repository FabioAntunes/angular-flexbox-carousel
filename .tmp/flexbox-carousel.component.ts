import {
  AfterContentInit,
  Component,
  ContentChildren,
  ElementRef,
  Input,
  OnDestroy,
  OnInit,
  QueryList,
  ViewChild
} from '@angular/core';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/fromEvent';
import 'rxjs/add/operator/map';
import { Subscription } from 'rxjs/Subscription';
import { FlexboxCarouselItemComponent } from './flexbox-carousel-item.component';

@Component({
  selector: 'flexbox-carousel',
  template: "<section> <div class=\"wrapper\" (tap)=\"destroyInterval()\" (panleft)=\"pan($event)\" (panright)=\"pan($event)\" (panend)=\"panend($event)\"> <div class=\"carousel\" #carousel [ngClass]=\"{ 'has-loop': loop, 'is-reversing': reversing, 'is-set': !animation, 'panning': panning, 'is-next-disabled': isNextDisabled, 'is-prev-disabled': isPrevDisabled }\" > <ng-content></ng-content> </div> </div> </section> ",
  styles: [":host { display: flex; flex-direction: column; max-width: 100vw; margin-right: -15px; margin-left: -15px; } :host /deep/ flub-carousel-item { order: 1; } :host /deep/ flub-carousel-item:last-child { order: 0; } :host /deep/ .is-next-disabled flub-carousel-item:last-child::after, :host /deep/ .is-prev-disabled flub-carousel-item:first-child::after { content: \"\"; background-color: white; position: absolute; top: 0; width: 100vh; height: 100%; z-index: 2; } :host /deep/ .is-next-disabled flub-carousel-item:last-child::after { left: 100%; } :host /deep/ .is-prev-disabled flub-carousel-item:first-child::after { right: 100%; } :host section { display: flex; flex-direction: row; align-items: center; position: relative; } :host .wrapper { overflow: hidden; } :host .carousel { will-change: transform; display: flex; margin: 0; padding: 0; position: relative; } "]
})
export class FlexboxCarouselComponent implements AfterContentInit, OnDestroy, OnInit {
  @Input() loop = false;
  @Input() automatic = false;
  @ContentChildren(FlexboxCarouselItemComponent) items: QueryList<FlexboxCarouselItemComponent>;
  @ViewChild('carousel') carousel: ElementRef;
  private sub: Subscription;
  animation = false;
  panning = false;
  max = 0;
  order = 0;
  reversing = false;
  interval: any;
  step = 1;

  ngAfterContentInit() {
    this.initialize();

    // we also need to listen for changes, due to async items
    this.items.changes.subscribe(() => {
      this.initialize();
    });
  }

  ngOnDestroy() {
    this.destroyInterval();
    this.sub.unsubscribe();
  }

  ngOnInit() {
    this.sub = Observable.fromEvent(window, 'resize').map(e => {
      this.calcItems();
      return e;
    }).subscribe();
    if (this.automatic) {
      this.destroyInterval();
      this.interval = setInterval(() => {
          this.moveNext();
          this.animate();
      }, 3000);
    }
  }

  get initalLeft() {
    return parseInt(window.getComputedStyle(this.carousel.nativeElement, undefined).getPropertyValue('left').split('px')[0], 10);
  }

  get isNextDisabled () {
    return !this.loop && this.order + this.step === this.max;
  }

  get isPrevDisabled () {
    return !this.loop && this.order - 1 < 0;
  }

  panHasMinDistance (deltaX: number, initalLeft: number) {
    return this.carousel && Math.abs(deltaX) > Math.abs(initalLeft / 3);
  }

  pan(event: any) {
    this.destroyInterval();
    if (this.carousel && !event.isFinal && Math.abs(event.overallVelocityX) > Math.abs(event.overallVelocityY)) {
      this.carousel.nativeElement.style.transform =  `translateX(${event.deltaX}px)`;
    }
  }

  panend(event: any) {
    if (event.deltaX > 0) {
      this.panRight(event);
    } else {
      this.panLeft(event);
    }
  }

  private panLeft (event: any) {
    if (this.panHasMinDistance(event.deltaX, this.initalLeft) && !this.isNextDisabled) {
      this.carousel.nativeElement.style.transform = `translateX(${ this.initalLeft }px)`;
      this.moveNext();
      this.animatePan();
    } else {
      this.carousel.nativeElement.style.transform = '';
    }
  }

  private panRight (event: any) {
    const initalLeft = Math.abs(this.initalLeft);
    if (this.panHasMinDistance(event.deltaX, initalLeft) && !this.isPrevDisabled) {
      this.carousel.nativeElement.style.transform = `translateX(${initalLeft}px)`;
      this.movePrev();
      this.animatePan();
    } else {
      this.carousel.nativeElement.style.transform = '';
    }
  }


  next () {
    this.destroyInterval();
    if (!this.isNextDisabled) {
      this.moveNext();
      this.animate();
    }
  }
  moveNext () {
    if (this.loop) {
      this.order = this.order + 1 === this.max ? 0 : this.order + 1;
    }
    this.reversing = false;
  }

  prev () {
    this.destroyInterval();
    if (!this.isPrevDisabled) {
      this.movePrev();
      this.animate();
    }
  }

  movePrev () {
    if (this.loop) {
      this.order = this.order - 1 < 0 ? this.max - 1 : this.order - 1;
    }
    this.reversing = true;
  }

  destroyInterval() {
    if (this.interval) {
      clearInterval(this.interval);
    }
  }

  private animate() {
    this.updateOrder();
    this.animation = true;
    setTimeout(() => {
      this.animation = false;
      this.carousel.nativeElement.style.transform = '';
    }, 50);
  }

  private animatePan() {
    setTimeout(() => {
      this.panning = true;
      this.updateOrder();
      this.carousel.nativeElement.style.transform = '';
      setTimeout(() => {
        this.panning = false;
      }, 50);
    }, 150);
  }

  private calcItems() {
    if (this.items.length) {
      const width = parseInt(window.getComputedStyle(this.carousel.nativeElement, undefined).getPropertyValue('width').split('px')[0], 10);
      this.step = Math.floor(width / Math.abs(this.initalLeft));
      if (this.step > 1 && this.order + 1 === this.max) {
        this.order = this.order - this.step;
        this.updateOrder();
      }
    }

  }

  private getOrder (i: number) {
    return i < this.order ? this.max - this.order + i : i - this.order;
  }

  private initialize () {
    this.order = 0;
    this.max = this.items.length;
    this.items.forEach((item, index) => {
      // since we shift the screen one position left, we need to make sure
      // that our last item, is the first in the flex order;
      index = index + 1 === this.max ? 0 : index + 1;
      item.index = index;
    });
    this.calcItems();
  }

  private updateOrder () {
    this.items.forEach(item => {
      item.setOrder(this.getOrder(item.index));
    });
  }
}
