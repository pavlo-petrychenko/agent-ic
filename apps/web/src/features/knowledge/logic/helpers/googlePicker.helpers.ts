import {
  GOOGLE_DOCUMENT_MIME_TYPE,
  GOOGLE_PICKER_ACTION_CANCEL,
  GOOGLE_PICKER_ACTION_PICKED,
  GOOGLE_PICKER_LIBRARY,
  GOOGLE_PICKER_LOAD_FAILED_MESSAGE,
  GOOGLE_PICKER_MULTISELECT_FEATURE,
  GOOGLE_PICKER_SCRIPT_ID,
  GOOGLE_PICKER_SCRIPT_URL,
} from '@/features/knowledge/constants/googlePicker.constants';
import type {
  GooglePickerApi,
  GooglePickerCallbackData,
  GooglePickerDocsView,
  GooglePickerDocument,
  GooglePickerWindow,
  OpenGooglePickerInput,
} from '@/features/knowledge/typedefs/googlePicker.typedefs';

export class GooglePickerLoadError extends Error {
  constructor() {
    super(GOOGLE_PICKER_LOAD_FAILED_MESSAGE);
  }
}

let pickerPromise: Promise<GooglePickerApi> | null = null;

const pickerWindow = (): Window & GooglePickerWindow => window as Window & GooglePickerWindow;

const loadLibrary = (): Promise<GooglePickerApi> => {
  const target = pickerWindow();
  if (target.google !== undefined) {
    return Promise.resolve(target.google);
  }
  if (target.gapi === undefined) {
    return Promise.reject(new GooglePickerLoadError());
  }
  return new Promise((resolve, reject) => {
    target.gapi?.load(GOOGLE_PICKER_LIBRARY, {
      callback: () => {
        const api = pickerWindow().google;
        if (api === undefined) {
          reject(new GooglePickerLoadError());
          return;
        }
        resolve(api);
      },
    });
  });
};

const loadScript = (): Promise<void> =>
  new Promise((resolve, reject) => {
    if (pickerWindow().gapi !== undefined) {
      resolve();
      return;
    }
    const existing = document.getElementById(GOOGLE_PICKER_SCRIPT_ID);
    if (existing !== null) {
      existing.remove();
    }
    const script = document.createElement('script');
    script.id = GOOGLE_PICKER_SCRIPT_ID;
    script.src = GOOGLE_PICKER_SCRIPT_URL;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      script.remove();
      reject(new GooglePickerLoadError());
    };
    document.head.append(script);
  });

export const loadGooglePicker = (): Promise<GooglePickerApi> => {
  if (pickerPromise !== null) {
    return pickerPromise;
  }
  pickerPromise = loadScript()
    .then(loadLibrary)
    .catch((failure: unknown) => {
      pickerPromise = null;
      throw failure;
    });
  return pickerPromise;
};

const toPickedDocument = (document: GooglePickerDocument): GooglePickerDocument => ({
  id: document.id,
  name: document.name,
  mimeType: document.mimeType,
  url: document.url ?? null,
  resourceKey: document.resourceKey ?? null,
});

const documentsView = (api: GooglePickerApi, sharedDrives: boolean): GooglePickerDocsView => {
  const view = new api.picker.DocsView(api.picker.ViewId.DOCS)
    .setMimeTypes(GOOGLE_DOCUMENT_MIME_TYPE)
    .setIncludeFolders(false)
    .setSelectFolderEnabled(false);
  view.setEnableDrives?.(sharedDrives);
  return view;
};

export const openGooglePicker = async ({
  accessToken,
  apiKey,
  appId,
  onPicked,
  onCancel,
}: OpenGooglePickerInput): Promise<void> => {
  const api = await loadGooglePicker();
  const picker = new api.picker.PickerBuilder()
    .addView(documentsView(api, false))
    .addView(documentsView(api, true))
    .enableFeature(GOOGLE_PICKER_MULTISELECT_FEATURE)
    .setOAuthToken(accessToken)
    .setDeveloperKey(apiKey)
    .setAppId(appId)
    .setCallback((data: GooglePickerCallbackData) => {
      if (data.action === GOOGLE_PICKER_ACTION_PICKED) {
        onPicked((data.docs ?? []).map(toPickedDocument));
        return;
      }
      if (data.action === GOOGLE_PICKER_ACTION_CANCEL) {
        onCancel();
      }
    })
    .build();
  picker.setVisible(true);
};
