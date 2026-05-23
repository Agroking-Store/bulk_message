export type TemplateButton = {
  type: "QUICK_REPLY" | "URL" | "PHONE_NUMBER" | "COPY_CODE";
  text: string;
  url?: string;
  phoneNumber?: string;
  example?: string; // used for copy code
};

export type TemplateFormType = {
  name: string;
  category: "UTILITY" | "MARKETING" | "AUTHENTICATION";
  language: string;

  headerType: "NONE" | "TEXT" | "IMAGE" | "VIDEO" | "DOCUMENT";
  headerText: string;
  media: File | null;

  body: string;
  footer: string;

  variableValues: string[];

  buttons: TemplateButton[];
};