import { Directive, HostListener, ElementRef } from '@angular/core';
import { NgControl } from '@angular/forms';

@Directive({
    selector: '[appNumberFormat]'
})
export class NumberFormatDirective {

    constructor(private readonly el: ElementRef<HTMLInputElement>, private readonly control: NgControl) { }

    @HostListener('input', ['$event'])
    onInput(event: Event) {
        const input = this.el.nativeElement;
        let raw = input.value;
        raw = raw.replace(/,/g, '');
        const num = parseFloat(raw);
        if (!isNaN(num)) {
            const fixed = parseFloat(num.toFixed(2));
            this.control.control?.setValue(fixed, { emitEvent: true });
        } else {
            this.control.control?.setValue(null, { emitEvent: true });
        }
    }

    @HostListener('blur')
    onBlur() {
        const val = this.control.value;
        if (val != null && !isNaN(val)) {
            this.el.nativeElement.value = new Intl.NumberFormat('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }).format(val);
        }
    }

    @HostListener('focus')
    onFocus() {
        const val = this.control.value;
        if (val != null && !isNaN(val)) {
            this.el.nativeElement.value = val.toString();
        }
    }

}
