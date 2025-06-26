import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { parse } from '../app/lib/pptxtojson';

describe('尺寸转换逻辑分析', () => {
  const samplePPTXPath = join(__dirname, '../sample/input.pptx');
  const expectedOutputPath = join(__dirname, '../sample/output.json');
  
  let actualOutput: any;
  let expectedOutput: any;

  beforeAll(async () => {
    if (!existsSync(samplePPTXPath) || !existsSync(expectedOutputPath)) {
      console.warn('示例文件不可用');
      return;
    }

    try {
      const sampleBuffer = readFileSync(samplePPTXPath);
      expectedOutput = JSON.parse(readFileSync(expectedOutputPath, 'utf-8'));
      actualOutput = await parse(sampleBuffer);
    } catch (error: any) {
      console.warn('解析测试文件失败:', error?.message);
    }
  });

  describe('尺寸转换问题诊断', () => {
    it('应该分析所有元素的尺寸转换比例', () => {
      if (!actualOutput || !expectedOutput) {
        pending('示例文件不可用');
        return;
      }

      console.log('\n=== 尺寸转换分析报告 ===\n');

      const dimensionAnalysis: Array<{
        slideIndex: number;
        elementIndex: number;
        elementType: string;
        expected: { width: number; height: number };
        actual: { width: number; height: number };
        widthRatio: number;
        heightRatio: number;
        widthDiff: number;
        heightDiff: number;
      }> = [];

      expectedOutput.slides.forEach((expectedSlide: any, slideIndex: number) => {
        const actualSlide = actualOutput.slides[slideIndex];
        if (!actualSlide) return;

        console.log(`幻灯片 ${slideIndex + 1}:`);
        
        const minCount = Math.min(expectedSlide.elements.length, actualSlide.elements.length);
        
        for (let i = 0; i < minCount; i++) {
          const expectedElement = expectedSlide.elements[i];
          const actualElement = actualSlide.elements[i];
          
          // 计算比例和差异
          const widthRatio = actualElement.width / expectedElement.width;
          const heightRatio = actualElement.height / expectedElement.height;
          const widthDiff = actualElement.width - expectedElement.width;
          const heightDiff = actualElement.height - expectedElement.height;
          
          dimensionAnalysis.push({
            slideIndex: slideIndex + 1,
            elementIndex: i + 1,
            elementType: expectedElement.type,
            expected: { width: expectedElement.width, height: expectedElement.height },
            actual: { width: actualElement.width, height: actualElement.height },
            widthRatio,
            heightRatio,
            widthDiff,
            heightDiff
          });

          console.log(`  元素 ${i + 1} (${expectedElement.type}):`);
          console.log(`    期望尺寸: ${expectedElement.width.toFixed(1)} × ${expectedElement.height.toFixed(1)}`);
          console.log(`    实际尺寸: ${actualElement.width.toFixed(1)} × ${actualElement.height.toFixed(1)}`);
          console.log(`    宽度比例: ${widthRatio.toFixed(3)} (差异: ${widthDiff.toFixed(1)}px)`);
          console.log(`    高度比例: ${heightRatio.toFixed(3)} (差异: ${heightDiff.toFixed(1)}px)`);
          console.log('');
        }
      });

      // 统计分析
      console.log('=== 统计分析 ===');
      
      const widthRatios = dimensionAnalysis.map(item => item.widthRatio);
      const heightRatios = dimensionAnalysis.map(item => item.heightRatio);
      
      const avgWidthRatio = widthRatios.reduce((sum, ratio) => sum + ratio, 0) / widthRatios.length;
      const avgHeightRatio = heightRatios.reduce((sum, ratio) => sum + ratio, 0) / heightRatios.length;
      
      const minWidthRatio = Math.min(...widthRatios);
      const maxWidthRatio = Math.max(...widthRatios);
      const minHeightRatio = Math.min(...heightRatios);
      const maxHeightRatio = Math.max(...heightRatios);

      console.log(`平均宽度比例: ${avgWidthRatio.toFixed(3)}`);
      console.log(`平均高度比例: ${avgHeightRatio.toFixed(3)}`);
      console.log(`宽度比例范围: ${minWidthRatio.toFixed(3)} - ${maxWidthRatio.toFixed(3)}`);
      console.log(`高度比例范围: ${minHeightRatio.toFixed(3)} - ${maxHeightRatio.toFixed(3)}`);

      // 按元素类型分组分析
      console.log('\n=== 按元素类型分析 ===');
      const typeGroups = dimensionAnalysis.reduce((groups, item) => {
        if (!groups[item.elementType]) {
          groups[item.elementType] = [];
        }
        groups[item.elementType].push(item);
        return groups;
      }, {} as Record<string, typeof dimensionAnalysis>);

      Object.entries(typeGroups).forEach(([type, items]) => {
        const typeWidthRatios = items.map(item => item.widthRatio);
        const typeHeightRatios = items.map(item => item.heightRatio);
        
        const avgTypeWidthRatio = typeWidthRatios.reduce((sum, ratio) => sum + ratio, 0) / typeWidthRatios.length;
        const avgTypeHeightRatio = typeHeightRatios.reduce((sum, ratio) => sum + ratio, 0) / typeHeightRatios.length;

        console.log(`${type} 元素 (${items.length}个):`);
        console.log(`  平均宽度比例: ${avgTypeWidthRatio.toFixed(3)}`);
        console.log(`  平均高度比例: ${avgTypeHeightRatio.toFixed(3)}`);
      });

      // 寻找可能的转换常数
      console.log('\n=== 转换常数分析 ===');
      
      // 检查是否存在固定的转换因子
      const commonWidthRatio = Math.round(avgWidthRatio * 1000) / 1000;
      const commonHeightRatio = Math.round(avgHeightRatio * 1000) / 1000;
      
      console.log(`推荐的宽度转换因子: ${commonWidthRatio}`);
      console.log(`推荐的高度转换因子: ${commonHeightRatio}`);
      
      // 检查是否所有比例都接近某个常数
      const widthVariance = widthRatios.reduce((sum, ratio) => sum + Math.pow(ratio - avgWidthRatio, 2), 0) / widthRatios.length;
      const heightVariance = heightRatios.reduce((sum, ratio) => sum + Math.pow(ratio - avgHeightRatio, 2), 0) / heightRatios.length;
      
      console.log(`宽度比例方差: ${widthVariance.toFixed(6)}`);
      console.log(`高度比例方差: ${heightVariance.toFixed(6)}`);
      
      if (widthVariance < 0.01 && heightVariance < 0.01) {
        console.log('✅ 检测到一致的转换比例，可能需要应用固定的转换因子');
      } else {
        console.log('⚠️  转换比例不一致，可能存在复杂的转换逻辑');
      }

      // 检查 EMU 转换
      console.log('\n=== EMU 转换分析 ===');
      
      // PowerPoint 使用 EMU (English Metric Units)
      // 1 inch = 914400 EMU
      // 1 point = 12700 EMU (因为 1 inch = 72 points)
      const EMU_TO_POINTS = 1 / 12700;
      
      console.log(`EMU 到点的转换比例: ${EMU_TO_POINTS}`);
      console.log(`如果实际尺寸是 EMU，转换到点后的期望比例: ${EMU_TO_POINTS.toFixed(6)}`);
      
      // 检查实际/期望比例是否接近 EMU 转换
      const isEMUConversion = Math.abs(avgWidthRatio - EMU_TO_POINTS) < 0.0001;
      if (isEMUConversion) {
        console.log('✅ 检测到可能的 EMU 转换问题');
      }

      // 设置测试期望
      // 当前只要求数据收集完成，不强制通过
      expect(dimensionAnalysis.length).toBeGreaterThan(0);
      expect(avgWidthRatio).toBeGreaterThan(0);
      expect(avgHeightRatio).toBeGreaterThan(0);

      // 将分析结果保存到全局变量供后续使用
      (global as any).dimensionAnalysisResult = {
        avgWidthRatio,
        avgHeightRatio,
        commonWidthRatio,
        commonHeightRatio,
        widthVariance,
        heightVariance,
        typeGroups,
        isConsistentRatio: widthVariance < 0.01 && heightVariance < 0.01
      };
    });

    it('应该提供转换函数修复建议', () => {
      const analysisResult = (global as any).dimensionAnalysisResult;
      
      if (!analysisResult) {
        pending('需要先运行尺寸分析测试');
        return;
      }

      console.log('\n=== 修复建议 ===');
      
      const { avgWidthRatio, avgHeightRatio, isConsistentRatio, typeGroups } = analysisResult;
      
      if (isConsistentRatio) {
        console.log('✅ 检测到一致的转换比例，建议应用全局转换因子:');
        console.log(`   宽度: actualWidth *= ${(1 / avgWidthRatio).toFixed(3)}`);
        console.log(`   高度: actualHeight *= ${(1 / avgHeightRatio).toFixed(3)}`);
        console.log('');
        console.log('实施方法:');
        console.log('1. 在解析器中找到尺寸计算逻辑');
        console.log('2. 应用转换因子到 width 和 height');
        console.log('3. 确保所有元素类型都应用相同的转换');
      } else {
        console.log('⚠️  转换比例不一致，需要按元素类型分别处理:');
        Object.entries(typeGroups).forEach(([type, items]: [string, any[]]) => {
          const typeWidthRatios = items.map(item => item.widthRatio);
          const typeHeightRatios = items.map(item => item.heightRatio);
          
          const avgTypeWidthRatio = typeWidthRatios.reduce((sum, ratio) => sum + ratio, 0) / typeWidthRatios.length;
          const avgTypeHeightRatio = typeHeightRatios.reduce((sum, ratio) => sum + ratio, 0) / typeHeightRatios.length;

          console.log(`  ${type} 元素:`);
          console.log(`    宽度因子: ${(1 / avgTypeWidthRatio).toFixed(3)}`);
          console.log(`    高度因子: ${(1 / avgTypeHeightRatio).toFixed(3)}`);
        });
      }
      
      console.log('\n可能的问题根源:');
      console.log('1. EMU (English Metric Units) 转换不正确');
      console.log('2. 坐标系统的缩放比例问题');
      console.log('3. 字体大小到尺寸的转换问题');
      console.log('4. 不同元素类型使用不同的测量单位');
      
      // 这个测试总是通过，只是为了提供建议
      expect(true).toBe(true);
    });
  });
});