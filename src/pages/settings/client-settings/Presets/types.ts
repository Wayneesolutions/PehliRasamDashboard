export interface Field {
  _id: string;
  presetFieldId?: string; // Add this - the PresetFields document ID
  fieldsId: string; // The FormField/PreferencesField ID
  fieldsFor: "profile" | "preferences";
  AllowEdit: boolean;
  isRequired: boolean;
  presetId: string;
  label?: string;
  kind?: string;
  fieldType?: string;
  required?: boolean;
  allowEdit?: boolean;
}



export interface Group {
  _id: string;
  name: string;
  formFields: Field[];
}
