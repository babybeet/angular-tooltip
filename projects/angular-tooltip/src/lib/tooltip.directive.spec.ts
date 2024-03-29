import { Component, ElementRef, Input, ViewChild } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { assertThat, delayBy, fireEvent } from '@babybeet/angular-testing-kit';

import { Placement } from './placement';
import { Theme } from './theme';
import { TooltipDirective } from './tooltip.directive';

@Component({
  imports: [TooltipDirective],
  selector: 'bbb-test',
  template: `
    <button
      #button
      type="button"
      [bbbTooltip]="content"
      [bbbTooltipPlacement]="placement"
      [bbbTooltipTheme]="theme"
      [disabled]="disabled">
      Hover me
    </button>
  `
})
class TestBedComponent {
  @Input()
  // eslint-disable-next-line @stylistic/indent
  content = 'Hello World';

  @Input()
  // eslint-disable-next-line @stylistic/indent
  placement?: Placement;

  @Input()
  // eslint-disable-next-line @stylistic/indent
  theme?: Theme;

  @Input()
  // eslint-disable-next-line @stylistic/indent
  disabled?: boolean;

  @ViewChild('button', { read: ElementRef })
  readonly buttonRef!: ElementRef<HTMLButtonElement>;

  dispatchEvent<T extends keyof HTMLElementEventMap = keyof HTMLElementEventMap>(
    eventType: T,
    eventDetail?: CustomEventInit<HTMLElementEventMap[T]>['detail']
  ) {
    fireEvent(this.buttonRef.nativeElement, eventType, eventDetail);
  }
}

describe(TooltipDirective.name, () => {
  const classSelectorPrefix = '.bbb-tooltip';
  let fixture: ComponentFixture<TestBedComponent>;
  let testBedComponent: TestBedComponent;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [TestBedComponent],
      imports: [TooltipDirective]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TestBedComponent);
    testBedComponent = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
  });

  it('Should render the provided content properly', async () => {
    testBedComponent.content = 'Hello TooltipDirective';
    fixture.detectChanges();

    testBedComponent.dispatchEvent('pointerover');
    fixture.detectChanges();

    await delayBy(500);

    assertThat(`${classSelectorPrefix}__content`).hasTextContent('Hello TooltipDirective');
  });

  it('Should render with the provided placement properly', async () => {
    testBedComponent.placement = 'horizontal';
    fixture.detectChanges();

    testBedComponent.dispatchEvent('pointerover');
    fixture.detectChanges();

    await delayBy(500);

    assertThat(`${classSelectorPrefix}.bottom`).doesNotExist();
    assertThat(`${classSelectorPrefix}.right`).exists();
  });

  it('Should render with the provided theme properly', async () => {
    testBedComponent.theme = 'dark';
    fixture.detectChanges();

    testBedComponent.dispatchEvent('pointerover');
    fixture.detectChanges();

    await delayBy(500);

    assertThat(`${classSelectorPrefix}.light`).doesNotExist();
    assertThat(`${classSelectorPrefix}.dark`).exists();
  });

  it('Should show tooltip on pointerover', async () => {
    testBedComponent.dispatchEvent('pointerover');

    fixture.detectChanges();

    await delayBy(500);

    assertThat(`${classSelectorPrefix}__content`).hasTextContent('Hello World');
  });

  it('Should hide tooltip on pointerout', async () => {
    spyOnProperty(navigator, 'userAgent', 'get').and.callFake(() => 'chrome');

    testBedComponent.dispatchEvent('pointerover');

    fixture.detectChanges();

    await delayBy(1000);

    assertThat(`${classSelectorPrefix}__content`).hasTextContent('Hello World');

    testBedComponent.dispatchEvent('pointerout');

    fixture.detectChanges();

    await delayBy(1000);

    assertThat(classSelectorPrefix).doesNotExist();
  });

  it('Should show tooltip when the target element has keyboard focus', async () => {
    testBedComponent.buttonRef.nativeElement.focus();
    fixture.detectChanges();

    testBedComponent.dispatchEvent('keyup');
    fixture.detectChanges();

    await delayBy(500);

    assertThat(`${classSelectorPrefix}__content`).hasTextContent('Hello World');
  });

  it('Should hide tooltip when the target element loses keyboard focus', async () => {
    testBedComponent.buttonRef.nativeElement.focus();
    fixture.detectChanges();

    testBedComponent.dispatchEvent('keyup');
    fixture.detectChanges();

    await delayBy(1000);

    assertThat(`${classSelectorPrefix}__content`).hasTextContent('Hello World');

    testBedComponent.buttonRef.nativeElement.blur();
    fixture.detectChanges();

    await delayBy(1000);

    assertThat(classSelectorPrefix).doesNotExist();
  });

  it('Should not show tooltip when the anchor element is disabled', async () => {
    testBedComponent.content = 'Hello TooltipDirective';
    testBedComponent.disabled = true;

    fixture.detectChanges();

    testBedComponent.dispatchEvent('pointerover');
    fixture.detectChanges();

    await delayBy(500);

    assertThat(`${classSelectorPrefix}__content`).doesNotExist();
  });

  it('Should not show tooltip when the tooltip content is empty', async () => {
    testBedComponent.content = '';

    fixture.detectChanges();

    testBedComponent.dispatchEvent('pointerover');
    fixture.detectChanges();

    await delayBy(500);

    assertThat(`${classSelectorPrefix}__content`).doesNotExist();
  });
});

describe(`${TooltipDirective.name} on mobile`, () => {
  const classSelectorPrefix = '.bbb-tooltip';
  let fixture: ComponentFixture<TestBedComponent>;
  let testBedComponent: TestBedComponent;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [TestBedComponent],
      imports: [TooltipDirective]
    }).compileComponents();
  }));

  beforeEach(() => {
    spyOnProperty(window.navigator, 'userAgent').and.returnValue('Android');
    fixture = TestBed.createComponent(TestBedComponent);
    testBedComponent = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
  });

  it('Should show tooltip on long presses on mobile only', async () => {
    testBedComponent.dispatchEvent('pointerdown');
    fixture.detectChanges();

    await delayBy(1500);

    assertThat(`${classSelectorPrefix}__content`).hasTextContent('Hello World');

    fireEvent(window, 'pointerup');
    await delayBy(1000);

    assertThat(`${classSelectorPrefix}`).doesNotExist();
  });

  it('Should not show tooltip when clicking on the tooltip trigger after hovering it', async () => {
    testBedComponent.dispatchEvent('pointerover');
    fixture.detectChanges();

    await delayBy(500);

    testBedComponent.dispatchEvent('click');
    fixture.detectChanges();

    await delayBy(1000);

    assertThat(classSelectorPrefix).doesNotExist();
  });
});
