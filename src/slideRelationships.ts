import { readXmlFile } from './readXmlFile';
import { getTextByPathList } from './utils';
import type { XmlNode, ProcessingContext, ResourceObject } from './types';

/**
 * Load slide relationships and populate the resource objects
 */
export async function loadSlideRelationships(
  zip: any,
  slideFileName: string,
  context: ProcessingContext
): Promise<void> {
  // Get slide relationship file path
  const slideRelPath = slideFileName.replace('.xml', '.xml.rels').replace('slides/', 'slides/_rels/');
  
  // Load slide relationship file
  const slideRels = await readXmlFile(zip, slideRelPath);
  if (!slideRels) {
    console.warn(`No relationship file found for ${slideFileName}`);
    return;
  }
  
  context.slideRelationshipFile = slideRels;
  
  // Build slide resource object
  const slideResObj: ResourceObject = {};
  const relationships = slideRels['Relationships']?.['Relationship'];
  if (relationships) {
    const rels = Array.isArray(relationships) ? relationships : [relationships];
    for (const rel of rels) {
      const id = rel.attrs?.['Id'];
      const type = rel.attrs?.['Type'];
      const target = rel.attrs?.['Target'];
      
      if (id && type && target) {
        slideResObj[id] = { type, target };
      }
    }
  }
  context.slideResObj = slideResObj;
  
  // Find slide layout reference
  const layoutRel = Object.values(slideResObj).find(rel => 
    rel.type === 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout'
  );
  
  if (layoutRel) {
    // Load slide layout
    const layoutPath = 'ppt/slideLayouts/' + layoutRel.target.replace('../slideLayouts/', '');
    const slideLayoutContent = await readXmlFile(zip, layoutPath);
    if (slideLayoutContent) {
      context.slideLayoutContent = slideLayoutContent;
      
      // Load layout relationships
      const layoutRelPath = layoutPath.replace('.xml', '.xml.rels').replace('slideLayouts/', 'slideLayouts/_rels/');
      const layoutRels = await readXmlFile(zip, layoutRelPath);
      
      if (layoutRels) {
        // Build layout resource object
        const layoutResObj: ResourceObject = {};
        const layoutRelationships = layoutRels['Relationships']?.['Relationship'];
        if (layoutRelationships) {
          const rels = Array.isArray(layoutRelationships) ? layoutRelationships : [layoutRelationships];
          for (const rel of rels) {
            const id = rel.attrs?.['Id'];
            const type = rel.attrs?.['Type'];
            const target = rel.attrs?.['Target'];
            
            if (id && type && target) {
              layoutResObj[id] = { type, target };
            }
          }
        }
        context.layoutResObj = layoutResObj;
        
        // Find slide master reference
        const masterRel = Object.values(layoutResObj).find(rel => 
          rel.type === 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster'
        );
        
        if (masterRel) {
          // Load slide master
          const masterPath = 'ppt/slideMasters/' + masterRel.target.replace('../slideMasters/', '');
          const slideMasterContent = await readXmlFile(zip, masterPath);
          if (slideMasterContent) {
            context.slideMasterContent = slideMasterContent;
            
            // Load master relationships
            const masterRelPath = masterPath.replace('.xml', '.xml.rels').replace('slideMasters/', 'slideMasters/_rels/');
            const masterRels = await readXmlFile(zip, masterRelPath);
            
            if (masterRels) {
              // Build master resource object
              const masterResObj: ResourceObject = {};
              const masterRelationships = masterRels['Relationships']?.['Relationship'];
              if (masterRelationships) {
                const rels = Array.isArray(masterRelationships) ? masterRelationships : [masterRelationships];
                for (const rel of rels) {
                  const id = rel.attrs?.['Id'];
                  const type = rel.attrs?.['Type'];
                  const target = rel.attrs?.['Target'];
                  
                  if (id && type && target) {
                    masterResObj[id] = { type, target };
                  }
                }
              }
              context.masterResObj = masterResObj;
            }
          }
        }
      }
    }
  }
}

/**
 * Get position node from slide, layout, or master
 */
export function getPositionNode(
  element: XmlNode,
  elementType: string,
  context: ProcessingContext
): { slideNode?: XmlNode; layoutNode?: XmlNode; masterNode?: XmlNode } {
  const result: { slideNode?: XmlNode; layoutNode?: XmlNode; masterNode?: XmlNode } = {};
  
  // Get slide node
  const spPr = element['p:spPr'];
  if (spPr?.['a:xfrm']) {
    result.slideNode = spPr['a:xfrm'];
  }
  
  // Try to find corresponding element in layout and master
  const nvPr = element['p:nvSpPr'] || element['p:nvPicPr'] || element['p:nvGrpSpPr'];
  const phType = nvPr?.['p:nvPr']?.['p:ph']?.attrs?.type;
  const phIdx = nvPr?.['p:nvPr']?.['p:ph']?.attrs?.idx;
  
  if (phType || phIdx !== undefined) {
    // Find in layout
    if (context.slideLayoutContent) {
      const layoutSpTree = context.slideLayoutContent['p:sldLayout']?.['p:cSld']?.['p:spTree'];
      if (layoutSpTree) {
        const layoutElements = layoutSpTree[elementType];
        if (layoutElements) {
          const elements = Array.isArray(layoutElements) ? layoutElements : [layoutElements];
          for (const layoutEl of elements) {
            const layoutPh = layoutEl['p:nvSpPr']?.['p:nvPr']?.['p:ph'] ||
                            layoutEl['p:nvPicPr']?.['p:nvPr']?.['p:ph'] ||
                            layoutEl['p:nvGrpSpPr']?.['p:nvPr']?.['p:ph'];
            if (layoutPh) {
              const layoutPhType = layoutPh.attrs?.type;
              const layoutPhIdx = layoutPh.attrs?.idx;
              
              if ((phType && phType === layoutPhType) || 
                  (phIdx !== undefined && phIdx === layoutPhIdx)) {
                const layoutSpPr = layoutEl['p:spPr'];
                if (layoutSpPr?.['a:xfrm']) {
                  result.layoutNode = layoutSpPr['a:xfrm'];
                  break;
                }
              }
            }
          }
        }
      }
    }
    
    // Find in master
    if (context.slideMasterContent) {
      const masterSpTree = context.slideMasterContent['p:sldMaster']?.['p:cSld']?.['p:spTree'];
      if (masterSpTree) {
        const masterElements = masterSpTree[elementType];
        if (masterElements) {
          const elements = Array.isArray(masterElements) ? masterElements : [masterElements];
          for (const masterEl of elements) {
            const masterPh = masterEl['p:nvSpPr']?.['p:nvPr']?.['p:ph'] ||
                            masterEl['p:nvPicPr']?.['p:nvPr']?.['p:ph'] ||
                            masterEl['p:nvGrpSpPr']?.['p:nvPr']?.['p:ph'];
            if (masterPh) {
              const masterPhType = masterPh.attrs?.type;
              const masterPhIdx = masterPh.attrs?.idx;
              
              if ((phType && phType === masterPhType) || 
                  (phIdx !== undefined && phIdx === masterPhIdx)) {
                const masterSpPr = masterEl['p:spPr'];
                if (masterSpPr?.['a:xfrm']) {
                  result.masterNode = masterSpPr['a:xfrm'];
                  break;
                }
              }
            }
          }
        }
      }
    }
  }
  
  return result;
}