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
import { Subject } from 'rxjs/Subject';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/fromEvent';
import 'rxjs/add/operator/map';
import { Subscription } from 'rxjs/Subscription';
import { FlexboxCarouselItemComponent } from './flexbox-carousel-item.component';
import { 
  FlexboxCarouselEvent,
  OnChangesEvent,
  NextEvent,
  PreviousEvent,
} from './flexbox-carousel.classes';


@Component({
  selector: 'flexbox-carousel',
  templateUrl: './flexbox-carousel.template.html',
  styleUrls: ['./flexbox-carousel.styles.scss']
})
export class FlexboxCarouselComponent implements AfterContentInit, OnDestroy, OnInit {
  @Input() loop = false;
  @Input() automatic = false;
  @Input() eventListener: Subject<FlexboxCarouselEvent>;
  @ContentChildren(FlexboxCarouselItemComponent) items: QueryList<FlexboxCarouselItemComponent>;
  @ViewChild('carousel') carousel: ElementRef;
  @ViewChild('section') section: ElementRef;
  private subs: Subscription[] = [];
  animation = false;
  panning = false;
  order = 0;
  index = 0;
  initialLeft = 0;
  flexWidth = 0;
  reversing = false;
  interval: any;
  step = 1;
  translate = 0;
  maxWidth = 0;
  visibleItems = {
    left: 0,
    right: 0,
    visible: 0
  };
  styles = {
    left: '0',
    transform: 'translate3d(0, 0, 0)'
  };
  distance = 0;

  ngAfterContentInit() {
    this.initialize();

    // we also need to listen for changes, due to async items
    this.items.changes.subscribe(() => {
      this.initialize();
    });
  }

  ngOnDestroy() {
    this.destroyInterval();
    this.subs.map(s => {
      s.unsubscribe();
    })
  }

  ngOnInit() {
    this.subs = [
      Observable.fromEvent(window, 'resize').subscribe(e => {
        this.calcItems();
      })
    ];
    if (this.automatic) {
      this.destroyInterval();
      this.interval = setInterval(() => {
          this.moveNext();
          this.animate();
      }, 3000);
    }
  }

  get isNextDisabled() {
    return !this.loop && this.visibleItems.right + 1  === this.max;
  }

  get isPrevDisabled() {
    return !this.loop && this.visibleItems.left - 1 < 0;
  }

  get max() {
    return this.items.length;
  }

  panHasMinDistance(deltaX: number, direction: string) {
    let width = this.getItem(this.visibleItems.left - 1).offsetWidth;
    if (direction === 'left') {
      width = this.getItem(this.visibleItems.right + 1).offsetWidth;
    }
    return this.carousel && Math.abs(deltaX) > Math.abs(width/ 3);
  }

  pan({distance, velocityX, velocityY, deltaX, deltaY, isFinal}: any) {
    if (isFinal && (distance === this.distance || distance - this.distance > 100)) {
      this.panning = false;
      window.requestAnimationFrame(() => {
        this.resetPan();
      });
      return;
    }
    this.distance = distance;
    window.requestAnimationFrame(() => {
      velocityX = Math.abs(velocityX);
      velocityY = Math.abs(velocityY);
      if (velocityX >= velocityY) {
        this.styles.transform = `translate3d(${this.translate + deltaX}px, 0, 0)`;
      }
    });
  }

  panstart(event: any) {
    this.distance = event.distance;
    window.requestAnimationFrame(() => {
      this.destroyInterval();
      this.panning = !this.loop;

    })
  }
  
  panend(event: any) {
    window.requestAnimationFrame(() => {
      this.panning = false;
      if (event.deltaX > 0) {
        this.panRight(event);
      } else {
        this.panLeft(event);
      }
    });
  }

  private panLeft (event: any) {
    if (!this.isNextDisabled && this.panHasMinDistance(event.deltaX, 'left')) {
      this.moveNext();
      this.animate();
      return;
    }
    this.resetPan();
  }

  private panRight (event: any) {
    if (!this.isPrevDisabled && this.panHasMinDistance(event.deltaX, 'right')) {
      this.movePrev();
      this.animate();
      return;
    }
    this.resetPan();
  }

  private resetPan() {
    if (this.loop) {
      this.styles.transform = `translate3d(0, 0, 0)`;
      return;
    }
    this.styles.transform = `translate3d(${this.translate}px, 0, 0)`;
  }

  next () {
    this.destroyInterval();
    if (!this.isNextDisabled) {
      window.requestAnimationFrame(() => {
        this.moveNext();
        this.animate();
      })
    }
  }
  moveNext () {
    if (this.loop) {
      this.index = this.index + 1 === this.max ? 0 : this.index + 1;
    } else {
      const item = this.getItem(this.visibleItems.right + 1);
      this.translate = -(item.offsetLeft - (this.flexWidth - item.offsetWidth));
      this.index += 1;
      this.styles.transform = `translate3d(${this.translate}px, 0, 0)`;
    }
    setTimeout(() => {
      this.calcVisibleItems();
      this.emitNextEvent();
    }, 100)

    this.reversing = false;
  }

