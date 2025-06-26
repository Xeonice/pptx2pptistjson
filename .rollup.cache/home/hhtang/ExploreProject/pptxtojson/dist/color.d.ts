export declare function hueToRgb(t1: number, t2: number, hue: number): number;
export declare function hslToRgb(hue: number, sat: number, light: number): {
    r: number;
    g: number;
    b: number;
};
export declare function applyShade(rgbStr: string, shadeValue: number, isAlpha?: boolean): string;
export declare function applyTint(rgbStr: string, tintValue: number, isAlpha?: boolean): string;
export declare function applyLumOff(rgbStr: string, offset: number, isAlpha?: boolean): string;
export declare function applyLumMod(rgbStr: string, multiplier: number, isAlpha?: boolean): string;
export declare function applyHueMod(rgbStr: string, multiplier: number, isAlpha?: boolean): string;
export declare function applySatMod(rgbStr: string, multiplier: number, isAlpha?: boolean): string;
export declare function getColorName2Hex(name: string): string | undefined;
//# sourceMappingURL=color.d.ts.map