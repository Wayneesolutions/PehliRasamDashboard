export interface Field {
    _id: string;
  label: string;
  profileField: string;
  clientTypes?: string;
  weight?: "Low" | "Medium" | "High";
  useInMatch?: boolean;
  dealBreak?: boolean;
  preferencesGroupId: string;
}


export interface Group {
    _id: string;
    name: string;
    formFields: Field[];
}
