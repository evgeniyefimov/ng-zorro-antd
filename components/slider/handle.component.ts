/**
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://github.com/NG-ZORRO/ng-zorro-antd/blob/master/LICENSE
 */

import { Direction } from '@angular/cdk/bidi';
import { NgStyle } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  Input,
  OnChanges,
  SimpleChanges,
  TemplateRef,
  ViewChild,
  ViewEncapsulation
} from '@angular/core';

import { BooleanInput, NgStyleInterface, NzTSType } from 'ng-zorro-antd/core/types';
import { InputBoolean } from 'ng-zorro-antd/core/util';
import { NzTooltipDirective, NzToolTipModule } from 'ng-zorro-antd/tooltip';

import { NzSliderService } from './slider.service';
import { NzSliderShowTooltip } from './typings';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  selector: 'nz-slider-handle',
  exportAs: 'nzSliderHandle',
  preserveWhitespaces: false,
  template: `
    <div
      #handle
      class="ant-slider-handle"
      tabindex="0"
      nz-tooltip
      [ngStyle]="style"
      [nzTooltipTitle]="tooltipFormatter === null || tooltipVisible === 'never' ? null : tooltipTitle"
      [nzTooltipTitleContext]="{ $implicit: value }"
      [nzTooltipTrigger]="null"
      [nzTooltipPlacement]="tooltipPlacement"
    ></div>
  `,
  host: {
    '(mouseenter)': 'enterHandle()',
    '(mouseleave)': 'leaveHandle()'
  },
  imports: [NzToolTipModule, NgStyle],
  standalone: true
})
export class NzSliderHandleComponent implements OnChanges {
  static ngAcceptInputType_active: BooleanInput;

  @ViewChild('handle', { static: false }) handleEl?: ElementRef;
  @ViewChild(NzTooltipDirective, { static: false }) tooltip?: NzTooltipDirective;

  @Input() vertical?: boolean;
  @Input() reverse?: boolean;
  @Input() offset?: number;
  @Input() value?: number;
  @Input() tooltipVisible: NzSliderShowTooltip = 'default';
  @Input() tooltipPlacement?: string;
  @Input() tooltipFormatter?: null | ((value: number) => string) | TemplateRef<void>;
  @Input() @InputBoolean() active = false;
  @Input() dir: Direction = 'ltr';

  tooltipTitle?: NzTSType;
  style: NgStyleInterface = {};

  constructor(private sliderService: NzSliderService, private cdr: ChangeDetectorRef) {}

  ngOnChanges(changes: SimpleChanges): void {
    const { offset, value, active, tooltipVisible, reverse, dir } = changes;

    if (offset || reverse || dir) {
      this.updateStyle();
    }

    if (value) {
      this.updateTooltipTitle();
      this.updateTooltipPosition();
    }

    if (active) {
      if (active.currentValue) {
        this.toggleTooltip(true);
      } else {
        this.toggleTooltip(false);
      }
    }

    if (tooltipVisible?.currentValue === 'always') {
      Promise.resolve().then(() => this.toggleTooltip(true, true));
    }
  }

  enterHandle = (): void => {
    if (!this.sliderService.isDragging) {
      this.toggleTooltip(true);
      this.updateTooltipPosition();
      this.cdr.detectChanges();
    }
  };

  leaveHandle = (): void => {
    if (!this.sliderService.isDragging) {
      this.toggleTooltip(false);
      this.cdr.detectChanges();
    }
  };

  focus(): void {
    this.handleEl?.nativeElement.focus();
  }

  private toggleTooltip(show: boolean, force: boolean = false): void {
    if (!force && (this.tooltipVisible !== 'default' || !this.tooltip)) {
      return;
    }

    if (show) {
      this.tooltip?.show();
    } else {
      this.tooltip?.hide();
    }
  }

  private updateTooltipTitle(): void {
    if (this.tooltipFormatter) {
      this.tooltipTitle =
        typeof this.tooltipFormatter === 'function' ? this.tooltipFormatter(this.value!) : this.tooltipFormatter;
    } else {
      this.tooltipTitle = `${this.value}`;
    }
  }

  private updateTooltipPosition(): void {
    if (this.tooltip) {
      Promise.resolve().then(() => this.tooltip?.updatePosition());
    }
  }

  private updateStyle(): void {
    const vertical = this.vertical;
    const reverse = this.reverse;
    const offset = this.offset;

    const positionStyle = vertical
      ? {
          [reverse ? 'top' : 'bottom']: `${offset}%`,
          [reverse ? 'bottom' : 'top']: 'auto',
          transform: reverse ? null : `translateY(+50%)`
        }
      : {
          ...this.getHorizontalStylePosition(),
          transform: `translateX(${reverse ? (this.dir === 'rtl' ? '-' : '+') : this.dir === 'rtl' ? '+' : '-'}50%)`
        };

    this.style = positionStyle;
    this.cdr.markForCheck();
  }

  private getHorizontalStylePosition(): { left: string; right: string } {
    let left = this.reverse ? 'auto' : `${this.offset}%`;
    let right = this.reverse ? `${this.offset}%` : 'auto';
    if (this.dir === 'rtl') {
      const tmp = left;
      left = right;
      right = tmp;
    }
    return { left, right };
  }
}
