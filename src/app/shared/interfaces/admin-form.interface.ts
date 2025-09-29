export interface FormConfig{
    labelSize: 'sm' | '' | 'lg';
    items: FormConfigItem[];
}

export interface FormConfigItem {
    label: string;
    prop: string;
    type: 'input' | 'select' | 'switch';
    required?: boolean;
    placeholder?: string;
    options?: Array<{value: string | number; label:string }>;

    inputType: 'text' | 'number' | 'month';
    min?: number;
    pattern?: string;
    col?: string;
}