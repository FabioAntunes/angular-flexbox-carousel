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
import 'rxjs/add/operator/distinctUntilChanged';
import { Subscription } from 'rxjs/Subscription';
import { FlexboxCarouselItemComponent } from './flexbox-carousel-item.component';

@Component({
  selector: 'flexbox-carousel',
  templateUrl: './flexbox-carousel.template.html',
  styleUrls: ['./flexbox-carousel.styles.scss']
})
export class FlexboxCarouselComponent implements AfterContentInit, OnDestroy, OnInit {
  @Input() loop = false;
  @Input() automatic = false;
  @ContentChildren(FlexboxCarouselItemComponent) items: QueryList<FlexboxCarouselItemComponent>;
  @ViewChild('carousel') carousel: ElementRef;
  @ViewChild('section') section: ElementRef;
  private subs: Subscription[] = [];
  subject = new Subject<ElementRef>();
  animation = false;
  panning = false;
  max = 0;
  order = 0;
  index = 0;
  flexWidth = 0;
  reversing = false;
  interval: any;
  step = 1;
  translate = 0;
  active: FlexboxCarouselItemComponent;
  maxWidth = 0;
  itemWidth = 0;

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
      Observable.fromEvent(window, 'resize').map(e => {
        this.calcItems();
        return e;
      }).subscribe()
    ];
    if (this.automatic) {
      this.destroyInterval();
      this.interval = setInterval(() => {
          this.moveNext();
          this.animate();
      }, 3000);
    }
  }

  get isNextDisabled () {
    return !this.loop && this.index + 1 === this.max;
  }

  get isPrevDisabled () {
    return !this.loop && this.index - 1 < 0;
  }

  panHasMinDistance (deltaX: number) {
    return this.carousel && Math.abs(deltaX) > Math.abs(this.getWidth(this.active.elem.nativeElement) / 3);
  }

  pan(event: any) {
    this.destroyInterval();
    if (this.carousel && !event.isFinal && Math.abs(event.overallVelocityX) > Math.abs(event.overallVelocityY)) {
      this.carousel.nativeElement.style.transform =  `translate3d(${this.translate + event.deltaX}px, 0, 0)`;
      this.panning = !this.loop;
    }
  }

  panend(event: any) {
    this.panning = false;
    if (event.deltaX > 0) {
      this.panRight(event);
    } else {
      this.panLeft(event);
    }
  }

  private panLeft (event: any) {
    if (this.panHasMinDistance(event.deltaX) && !this.isNextDisabled) {
      // this.carousel.nativeElement.style.transform = `translate3d(${ this.initalLeft }px, 0, 0)`;
      this.moveNext();
      this.animatePan();
      return;
    }
    this.resetPan();
  }

  private panRight (event: any) {
    const initalLeft = Math.abs(this.flexWidth);
    if (this.panHasMinDistance(event.deltaX) && !this.isPrevDisabled) {
      // this.carousel.nativeElement.style.transform = `translate3d(${initalLeft}px, 0, 0)`;
      this.movePrev();
      this.animatePan();
      return;
    }
    this.resetPan();
  }

  private resetPan() {
    if (this.loop) {
      this.carousel.nativeElement.style.transform = '';
      return;
    }
    this.carousel.nativeElement.style.transform = `translate3d(${this.translate}px, 0, 0)`;
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
    } else {
      const items = this.items.toArray();
      console.log(this.step);
      const step = this.max - (this.index + this.step) >= this.step ? this.step: this.max - (this.index + this.step);
      this.index = this.index + this.step >= this.max ? this.max - 1 : this.index + this.step;
      this.translate -= this.itemWidth * step;
      this.carousel.nativeElement.style.transform = `translate3d(${this.translate}px, 0, 0)`;
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
    } else {
      const items= this.items.toArray();
      const step = this.index - this.step >= this.step ? this.step : this.index - this.step;
      this.index = this.index - this.step < 0 ? 0 : this.index - this.step;
      const nextTranslate = this.translate + this.itemWidth * step;
      this.translate = nextTranslate > 0 ? 0 : nextTranslate;
      this.carousel.nativeElement.style.transform = `translate3d(${this.translate}px, 0, 0)`;
    }

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
    this.animation = true;
    setTimeout(() => {
      this.animation = false;
      this.carousel.nativeElement.style.transform = '';
    }, 50);
  }

  private animatePan() {
    if (!this.loop) return;
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
      this.flexWidth = this.getWidth(this.section.nativeElement);
      console.log(this.flexWidth);
      this.active = this.items.first;
      this.itemWidth = this.getWidth(this.active.elem.nativeElement);
      console.log(this.itemWidth);
      console.log(this.flexWidth / this.itemWidth);
      this.step = Math.floor(this.flexWidth / Math.abs(this.itemWidth));
      console.log(this.step);
      // if (this.step > 1 && this.order + 1 === this.max) {
      //   this.order = this.order - this.step;
      //   this.updateOrder();
      // }
    }
  }

  private getOrder (i: number) {
    return i < this.order ? this.max - this.order + i : i - this.order;
  }

  private initialize () {
    this.order = 0;
    this.max = this.items.length;
    setTimeout(() => {
      this.items.forEach((item, index) => {
        // since we shift the screen one position left, we need to make sure
        // that our last item, is the first in the flex order;
        if (this.loop) {
          index = index + 1 === this.max ? 0 : index + 1;
        }
        item.index = index;
        item.subject = this.subject;
        this.maxWidth += this.getWidth(item.elem.nativeElement);
      });
      this.calcItems();
    }, 1000);
  }

  private setActive(item: FlexboxCarouselItemComponent) {
    item.active = true;
    this.active = item;
  }

  private updateOrder () {
    this.items.forEach(item => {
      item.setOrder(this.getOrder(item.index));
    });
  }

  private getWidth(elem: any) {
    return parseInt(window.getComputedStyle(elem).getPropertyValue('width').split('px')[0], 10);
  }
}
