import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { FlexboxCarouselComponent } from './flexbox-carousel.component';
import { FlexboxCarouselItemComponent } from './flexbox-carousel-item.component';

const components = [FlexboxCarouselComponent, FlexboxCarouselItemComponent];

@NgModule({
  imports: [CommonModule],
  exports: components,
  declarations: components,
  providers: []
})
export class FlexboxCarouselModule { }
