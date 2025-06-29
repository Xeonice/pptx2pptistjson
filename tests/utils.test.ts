import { Presentation, PresentationMetadata } from '../app/lib/models/domain/Presentation';
import { Slide } from '../app/lib/models/domain/Slide';
import { Theme, ColorScheme } from '../app/lib/models/domain/Theme';

describe('领域模型', () => {
  describe('演示文稿', () => {
    it('应该创建演示文稿实例', () => {
      const metadata: PresentationMetadata = {
        title: '测试演示文稿',
        format: 'pptx'
      };
      
      const presentation = new Presentation(metadata);
      
      expect(presentation).toBeInstanceOf(Presentation);
      expect(presentation.getSlides()).toEqual([]);
      expect(presentation.getMetadata()).toEqual(metadata);
      expect(presentation.getSlideSize()).toEqual({ width: 960, height: 540 });
    });

    it('应该添加和获取幻灯片', () => {
      const metadata: PresentationMetadata = { format: 'pptx' };
      const presentation = new Presentation(metadata);
      const slide = new Slide('slide1', 1);
      
      presentation.addSlide(slide);
      
      expect(presentation.getSlides()).toHaveLength(1);
      expect(presentation.getSlideById('slide1')).toBe(slide);
    });
  });

  describe('幻灯片', () => {
    it('应该创建幻灯片实例', () => {
      const slide = new Slide('slide1', 1);
      
      expect(slide).toBeInstanceOf(Slide);
      expect(slide.getId()).toBe('slide1');
      expect(slide.getElements()).toEqual([]);
    });
  });

  describe('主题', () => {
    it('应该创建主题实例', () => {
      const theme = new Theme('测试主题');
      
      expect(theme).toBeInstanceOf(Theme);
      expect(theme.getName()).toBe('测试主题');
      expect(theme.getColorScheme()).toBeUndefined();
    });

    it('应该设置和获取配色方案', () => {
      const theme = new Theme('测试主题');
      const colorScheme: ColorScheme = {
        accent1: '#FF0000',
        accent2: '#00FF00',
        accent3: '#0000FF',
        accent4: '#FFFF00',
        accent5: '#FF00FF',
        accent6: '#00FFFF',
        lt1: '#FFFFFF',
        lt2: '#F0F0F0',
        dk1: '#000000',
        dk2: '#333333',
        hyperlink: '#0066CC',
        followedHyperlink: '#800080'
      };
      
      theme.setColorScheme(colorScheme);
      
      expect(theme.getColorScheme()).toEqual(colorScheme);
      expect(theme.getColor('accent1')).toBe('#FF0000');
    });
  });
});