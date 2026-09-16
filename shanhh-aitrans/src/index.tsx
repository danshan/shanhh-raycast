import { Action, ActionPanel, Detail, Form, Icon, Toast, getPreferenceValues, showToast, useNavigation } from "@raycast/api";
import { useState } from "react";
import { type TranslationConfig, type TranslationResult, translateText } from "./clients/translation-client";
import { LANGUAGES, resolveLanguages } from "./languages";

type ExtensionPreferences = TranslationConfig & {
  targetLanguage1: string;
  targetLanguage2: string;
  targetLanguage3: string;
};

type FormValues = {
  text: string;
};

export default function Command() {
  const preferences = getPreferenceValues<ExtensionPreferences>();
  const defaultLanguages = resolveLanguages([preferences.targetLanguage1, preferences.targetLanguage2, preferences.targetLanguage3]);

  return <TranslationForm preferences={preferences} defaultTargetCodes={defaultLanguages.map(({ code }) => code)} />;
}

function TranslationForm({ preferences, defaultTargetCodes }: { preferences: ExtensionPreferences; defaultTargetCodes: string[] }) {
  const [targetCodes, setTargetCodes] = useState(defaultTargetCodes);
  const [isLoading, setIsLoading] = useState(false);
  const { push } = useNavigation();

  function handleTargetChange(nextTargetCodes: string[]) {
    if (nextTargetCodes.length > 3) {
      void showToast({ style: Toast.Style.Failure, title: "Select at most three target languages" });
      return;
    }
    setTargetCodes(nextTargetCodes);
  }

  async function handleSubmit(values: FormValues) {
    const targetLanguages = resolveLanguages(targetCodes);
    if (!values.text.trim()) {
      await showToast({ style: Toast.Style.Failure, title: "Enter text to translate" });
      return;
    }
    if (targetLanguages.length === 0) {
      await showToast({ style: Toast.Style.Failure, title: "Select at least one target language" });
      return;
    }

    setIsLoading(true);
    const toast = await showToast({ style: Toast.Style.Animated, title: "Translating" });
    try {
      const result = await translateText(values.text, targetLanguages, preferences);
      toast.style = Toast.Style.Success;
      toast.title = "Translation complete";
      push(<TranslationDetail result={result} />);
    } catch (error) {
      toast.style = Toast.Style.Failure;
      toast.title = "Translation failed";
      toast.message = error instanceof Error ? error.message : "Unexpected error.";
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form
      isLoading={isLoading}
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Translate" icon={Icon.Globe} onSubmit={handleSubmit} />
        </ActionPanel>
      }
    >
      <Form.TextArea id="text" title="Text" placeholder="Enter a word, phrase, or sentence" autoFocus />
      <Form.TagPicker id="targetLanguages" title="Target Languages" value={targetCodes} onChange={handleTargetChange}>
        {LANGUAGES.map((language) => (
          <Form.TagPicker.Item key={language.code} value={language.code} title={language.name} />
        ))}
      </Form.TagPicker>
      <Form.Description text="Select one to three languages. The detected source language is skipped automatically." />
    </Form>
  );
}

function TranslationDetail({ result }: { result: TranslationResult }) {
  const markdown = result.translations.length === 0 ? "No translation is needed because the source language matches every selected target language." : result.translations.map(renderTranslation).join("\n\n---\n\n");

  return (
    <Detail
      navigationTitle="Translation"
      markdown={markdown}
      metadata={
        <Detail.Metadata>
          <Detail.Metadata.Label title="Source Language" text={result.sourceLanguageName} />
          <Detail.Metadata.Label title="Input Type" text={capitalize(result.inputKind)} />
        </Detail.Metadata>
      }
      actions={
        result.translations.length > 0 ? (
          <ActionPanel>
            {result.translations.map((translation) => (
              <ActionPanel.Section key={translation.targetLanguageCode} title={translation.targetLanguageName}>
                {translation.alternatives.map((alternative) => (
                  <Action.CopyToClipboard key={alternative.text} title={`Copy ${alternative.text}`} content={alternative.text} />
                ))}
              </ActionPanel.Section>
            ))}
          </ActionPanel>
        ) : undefined
      }
    />
  );
}

function renderTranslation(translation: TranslationResult["translations"][number]): string {
  const [primary, ...others] = translation.alternatives;
  const alternatives = others.length === 0 ? "" : `\n\n**Other translations**\n${others.map((alternative) => `- ${alternative.text}${alternative.context ? `: ${alternative.context}` : ""}`).join("\n")}`;
  const details = translation.details ? `\n\n${translation.details}` : "";
  return `${primary.text}\n\n_Target language: ${translation.targetLanguageName}_${alternatives}${details}`;
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
