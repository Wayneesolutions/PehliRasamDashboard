import { z } from "zod";

const schema = z.object({
  personalDetails: z.object({
    fullName: z.string().min(1, "Full Name is required"),
    email: z.string().email("Valid email is required"),
    contactNumber: z.string().min(3, "Enter a valid contact number").max(20).regex(/^\+?[1-9]\d{1,14}$/),
    country: z.string().min(1, "Country is required"),
    location: z.string().min(1, "Location is required"),
  }),

  basicInformation: z.object({
    gender: z.enum(["Male", "Female", "Other"], { required_error: "Gender is required" }),
    religion: z.string().min(1, "Religion is required"),
    maritalStatus: z.string().optional(),
    birthdate: z.union([
      z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Birthdate should be in YYYY-MM-DD format"),
      z.date(),
    ]),
    caste: z.string().optional(),
    height: z.string().min(1, "Height is required"),
  }),

  educationProfession: z.object({
    employment: z.string().min(1, "Employment/Job is required"),
    education: z.string().min(1, "Education is required"),
  }),

  familyDetails: z.object({
    fatherName: z.string().min(1, "Father's Name is required"),
    motherName: z.string().min(1, "Mother's Name is required"),
  }),

  matchPreferences: z.object({
    preferredGender: z.enum(["Male", "Female", "Other"], { required_error: "Preferred Gender is required" }),
    preferredReligion: z.string().min(1, "Preferred Religion is required"),
    preferredAgeRange: z.object({
      min: z.number().min(18, "Minimum age must be at least 18").max(100, "Maximum age cannot exceed 100"),
      max: z.number().min(18, "Minimum age must be at least 18").max(100, "Maximum age cannot exceed 100"),
    }),
    preferredHeight: z.object({
      min: z
        .number()
        .min(100, { message: "Height min should be between 100 and 250 cm" })
        .max(250, { message: "Height min should be between 100 and 250 cm" }),
      max: z
        .number()
        .min(100, { message: "Height max should be between 100 and 250 cm" })
        .max(250, { message: "Height max should be between 100 and 250 cm" }),
    }),
    caste: z.string().optional(),
    cityPreferred: z.string().optional(),
    preferredAppearance: z.string().optional(),
    maritalStatusPreference: z.string().optional(),
    educationPreference: z.string().optional(),
    employmentPreference: z.string().optional(),
    vegetarianPreference: z.boolean().default(false),
    drinkAlcohol: z.boolean().default(false),
  }),

  aboutMe: z.object({
    images: z.array(z.string().url()).optional(),
  }),
});

export default schema;

export interface AddClientFormData {
  firstname: String;
  lastname: String;
  email: String;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface ActiveClientDetails {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  imagePath: string;
  activeStatus: boolean;
  address: Address;
}

export interface Customer {
  _id: string;
  firstName: string;
  middelName: string;
  lastName: string;
  email: string;
  Number?: string;
  address?: {
    street: string | null;
    city: string | null;
    state: string | null;
    postalCode: string | null;
    country: string | null;
  };
  imagePath?: string;
  createdAt: string;
  updatedAt: string;
}

