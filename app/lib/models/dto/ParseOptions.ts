export interface ParseOptions {
  /**
   * Whether to include speaker notes
   */
  includeNotes?: boolean;

  /**
   * Whether to include hidden slides
   */
  includeHiddenSlides?: boolean;

  /**
   * Whether to extract embedded media files
   */
  extractMedia?: boolean;

  /**
   * Output format for media files (base64 or url)
   */
  mediaFormat?: 'base64' | 'url';

  /**
   * Whether to preserve original XML structure for debugging
   */
  preserveXml?: boolean;

  /**
   * Maximum size for embedded images (in pixels)
   */
  maxImageSize?: number;

  /**
   * Whether to parse mathematical formulas
   */
  parseMath?: boolean;

  /**
   * Whether to parse embedded charts
   */
  parseCharts?: boolean;

  /**
   * Whether to parse SmartArt diagrams
   */
  parseDiagrams?: boolean;

  /**
   * Custom theme overrides
   */
  themeOverrides?: {
    colors?: Record<string, string>;
    fonts?: Record<string, string>;
  };

  /**
   * Master debug mode switch
   */
  enableDebugMode?: boolean;

  /**
   * Detailed debug configuration options
   */
  debugOptions?: {
    /**
     * Save debug images during image processing
     */
    saveDebugImages?: boolean;
    
    /**
     * Enable detailed console logging
     */
    logProcessingDetails?: boolean;
    
    /**
     * Preserve intermediate processing steps
     */
    preserveIntermediateSteps?: boolean;
    
    /**
     * Include color resolution trace in shape processing
     */
    includeColorResolutionTrace?: boolean;
    
    /**
     * Include processing timing information
     */
    includeTimingInfo?: boolean;
    
    /**
     * Save XML intermediate files for inspection
     */
    saveXmlFiles?: boolean;
  };
}