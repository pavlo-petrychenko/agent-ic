import type {
  CreateGoogleDocsSourceMutation,
  CreateGoogleDocsSourceMutationVariables,
} from '@/features/knowledge/communication/gql/mutation/createGoogleDocsSource.generated';
import type { CreateGooglePickerSessionMutation } from '@/features/knowledge/communication/gql/mutation/createGooglePickerSession.generated';

export type GooglePickerSession = CreateGooglePickerSessionMutation['createGooglePickerSession'];

export type GooglePickerCreatedSource = CreateGoogleDocsSourceMutation['createGoogleDocsSource'];

export type GooglePickerSourceInput = CreateGoogleDocsSourceMutationVariables['input'];

export interface GooglePickerDocument {
  readonly id: string;
  readonly name: string;
  readonly mimeType: string;
  readonly url: string | null;
  readonly resourceKey: string | null;
}

export interface GooglePickerCallbackData {
  readonly action: string;
  readonly docs?: readonly GooglePickerDocument[];
}

export interface GooglePickerDocsView {
  setMimeTypes(mimeTypes: string): GooglePickerDocsView;
  setIncludeFolders(includeFolders: boolean): GooglePickerDocsView;
  setSelectFolderEnabled(selectFolderEnabled: boolean): GooglePickerDocsView;
  setEnableDrives?(enableDrives: boolean): GooglePickerDocsView;
}

export interface GooglePickerInstance {
  setVisible(visible: boolean): void;
}

export interface GooglePickerBuilder {
  addView(view: GooglePickerDocsView): GooglePickerBuilder;
  enableFeature(feature: string): GooglePickerBuilder;
  setOAuthToken(accessToken: string): GooglePickerBuilder;
  setDeveloperKey(apiKey: string): GooglePickerBuilder;
  setAppId(appId: string): GooglePickerBuilder;
  setCallback(callback: (data: GooglePickerCallbackData) => void): GooglePickerBuilder;
  build(): GooglePickerInstance;
}

export interface GooglePickerApi {
  readonly picker: {
    readonly PickerBuilder: new () => GooglePickerBuilder;
    readonly DocsView: new (viewId: string) => GooglePickerDocsView;
  };
}

export interface GoogleApiLoader {
  load(library: string, options: { readonly callback: () => void }): void;
}

export interface GooglePickerWindow {
  readonly gapi?: GoogleApiLoader;
  readonly google?: GooglePickerApi;
}

export interface OpenGooglePickerInput {
  readonly accessToken: string;
  readonly apiKey: string;
  readonly appId: string;
  readonly onPicked: (documents: readonly GooglePickerDocument[]) => void;
  readonly onCancel: () => void;
}

export interface PickGoogleDocumentsInput {
  readonly connectionId: string;
  readonly knowledgeBaseId: string;
  readonly onCreated: (result: GooglePickerCreatedSource) => void;
  readonly onError: (error: unknown) => void;
}

export interface UseGooglePickerResult {
  readonly pickDocuments: (input: PickGoogleDocumentsInput) => Promise<void>;
  readonly pickingConnectionId: string | null;
}

export interface UseCreateGooglePickerSessionResult {
  readonly createGooglePickerSession: (connectionId: string) => Promise<GooglePickerSession>;
}

export interface UseCreateGoogleDocsSourceResult {
  readonly createGoogleDocsSource: (
    input: GooglePickerSourceInput,
  ) => Promise<GooglePickerCreatedSource>;
}
