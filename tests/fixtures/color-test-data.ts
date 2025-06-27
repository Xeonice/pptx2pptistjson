/**
 * Comprehensive color test data for various scenarios
 */

export const colorTestData = {
  // Standard color format conversions
  standardColors: {
    red: {
      hex: '#FF0000',
      rgb: 'rgb(255,0,0)',
      rgba: 'rgba(255,0,0,1)',
      hsl: { h: 0, s: 1, l: 0.5 },
      pptHsl: { hue: '0', sat: '100%', lum: '50%' }
    },
    green: {
      hex: '#00FF00',
      rgb: 'rgb(0,255,0)',
      rgba: 'rgba(0,255,0,1)',
      hsl: { h: 1/3, s: 1, l: 0.5 },
      pptHsl: { hue: '33333', sat: '100%', lum: '50%' }
    },
    blue: {
      hex: '#0000FF',
      rgb: 'rgb(0,0,255)',
      rgba: 'rgba(0,0,255,1)',
      hsl: { h: 2/3, s: 1, l: 0.5 },
      pptHsl: { hue: '66667', sat: '100%', lum: '50%' }
    },
    white: {
      hex: '#FFFFFF',
      rgb: 'rgb(255,255,255)',
      rgba: 'rgba(255,255,255,1)',
      hsl: { h: 0, s: 0, l: 1 },
      pptHsl: { hue: '0', sat: '0%', lum: '100%' }
    },
    black: {
      hex: '#000000',
      rgb: 'rgb(0,0,0)',
      rgba: 'rgba(0,0,0,1)',
      hsl: { h: 0, s: 0, l: 0 },
      pptHsl: { hue: '0', sat: '0%', lum: '0%' }
    },
    gray: {
      hex: '#808080',
      rgb: 'rgb(128,128,128)',
      rgba: 'rgba(128,128,128,1)',
      hsl: { h: 0, s: 0, l: 0.5 },
      pptHsl: { hue: '0', sat: '0%', lum: '50%' }
    }
  },

  // PowerPoint theme color schemes
  themeColors: {
    office2019: {
      accent1: '#FF0000',
      accent2: '#00FF00',
      accent3: '#0000FF',
      accent4: '#FFFF00',
      accent5: '#FF00FF',
      accent6: '#00FFFF',
      dk1: '#000000',
      dk2: '#1F1F1F',
      lt1: '#FFFFFF',
      lt2: '#F8F8F8',
      hyperlink: '#0563C1',
      followedHyperlink: '#954F72'
    },
    colorful: {
      accent1: '#E7E6E6',
      accent2: '#44546A',
      accent3: '#5B9BD5',
      accent4: '#A5A5A5',
      accent5: '#FFC000',
      accent6: '#70AD47',
      dk1: '#000000',
      dk2: '#000000',
      lt1: '#FFFFFF',
      lt2: '#FFFFFF',
      hyperlink: '#0563C1',
      followedHyperlink: '#954F72'
    },
    custom: {
      accent1: '#D32F2F',
      accent2: '#7B1FA2',
      accent3: '#303F9F',
      accent4: '#1976D2',
      accent5: '#0097A7',
      accent6: '#388E3C',
      dk1: '#212121',
      dk2: '#424242',
      lt1: '#FAFAFA',
      lt2: '#F5F5F5',
      hyperlink: '#1565C0',
      followedHyperlink: '#6A1B9A'
    }
  },

  // Color transformation test cases with expected results
  transformations: {
    // Shade transformations (darker)
    shade: {
      red_25: { input: '#FF0000', factor: 0.25, expected: 'rgba(191,0,0,1)' },
      red_50: { input: '#FF0000', factor: 0.5, expected: 'rgba(128,0,0,1)' },
      red_75: { input: '#FF0000', factor: 0.75, expected: 'rgba(64,0,0,1)' },
      blue_50: { input: '#0000FF', factor: 0.5, expected: 'rgba(0,0,128,1)' },
      white_50: { input: '#FFFFFF', factor: 0.5, expected: 'rgba(128,128,128,1)' }
    },

    // Tint transformations (lighter)
    tint: {
      red_25: { input: '#FF0000', factor: 0.25, expected: 'rgba(255,64,64,1)' },
      red_50: { input: '#FF0000', factor: 0.5, expected: 'rgba(255,128,128,1)' },
      red_75: { input: '#FF0000', factor: 0.75, expected: 'rgba(255,191,191,1)' },
      black_50: { input: '#000000', factor: 0.5, expected: 'rgba(128,128,128,1)' },
      blue_25: { input: '#0000FF', factor: 0.25, expected: 'rgba(64,64,255,1)' }
    },

    // Alpha transformations
    alpha: {
      red_50: { input: '#FF0000', factor: 0.5, expected: 'rgba(255,0,0,0.5)' },
      red_25: { input: '#FF0000', factor: 0.25, expected: 'rgba(255,0,0,0.25)' },
      red_75: { input: '#FF0000', factor: 0.75, expected: 'rgba(255,0,0,0.75)' },
      transparent: { input: '#FF0000', factor: 0, expected: 'rgba(255,0,0,0)' },
      opaque: { input: '#FF0000', factor: 1, expected: 'rgba(255,0,0,1)' }
    },

    // Saturation modifications
    saturation: {
      red_increase: { input: '#FF8080', factor: 2, expected: 'rgba(255,0,0,1)' },
      red_decrease: { input: '#FF0000', factor: 0.5, expected: 'rgba(255,128,128,1)' },
      gray_any: { input: '#808080', factor: 2, expected: 'rgba(128,128,128,1)' } // Gray shouldn't change
    },

    // Hue modifications (approximate expectations due to HSL complexity)
    hue: {
      red_to_green: { input: '#FF0000', factor: 1/3, expectedRange: 'green' },
      red_to_blue: { input: '#FF0000', factor: 2/3, expectedRange: 'blue' },
      full_rotation: { input: '#FF0000', factor: 1, expected: 'rgba(255,0,0,1)' }
    }
  },

  // Preset color mappings (subset for testing)
  presetColors: {
    // Basic colors
    red: '#FF0000',
    green: '#008000',
    blue: '#0000FF',
    yellow: '#FFFF00',
    cyan: '#00FFFF',
    magenta: '#FF00FF',
    white: '#FFFFFF',
    black: '#000000',
    
    // Named colors
    crimson: '#DC143C',
    navy: '#000080',
    olive: '#808000',
    silver: '#C0C0C0',
    maroon: '#800000',
    purple: '#800080',
    lime: '#00FF00',
    aqua: '#00FFFF',
    
    // Light colors
    lightBlue: '#ADD8E6',
    lightGreen: '#90EE90',
    lightPink: '#FFB6C1',
    lightYellow: '#FFFFE0',
    
    // Dark colors
    darkBlue: '#00008B',
    darkGreen: '#006400',
    darkRed: '#8B0000',
    darkGray: '#A9A9A9'
  },

  // Complex transformation chains for testing
  transformationChains: {
    // Common PowerPoint combinations
    lumModAndOff: {
      input: '#FF0000',
      transformations: [
        { type: 'lumMod', value: '80000' },  // 80% luminance
        { type: 'lumOff', value: '20000' }   // +20% luminance offset
      ],
      expected: 'rgba(255,51,51,1)' // Approximate
    },
    
    shadeAndTint: {
      input: '#FF0000',
      transformations: [
        { type: 'shade', value: '50000' },   // 50% darker
        { type: 'tint', value: '25000' }     // 25% lighter
      ],
      expected: 'rgba(160,32,32,1)' // Approximate
    },
    
    alphaAndHue: {
      input: '#FF0000',
      transformations: [
        { type: 'alpha', value: '75000' },   // 75% opacity
        { type: 'hueMod', value: '50000' }   // Hue modification
      ],
      expected: 'rgba(255,255,0,0.75)' // Approximate
    }
  },

  // Edge cases and error conditions
  edgeCases: {
    // Invalid or missing values
    emptyColor: '',
    nullColor: null,
    undefinedColor: undefined,
    invalidHex: '#GGGGGG',
    shortHex: '#FFF',
    longHex: '#FF0000FF',
    
    // Extreme transformation values
    negativeShade: { factor: -0.5 },
    oversizedTint: { factor: 2.0 },
    negativeAlpha: { factor: -0.1 },
    oversizedAlpha: { factor: 1.5 },
    
    // PowerPoint specific edge cases
    missingAttrs: { "a:srgbClr": {} },
    emptyAttrs: { "a:srgbClr": { attrs: {} } },
    invalidTransformation: { "a:srgbClr": { attrs: { val: "FF0000" }, "a:invalid": { attrs: { val: "50000" } } } }
  },

  // PowerPoint XML structures for testing
  pptXmlStructures: {
    // Simple direct color
    directRgb: {
      "a:srgbClr": {
        attrs: { val: "FF0000" }
      }
    },

    // Theme color reference
    themeColor: {
      "a:schemeClr": {
        attrs: { val: "accent1" }
      }
    },

    // Color with transformation
    colorWithShade: {
      "a:srgbClr": {
        attrs: { val: "FF0000" },
        "a:shade": {
          attrs: { val: "50000" }
        }
      }
    },

    // Color with multiple transformations
    colorWithMultipleTransforms: {
      "a:srgbClr": {
        attrs: { val: "FF0000" },
        "a:alpha": { attrs: { val: "75000" } },
        "a:shade": { attrs: { val: "25000" } },
        "a:tint": { attrs: { val: "10000" } }
      }
    },

    // HSL color
    hslColor: {
      "a:hslClr": {
        attrs: {
          hue: "0",
          sat: "100%",
          lum: "50%"
        }
      }
    },

    // Preset color
    presetColor: {
      "a:prstClr": {
        attrs: { val: "red" }
      }
    },

    // System color
    systemColor: {
      "a:sysClr": {
        attrs: { 
          val: "windowText",
          lastClr: "000000"
        }
      }
    },

    // Percentage RGB
    percentageRgb: {
      "a:scrgbClr": {
        attrs: {
          r: "100%",
          g: "0%",
          b: "0%"
        }
      }
    }
  }
};

// Helper functions for test data
export const testDataHelpers = {
  /**
   * Get all standard colors as array
   */
  getAllStandardColors(): Array<{ name: string; data: typeof colorTestData.standardColors.red }> {
    return Object.entries(colorTestData.standardColors).map(([name, data]) => ({ name, data }));
  },

  /**
   * Get all transformation test cases
   */
  getAllTransformations(): Array<{ type: string; name: string; data: any }> {
    const results: Array<{ type: string; name: string; data: any }> = [];
    Object.entries(colorTestData.transformations).forEach(([type, cases]) => {
      Object.entries(cases).forEach(([name, data]) => {
        results.push({ type, name, data });
      });
    });
    return results;
  },

  /**
   * Get theme color variations
   */
  getThemeVariations(): Array<{ name: string; colors: Record<string, string> }> {
    return Object.entries(colorTestData.themeColors).map(([name, colors]) => ({ name, colors }));
  }
};