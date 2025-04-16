export interface ICustomer {
  _id?: string;
  name: string;
  email: string;
  contact: string;
  countryCode: string;
  location: string;
  latlng: number[];
  gender: 'Male' | 'Female' | 'Other';
  birthdate: string;
  maritalStatus:
  "Never Married" |
  "Divorced" |
  "Windowed" |
  "Separated" |
  "Annulled" |
  "Divorced(1 child , Living Together)" |
  "Divorced(2 children , Living Together)" |
  "Divorced(3 children , Living Together)" |
  "Awaiting Divorce" |
  "Widowed(1 child , Living Together)" |
  "Divorced(Without child)";
  profileNote: string;
  profileMadeBy: "Self" | "Father" | "Mother" | "Brother" | "Sister" | "Cousin" | "Friend" | "Relative" | "Uncle" | "Aunty" | "Other";
  memberShipType: "Active Client" | "Free Member" | "Inactive" | "Deactivated" | "Refund" | "Old Paid Member" | "Profile on Hold";
  registeredBy: string;
  amount: string,
  appearance: "Hair-cut" | "Turbaned(with trimmed beard)" | "Gursikh" | "Clean Shaven" | "Amrit-Dhari" | "Female Profile";
  religion?: 'Sikh' | 'Hindu' | 'Jain' | 'Muslim' | 'Christain' | 'Buddhist' | 'Spiritual' | 'Other';
  subcaste?: 'Ad Dharmi' |
  'Ahluwalia' |
  'Arora' |
  'Baazigar' |
  'Bhatia' |
  'Bhatra' |
  'Brahmin' |
  'Baniya' |
  'Chimba' |
  'Ghumar' |
  'Gujjar' |
  'Sunyar (Gold Smith)' |
  'Hindu Punjabi' |
  'Intercaste' |
  'Jatt (Sikh)' |
  'Julahe' |
  'Jain' |
  'Jaat (Hindu)' |
  'Kabir Panthi' |
  'Kamboj' |
  'Kashyap Rajput' |
  'Khatri' |
  'Kshatriya' |
  'Lubana' |
  'Mahajan' |
  'Maid Rajput' |
  'Mair Rajput' |
  'Majabi' |
  'Nai' |
  'Parjapat' |
  'Rai' |
  'Rajput' |
  'Ramdasia' |
  'Ramgharia' |
  'Ravidasia' |
  'Saini' |
  'Tonk Khatriya' |
  'Other';
  height: string;
  moreAboutMartialStatus: string;
  vegetarian: "Yes" | "No";
  doYouDrinkAlcohol?: 'Yes,occasionally' | 'yes,regularly' | 'No';
  doYouSmoke: "Yes" | "No";
  phoneNumber: string;
  userCode: string;
  nameOfHighSchool: string;
  education: string;
  employment: string;
  income: string;
  profession: string;
  familyAffluenceLevel: string;
  fatherEmployment: string;
  motherEmployment: string;
  otherFamilyDetails: string;
  fatherName: string;
  motherName: string;
  residencyStatus: string;
  livingInSince: string;
  countryLiving: string;
  countryGrewUpIn: string;
  propertyDetails: string;


  moreAboutPartnerPreference?: string;
  memeberStatus?: string;
  preferredGender?: 'Male' | 'Female';
  preferredAge?: {
    min: number;
    max: number;
  };
  preferredHeight?: {
    min: number;
    max: number;
  };
  preferredReligion?: 'Sikh' | 'Hindu' | 'Jain' | 'Muslim' | 'Christain' | 'Buddhist' | 'Spiritual' | 'Not Matter';
  preferredSubcaste?: 'Ad Dharmi' |
  'Ahluwalia' |
  'Arora' |
  'Baazigar' |
  'Bhatia' |
  'Bhatra' |
  'Brahmin' |
  'Baniya' |
  'Chimba' |
  'Ghumar' |
  'Gujjar' |
  'Sunyar (Gold Smith)' |
  'Hindu Punjabi' |
  'Intercaste' |
  'Jatt (Sikh)' |
  'Julahe' |
  'Jain' |
  'Jaat (Hindu)' |
  'Kabir Panthi' |
  'Kamboj' |
  'Kashyap Rajput' |
  'Khatri' |
  'Kshatriya' |
  'Lubana' |
  'Mahajan' |
  'Maid Rajput' |
  'Mair Rajput' |
  'Majabi' |
  'Nai' |
  'Parjapat' |
  'Rai' |
  'Rajput' |
  'Ramdasia' |
  'Ramgharia' |
  'Ravidasia' |
  'Saini' |
  'Tonk Khatriya' |
  'Other';
  residencyPreferrence?: string;
  countryPreferred?: string;
  cityPreferred?: 'Amritsar' |
  'Barnala' |
  'Bathinda' |
  'Dera Bassi' |
  'Delhi' |
  'Chandigarh' |
  'Faridkot' |
  'Fatehgarh Sahib' |
  'Firozpur' |
  'Gurdaspur' |
  'Gujarat' |
  'Hoshiarpur' |
  'Himachal Pradesh' |
  'Haryana' |
  'Jalandhar' |
  'Jammu and Kashmir' |
  'Kapurthala' |
  'Khanna' |
  'Ludhiana' |
  'Mansa' |
  'Moga' |
  'Muktsar(Sri Muktsar Sahib)' |
  'Nakodar' |
  'Patiala' |
  'Phagwara' |
  'Rupnagar' |
  'Rajasthan' |
  '(Mohali)Sahibzada Ajit Singh Nagar' |
  'Sangrur' |
  '(Nawanshahr)Shahid Bhagat Singh Nagar' |
  'Tarn Taran' |
  'Uttarakhand' |
  'Uttar Pradesh' |
  'Zirakpur';
  preferredAppearance?: 'Hair-cut' | 'Turbaned(with trimmed beard)' | 'Gursikh' | 'Clean Shaven' | 'Amrit-Dhari' | 'Female Profile';
  maritalStatusPreference?: 'Never Married' | 'Divorced' | 'Windowed' | 'Separated' | 'Annulled' |
  'Divorced(1 child , Living Together)' | 'Divorced(2 children , Living Together)' |
  'Divorced(3 children , Living Together)' | 'Awaiting Divorce' |
  'Widowed(1 child , Living Together)' | 'Divorced(Without child)';
  educationPreferrence?: 'High School' |
  'Senior Secondary School' |
  'Graduation - Bachelor’s degree, BA, BSc, BCom etc.' |
  'Post-Graduation - Master’s degree, MA, MSc, MCom etc.' |
  'Doctorate - PhD';
  employmentPreferrence?: 'Private Sector' |
  'Government Job' |
  'Businessman' |
  'Self-Employed' |
  'Freelancer' |
  'Student' |
  'Retired' |
  'Homemaker' |
  'Consultant' |
  'Part-Time Worker';
  vegetarianPreferrence?: 'Yes' | 'No';
  drinkAlcoholPreferrence?: 'Yes,occasionally' | 'yes,regularly' | 'No';

}

