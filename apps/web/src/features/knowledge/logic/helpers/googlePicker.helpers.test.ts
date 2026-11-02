import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

class FakePickerBuilder {
  addView(): this {
    return this;
  }

  enableFeature(): this {
    return this;
  }

  setOAuthToken(): this {
    return this;
  }

  setDeveloperKey(): this {
    return this;
  }

  setAppId(): this {
    return this;
  }

  setCallback(): this {
    return this;
  }

  build(): this {
    return this;
  }

  setVisible(): void {}
}

class FakeDocsView {
  setMimeTypes(): this {
    return this;
  }

  setIncludeFolders(): this {
    return this;
  }

  setSelectFolderEnabled(): this {
    return this;
  }

  setEnableDrives(): this {
    return this;
  }
}

describe('openGooglePicker', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    Reflect.deleteProperty(window, 'google');
    Reflect.deleteProperty(window, 'gapi');
  });

  it('enables multi-select in the Google Picker', async () => {
    const builder = new FakePickerBuilder();
    const enableFeature = vi.spyOn(builder, 'enableFeature');
    const addView = vi.spyOn(builder, 'addView');
    Object.defineProperty(window, 'gapi', {
      configurable: true,
      value: {
        load: (...args: [string, { readonly callback: () => void }]) => args[1].callback(),
      },
    });
    Object.defineProperty(window, 'google', {
      configurable: true,
      value: {
        picker: {
          PickerBuilder: function PickerBuilder() {
            return builder;
          },
          DocsView: FakeDocsView,
          ViewId: { DOCS: 'docs' },
        },
      },
    });
    const { openGooglePicker } =
      await import('@/features/knowledge/logic/helpers/googlePicker.helpers');

    await openGooglePicker({
      accessToken: 'access-token',
      apiKey: 'api-key',
      appId: 'app-id',
      onPicked: vi.fn<() => void>(),
      onCancel: vi.fn<() => void>(),
    });

    expect(enableFeature).toHaveBeenCalledWith('multiselectEnabled');
    expect(enableFeature).toHaveBeenCalledTimes(1);
    expect(addView).toHaveBeenCalledTimes(2);
  });
});
