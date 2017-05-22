import { NgModule } from '@angular/core';

import { FlexboxCarouselComponent } from './flexbox-carousel.component';
import { FlexboxCarouselItemComponent } from './flexbox-carousel-item.component';

const components = [FlexboxCarouselComponent, FlexboxCarouselItemComponent];

@NgModule({
  imports: components,
  exports: components,
  declarations: components,
  providers: []
})
export class FlexboxCarouselModule { }