  prev () {
    this.destroyInterval();
    if (!this.isPrevDisabled) {
      window.requestAnimationFrame(() => {
        this.movePrev();
        this.animate();
      });
    }
  }

  movePrev () {
    if (this.loop) {
      this.index = this.index - 1 < 0 ? this.max - 1 : this.index - 1;
    } else {
      this.index -= 1;
      const item = this.getItem(this.visibleItems.left - 1);
      this.translate = -item.offsetLeft;
      this.carousel.nativeElement.style.transform = `translate3d(${this.translate}px, 0, 0)`;
    }
    setTimeout(() => {
      this.calcVisibleItems();
      this.emitPreviousEvent();
    }, 100)

    this.reversing = true;
  }

  destroyInterval() {
    if (this.interval) {
      clearInterval(this.interval);
    }
  }

  private animate() {
    if (!this.loop) return;
    this.updateOrder();
    const translate = this.reversing ? -this.getItem(this.index).offsetWidth : this.getItem(this.index).offsetWidth;
    this.styles.transform = `translate3d(${translate}px, 0, 0)`;
    this.animation = true;
    window.requestAnimationFrame(() => {
      this.animation = false;
      this.styles.transform = 'translate3d(0, 0, 0)';
    });
  }

  private calcItems() {
    if (this.items.length) {
      if (this.loop && this.items.last.elem.nativeElement.offsetWidth > 0) {
        this.initialLeft = this.getItem(this.index - 1).offsetWidth;
        this.styles.left = `-${this.initialLeft}px`;
      }
      this.maxWidth = this.items.reduce((width, item) => {
        return width + item.elem.nativeElement.offsetWidth;
      }, 0);
      this.flexWidth = this.section.nativeElement.offsetWidth;
      // const item = this.getItem();
      // const maxTranslate = this.maxWidth - this.flexWidth;
      // if (item.offsetLeft > maxTranslate && maxTranslate > 0) {
      //   this.translate = -maxTranslate
      // } else {
      //   this.translate = -item.offsetLeft;
      // }
      // this.styles.transform = `translate3d(${this.translate}px, 0, 0)`;
      this.calcVisibleItems();
      // if (this.step > 1 && this.order + 1 === this.max) {
      //   this.order = this.order - this.step;
      //   this.updateOrder();
      // }
    }
  }

  private getOrder (i: number) {
    if (this.index === i) {
      return 1;
    }

    if (this.index - 1 === i || this.index === 0 && i === this.max - 1) {
      return 0;
    }

    return i > this.index ? i - this.index + 1 :  this.max + ((i + 1) - this.index);
  }

  private initialize () {
    setTimeout(() => {
      this.calcItems();
      this.items.forEach((item, index) => {
        // since we shift the screen one position left, we need to make sure
        // that our last item, is the first in the flex order;
        //if (this.loop) {
        //  index = index + 1 === this.max ? 0 : index + 1;
        //}
        item.index = index;
      });
      this.emitOnChangesEvent();
    }, 500);
  }

  private calcVisibleItems() {
    const translate = Math.abs(this.translate);
    this.visibleItems = this.items.toArray().reduce((acc, item, index) => {
      console.log(item.elem);
      let difference = item.elem.nativeElement.offsetLeft - translate - this.initialLeft;
      if (difference >= 0 && this.flexWidth - 
        (difference + item.elem.nativeElement.offsetWidth) >= 0
      ) {
        acc.left = index < acc.left ? index : acc.left;
        acc.right = index;
        acc.visible = acc.visible + 1;
        return acc;
      }
      return acc;
    }, {left: Infinity, right: 0, visible: 0});
    console.log(this.visibleItems);
  }

  private updateOrder () {
    this.items.forEach(item => {
      item.setOrder(this.getOrder(item.index));
    });
  }

  private getItem(index?: number) {
    index = index !== undefined && index >= 0 ? index : this.index;
    return this.items.toArray()[index].elem.nativeElement;
  }

  private emitNextEvent() {
    const e = new NextEvent(this.index, !this.isNextDisabled, !this.isPrevDisabled);
    this.emitEvent(e);
  }

  private emitPreviousEvent() {
    const e = new PreviousEvent(this.index, !this.isNextDisabled, !this.isPrevDisabled);
    this.emitEvent(e);
  }

   private emitOnChangesEvent() {
    const e = new OnChangesEvent(this.index, !this.isNextDisabled, !this.isPrevDisabled);
     this.emitEvent(e);
  }

  private emitEvent(e: FlexboxCarouselEvent) {
    if (this.eventListener) {
      this.eventListener.next(e);
    }
  }
}
