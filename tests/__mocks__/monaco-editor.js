// Mock for monaco-editor in Jest tests
module.exports = {
  editor: {
    create: jest.fn(() => ({
      dispose: jest.fn(),
      getValue: jest.fn(() => '{}'),
      setValue: jest.fn(),
      getModel: jest.fn(() => ({
        dispose: jest.fn()
      })),
      onDidChangeModelContent: jest.fn(),
      layout: jest.fn(),
      focus: jest.fn(),
      addCommand: jest.fn(),
      addAction: jest.fn(),
      getContentHeight: jest.fn(() => 200),
      setSelection: jest.fn(),
      revealLine: jest.fn(),
      trigger: jest.fn()
    })),
    createModel: jest.fn(() => ({
      dispose: jest.fn()
    })),
    defineTheme: jest.fn(),
    setTheme: jest.fn()
  },
  KeyMod: {
    CtrlCmd: 1,
    Shift: 2,
    Alt: 4,
    WinCtrl: 8
  },
  KeyCode: {
    KEY_S: 1,
    KEY_F: 2,
    Escape: 3,
    Enter: 4
  },
  languages: {
    json: {
      jsonDefaults: {
        setDiagnosticsOptions: jest.fn()
      }
    },
    register: jest.fn(),
    setMonarchTokensProvider: jest.fn(),
    setLanguageConfiguration: jest.fn(),
    registerCompletionItemProvider: jest.fn()
  }
};