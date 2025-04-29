export interface Field {
  _id: string; 
  fieldsId: string;   
  fieldsFor: "profile" | "preferences"; 
  AllowEdit: boolean; 
  isRequired: boolean; 
  presetId: string;    
}



export interface Group {
    _id: string;
    name: string;
    formFields: Field[];
}