export interface PreferencesField {
  label: string;
  profileField: string;
  clientTypes: string[]; // Assuming it's an array
  weight: number;
  useInMatch: boolean;
  choices: string[];
  helpText?: string; // Optional
  dealBreak: boolean;
  preferencesGroupId: string; // Assuming it's an ID
}

export interface ClientList {
  listName: string;
  color: string;
}

export interface CustomerUpdate {
  customerId: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  Number?: string;
  middelName?: string; // Fixed typo from 'middelName' to 'middleName'
  address?: {
    street: string | null;
    city: string | null;
    stateOrProvince: string | null;
    postalCode: string | null;
    country?: string | null; // Make country optional, if it's not always provided
  };
}

export interface MatchField {
  fieldId: string;
  fieldName: string;
  profileField: string;
  clientTypes: string;
  weight: string;
  choices?: string[]; // Optional as not all fields may have choices
  dealBreak?: boolean;
  helpText?: string;
  useInMatch?: boolean;
  value?: string;
}

export interface MatchGroup {
  groupId: string;
  groupName: string;
  fields: MatchField[];
}

export interface Field {
  attributeId: string;
  attributeName: string;
  attributeType: string;
  attributeEnum: any[]; // Can be replaced with a more specific type if needed
  attributeOption: any[]; // Assuming it's an array of strings
}

export interface Group {
  _id: string;
  groupId: string;
  groupName: string;
  fields: Field[];
}


