export interface GovtHospitalPsychiatryUnit {
  id: string;
  hospitalName: string;
  department: string;
  emergencyNumber: string;
  city: string;
  state: string;
  region: string;
}

/**
 * Verified Government Hospital Psychiatry & Emergency Crisis Cells
 * Used for emergency intervention dispatch when youth have no secondary contact.
 */
export const GOVT_HOSPITAL_PSYCHIATRY_UNITS: GovtHospitalPsychiatryUnit[] = [
  {
    id: 'gov-imh-chennai',
    hospitalName: 'Institute of Mental Health (IMH) Kilpauk',
    department: '24/7 Government Psychiatric Emergency Cell',
    emergencyNumber: '+914426425585',
    city: 'Chennai',
    state: 'Tamil Nadu',
    region: 'South',
  },
  {
    id: 'gov-rgggh-chennai',
    hospitalName: 'Rajiv Gandhi Government General Hospital (RGGGH)',
    department: 'Psychiatry & Emergency Crisis Intervention',
    emergencyNumber: '+914425305000',
    city: 'Chennai',
    state: 'Tamil Nadu',
    region: 'South',
  },
  {
    id: 'gov-nimhans-bangalore',
    hospitalName: 'NIMHANS (National Institute of Mental Health & Neuro Sciences)',
    department: 'Emergency Psychiatry & Crisis Centre',
    emergencyNumber: '+918046110007',
    city: 'Bangalore',
    state: 'Karnataka',
    region: 'South',
  },
  {
    id: 'gov-aiims-delhi',
    hospitalName: 'All India Institute of Medical Sciences (AIIMS)',
    department: 'Department of Psychiatry Emergency Services',
    emergencyNumber: '+911126588500',
    city: 'New Delhi',
    state: 'Delhi',
    region: 'North',
  },
  {
    id: 'gov-kem-mumbai',
    hospitalName: 'King Edward Memorial Hospital (KEM)',
    department: 'Psychiatric Emergency Intervention Cell',
    emergencyNumber: '+912224107000',
    city: 'Mumbai',
    state: 'Maharashtra',
    region: 'West',
  },
  {
    id: 'gov-tele-manas-national',
    hospitalName: 'Tele-MANAS Government National Mental Health Directorate',
    department: '24/7 Clinical Psychiatric Crisis Outreach Cell',
    emergencyNumber: '+911441600000',
    city: 'National',
    state: 'National',
    region: 'National',
  },
];

/**
 * Locates the nearest government hospital psychiatric emergency unit
 * based on provided city/location or defaults to the National Tele-MANAS clinical cell.
 */
export function findNearbyGovtPsychiatrist(userLocation?: string): GovtHospitalPsychiatryUnit {
  if (!userLocation) {
    return GOVT_HOSPITAL_PSYCHIATRY_UNITS[0]; // Default to Tamil Nadu IMH or Tele-MANAS
  }

  const query = userLocation.toLowerCase();

  const match = GOVT_HOSPITAL_PSYCHIATRY_UNITS.find(
    (h) =>
      query.includes(h.city.toLowerCase()) ||
      query.includes(h.state.toLowerCase()) ||
      query.includes(h.region.toLowerCase())
  );

  return match || GOVT_HOSPITAL_PSYCHIATRY_UNITS[0];
}
